import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const offer = await db.insuranceOffer.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, icon: true } },
        insurer: { select: { id: true, name: true, code: true, logoUrl: true } },
      },
    });

    if (!offer) {
      return NextResponse.json(
        { error: "Offre non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...offer,
      features: JSON.parse(offer.features || "[]"),
    });
  } catch (error) {
    console.error("Erreur insurer/offers/[id] GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement de l'offre" },
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
    const {
      categoryId,
      name,
      description,
      priceMin,
      priceMax,
      coverageAmount,
      deductible,
      features,
      contractType,
      isActive,
      fiscalPowerMin,
      fiscalPowerMax,
      fuelTypes,
      newValueMin,
      newValueMax,
      venalValueMin,
      venalValueMax,
      vehicleUsage,
    } = body;

    const existing = await db.insuranceOffer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Offre non trouvée" },
        { status: 404 }
      );
    }

    const updated = await db.insuranceOffer.update({
      where: { id },
      data: {
        ...(categoryId !== undefined ? { categoryId: categoryId || null } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description: description || null } : {}),
        ...(priceMin !== undefined ? { priceMin: priceMin != null ? Number(priceMin) : null } : {}),
        ...(priceMax !== undefined ? { priceMax: priceMax != null ? Number(priceMax) : null } : {}),
        ...(coverageAmount !== undefined ? { coverageAmount: coverageAmount != null ? Number(coverageAmount) : null } : {}),
        ...(deductible !== undefined ? { deductible: Number(deductible) } : {}),
        ...(features !== undefined ? { features: JSON.stringify(features) } : {}),
        ...(contractType !== undefined ? { contractType: contractType || null } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(fiscalPowerMin !== undefined ? { fiscalPowerMin: fiscalPowerMin ? Number(fiscalPowerMin) : null } : {}),
        ...(fiscalPowerMax !== undefined ? { fiscalPowerMax: fiscalPowerMax ? Number(fiscalPowerMax) : null } : {}),
        ...(fuelTypes !== undefined ? { fuelTypes: Array.isArray(fuelTypes) ? JSON.stringify(fuelTypes) : (fuelTypes || "[]") } : {}),
        ...(newValueMin !== undefined ? { newValueMin: newValueMin ? Number(newValueMin) : null } : {}),
        ...(newValueMax !== undefined ? { newValueMax: newValueMax ? Number(newValueMax) : null } : {}),
        ...(venalValueMin !== undefined ? { venalValueMin: venalValueMin ? Number(venalValueMin) : null } : {}),
        ...(venalValueMax !== undefined ? { venalValueMax: venalValueMax ? Number(venalValueMax) : null } : {}),
        ...(vehicleUsage !== undefined ? { vehicleUsage: Array.isArray(vehicleUsage) ? JSON.stringify(vehicleUsage) : (vehicleUsage || "[]") } : {}),
      },
      include: {
        category: { select: { id: true, name: true, icon: true } },
        insurer: { select: { id: true, name: true, code: true, logoUrl: true } },
      },
    });

    return NextResponse.json({
      ...updated,
      features: JSON.parse(updated.features || "[]"),
    });
  } catch (error) {
    console.error("Erreur insurer/offers/[id] PUT:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'offre" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.insuranceOffer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Offre non trouvée" },
        { status: 404 }
      );
    }

    await db.insuranceOffer.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur insurer/offers/[id] DELETE:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'offre" },
      { status: 500 }
    );
  }
}