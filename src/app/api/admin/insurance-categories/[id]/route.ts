import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const category = await db.insuranceCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { offers: true, quotes: true } },
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
    const { id } = await params;
    const body = await request.json();
    const { name, description, icon, isActive } = body;

    const existing = await db.insuranceCategory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Catégorie introuvable" },
        { status: 404 }
      );
    }

    const category = await db.insuranceCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(icon !== undefined && { icon: icon || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    await db.auditLog.create({
      data: { action: "UPDATE", entity: "InsuranceCategory", entityId: id, details: JSON.stringify({ name: category.name }), userName: "SYSTEM" },
    });

    return NextResponse.json(category);
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
    const { id } = await params;

    const existing = await db.insuranceCategory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Catégorie introuvable" },
        { status: 404 }
      );
    }

    await db.insuranceCategory.delete({ where: { id } });

    await db.auditLog.create({
      data: { action: "DELETE", entity: "InsuranceCategory", entityId: id, details: JSON.stringify({ name: existing.name }), userName: "SYSTEM" },
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