import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const insurerId = request.nextUrl.searchParams.get("insurerId");

    if (!insurerId) {
      return NextResponse.json(
        { error: "Le paramètre insurerId est requis" },
        { status: 400 }
      );
    }

    const coverages = await db.coverage.findMany({
      where: { insurerId },
      include: {
        category: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ coverages });
  } catch (error) {
    console.error("Erreur insurer/coverages GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des garanties" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      insurerId,
      categoryId,
      code,
      type,
      name,
      description,
      calculationType,
      isMandatory,
      metadata,
    } = body;

    if (!insurerId || !code || !name) {
      return NextResponse.json(
        { error: "L'identifiant de l'assureur, le code et le nom sont requis" },
        { status: 400 }
      );
    }

    // Check unique code
    const existing = await db.coverage.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { error: "Une garantie avec ce code existe déjà" },
        { status: 409 }
      );
    }

    const coverage = await db.coverage.create({
      data: {
        insurerId,
        categoryId: categoryId || null,
        code: code.toUpperCase().trim(),
        type: type || code.toUpperCase().trim(),
        name,
        description: description || null,
        calculationType: calculationType || "FIXED_AMOUNT",
        isMandatory: Boolean(isMandatory),
        isActive: true,
        metadata: typeof metadata === "string" ? metadata : JSON.stringify(metadata || {}),
      },
      include: {
        category: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json(coverage, { status: 201 });
  } catch (error) {
    console.error("Erreur insurer/coverages POST:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la garantie" },
      { status: 500 }
    );
  }
}