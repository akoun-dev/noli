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

    if (!insurerId || !name) {
      return NextResponse.json(
        { error: "L'identifiant de l'assureur et le nom sont requis" },
        { status: 400 }
      );
    }

    // Auto-generate code if not provided (like admin)
    let genCode = code;
    if (!genCode) {
      const insurer = await db.insurer.findUnique({ where: { id: insurerId }, select: { code: true } });
      const insCode = insurer?.code || "INS";
      const typePrefix = name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, "").substring(0, 10);
      genCode = `${typePrefix}_${insCode}`;
      let suffix = 1;
      let unique = genCode;
      while (await db.coverage.findUnique({ where: { code: unique } })) {
        unique = `${genCode}_${suffix++}`;
      }
      genCode = unique;
    } else {
      genCode = genCode.toUpperCase().trim();
      const existing = await db.coverage.findUnique({ where: { code: genCode } });
      if (existing) {
        return NextResponse.json(
          { error: "Une garantie avec ce code existe déjà" },
          { status: 409 }
        );
      }
    }

    const coverage = await db.coverage.create({
      data: {
        insurerId,
        categoryId: categoryId || null,
        code: genCode,
        type: genCode,
        name,
        description: description || null,
        calculationType: calculationType || "FIXED_AMOUNT",
        isMandatory: Boolean(isMandatory),
        isActive: true,
        metadata: metadata
          ? typeof metadata === "string"
            ? metadata
            : JSON.stringify(metadata)
          : "{}",
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