import { db, mapRow } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;

    const { data, error } = await db
      .from("insurance_categories")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    const category = mapRow(data);

    if (!category) {
      return NextResponse.json(
        { error: "Catégorie introuvable" },
        { status: 404 }
      );
    }

    const { count: offersCount } = await db
      .from("insurance_offers")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);
    const { count: quotesCount } = await db
      .from("quotes")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);

    return NextResponse.json({
      ...category,
      _count: { offers: offersCount || 0, quotes: quotesCount || 0 },
    });
  } catch (error) {
    console.error("Erreur insurance-category GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement de la catégorie" },
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
    const { name, description, icon, isActive } = body;

    const { data: existing } = await db
      .from("insurance_categories")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json(
        { error: "Catégorie introuvable" },
        { status: 404 }
      );
    }

    const { data: category, error } = await db
      .from("insurance_categories")
      .update({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(icon !== undefined && { icon: icon || null }),
        ...(isActive !== undefined && { is_active: isActive }),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    await logAudit({
      action: "UPDATE",
      entity: "InsuranceCategory",
      entityId: id,
      details: { name: category.name },
    });

    return NextResponse.json(mapRow(category));
  } catch (error) {
    console.error("Erreur insurance-category PUT:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la catégorie" },
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
      .from("insurance_categories")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    const existing = mapRow(data);
    if (!existing) {
      return NextResponse.json(
        { error: "Catégorie introuvable" },
        { status: 404 }
      );
    }

    await db.from("insurance_categories").delete().eq("id", id);

    await logAudit({
      action: "DELETE",
      entity: "InsuranceCategory",
      entityId: id,
      details: { name: existing.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur insurance-category DELETE:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la catégorie" },
      { status: 500 }
    );
  }
}
