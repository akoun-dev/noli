import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const offer = await db.offer.findUnique({
      where: { id },
      include: {
        insurer: true,
        guaranteeLinks: {
          include: {
            guarantee: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!offer) {
      return NextResponse.json(
        { error: "Offre introuvable" },
        { status: 404 }
      );
    }

    // Parse features and guarantee JSON fields
    const result = {
      ...offer,
      features: JSON.parse(offer.features),
      guaranteeLinks: offer.guaranteeLinks.map((link) => ({
        ...link,
        guarantee: {
          ...link.guarantee,
          rateConditions: link.guarantee.rateConditions
            ? JSON.parse(link.guarantee.rateConditions)
            : null,
          capital: link.guarantee.capital
            ? JSON.parse(link.guarantee.capital)
            : null,
          franchise: link.guarantee.franchise
            ? JSON.parse(link.guarantee.franchise)
            : null,
          matrixConfig: link.guarantee.matrixConfig
            ? JSON.parse(link.guarantee.matrixConfig)
            : null,
        },
      })),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'offre:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'offre" },
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

    const existing = await db.offer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Offre introuvable" },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (body.insurerId !== undefined) data.insurerId = body.insurerId;
    if (body.name !== undefined) data.name = body.name;
    if (body.coverageType !== undefined) data.coverageType = body.coverageType;
    if (body.description !== undefined) data.description = body.description;
    if (body.basePrice !== undefined) data.basePrice = body.basePrice;
    if (body.annualPrice !== undefined) data.annualPrice = body.annualPrice;
    if (body.deductible !== undefined) data.deductible = body.deductible;
    if (body.maxCoverage !== undefined) data.maxCoverage = body.maxCoverage;
    if (body.features !== undefined)
      data.features = Array.isArray(body.features)
        ? JSON.stringify(body.features)
        : undefined;
    if (body.conditions !== undefined) data.conditions = body.conditions;
    if (body.isActive !== undefined) data.isActive = body.isActive;

    const offer = await db.offer.update({
      where: { id },
      data,
      include: {
        insurer: {
          select: { id: true, name: true, logo: true },
        },
        guaranteeLinks: {
          include: {
            guarantee: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const offerParsed = {
      ...offer,
      features: JSON.parse(offer.features),
      guaranteeLinks: offer.guaranteeLinks.map((link) => ({
        ...link,
        guarantee: {
          ...link.guarantee,
          rateConditions: link.guarantee.rateConditions
            ? JSON.parse(link.guarantee.rateConditions)
            : null,
          capital: link.guarantee.capital
            ? JSON.parse(link.guarantee.capital)
            : null,
          franchise: link.guarantee.franchise
            ? JSON.parse(link.guarantee.franchise)
            : null,
          matrixConfig: link.guarantee.matrixConfig
            ? JSON.parse(link.guarantee.matrixConfig)
            : null,
        },
      })),
    };

    return NextResponse.json(offerParsed);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'offre:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'offre" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.offer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Offre introuvable" },
        { status: 404 }
      );
    }

    await db.offer.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Offre supprimée avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'offre:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'offre" },
      { status: 500 }
    );
  }
}