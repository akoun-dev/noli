import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const insurerId = searchParams.get("insurerId");
    const contractType = searchParams.get("contractType");
    const sortBy = searchParams.get("sortBy") || "price_asc";

    const where: Record<string, unknown> = {
      isActive: true,
      insurer: { isActive: true },
    };

    if (categoryId) where.categoryId = categoryId;
    if (insurerId) where.insurerId = insurerId;
    if (contractType) where.contractType = contractType;

    const orderBy: Record<string, string> =
      sortBy === "price_desc"
        ? { priceMin: "desc" }
        : sortBy === "name_asc"
          ? { name: "asc" }
          : { priceMin: "asc" };

    const offers = await db.insuranceOffer.findMany({
      where,
      include: {
        insurer: { select: { id: true, name: true, logoUrl: true, code: true } },
        category: { select: { id: true, name: true, icon: true } },
      },
      orderBy,
    });

    // Also fetch categories and insurers for filtering
    const categories = await db.insuranceCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    const insurers = await db.insurer.findMany({
      where: { isActive: true },
      select: { id: true, name: true, logoUrl: true, code: true },
      orderBy: { name: "asc" },
    });

    const formattedOffers = offers.map((o) => ({
      id: o.id,
      name: o.name,
      description: o.description,
      priceMin: o.priceMin,
      priceMax: o.priceMax,
      coverageAmount: o.coverageAmount,
      deductible: o.deductible,
      contractType: o.contractType,
      features: (() => { try { return JSON.parse(o.features || "[]"); } catch { return []; } })(),
      insurer: o.insurer,
      category: o.category,
      createdAt: o.createdAt,
    }));

    return NextResponse.json({
      offers: formattedOffers,
      categories,
      insurers,
      total: formattedOffers.length,
    });
  } catch (error) {
    console.error("Offers fetch error:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des offres" },
      { status: 500 }
    );
  }
}