import { db, mapRow, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";
import { createInsuranceCategorySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const search = request.nextUrl.searchParams.get("search")?.trim() || "";
    let query = db
      .from("insurance_categories")
      .select("*");
    if (search) query = query.ilike("name", `%${search}%`);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    const categories = mapRows(data || []);

    const ids = categories.map((c) => (c as { id: string }).id);
    const offersCounts = new Map<string, number>();
    const quotesCounts = new Map<string, number>();
    if (ids.length > 0) {
      const { data: offersData } = await db
        .from("insurance_offers")
        .select("category_id")
        .in("category_id", ids);
      for (const o of offersData || []) {
        const key = String(o.category_id);
        offersCounts.set(key, (offersCounts.get(key) || 0) + 1);
      }
      const { data: quotesData } = await db
        .from("quotes")
        .select("category_id")
        .in("category_id", ids);
      for (const q of quotesData || []) {
        const key = String(q.category_id);
        quotesCounts.set(key, (quotesCounts.get(key) || 0) + 1);
      }
    }

    const result = categories.map((c) => ({
      ...c,
      _count: {
        offers: offersCounts.get(String((c as { id: string }).id)) || 0,
        quotes: quotesCounts.get(String((c as { id: string }).id)) || 0,
      },
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur insurance-categories GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des catégories d'assurance" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }
    const parsed = createInsuranceCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
        { status: 400 }
      );
    }
    const { name, description, icon, isActive } = parsed.data;

    const { data: category, error } = await db
      .from("insurance_categories")
      .insert({
        name,
        description: description || null,
        icon: icon || null,
        is_active: isActive ?? true,
      })
      .select()
      .single();
    if (error) throw error;

    await logAudit({
      action: "CREATE",
      entity: "InsuranceCategory",
      entityId: category.id,
      details: { name: category.name },
    });

    return NextResponse.json(mapRow(category), { status: 201 });
  } catch (error) {
    console.error("Erreur insurance-categories POST:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la catégorie" },
      { status: 500 }
    );
  }
}
