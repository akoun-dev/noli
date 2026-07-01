import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [
      totalInsurers,
      activeInsurers,
      totalOffers,
      activeOffers,
      totalQuotes,
      pendingQuotes,
      totalGuarantees,
      totalGuaranteeLinks,
      totalOfferLinks,
      recentQuotes,
    ] = await Promise.all([
      db.insurer.count(),
      db.insurer.count({ where: { isActive: true } }),
      db.offer.count(),
      db.offer.count({ where: { isActive: true } }),
      db.quote.count(),
      db.quote.count({ where: { status: "pending" } }),
      db.guarantee.count(),
      db.insurerGuarantee.count(),
      db.offerGuarantee.count(),
      db.quote.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
          offer: {
            include: {
              insurer: {
                select: { id: true, name: true, logo: true },
              },
              guaranteeLinks: {
                include: {
                  guarantee: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const recentQuotesParsed = recentQuotes.map((quote) => ({
      ...quote,
      personalInfo: JSON.parse(quote.personalInfo),
      vehicleInfo: JSON.parse(quote.vehicleInfo),
      coverageNeeds: JSON.parse(quote.coverageNeeds),
      offer: quote.offer
        ? {
            ...quote.offer,
            features: JSON.parse(quote.offer.features),
          }
        : null,
    }));

    return NextResponse.json({
      totalInsurers,
      activeInsurers,
      totalOffers,
      activeOffers,
      totalQuotes,
      pendingQuotes,
      totalGuarantees,
      totalGuaranteeLinks,
      totalOfferLinks,
      recentQuotes: recentQuotesParsed,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}