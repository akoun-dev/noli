import { db, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getInsurerAccount, getSessionProfile, requireAuth } from "@/lib/auth-guard";

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

    const insurerId = account.insurerId;

    const [
      totalOffers,
      activeOffers,
      totalQuotes,
      pendingQuotes,
      approvedQuotes,
      rejectedQuotes,
      draftQuotes,
      totalCoverages,
      recentQuotes,
    ] = await Promise.all([
      db.from("insurance_offers").select("id", { count: "exact", head: true }).eq("insurer_id", insurerId).then(({ count, error }) => {
        if (error) throw error;
        return count || 0;
      }),
      db.from("insurance_offers").select("id", { count: "exact", head: true }).eq("insurer_id", insurerId).eq("is_active", true).then(({ count, error }) => {
        if (error) throw error;
        return count || 0;
      }),
      db.from("quotes").select("id, offer:insurance_offers!inner(id)", { count: "exact", head: true }).eq("offer.insurer_id", insurerId).then(({ count, error }) => {
        if (error) throw error;
        return count || 0;
      }),
      db.from("quotes").select("id, offer:insurance_offers!inner(id)", { count: "exact", head: true }).eq("offer.insurer_id", insurerId).eq("status", "PENDING").then(({ count, error }) => {
        if (error) throw error;
        return count || 0;
      }),
      db.from("quotes").select("id, offer:insurance_offers!inner(id)", { count: "exact", head: true }).eq("offer.insurer_id", insurerId).eq("status", "APPROVED").then(({ count, error }) => {
        if (error) throw error;
        return count || 0;
      }),
      db.from("quotes").select("id, offer:insurance_offers!inner(id)", { count: "exact", head: true }).eq("offer.insurer_id", insurerId).eq("status", "REJECTED").then(({ count, error }) => {
        if (error) throw error;
        return count || 0;
      }),
      db.from("quotes").select("id, offer:insurance_offers!inner(id)", { count: "exact", head: true }).eq("offer.insurer_id", insurerId).eq("status", "DRAFT").then(({ count, error }) => {
        if (error) throw error;
        return count || 0;
      }),
      db.from("coverages").select("id", { count: "exact", head: true }).eq("insurer_id", insurerId).then(({ count, error }) => {
        if (error) throw error;
        return count || 0;
      }),
      db.from("quotes")
        .select("id, reference, status, estimated_price, final_price, created_at, vehicle_data, offer:insurance_offers!inner(id), user:profiles(first_name, last_name)")
        .eq("offer.insurer_id", insurerId)
        .order("created_at", { ascending: false })
        .limit(5)
        .then(({ data, error }) => {
          if (error) throw error;
          return mapRows(data || []);
        }),
    ]);

    const recentQuotesFormatted = recentQuotes.map((q) => ({
      id: q.id,
      reference: q.reference,
      status: q.status,
      estimatedPrice: q.estimatedPrice,
      finalPrice: q.finalPrice,
      createdAt: q.createdAt,
      userName: q.user
        ? `${q.user.firstName || ""} ${q.user.lastName || ""}`.trim()
        : null,
      vehicleInfo: parseJsonField(q.vehicleData, {}),
    }));

    return NextResponse.json({
      totalOffers,
      activeOffers,
      totalQuotes,
      pendingQuotes,
      approvedQuotes,
      rejectedQuotes,
      draftQuotes,
      totalCoverages,
      recentQuotes: recentQuotesFormatted,
    });
  } catch (error) {
    console.error("Erreur insurer/stats:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des statistiques" },
      { status: 500 }
    );
  }
}
