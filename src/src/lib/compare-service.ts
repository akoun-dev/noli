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

const COVERAGE_TYPE_TO_CATEGORY: Record<string, string> = {
  RC: "RESPONSABILITE_CIVILE",
  RTI: "RESPONSABILITE_CIVILE",
  DR: "DEFENSE_RECOURS",
  IC: "INDIVIDUELLE_CONDUCTEUR",
  IPT: "INDIVIDUELLE_PASSAGERS",
  INCENDIE: "INCENDIE",
  VOL: "VOL",
  VOL_ARME: "VOL",
  BDG: "BRIS_GLACES",
  EXT_BDG: "BRIS_GLACES",
  TCM: "TIERCE_COMPLETE",
  TCL: "TIERCE_COLLISION",
  ASSISTANCE: "ASSISTANCE",
  AVANCE_RECOURS: "AVANCE_RECOURS",
  VOL_ACCESSOIRES: "ACCESSOIRES",
};

const contractTypeLabel: Record<string, string> = {
  basic: "Tiers",
  third_party_plus: "Tiers+",
  all_risks: "Tous Risques",
  premium: "Premium",
  premium_plus: "Premium+",
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

function resolveCategory(coverage: any): { code: string; name: string } {
  const code = coverage.category?.code
    || COVERAGE_TYPE_TO_CATEGORY[coverage.type]
    || COVERAGE_TYPE_TO_CATEGORY[coverage.code?.split("_")[0]]
    || coverage.type
    || "UNKNOWN";
  const name = coverage.category?.name || code;
  return { code, name };
}

function priceCoverages(
  insurerCoverages: any[],
  matchedCategories: string[],
  pricingVehicle: VehiclePricingData
): { grossPremium: number; pricingBreakdown: PricingBreakdown[] } {
  let grossPremium = 0;
  const pricingBreakdown: PricingBreakdown[] = [];

  for (const coverage of insurerCoverages) {
    const { code: catCode, name: catName } = resolveCategory(coverage);
    const isMatched = matchedCategories.includes(catCode);
    const isCountable = isMatched || coverage.isMandatory;

    try {
      const result = calculateGuaranteePremium(coverage, pricingVehicle);
      if (isCountable) grossPremium += result.amount;
      const meta = (() => { try { return JSON.parse(coverage.metadata || "{}"); } catch { return {}; } })();
      const coverageCapital = coverage.capital || meta.capital || meta.maxAmount || coverage.maxAmount || null;
      pricingBreakdown.push({
        guaranteeName: coverage.name,
        guaranteeCode: coverage.code,
        categoryCode: catCode,
        categoryName: catName,
        amount: result.amount,
        coverageCapital: coverageCapital || undefined,
        method: result.method,
        breakdown: result.breakdown,
      });
    } catch (err) {
      const meta = (() => { try { return JSON.parse(coverage.metadata || "{}"); } catch { return {}; } })();
      const coverageCapital = coverage.capital || meta.capital || meta.maxAmount || coverage.maxAmount || null;
      pricingBreakdown.push({
        guaranteeName: coverage.name,
        guaranteeCode: coverage.code,
        categoryCode: catCode,
        categoryName: catName,
        amount: 0,
        coverageCapital: coverageCapital || undefined,
        method: coverage.calculationType || "INCLUDED",
        breakdown: "Garantie incluse dans la formule",
      });
    }
  }

  return { grossPremium, pricingBreakdown };
}

function findPricingForFeature(
  pricingBreakdown: PricingBreakdown[],
  feature: string
): PricingBreakdown | undefined {
  const norm = feature
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "et")
    .toLowerCase()
    .trim();
  return pricingBreakdown.find((pb) => {
    const normName = (pb.guaranteeName || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, "et")
      .toLowerCase()
      .trim();
    if (normName === norm) return true;
    const normCode = (pb.guaranteeCode || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, "et")
      .toLowerCase()
      .trim();
    if (normCode === norm) return true;
    if (norm.includes(normName) || normName.includes(norm)) return true;
    const keywords = norm.split(" ").filter((w: string) => w.length > 2);
    return keywords.length > 0 && keywords.every((kw: string) => normName.includes(kw));
  });
}

function buildOfferResult(
  offer: any,
  matchedCategories: string[],
  pricingVehicle: VehiclePricingData,
  offerFeatures: string[],
  offerFuelTypes: string[],
  offerVehicleUsage: string[],
  grossPremium: number,
  pricingBreakdown: PricingBreakdown[],
  contractDuration: number = 12,
  coverageDescriptions: Record<string, string> = {}
): InsurerOffer {
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

  let computedPremium = 0;
  for (const feature of offerFeatures) {
    const pricing = findPricingForFeature(pricingBreakdown, feature);
    if (pricing) computedPremium += pricing.amount;
  }

  return {
    id: offer.id,
    insurerId: offer.insurerId,
    insurerName: offer.insurer.name,
    insurerLogo: offer.insurer.logoUrl || null,
    insurerRating: 4.0,
    name: offer.name,
    coverageType: contractTypeLabel[offer.contractType || "basic"] || offer.contractType || "Tiers",
    description: offer.description,
    monthlyPrice: Math.round(computedPremium / contractDuration),
    annualPrice: Math.round(computedPremium),
    contractDuration,
    deductible: offer.deductible || 0,
    maxCoverage: offer.coverageAmount || 0,
    features: offerFeatures,
    conditions: null,
    matchedGuarantees: matchedCategories,
    guaranteeDescriptions: coverageDescriptions,
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
  const selectedContractType: string = needs.contractType || "";
  const contractDuration = needs.contractDuration || 12;
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

  const coverageDescriptions: Record<string, string> = {};
  for (const c of allCoverages) {
    if (c.description && !coverageDescriptions[c.code]) {
      coverageDescriptions[c.code] = c.description;
    }
    if (c.description && c.name && !coverageDescriptions[c.name]) {
      coverageDescriptions[c.name] = c.description;
    }
  }

  const results: InsurerOffer[] = [];

  for (const offer of offers) {
    // Filter by selected contract type
    if (selectedContractType && offer.contractType !== selectedContractType) {
      continue;
    }

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

    // Use all known category codes to match against offer features
    const allCategoryCodes = Object.keys(CATEGORY_FEATURE_KEYWORDS);
    const matchedCategories = matchCategories(allCategoryCodes, offerFeatures);

    const insurerCoverages = coveragesByInsurer.get(offer.insurerId) || [];
    let { grossPremium, pricingBreakdown } = priceCoverages(
      insurerCoverages,
      matchedCategories,
      pricingVehicle
    );

    if (grossPremium === 0 && pricingBreakdown.length === 0) {
      console.warn(
        `[compare] Aucune prime calculée pour l'offre "${offer.name}" (${offer.insurerId}). ` +
        `Vérifier les coverages et règles tarifaires.`
      );
    }

    const built = buildOfferResult(
      offer,
      matchedCategories,
      pricingVehicle,
      offerFeatures,
      offerFuelTypes,
      offerVehicleUsage,
      grossPremium,
      pricingBreakdown,
      contractDuration,
      coverageDescriptions
    );
    results.push(built);
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
    const topOffer = results.length > 0 ? results[0] : null;
    await db.quote.create({
      data: {
        reference: ref,
        userId,
        categoryId: autoCat?.id || null,
        offerId: topOffer?.id || null,
        status: "PENDING",
        personalData: JSON.stringify(personal),
        vehicleData: JSON.stringify(vehicle),
        coverageRequirements: JSON.stringify(needs),
        estimatedPrice: topOffer ? topOffer.monthlyPrice : 0,
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


