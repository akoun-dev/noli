import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const packages = await db.insurancePackage.findMany({
      include: {
        _count: { select: { coverageLinks: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(packages);
  } catch (error) {
    console.error("Erreur insurance-packages GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des packages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, basePrice, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Le nom est requis" },
        { status: 400 }
      );
    }
    if (basePrice === undefined || basePrice === null) {
      return NextResponse.json(
        { error: "Le prix de base est requis" },
        { status: 400 }
      );
    }

    const pkg = await db.insurancePackage.create({
      data: {
        name,
        description: description || null,
        basePrice,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(pkg, { status: 201 });
  } catch (error) {
    console.error("Erreur insurance-packages POST:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du package" },
      { status: 500 }
    );
  }
}