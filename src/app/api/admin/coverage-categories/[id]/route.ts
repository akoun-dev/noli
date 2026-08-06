import { db, mapRow } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;

    const { data, error } = await db
      .from("coverage_categories")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    const category = mapRow(data);

    if (!category) {
      return NextResponse.json(
        { error: "Catégorie de garanties introuvable" },
        { status: 404 }
      );
    }

    const { count: coveragesCount } = await db
      .from("coverages")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);

    return NextResponse.json({
      ...category,
      _count: { coverages: coveragesCount || 0 },
    });
  } catch (error) {
    console.error("Erreur coverage-category GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement de la catégorie de garanties" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;
    const body = await request.json();
    const { code, name, description, displayOrder, isActive } = body;

    const { data: existingData } = await db
      .from("coverage_categories")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    const existing = mapRow(existingData);
    if (!existing) {
      return NextResponse.json(
        { error: "Catégorie de garanties introuvable" },
        { status: 404 }
      );
    }

    if (code && code !== existing.code) {
      const { data: codeTaken } = await db
        .from("coverage_categories")
        .select("id")
        .eq("code", code)
        .maybeSingle();
      if (codeTaken) {
        return NextResponse.json(
          { error: "Une catégorie avec ce code existe déjà" },
          { status: 400 }
        );
      }
    }

    const { data: category, error } = await db
      .from("coverage_categories")
      .update({
        ...(code !== undefined && { code }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(displayOrder !== undefined && { display_order: displayOrder }),
        ...(isActive !== undefined && { is_active: isActive }),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    await db.from("audit_logs").insert({
      action: "UPDATE",
      entity: "CoverageCategory",
      entity_id: id,
      details: JSON.stringify({ code: category.code, name: category.name }),
      user_name: "SYSTEM",
    });

    return NextResponse.json(mapRow(category));
  } catch (error) {
    console.error("Erreur coverage-category PUT:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la catégorie de garanties" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;

    const { data } = await db
      .from("coverage_categories")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    const existing = mapRow(data);
    if (!existing) {
      return NextResponse.json(
        { error: "Catégorie de garanties introuvable" },
        { status: 404 }
      );
    }

    await db.from("coverage_categories").delete().eq("id", id);

    await db.from("audit_logs").insert({
      action: "DELETE",
      entity: "CoverageCategory",
      entity_id: id,
      details: JSON.stringify({ code: existing.code, name: existing.name }),
      user_name: "SYSTEM",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur coverage-category DELETE:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la catégorie de garanties" },
      { status: 500 }
    );
  }
}
