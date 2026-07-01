import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [
      insurers,
      offers,
      coverages,
      coverageCategories,
      insuranceCategories,
      packages,
      quotes,
      profiles,
      tariffRules,
    ] = await Promise.all([
      db.insurer.count(),
      db.insuranceOffer.count(),
      db.coverage.count(),
      db.coverageCategory.count(),
      db.insuranceCategory.count(),
      db.insurancePackage.count(),
      db.quote.count(),
      db.profile.count(),
      db.coverageTariffRule.count(),
    ]);

    return NextResponse.json({
      insurers,
      offers,
      coverages,
      coverageCategories,
      insuranceCategories,
      packages,
      quotes,
      profiles,
      tariffRules,
    });
  } catch (error) {
    console.error("Erreur stats:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des statistiques" },
      { status: 500 }
    );
  }
}