import { db } from "@/lib/db";
import type { PersonalInfo, VehicleInfo, CoverageNeeds, InsurerOffer, PricingBreakdown } from "@/types";
import { createNotification } from "@/lib/notifications";
import {
  calculateGuaranteePremium,
  calculateNetPremium,
  scoreOffer,
  isVehicleEligible,
  type VehiclePricingData,
} from "@/lib/pricing-service";

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

const contractTypeLabel: Record<string, string> = {
  basic: "Tiers",
  third_party_plus: "Tiers+",
  all_risks: "Tous Risques",
};

function toPricingVehicle(v: VehicleInfo): VehiclePricingData {
  return {
    fuelType: v.fuelType,
    fiscalPower: v.fiscalPower,
    seats: v.seats,
    year: v.year,
    newValue: (v.newValue || "0").replace(/\s/g, ""),
    currentValue: (v.currentValue || "0").replace(/\s/g, ""),
    usage: v.usage,
  };
}

function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function buildFeatureKeywords(selectedCats: string[]): Set<string> {
  const keywords = new Set<string>();
  for (const catCode of selectedCats) {
    const kwList = CATEGORY_FEATURE_KEYWORDS[catCode] || [];
    for (const kw of kwList) keywords.add(kw);
  }
  return keywords;
}

function matchCategories(
  selectedCats: string[],
  offerFeatures: string[]
): string[] {
  if (selectedCats.length === 0) return [];
  const matched: string[] = [];
  for (const catCode of selectedCats) {
    const keywords = CATEGORY_FEATURE_KEYWORDS[catCode] || [];
    const hit = offerFeatures.some((f) =>
      keywords.some((kw) => f.toUpperCase().includes(kw.toUpperCase()))
    );
    if (hit) matched.push(catCode);
  }
  return matched;
}

function priceCoverages(
  insurerCoverages: any[],
  matchedCategories: string[],
  pricingVehicle: VehiclePricingData
): { grossPremium: number; pricingBreakdown: PricingBreakdown[] } {
  let grossPremium = 0;
  const pricingBreakdown: PricingBreakdown[] = [];

  for (const coverage of insurerCoverages) {
    const catCode = coverage.category?.code;
    const isMatched = catCode && matchedCategories.includes(catCode);
    if (!isMatched && !coverage.isMandatory) continue;

    try {
      const result = calculateGuaranteePremium(coverage, pricingVehicle);
      grossPremium += result.amount;
      pricingBreakdown.push({
        guaranteeName: coverage.name,
        guaranteeCode: coverage.code,
        categoryCode: coverage.category?.code,
        categoryName: coverage.category?.name,
        amount: result.amount,
        method: result.method,
        breakdown: result.breakdown,
      });
    } catch (err) {
      console.error(`Pricing error for ${coverage.code}:`, err);
    }
  }

  return { grossPremium, pricingBreakdown };
}

function buildOfferResult(
  offer: any,
  matchedCategories: string[],
  pricingVehicle: VehiclePricingData,
  offerFeatures: string[],
  offerFuelTypes: string[],
  offerVehicleUsage: string[],
  grossPremium: number,
  pricingBreakdown: PricingBreakdown[]
): InsurerOffer {
  const netPremium = calculateNetPremium(grossPremium);

  const { score, reasons } = scoreOffer(
    {
      fiscalPowerMin: offer.fiscalPowerMin,
      fiscalPowerMax: offer.fiscalPowerMax,
      fuelTypes: offerFuelTypes,
      newValueMin: offer.newValueMin,
      newValueMax: offer.newValueMax,
      venalValueMin: offer.venalValueMin,
      venalValueMax: offer.venalValueMax,
      vehicleUsage: offerVehicleUsage,
      contractType: offer.contractType,
      priceMin: offer.priceMin,
      priceMax: offer.priceMax,
    },
    pricingVehicle,
    matchedCategories
  );

  return {
    id: offer.id,
    insurerId: offer.insurerId,
    insurerName: offer.insurer.name,
    insurerLogo: offer.insurer.logoUrl || null,
    insurerRating: 4.0,
    name: offer.name,
    coverageType: contractTypeLabel[offer.contractType || "basic"] || offer.contractType || "Tiers",
    description: offer.description,
    monthlyPrice: Math.round(netPremium / 11),
    annualPrice: netPremium,
    deductible: offer.deductible || 0,
    maxCoverage: offer.coverageAmount || 0,
    features: offerFeatures,
    conditions: null,
    matchedGuarantees: matchedCategories,
    relevanceScore: score,
    matchReasons: reasons,
    pricingBreakdown,
  };
}

