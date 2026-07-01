import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

function parseMetadata(coverage: Record<string, unknown>) {
  try {
    return { ...coverage, metadata: JSON.parse((coverage.metadata as string) || "{}") };
  } catch {
    return { ...coverage, metadata: {} };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const insurerId = searchParams.get("insurerId");
    const categoryId = searchParams.get("categoryId");
    const calculationType = searchParams.get("calculationType");
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (insurerId) {
      where.insurerId = insurerId;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (calculationType) {
      where.calculationType = calculationType;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
      ];
    }

    const coverages = await db.coverage.findMany({
      where,
      select: {
        id: true,
        code: true,
        type: true,
        name: true,
        description: true,
        calculationType: true,
        isMandatory: true,
        isActive: true,
        displayOrder: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        categoryId: true,
        insurerId: true,
        insurer: { select: { id: true, name: true, code: true } },
        category: { select: { id: true, name: true, code: true } },
        _count: { select: { tariffRules: true } },
      },
      orderBy: { displayOrder: "asc" },
    });

    const parsed = coverages.map((c) => parseMetadata(c as unknown as Record<string, unknown>));
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Erreur coverages GET:", error);
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
      code,
      type,
      name,
      description,
      calculationType,
      categoryId,
      insurerId,
      isMandatory,
      isActive,
      displayOrder,
      metadata,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Le nom est requis" },
        { status: 400 }
      );
    }
    if (!calculationType) {
      return NextResponse.json(
        { error: "Le type de calcul est requis" },
        { status: 400 }
      );
    }
    if (!insurerId) {
      return NextResponse.json(
        { error: "L'assureur est requis" },
        { status: 400 }
      );
    }

    // Auto-generate code: TYPE_INSURER_CODE
    let genCode = code;
    if (!genCode) {
      const insurer = await db.insurer.findUnique({ where: { id: insurerId }, select: { code: true } });
      const insCode = insurer?.code || "INS";
      const typePrefix = (type || name).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, "").substring(0, 10);
      genCode = `${typePrefix}_${insCode}`;
      // Ensure uniqueness
      let suffix = 1;
      let unique = genCode;
      while (await db.coverage.findUnique({ where: { code: unique } })) {
        unique = `${genCode}_${suffix++}`;
      }
      genCode = unique;
    } else {
      const existing = await db.coverage.findUnique({ where: { code: genCode } });
      if (existing) {
        return NextResponse.json(
          { error: "Une garantie avec ce code existe déjà" },
          { status: 400 }
        );
      }
    }

    const coverage = await db.coverage.create({
      data: {
        code: genCode,
        type: type || genCode,
        name,
        description: description || null,
        calculationType,
        categoryId: categoryId || null,
        insurerId,
        isMandatory: isMandatory ?? false,
        isActive: isActive ?? true,
        displayOrder: displayOrder ?? 0,
        metadata: typeof metadata === "object" ? JSON.stringify(metadata) : (metadata || "{}"),
      },
    });

    return NextResponse.json(parseMetadata(coverage as unknown as Record<string, unknown>), { status: 201 });
  } catch (error) {
    console.error("Erreur coverages POST:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la garantie" },
      { status: 500 }
    );
  }
}