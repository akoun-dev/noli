import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Le paramètre userId est requis" },
        { status: 400 }
      );
    }

    const [
      totalQuotes,
      pendingQuotes,
      approvedQuotes,
      rejectedQuotes,
      draftQuotes,
      quotesWithPrices,
    ] = await Promise.all([
      db.quote.count({ where: { userId } }),
      db.quote.count({ where: { userId, status: "PENDING" } }),
      db.quote.count({ where: { userId, status: "APPROVED" } }),
      db.quote.count({ where: { userId, status: "REJECTED" } }),
      db.quote.count({ where: { userId, status: "DRAFT" } }),
      db.quote.findMany({
        where: {
          userId,
          estimatedPrice: { not: null },
          offerId: { not: null },
        },
        select: {
          estimatedPrice: true,
          offer: { select: { priceMin: true, priceMax: true } },
        },
      }),
    ]);

    // Total savings = sum of (priceMax - priceMin) for each quote's linked offer
    const totalSavings = quotesWithPrices.reduce((sum, q) => {
      const max = q.offer?.priceMax ?? 0;
      const min = q.offer?.priceMin ?? 0;
      return sum + (max - min);
    }, 0);

    return NextResponse.json({
      totalQuotes,
      pendingQuotes,
      approvedQuotes,
      rejectedQuotes,
      draftQuotes,
      totalSavings,
    });
  } catch (error) {
    console.error("Erreur user/stats:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des statistiques" },
      { status: 500 }
    );
  }
}