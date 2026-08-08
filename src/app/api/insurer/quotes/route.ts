import { db, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getInsurerAccount, getSessionProfile, requireAuth } from "@/lib/auth-guard";
import { sanitizePostgrestSearch } from "@/lib/security";

function parseJsonField<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAuth(["INSURER"]);
    if (guard) return guard;

    const profile = await getSessionProfile();
    if (!profile) return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    const account = await getInsurerAccount(profile.id);
    if (!account) {
      return NextResponse.json(
        { error: "Aucun compte assureur trouvé pour cet utilisateur" },
        { status: 404 }
      );
    }

    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));

    let query = db
      .from("quotes")
      .select(
        "*, user:profiles(firstName:first_name, lastName:last_name, email), offer:insurance_offers(name), category:insurance_categories(name)",
        { count: "exact" }
      )
      .eq("offer.insurer_id", account.insurerId)
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, (page - 1) * limit + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    if (search) {
      const s = sanitizePostgrestSearch(search);
      query = query.or(
        `reference.ilike.%${s}%,user.first_name.ilike.%${s}%,user.last_name.ilike.%${s}%`
      );
    }

    const { data, count, error } = await query;
    if (error) throw error;
    const quotes = mapRows(data || []);
    const total = count || 0;

    const formatted = quotes.map((q) => ({
      id: q.id,
      reference: q.reference,
      status: q.status,
      estimatedPrice: q.estimatedPrice,
      finalPrice: q.finalPrice,
      notes: q.notes,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
      offerName: q.offer?.name || null,
      categoryName: q.category?.name || null,
      userName: q.user
        ? `${q.user.firstName || ""} ${q.user.lastName || ""}`.trim()
        : null,
      personalData: parseJsonField(q.personalData, {}),
      vehicleData: parseJsonField(q.vehicleData, {}),
    }));

    return NextResponse.json({ quotes: formatted, total, page, limit });
  } catch (error) {
    console.error("Erreur insurer/quotes:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des devis" },
      { status: 500 }
    );
  }
}
