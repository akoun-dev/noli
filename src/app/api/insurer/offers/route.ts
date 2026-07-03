import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));

    if (!userId) {
      return NextResponse.json(
        { error: "Le paramètre userId est requis" },
        { status: 400 }
      );
    }

    const account = await db.insurerAccount.findFirst({
      where: { profileId: userId },
      select: { insurerId: true },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Aucun compte assureur trouvé pour cet utilisateur" },
        { status: 404 }
      );
    }

    const where: Record<string, unknown> = { insurerId: account.insurerId };

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { contractType: { contains: search } },
      ];
    }

    const [offers, total] = await Promise.all([
      db.insuranceOffer.findMany({
        where,
        include: {
          category: { select: { name: true } },
          _count: { select: { quotes: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.insuranceOffer.count({ where }),
    ]);

    const formatted = offers.map((o) => ({
      id: o.id,
      name: o.name,
      description: o.description,
      priceMin: o.priceMin,
      priceMax: o.priceMax,
      deductible: o.deductible,
      contractType: o.contractType,
      isActive: o.isActive,
      category: o.category ? { name: o.category.name } : null,
      _count: { quotes: o._count.quotes },
    }));

    return NextResponse.json({ offers: formatted, total, page, limit });
  } catch (error) {
    console.error("Erreur insurer/offers:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des offres" },
      { status: 500 }
    );
  }
}