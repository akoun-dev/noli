import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;

    const category = await db.guaranteeCategory.findUnique({
      where: { id },
      include: {
        guarantees: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Catégorie introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Erreur lors de la récupération de la catégorie:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la catégorie" },
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

    const existing = await db.guaranteeCategory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Catégorie introuvable" },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.slug !== undefined) data.slug = body.slug;
    if (body.description !== undefined) data.description = body.description;
    if (body.icon !== undefined) data.icon = body.icon;
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
    if (body.isActive !== undefined) data.isActive = body.isActive;

    const category = await db.guaranteeCategory.update({
      where: { id },
      data,
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la catégorie:", error);
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

    const existing = await db.guaranteeCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { guarantees: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Catégorie introuvable" },
        { status: 404 }
      );
    }

    if (existing._count.guarantees > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer cette catégorie : ${existing._count.guarantees} garantie(s) y sont liée(s). Veuillez d'abord les dissocier.`,
        },
        { status: 400 }
      );
    }

    await db.guaranteeCategory.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Catégorie supprimée avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la catégorie:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la catégorie" },
      { status: 500 }
    );
  }
}