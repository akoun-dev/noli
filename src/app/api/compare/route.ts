import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import type { PersonalInfo, VehicleInfo, CoverageNeeds, InsurerOffer } from "@/types";

function calculatePrice(
  basePrice: number,
  personal: PersonalInfo,
  vehicle: VehicleInfo,
  needs: CoverageNeeds
): number {
  let price = basePrice;

  // Fiscal power factor
  const cv = parseInt(vehicle.fiscalPower || "6");
  if (cv <= 4) price *= 0.8;
  else if (cv <= 6) price *= 1.0;
  else if (cv <= 8) price *= 1.12;
  else if (cv <= 11) price *= 1.25;
  else price *= 1.4;

  // Vehicle age — year can be "2020" or "2020-06" (month input)
  const currentYear = new Date().getFullYear();
  const rawYear = vehicle.year?.split("-")[0] || String(currentYear);
  const vehicleAge = currentYear - parseInt(rawYear);
  if (vehicleAge <= 1) price *= 1.05;
  else if (vehicleAge <= 3) price *= 1.0;
  else if (vehicleAge <= 5) price *= 1.1;
  else if (vehicleAge <= 10) price *= 1.2;
  else price *= 1.35;

  // Usage factor
  if (vehicle.usage === "professionnel") price *= 1.15;
  else if (vehicle.usage === "taxi_vtc") price *= 1.4;
  else if (vehicle.usage === "autre") price *= 1.2;

  // Fuel type
  if (vehicle.fuelType === "diesel") price *= 1.05;
  else if (vehicle.fuelType === "hybride") price *= 1.08;
  else if (vehicle.fuelType === "electrique") price *= 0.95;

  // Seats
  const seats = parseInt(vehicle.seats || "5");
  if (seats > 7) price *= 1.15;
  else if (seats <= 2) price *= 0.9;

  // Value factor
  const newVal = parseInt((vehicle.newValue || "0").replace(/\s/g, "")) || 10000000;
  if (newVal > 30000000) price *= 1.3;
  else if (newVal > 20000000) price *= 1.15;
  else if (newVal > 10000000) price *= 1.0;
  else price *= 0.85;

  // Guarantee categories - more categories = higher price
  const catCount = needs.guaranteeCategories?.length || 0;
  if (catCount <= 2) price *= 0.85;
  else if (catCount <= 4) price *= 1.0;
  else if (catCount <= 6) price *= 1.2;
  else price *= 1.35;

  return Math.round(price / 500) * 500;
}

// Map DB coverage category codes → feature keywords to match in offer features
// These DB codes are now sent directly from the frontend Step 3
const CATEGORY_FEATURE_KEYWORDS: Record<string, string[]> = {
  RESPONSABILITE_CIVILE: ["RC", "Responsabilité"],
  DEFENSE_RECOURS: ["DR", "Défense", "Défense & Recours", "Défense / Recours"],
  INDIVIDUELLE_CONDUCTEUR: ["IC", "Individuelle"],
  INDIVIDUELLE_PASSAGERS: ["IPT", "Passager"],
  INCENDIE: ["Incendie"],
  VOL: ["Vol"],
  BRIS_GLACES: ["BDG", "Bris", "Glaces"],
  TIERCE_COMPLETE: ["TCM", "Tierce Complète"],
  TIERCE_COLLISION: ["TCL", "Tierce Collision"],
  ASSISTANCE: ["Assistance"],
  AVANCE_RECOURS: ["Avance"],
  ACCESSOIRES: ["Accessoire"],
};

// Map contractType to human-readable coverage type
const contractTypeLabel: Record<string, string> = {
  basic: "Tiers",
  third_party_plus: "Tiers+",
  all_risks: "Tous Risques",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const personal: PersonalInfo = body.personalInfo;
    const vehicle: VehicleInfo = body.vehicleInfo;
    const needs: CoverageNeeds = body.coverageNeeds;

    if (!personal.firstName || !personal.lastName || !personal.email || !personal.phone) {
      return NextResponse.json({ error: "Informations personnelles incomplètes" }, { status: 400 });
    }
    if (!vehicle.fiscalPower || !vehicle.year || !vehicle.fuelType) {
      return NextResponse.json({ error: "Informations véhicule incomplètes" }, { status: 400 });
    }

    // Selected guarantee category codes from step 3 (DB codes)
    const selectedCats: string[] = needs.guaranteeCategories || [];

    // Build keyword list for feature matching
    const featureKeywords = new Set<string>();
    for (const catCode of selectedCats) {
      const keywords = CATEGORY_FEATURE_KEYWORDS[catCode] || [];
      for (const kw of keywords) featureKeywords.add(kw);
    }

    // Fetch ALL active offers (no contract type pre-filtering)
    const offers = await db.insuranceOffer.findMany({
      where: {
        isActive: true,
        insurer: { isActive: true },
      },
      include: { insurer: true },
      orderBy: { priceMin: "asc" },
    });

    // Filter: offer features must match at least 1 selected category keyword
    const results: InsurerOffer[] = [];

    for (const offer of offers) {
      let offerFeatures: string[] = [];
      try { offerFeatures = JSON.parse(offer.features || "[]"); } catch { /* ignore */ }

      // Find which selected categories this offer covers via its features
      const matchedCategories: string[] = [];
      for (const catCode of selectedCats) {
        const keywords = CATEGORY_FEATURE_KEYWORDS[catCode] || [];
        const hit = offerFeatures.some((f) =>
          keywords.some((kw) => f.toUpperCase().includes(kw.toUpperCase()))
        );
        if (hit) matchedCategories.push(catCode);
      }

      // Only include offers that match AT LEAST 1 selected category
      if (selectedCats.length === 0 || matchedCategories.length > 0) {
        const basePrice = offer.priceMin || 25000;
        const monthlyPrice = calculatePrice(basePrice, personal, vehicle, needs);

        results.push({
          id: offer.id,
          insurerId: offer.insurerId,
          insurerName: offer.insurer.name,
          insurerLogo: offer.insurer.logoUrl || null,
          insurerRating: 4.0,
          name: offer.name,
          coverageType: contractTypeLabel[offer.contractType || "basic"] || offer.contractType || "Tiers",
          description: offer.description,
          monthlyPrice,
          annualPrice: monthlyPrice * 11,
          deductible: offer.deductible || 0,
          maxCoverage: offer.coverageAmount || 0,
          features: offerFeatures,
          conditions: null,
          matchedGuarantees: matchedCategories,
        });
      }
    }

    results.sort((a, b) => a.monthlyPrice - b.monthlyPrice);

    // Save quote to database
    if (body.userId) {
      const ref = `NOLI-${Date.now().toString(36).toUpperCase()}`;
      try {
        const autoCat = await db.insuranceCategory.findFirst({ where: { name: { contains: "Auto" } } });
        await db.quote.create({
          data: {
            reference: ref,
            userId: body.userId,
            categoryId: autoCat?.id || null,
            status: "PENDING",
            personalData: JSON.stringify(personal),
            vehicleData: JSON.stringify(vehicle),
            coverageRequirements: JSON.stringify(needs),
            estimatedPrice: results.length > 0 ? results[0].monthlyPrice : 0,
          },
        });
      } catch { /* non-critical */ }
    }

    return NextResponse.json({ results, total: results.length });
  } catch (error) {
    console.error("Compare error:", error);
    return NextResponse.json({ error: "Erreur lors de la comparaison" }, { status: 500 });
  }
}