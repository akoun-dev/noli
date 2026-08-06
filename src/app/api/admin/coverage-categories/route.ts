import { db, mapRow, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const { data, error } = await db
      .from("coverage_categories")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) throw error;
    const categories = mapRows(data || []);

    const ids = categories.map((c) => (c as { id: string }).id);
    const coveragesCounts = new Map<string, number>();
    if (ids.length > 0) {
      const { data: coveragesData } = await db
        .from("coverages")
        .select("category_id")
        .in("category_id", ids);
      for (const c of coveragesData || []) {
        const key = String(c.category_id);
        coveragesCounts.set(key, (coveragesCounts.get(key) || 0) + 1);
      }
    }

    const result = categories.map((c) => ({
      ...c,
      _count: { coverages: coveragesCounts.get(String((c as { id: string }).id)) || 0 },
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur coverage-categories GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des catégories de garanties" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const body = await request.json();
    const { code, name, description, displayOrder, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Le nom est requis" },
        { status: 400 }
      );
    }

    // Auto-generate code from name (uppercase, spaces to underscores)
    let genCode = code;
    if (!genCode) {
      genCode = name
        .toUpperCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");
      if (!genCode) genCode = "CAT";
      // Ensure uniqueness
      let suffix = 1;
      let unique = genCode;
      while (true) {
        const { data: dup } = await db
          .from("coverage_categories")
          .select("id")
          .eq("code", unique)
          .maybeSingle();
        if (!dup) break;
        unique = `${genCode}_${suffix++}`;
      }
      genCode = unique;
    } else {
      const { data: existing } = await db
        .from("coverage_categories")
        .select("id")
        .eq("code", genCode)
        .maybeSingle();
      if (existing) {
        return NextResponse.json(
          { error: "Une catégorie avec ce code existe déjà" },
          { status: 400 }
        );
      }
    }

    const { data: category, error } = await db
      .from("coverage_categories")
      .insert({
        code: genCode,
        name,
        description: description || null,
        display_order: displayOrder ?? 0,
        is_active: isActive ?? true,
      })
      .select()
      .single();
    if (error) throw error;

    await db.from("audit_logs").insert({
      action: "CREATE",
      entity: "CoverageCategory",
      entity_id: category.id,
      details: JSON.stringify({ code: category.code, name: category.name }),
      user_name: "SYSTEM",
    });

    return NextResponse.json(mapRow(category), { status: 201 });
  } catch (error) {
    console.error("Erreur coverage-categories POST:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la catégorie de garanties" },
      { status: 500 }
    );
  }
}
