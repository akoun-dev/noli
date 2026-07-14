import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function parseGuaranteeJson(guarantee: Record<string, unknown>) {
  return {
    ...guarantee,
    category: guarantee.category || null,
    rateConditions: guarantee.rateConditions
      ? JSON.parse(guarantee.rateConditions as string)
      : null,
    capital: guarantee.capital
      ? JSON.parse(guarantee.capital as string)
      : null,
    franchise: guarantee.franchise
      ? JSON.parse(guarantee.franchise as string)
      : null,
    matrixConfig: guarantee.matrixConfig
      ? JSON.parse(guarantee.matrixConfig as string)
      : null,
  };
}

export async function GET(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");

    const where: Record<string, unknown> = {};

    if (active !== null && active !== undefined && active !== "") {
      where.isActive = active === "true";
    }

    const guarantees = await db.guarantee.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { sortOrder: "asc" },
      include: { category: true },
    });

    const parsed = guarantees.map((g) =>
      parseGuaranteeJson(g as unknown as Record<string, unknown>)
    );

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Erreur lors de la récupération des garanties:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des garanties" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Le nom est obligatoire" },
        { status: 400 }
      );
    }

    const slug = body.slug || slugify(body.name);

    // Check for unique slug
    const existing = await db.guarantee.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "Une garantie avec ce slug existe déjà" },
        { status: 400 }
      );
    }

    // Validate categoryId if provided
    if (body.categoryId) {
      const cat = await db.guaranteeCategory.findUnique({
        where: { id: body.categoryId },
      });
      if (!cat) {
        return NextResponse.json(
          { error: "Catégorie introuvable" },
          { status: 400 }
        );
      }
    }

    const validCalcMethods = ["FREE", "FIXED_AMOUNT", "VARIABLE_BASED", "MATRIX_BASED"];
    if (body.calcMethod && !validCalcMethods.includes(body.calcMethod)) {
      return NextResponse.json(
        { error: "Méthode de calcul invalide. Valeurs acceptées : FREE, FIXED_AMOUNT, VARIABLE_BASED, MATRIX_BASED" },
        { status: 400 }
      );
    }

    const guarantee = await db.guarantee.create({
      data: {
        name: body.name,
        slug,
        description: body.description,
        icon: body.icon,
        categoryId: body.categoryId ?? null,
        categoryLabel: body.categoryLabel ?? "garantie",
        calcMethod: body.calcMethod ?? "FIXED_AMOUNT",
        fixedPrice: body.fixedPrice ?? null,
        rate: body.rate ?? null,
        rateConditions: body.rateConditions
          ? JSON.stringify(body.rateConditions)
          : null,
        capital: body.capital ? JSON.stringify(body.capital) : null,
        franchise: body.franchise ? JSON.stringify(body.franchise) : null,
        matrixConfig: body.matrixConfig
          ? JSON.stringify(body.matrixConfig)
          : null,
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive ?? true,
      },
      include: { category: true },
    });

    return NextResponse.json(
      parseGuaranteeJson(guarantee as unknown as Record<string, unknown>),
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de la création de la garantie:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la garantie" },
      { status: 500 }
    );
  }
}