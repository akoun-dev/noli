import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const [
      totalInsurers,
      activeInsurers,
      totalOffers,
      activeOffers,
      totalCoverages,
      activeCoverages,
      totalQuotes,
      pendingQuotes,
      totalPackages,
      totalProfiles,
      totalCoverageCategories,
      totalInsuranceCategories,
      totalTariffRules,
      recentQuotes,
    ] = await Promise.all([
      db.insurer.count(),
      db.insurer.count({ where: { isActive: true } }),
      db.insuranceOffer.count(),
      db.insuranceOffer.count({ where: { isActive: true } }),
      db.coverage.count(),
      db.coverage.count({ where: { isActive: true } }),
      db.quote.count(),
      db.quote.count({ where: { status: "PENDING" } }),
      db.insurancePackage.count(),
      db.profile.count(),
      db.coverageCategory.count(),
      db.insuranceCategory.count(),
      db.coverageTariffRule.count(),
      db.quote.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          offer: {
            include: { insurer: { select: { name: true } } },
          },
        },
      }),
    ]);

    return NextResponse.json({
      totalInsurers,
      activeInsurers,
      totalOffers,
      activeOffers,
      totalCoverages,
      activeCoverages,
      totalQuotes,
      pendingQuotes,
      totalPackages,
      totalProfiles,
      totalCoverageCategories,
      totalInsuranceCategories,
      totalTariffRules,
      recentQuotes: recentQuotes.map((q) => ({
        id: q.id,
        reference: q.reference,
        status: q.status,
        estimatedPrice: q.estimatedPrice,
        personalData: q.personalData,
        createdAt: q.createdAt.toISOString(),
        offer: q.offer ? {
          name: q.offer.name,
          insurer: q.offer.insurer ? { name: q.offer.insurer.name } : undefined,
        } : undefined,
      })),
    });
  } catch (error) {
    console.error("Erreur stats:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des statistiques" },
      { status: 500 }
    );
  }
}