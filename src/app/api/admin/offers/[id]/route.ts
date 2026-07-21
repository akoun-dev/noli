import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

function safeJsonParse(val: string | null | undefined, fallback: unknown = null) {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;

    const offer = await db.insuranceOffer.findUnique({
      where: { id },
      include: {
        insurer: true,
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
    }

    const result = {
      ...offer,
      features: safeJsonParse(offer.features, []),
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
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;
    const body = await request.json();

    const existing = await db.insuranceOffer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (body.insurerId !== undefined) data.insurerId = body.insurerId;
    if (body.name !== undefined) data.name = body.name;
    if (body.coverageType !== undefined) data.contractType = body.coverageType;
    if (body.description !== undefined) data.description = body.description;
    if (body.basePrice !== undefined) data.priceMin = body.basePrice;
    if (body.deductible !== undefined) data.deductible = body.deductible;
    if (body.maxCoverage !== undefined) data.coverageAmount = body.maxCoverage;
    if (body.features !== undefined)
      data.features = Array.isArray(body.features)
        ? JSON.stringify(body.features)
        : undefined;
    if (body.isActive !== undefined) data.isActive = body.isActive;

    const offer = await db.insuranceOffer.update({
      where: { id },
      data,
      include: {
        insurer: { select: { id: true, name: true, logoUrl: true } },
      },
    });

    const offerParsed = {
      ...offer,
      features: safeJsonParse(offer.features, []),
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
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;

    const existing = await db.insuranceOffer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
    }

    await db.insuranceOffer.delete({ where: { id } });

    return NextResponse.json({ message: "Offre supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'offre:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'offre" },
      { status: 500 }
    );
  }
}
