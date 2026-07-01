import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const insurer = await db.insurer.findUnique({
      where: { id },
      include: {
        offers: {
          orderBy: { createdAt: "desc" },
        },
        guaranteeLinks: {
          include: {
            guarantee: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!insurer) {
      return NextResponse.json(
        { error: "Assureur introuvable" },
        { status: 404 }
      );
    }

    // Parse JSON fields for offers and guarantees
    const result = {
      ...insurer,
      offers: insurer.offers.map((offer) => ({
        ...offer,
        features: JSON.parse(offer.features),
      })),
      guaranteeLinks: insurer.guaranteeLinks.map((link) => ({
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
    console.error("Erreur lors de la récupération de l'assureur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'assureur" },
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

    const existing = await db.insurer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Assureur introuvable" },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.logo !== undefined) data.logo = body.logo;
    if (body.description !== undefined) data.description = body.description;
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.email !== undefined) data.email = body.email;
    if (body.website !== undefined) data.website = body.website;
    if (body.rating !== undefined) data.rating = body.rating;
    if (body.isVerified !== undefined) data.isVerified = body.isVerified;
    if (body.isActive !== undefined) data.isActive = body.isActive;

    const insurer = await db.insurer.update({
      where: { id },
      data,
    });

    return NextResponse.json(insurer);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'assureur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'assureur" },
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

    const existing = await db.insurer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Assureur introuvable" },
        { status: 404 }
      );
    }

    await db.insurer.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Assureur supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'assureur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'assureur" },
      { status: 500 }
    );
  }
}