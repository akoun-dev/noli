import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

function parseFeatures(offer: Record<string, unknown>) {
  try {
    return { ...offer, features: JSON.parse((offer.features as string) || "[]") };
  } catch {
    return { ...offer, features: [] };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const insurerId = searchParams.get("insurerId");
    const contractType = searchParams.get("contractType");
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (insurerId) {
      where.insurerId = insurerId;
    }
    if (contractType) {
      where.contractType = contractType;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
      ];
    }

    const offers = await db.insuranceOffer.findMany({
      where,
      include: {
        insurer: { select: { id: true, name: true, code: true } },
        category: { select: { id: true, name: true, icon: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const parsed = offers.map((o) => parseFeatures(o as unknown as Record<string, unknown>));
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Erreur insurance-offers GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des offres" },
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

    if (!insurerId) {
      return NextResponse.json(
        { error: "L'assureur est requis" },
        { status: 400 }
      );
    }
    if (!name) {
      return NextResponse.json(
        { error: "Le nom est requis" },
        { status: 400 }
      );
    }

    const offer = await db.insuranceOffer.create({
      data: {
        insurerId,
        categoryId: categoryId || null,
        name,
        description: description || null,
        priceMin: priceMin ?? null,
        priceMax: priceMax ?? null,
        coverageAmount: coverageAmount ?? null,
        deductible: deductible ?? 0,
        features: Array.isArray(features) ? JSON.stringify(features) : (features || "[]"),
        contractType: contractType || null,
        isActive: isActive ?? true,
        fiscalPowerMin: fiscalPowerMin ? Number(fiscalPowerMin) : null,
        fiscalPowerMax: fiscalPowerMax ? Number(fiscalPowerMax) : null,
        fuelTypes: Array.isArray(fuelTypes) ? JSON.stringify(fuelTypes) : (fuelTypes || "[]"),
        newValueMin: newValueMin ? Number(newValueMin) : null,
        newValueMax: newValueMax ? Number(newValueMax) : null,
        venalValueMin: venalValueMin ? Number(venalValueMin) : null,
        venalValueMax: venalValueMax ? Number(venalValueMax) : null,
        vehicleUsage: Array.isArray(vehicleUsage) ? JSON.stringify(vehicleUsage) : (vehicleUsage || "[]"),
      },
    });

    await db.auditLog.create({
      data: {
        action: "CREATE",
        entity: "InsuranceOffer",
        entityId: offer.id,
        details: JSON.stringify({ name: offer.name, contractType: offer.contractType, insurerId }),
        userName: "SYSTEM",
      },
    });

    return NextResponse.json(parseFeatures(offer as unknown as Record<string, unknown>), { status: 201 });
  } catch (error) {
    console.error("Erreur insurance-offers POST:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'offre" },
      { status: 500 }
    );
  }
}