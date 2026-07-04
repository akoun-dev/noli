import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

function parseFeatures(offer: Record<string, unknown>) {
  try {
    return { ...offer, features: JSON.parse((offer.features as string) || "[]") };
  } catch {
    return { ...offer, features: [] };
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const offer = await db.insuranceOffer.findUnique({
      where: { id },
      include: {
        insurer: { select: { id: true, name: true, code: true } },
        category: { select: { id: true, name: true, icon: true } },
      },
    });

    if (!offer) {
      return NextResponse.json(
        { error: "Offre introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(parseFeatures(offer as unknown as Record<string, unknown>));
  } catch (error) {
    console.error("Erreur insurance-offer GET:", error);
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
      insurerId,
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
        { error: "Offre introuvable" },
        { status: 404 }
      );
    }

    const offer = await db.insuranceOffer.update({
      where: { id },
      data: {
        ...(insurerId !== undefined && { insurerId }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(priceMin !== undefined && { priceMin: priceMin ?? null }),
        ...(priceMax !== undefined && { priceMax: priceMax ?? null }),
        ...(coverageAmount !== undefined && { coverageAmount: coverageAmount ?? null }),
        ...(deductible !== undefined && { deductible }),
        ...(features !== undefined && {
          features: Array.isArray(features) ? JSON.stringify(features) : (features || "[]"),
        }),
        ...(contractType !== undefined && { contractType: contractType || null }),
        ...(isActive !== undefined && { isActive }),
        ...(fiscalPowerMin !== undefined && { fiscalPowerMin: fiscalPowerMin ? Number(fiscalPowerMin) : null }),
        ...(fiscalPowerMax !== undefined && { fiscalPowerMax: fiscalPowerMax ? Number(fiscalPowerMax) : null }),
        ...(fuelTypes !== undefined && {
          fuelTypes: Array.isArray(fuelTypes) ? JSON.stringify(fuelTypes) : (fuelTypes || "[]"),
        }),
        ...(newValueMin !== undefined && { newValueMin: newValueMin ? Number(newValueMin) : null }),
        ...(newValueMax !== undefined && { newValueMax: newValueMax ? Number(newValueMax) : null }),
        ...(venalValueMin !== undefined && { venalValueMin: venalValueMin ? Number(venalValueMin) : null }),
        ...(venalValueMax !== undefined && { venalValueMax: venalValueMax ? Number(venalValueMax) : null }),
        ...(vehicleUsage !== undefined && {
          vehicleUsage: Array.isArray(vehicleUsage) ? JSON.stringify(vehicleUsage) : (vehicleUsage || "[]"),
        }),
      },
    });

    await db.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "InsuranceOffer",
        entityId: id,
        details: JSON.stringify({ name: offer.name, contractType: offer.contractType }),
        userName: "SYSTEM",
      },
    });

    return NextResponse.json(parseFeatures(offer as unknown as Record<string, unknown>));
  } catch (error) {
    console.error("Erreur insurance-offer PUT:", error);
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
        { error: "Offre introuvable" },
        { status: 404 }
      );
    }

    await db.insuranceOffer.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        action: "DELETE",
        entity: "InsuranceOffer",
        entityId: id,
        details: JSON.stringify({ name: existing.name, contractType: existing.contractType }),
        userName: "SYSTEM",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur insurance-offer DELETE:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'offre" },
      { status: 500 }
    );
  }
}