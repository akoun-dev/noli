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
      while (await db.coverageCategory.findUnique({ where: { code: unique } })) {
        unique = `${genCode}_${suffix++}`;
      }
      genCode = unique;
    } else {
      const existing = await db.coverageCategory.findUnique({ where: { code: genCode } });
      if (existing) {
        return NextResponse.json(
          { error: "Une catégorie avec ce code existe déjà" },
          { status: 400 }
        );
      }
    }

    const category = await db.coverageCategory.create({
      data: {
        code: genCode,
        name,
        description: description || null,
        displayOrder: displayOrder ?? 0,
        isActive: isActive ?? true,
      },
    });

    await db.auditLog.create({
      data: { action: "CREATE", entity: "CoverageCategory", entityId: category.id, details: JSON.stringify({ code: category.code, name: category.name }), userName: "SYSTEM" },
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