import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const categories = await db.coverageCategory.findMany({
      include: {
        _count: { select: { coverages: true } },
      },
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Erreur coverage-categories GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des catégories de garanties" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, description, displayOrder, isActive } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Le code est requis" },
        { status: 400 }
      );
    }
    if (!name) {
      return NextResponse.json(
        { error: "Le nom est requis" },
        { status: 400 }
      );
    }

    const existing = await db.coverageCategory.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { error: "Une catégorie avec ce code existe déjà" },
        { status: 400 }
      );
    }

    const category = await db.coverageCategory.create({
      data: {
        code,
        name,
        description: description || null,
        displayOrder: displayOrder ?? 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Erreur coverage-categories POST:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la catégorie de garanties" },
      { status: 500 }
    );
  }
}