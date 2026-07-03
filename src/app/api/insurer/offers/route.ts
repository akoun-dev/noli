import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const insurerId = request.nextUrl.searchParams.get("insurerId");
    const activeOnly = request.nextUrl.searchParams.get("active");

    if (!insurerId) {
      return NextResponse.json(
        { error: "Le paramètre insurerId est requis" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { insurerId };
    if (activeOnly === "true") {
      where.isActive = true;
    }

    const offers = await db.insuranceOffer.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, icon: true },
        },
        insurer: {
          select: { id: true, name: true, code: true, logoUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Parse features JSON for each offer
    const parsed = offers.map((o) => ({
      ...o,
      features: JSON.parse(o.features || "[]"),
    }));

    return NextResponse.json({ offers: parsed });
  } catch (error) {
    console.error("Erreur insurer/offers GET:", error);
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
    } = body;

    if (!insurerId || !name) {
      return NextResponse.json(
        { error: "L'identifiant de l'assureur et le nom sont requis" },
        { status: 400 }
      );
    }

    const offer = await db.insuranceOffer.create({
      data: {
        insurerId,
        categoryId: categoryId || null,
        name,
        description: description || null,
        priceMin: priceMin != null ? Number(priceMin) : null,
        priceMax: priceMax != null ? Number(priceMax) : null,
        coverageAmount: coverageAmount != null ? Number(coverageAmount) : null,
        deductible: deductible != null ? Number(deductible) : 0,
        features: JSON.stringify(features || []),
        contractType: contractType || null,
        isActive: true,
      },
      include: {
        category: { select: { id: true, name: true, icon: true } },
        insurer: { select: { id: true, name: true, code: true, logoUrl: true } },
      },
    });

    return NextResponse.json(
      { ...offer, features: JSON.parse(offer.features || "[]") },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur insurer/offers POST:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'offre" },
      { status: 500 }
    );
  }
}