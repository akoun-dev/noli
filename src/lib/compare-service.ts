import { db, mapRows } from "@/lib/db";
import type { PersonalInfo, VehicleInfo, CoverageNeeds, InsurerOffer, PricingBreakdown } from "@/types";
import { createNotification, type CreateNotificationParams } from "@/lib/notifications";
import {
  calculateGuaranteePremium,
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
      // Garde anti-NaN : une formule mal renseignée en base (ni baseRate ni prime)
      // pourrait produire un montant NaN qui contaminerait tout le prix (affiché
      // vide). On neutralise à 0 dans ce cas.
      const safeAmount = Number.isFinite(result.amount) ? result.amount : 0;
      if (isCountable) grossPremium += safeAmount;
      const meta = (() => { try { return JSON.parse(coverage.metadata || "{}"); } catch { return {}; } })();
      const coverageCapital = coverage.capital || meta.capital || meta.maxAmount || coverage.maxAmount || null;
      pricingBreakdown.push({
        guaranteeName: coverage.name,
        guaranteeCode: coverage.code,
        categoryCode: catCode,
        categoryName: catName,
        amount: safeAmount,
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

function normalizeGuaranteeText(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "et")
    .toLowerCase()
    .trim();
}

function findPricingForFeature(
  pricingBreakdown: PricingBreakdown[],
  feature: string
): PricingBreakdown | undefined {
  const norm = normalizeGuaranteeText(feature);
  if (!norm) return undefined;

  // 1) Correspondance exacte (nom ou code) : prioritaire, elle lève les
  //    ambiguïtés entre garanties aux libellés proches (ex. les variantes IPT).
  const exact = pricingBreakdown.find((pb) => {
    if (normalizeGuaranteeText(pb.guaranteeName) === norm) return true;
    if (normalizeGuaranteeText(pb.guaranteeCode) === norm) return true;
    return false;
  });
  if (exact) return exact;

  // 2) Correspondance partielle : on garde le meilleur candidat (écart de
  //    longueur minimal), pas le premier trouvé. Un libellé strictement plus
  //    long que la feature (match par inclusion) est pénalisé : il s'agit d'une
  //    feature générique qui risquerait de tomber sur une variante spécifique.
  const keywords = norm.split(" ").filter((w: string) => w.length > 2);
  let best: PricingBreakdown | undefined;
  let bestScore = Infinity;
  for (const pb of pricingBreakdown) {
    const normName = normalizeGuaranteeText(pb.guaranteeName);
    if (!normName) continue;
    const matches =
      norm.includes(normName) ||
      normName.includes(norm) ||
      (keywords.length > 0 && keywords.every((kw: string) => normName.includes(kw)));
    if (!matches) continue;
    const penalty = normName.includes(norm) ? 500 : 0;
    const score = penalty + Math.abs(normName.length - norm.length);
    if (score < bestScore) {
      bestScore = score;
      best = pb;
    }
  }
  return best;
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
  coverageDescriptions: Record<string, string> = {},
  preferredContractType?: string | null
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
    matchedCategories,
    preferredContractType
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
    // Option A : le prix repose sur grossPremium (garanties retenues + obligatoires),
    // et non sur le rapprochement du texte marketing `features` — ce qui évite le
    // double comptage et l'oubli des garanties obligatoires. Voir docs/EXEMPLE_CALCUL_PRIX.md.
    //
    // Décision P1 : le prix mensuel est TOUJOURS le prix annuel ÷ 12 (cohérent avec
    // l'affichage « X/mois · Soit Y/an »). La durée du contrat ne modifie pas le prix
    // mensuel affiché ; un éventuel « montant par échéance » serait un autre concept.
    monthlyPrice: Math.round(grossPremium / 12),
    annualPrice: Math.round(grossPremium),
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

  const { data: offersData } = await db
    .from("insurance_offers")
    .select("*, insurer:insurers!inner(id, name, logoUrl:logo_url)")
    .eq("is_active", true)
    .eq("insurer.is_active", true)
    .order("price_min", { ascending: true });
  const offers = mapRows(offersData || []);

  const insurerIds = [...new Set(offers.map((o: any) => o.insurerId))];
  const { data: coveragesData } = await db
    .from("coverages")
    .select("*, category:coverage_categories(id, name, code), tariff_rules:coverage_tariff_rules(*)")
    .in("insurer_id", insurerIds)
    .eq("is_active", true);
  const allCoverages = mapRows(coveragesData || []);

  const coveragesByInsurer = new Map<string, any[]>();
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
    // Le type de contrat choisi n'est PAS un filtre strict : toutes les offres
    // éligibles sont présentées. Le type choisi est favorisé dans le classement
    // (bonus de pertinence dans scoreOffer), et le filtre « Formules » côté
    // résultats permet à l'utilisateur d'affiner.
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
      coverageDescriptions,
      selectedContractType
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
    const { data: autoCatData } = await db
      .from("insurance_categories")
      .select("id")
      .ilike("name", "%Auto%")
      .limit(1)
      .maybeSingle();
    const autoCat = mapRows([autoCatData || {}])[0] || null;
    const topOffer = results.length > 0 ? results[0] : null;
    await db.from("quotes").insert({
      reference: ref,
      user_id: userId,
      category_id: autoCat?.id || null,
      offer_id: topOffer?.id || null,
      status: "PENDING",
      personal_data: JSON.stringify(personal),
      vehicle_data: JSON.stringify(vehicle),
      coverage_requirements: JSON.stringify(needs),
      estimated_price: topOffer ? topOffer.monthlyPrice : 0,
    });

    const notifications: CreateNotificationParams[] = [
      {
        userId,
        type: "SUCCESS",
        title: "Devis envoyé",
        message: `Votre devis ${ref} a été envoyé avec succès. ${results.length} offre(s) trouvée(s).`,
      },
    ];

    const { data: activeInsurers } = await db
      .from("insurers")
      .select("id")
      .eq("is_active", true);
    const activeIds = (activeInsurers || []).map((i) => i.id);
    const { data: insurerProfiles } = await db
      .from("insurer_accounts")
      .select("profileId:profile_id")
      .in("insurer_id", activeIds);
    for (const ip of insurerProfiles || []) {
      notifications.push({
        userId: ip.profileId,
        type: "INFO",
        title: "Nouveau devis reçu",
        message: `Un nouveau devis (${ref}) a été soumis et attend votre traitement.`,
      });
    }

    // createNotification throw en cas d'erreur DB : on await explicitement
    // (allSettled) pour éviter une promesse rejetée non gérée, et ne pas faire
    // échouer toute la sauvegarde du devis pour une notification.
    await Promise.allSettled(notifications.map((n) => createNotification(n)));
  } catch (err) {
    console.error("Save quote error:", err);
  }
}