export async function runComparison(
  personal: PersonalInfo,
  vehicle: VehicleInfo,
  needs: CoverageNeeds,
  userId?: string
) {
  const selectedCats: string[] = needs.guaranteeCategories || [];
  const pricingVehicle = toPricingVehicle(vehicle);

  const offers = await db.insuranceOffer.findMany({
    where: {
      isActive: true,
      insurer: { isActive: true },
    },
    include: { insurer: true },
    orderBy: { priceMin: "asc" },
  });

  const insurerIds = [...new Set(offers.map((o) => o.insurerId))];
  const allCoverages = await db.coverage.findMany({
    where: {
      insurerId: { in: insurerIds },
      isActive: true,
    },
    include: {
      category: { select: { id: true, name: true, code: true } },
      tariffRules: true,
    },
  });

  const coveragesByInsurer = new Map<string, typeof allCoverages>();
  for (const c of allCoverages) {
    const list = coveragesByInsurer.get(c.insurerId) || [];
    list.push(c);
    coveragesByInsurer.set(c.insurerId, list);
  }

  const results: InsurerOffer[] = [];

  for (const offer of offers) {
    const offerFeatures = parseJsonArray(offer.features);
    const offerFuelTypes = parseJsonArray(offer.fuelTypes);
    const offerVehicleUsage = parseJsonArray(offer.vehicleUsage);

    if (!isVehicleEligible(
      {
        fiscalPowerMin: offer.fiscalPowerMin,
        fiscalPowerMax: offer.fiscalPowerMax,
        fuelTypes: offerFuelTypes,
        newValueMin: offer.newValueMin,
        newValueMax: offer.newValueMax,
        venalValueMin: offer.venalValueMin,
        venalValueMax: offer.venalValueMax,
        vehicleUsage: offerVehicleUsage,
      },
      pricingVehicle
    )) {
      continue;
    }

    const matchedCategories = matchCategories(selectedCats, offerFeatures);

    // Fallback: if no feature match, check if insurer has coverages belonging to selected categories
    if (selectedCats.length > 0 && matchedCategories.length === 0) {
      const insurerCoverages = coveragesByInsurer.get(offer.insurerId) || [];
      const coverageCatCodes = new Set(
        insurerCoverages
          .map((c) => c.category?.code)
          .filter(Boolean) as string[]
      );
      const coverageMatched = selectedCats.filter((cat) => coverageCatCodes.has(cat));
      if (coverageMatched.length > 0) {
        matchedCategories.push(...coverageMatched);
      }
    }

    // Second fallback: try matching by offer name/description keywords
    if (selectedCats.length > 0 && matchedCategories.length === 0) {
      const offerText = `${offer.name} ${offer.description || ""} ${offer.contractType || ""}`.toUpperCase();
      const fallbackMatched = selectedCats.filter((cat) => {
        const keywords = CATEGORY_FEATURE_KEYWORDS[cat] || [];
        return keywords.some((kw) => offerText.includes(kw.toUpperCase()));
      });
      if (fallbackMatched.length > 0) {
        matchedCategories.push(...fallbackMatched);
      }
    }

    if (selectedCats.length > 0 && matchedCategories.length === 0) {
      continue;
    }

    const insurerCoverages = coveragesByInsurer.get(offer.insurerId) || [];
    let { grossPremium, pricingBreakdown } = priceCoverages(
      insurerCoverages,
      matchedCategories,
      pricingVehicle
    );

    if (grossPremium === 0 && pricingBreakdown.length === 0) {
      const basePrice = offer.priceMin || 25000;
      grossPremium = legacyCalculatePrice(basePrice, vehicle, needs);
    }

    results.push(buildOfferResult(
      offer,
      matchedCategories,
      pricingVehicle,
      offerFeatures,
      offerFuelTypes,
      offerVehicleUsage,
      grossPremium,
      pricingBreakdown
    ));
  }

  results.sort((a, b) => {
    const scoreDiff = (b.relevanceScore || 0) - (a.relevanceScore || 0);
    if (scoreDiff !== 0) return scoreDiff;
    return a.monthlyPrice - b.monthlyPrice;
  });

  if (userId) {
    await saveQuote(userId, personal, vehicle, needs, results);
  }

  return { results, total: results.length };
}

