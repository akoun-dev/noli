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

    const category = await db.coverageCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { coverages: true } },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Catégorie de garanties introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
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

    const existing = await db.coverageCategory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Catégorie de garanties introuvable" },
        { status: 404 }
      );
    }

    if (code && code !== existing.code) {
      const codeTaken = await db.coverageCategory.findUnique({ where: { code } });
      if (codeTaken) {
        return NextResponse.json(
          { error: "Une catégorie avec ce code existe déjà" },
          { status: 400 }
        );
      }
    }

    const category = await db.coverageCategory.update({
      where: { id },
      data: {
        ...(code !== undefined && { code }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    await db.auditLog.create({
      data: { action: "UPDATE", entity: "CoverageCategory", entityId: id, details: JSON.stringify({ code: category.code, name: category.name }), userName: "SYSTEM" },
    });

    return NextResponse.json(category);
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

    const existing = await db.coverageCategory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Catégorie de garanties introuvable" },
        { status: 404 }
      );
    }

    await db.coverageCategory.delete({ where: { id } });

    await db.auditLog.create({
      data: { action: "DELETE", entity: "CoverageCategory", entityId: id, details: JSON.stringify({ code: existing.code, name: existing.name }), userName: "SYSTEM" },
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