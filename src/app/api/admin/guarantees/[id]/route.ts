import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;

    const guarantee = await db.guarantee.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!guarantee) {
      return NextResponse.json(
        { error: "Garantie introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      parseGuaranteeJson(guarantee as unknown as Record<string, unknown>)
    );
  } catch (error) {
    console.error("Erreur lors de la récupération de la garantie:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la garantie" },
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

    const existing = await db.guarantee.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Garantie introuvable" },
        { status: 404 }
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

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.slug !== undefined) data.slug = body.slug;
    if (body.description !== undefined) data.description = body.description;
    if (body.icon !== undefined) data.icon = body.icon;
    if (body.categoryId !== undefined) data.categoryId = body.categoryId;
    if (body.categoryLabel !== undefined) data.categoryLabel = body.categoryLabel;
    if (body.calcMethod !== undefined) data.calcMethod = body.calcMethod;
    if (body.fixedPrice !== undefined) data.fixedPrice = body.fixedPrice;
    if (body.rate !== undefined) data.rate = body.rate;
    if (body.rateConditions !== undefined)
      data.rateConditions = body.rateConditions
        ? JSON.stringify(body.rateConditions)
        : null;
    if (body.capital !== undefined)
      data.capital = body.capital ? JSON.stringify(body.capital) : null;
    if (body.franchise !== undefined)
      data.franchise = body.franchise ? JSON.stringify(body.franchise) : null;
    if (body.matrixConfig !== undefined)
      data.matrixConfig = body.matrixConfig
        ? JSON.stringify(body.matrixConfig)
        : null;
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
    if (body.isActive !== undefined) data.isActive = body.isActive;

    const guarantee = await db.guarantee.update({
      where: { id },
      data,
      include: { category: true },
    });

    return NextResponse.json(
      parseGuaranteeJson(guarantee as unknown as Record<string, unknown>)
    );
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la garantie:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la garantie" },
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

    const existing = await db.guarantee.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Garantie introuvable" },
        { status: 404 }
      );
    }

    await db.guarantee.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Garantie supprimée avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la garantie:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la garantie" },
      { status: 500 }
    );
  }
}