async function saveQuote(
  userId: string,
  personal: PersonalInfo,
  vehicle: VehicleInfo,
  needs: CoverageNeeds,
  results: InsurerOffer[]
) {
  const ref = `NOLI-${Date.now().toString(36).toUpperCase()}`;
  try {
    const autoCat = await db.insuranceCategory.findFirst({
      where: { name: { contains: "Auto" } },
    });
    await db.quote.create({
      data: {
        reference: ref,
        userId,
        categoryId: autoCat?.id || null,
        status: "PENDING",
        personalData: JSON.stringify(personal),
        vehicleData: JSON.stringify(vehicle),
        coverageRequirements: JSON.stringify(needs),
        estimatedPrice: results.length > 0 ? results[0].monthlyPrice : 0,
      },
    });

    createNotification({
      userId,
      type: "SUCCESS",
      title: "Devis envoyé",
      message: `Votre devis ${ref} a été envoyé avec succès. ${results.length} offre(s) trouvée(s).`,
    });

    const insurerProfiles = await db.insurerAccount.findMany({
      where: { insurer: { isActive: true } },
      select: { profileId: true },
    });
    for (const ip of insurerProfiles) {
      createNotification({
        userId: ip.profileId,
        type: "INFO",
        title: "Nouveau devis reçu",
        message: `Un nouveau devis (${ref}) a été soumis et attend votre traitement.`,
      });
    }
  } catch (err) {
    console.error("Save quote error:", err);
  }
}

function legacyCalculatePrice(
  basePrice: number,
  vehicle: VehicleInfo,
  needs: CoverageNeeds
): number {
  let price = basePrice;

  const cv = parseInt(vehicle.fiscalPower || "6");
  if (cv <= 4) price *= 0.8;
  else if (cv <= 6) price *= 1.0;
  else if (cv <= 8) price *= 1.12;
  else if (cv <= 11) price *= 1.25;
  else price *= 1.4;

  const currentYear = new Date().getFullYear();
  const rawYear = vehicle.year?.split("-")[0] || String(currentYear);
  const vehicleAge = currentYear - parseInt(rawYear);
  if (vehicleAge <= 1) price *= 1.05;
  else if (vehicleAge <= 3) price *= 1.0;
  else if (vehicleAge <= 5) price *= 1.1;
  else if (vehicleAge <= 10) price *= 1.2;
  else price *= 1.35;

  if (vehicle.usage === "professionnel") price *= 1.15;
  else if (vehicle.usage === "taxi_vtc") price *= 1.4;
  else if (vehicle.usage === "autre") price *= 1.2;

  if (vehicle.fuelType === "diesel") price *= 1.05;
  else if (vehicle.fuelType === "hybride") price *= 1.08;
  else if (vehicle.fuelType === "electrique") price *= 0.95;

  const seats = parseInt(vehicle.seats || "5");
  if (seats > 7) price *= 1.15;
  else if (seats <= 2) price *= 0.9;

  const newVal = parseInt((vehicle.newValue || "0").replace(/\s/g, "")) || 10000000;
  if (newVal > 30000000) price *= 1.3;
  else if (newVal > 20000000) price *= 1.15;
  else if (newVal > 10000000) price *= 1.0;
  else price *= 0.85;

  const catCount = needs.guaranteeCategories?.length || 0;
  if (catCount <= 2) price *= 0.85;
  else if (catCount <= 4) price *= 1.0;
  else if (catCount <= 6) price *= 1.2;
  else price *= 1.35;

  return Math.round(price / 500) * 500;
}
