import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const pkg = await db.insurancePackage.findUnique({
      where: { id },
      include: {
        coverageLinks: {
          include: {
            coverage: {
              select: {
                id: true,
                name: true,
                code: true,
                type: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!pkg) {
      return NextResponse.json(
        { error: "Package introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(pkg);
  } catch (error) {
    console.error("Erreur insurance-package GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement du package" },
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
    const { name, description, basePrice, isActive } = body;

    const existing = await db.insurancePackage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Package introuvable" },
        { status: 404 }
      );
    }

    const pkg = await db.insurancePackage.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(basePrice !== undefined && { basePrice }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(pkg);
  } catch (error) {
    console.error("Erreur insurance-package PUT:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du package" },
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

    const existing = await db.insurancePackage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Package introuvable" },
        { status: 404 }
      );
    }

    await db.insurancePackage.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur insurance-package DELETE:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du package" },
      { status: 500 }
    );
  }
}