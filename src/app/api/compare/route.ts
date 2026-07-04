import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import type { PersonalInfo, VehicleInfo, CoverageNeeds, InsurerOffer, PricingBreakdown } from "@/types";
import { createNotification } from "@/lib/notifications";
import {
  calculateGuaranteePremium,
  calculateNetPremium,
  scoreOffer,
  isVehicleEligible,
  type VehiclePricingData,
} from "@/lib/pricing-service";

// Map DB coverage category codes → feature keywords to match in offer features
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

const contractTypeScores: Record<string, number> = {
  basic: 15,
  third_party_plus: 22,
  all_risks: 30,
};

/**
 * Convert VehicleInfo (from store) → VehiclePricingData (for pricing service)
 */
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

    const selectedCats: string[] = needs.guaranteeCategories || [];
    const pricingVehicle = toPricingVehicle(vehicle);

    // Build keyword list for feature matching
    const featureKeywords = new Set<string>();
    for (const catCode of selectedCats) {
      const keywords = CATEGORY_FEATURE_KEYWORDS[catCode] || [];
      for (const kw of keywords) featureKeywords.add(kw);
    }

    // Fetch ALL active offers from active insurers
    const offers = await db.insuranceOffer.findMany({
      where: {
        isActive: true,
        insurer: { isActive: true },
      },
      include: { insurer: true },
      orderBy: { priceMin: "asc" },
    });

    // Fetch all coverages grouped by insurer for pricing
    const insurerIds = [...new Set(offers.map((o) => o.insurerId))];
    const allCoverages = await db.coverage.findMany({
      where: {
        insurerId: { in: insurerIds },
        isActive: true,
      },
      include: { category: { select: { id: true, name: true, code: true } } },
    });

    // Index coverages by insurer ID
    const coveragesByInsurer = new Map<string, typeof allCoverages>();
    for (const c of allCoverages) {
      const list = coveragesByInsurer.get(c.insurerId) || [];
      list.push(c);
      coveragesByInsurer.set(c.insurerId, list);
    }

    const results: InsurerOffer[] = [];

    for (const offer of offers) {
      // Parse offer's features and fuel types
      let offerFeatures: string[] = [];
      try { offerFeatures = JSON.parse(offer.features || "[]"); } catch { /* ignore */ }

      let offerFuelTypes: string[] = [];
      try { offerFuelTypes = JSON.parse(offer.fuelTypes || "[]"); } catch { /* ignore */ }

      let offerVehicleUsage: string[] = [];
      try { offerVehicleUsage = JSON.parse(offer.vehicleUsage || "[]"); } catch { /* ignore */ }

      // ── Vehicle Eligibility Check ──
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
        continue; // Skip offers that don't match vehicle criteria
      }

      // ── Feature Matching (which guarantee categories this offer covers) ──
      const matchedCategories: string[] = [];
      for (const catCode of selectedCats) {
        const keywords = CATEGORY_FEATURE_KEYWORDS[catCode] || [];
        const hit = offerFeatures.some((f) =>
          keywords.some((kw) => f.toUpperCase().includes(kw.toUpperCase()))
        );
        if (hit) matchedCategories.push(catCode);
      }

      // Only include offers that match AT LEAST 1 selected category
      if (selectedCats.length > 0 && matchedCategories.length === 0) {
        continue;
      }

      // ── Pricing: Calculate premium using Coverages + PricingService ──
      const insurerCoverages = coveragesByInsurer.get(offer.insurerId) || [];
      const pricingBreakdown: PricingBreakdown[] = [];
      let grossPremium = 0;

      for (const coverage of insurerCoverages) {
        // Check if this coverage matches any selected category
        const catCode = coverage.category?.code;
        const isMatched = catCode && matchedCategories.includes(catCode);
        const isMandatory = coverage.isMandatory;

        if (!isMatched && !isMandatory) continue;

        try {
          const result = calculateGuaranteePremium(coverage, pricingVehicle);
          grossPremium += result.amount;
          pricingBreakdown.push({
            guaranteeName: coverage.name,
            guaranteeCode: coverage.code,
            amount: result.amount,
            method: result.method,
            breakdown: result.breakdown,
          });
        } catch (err) {
          console.error(`Pricing error for ${coverage.code}:`, err);
        }
      }

      // Fallback: if no coverages could be priced, use the old multiplier method
      if (grossPremium === 0 && pricingBreakdown.length === 0) {
        const basePrice = offer.priceMin || 25000;
        grossPremium = legacyCalculatePrice(basePrice, vehicle, needs);
      }

      // Calculate net premium
      const netPremium = calculateNetPremium(grossPremium);

      // ── Scoring ──
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

      // Contract type bonus
      if (offer.contractType) {
        const ctScore = contractTypeScores[offer.contractType] || 10;
        // Already included in scoreOffer
      }

      results.push({
        id: offer.id,
        insurerId: offer.insurerId,
        insurerName: offer.insurer.name,
        insurerLogo: offer.insurer.logoUrl || null,
        insurerRating: 4.0,
        name: offer.name,
        coverageType: contractTypeLabel[offer.contractType || "basic"] || offer.contractType || "Tiers",
        description: offer.description,
        monthlyPrice: Math.round(netPremium / 11), // ~11 months
        annualPrice: netPremium,
        deductible: offer.deductible || 0,
        maxCoverage: offer.coverageAmount || 0,
        features: offerFeatures,
        conditions: null,
        matchedGuarantees: matchedCategories,
        relevanceScore: score,
        matchReasons: reasons,
        pricingBreakdown,
      });
    }

    // Sort: by relevance score desc, then by monthly price asc
    results.sort((a, b) => {
      const scoreDiff = (b.relevanceScore || 0) - (a.relevanceScore || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return a.monthlyPrice - b.monthlyPrice;
    });

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

        createNotification({
          userId: body.userId,
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
      } catch { /* non-critical */ }
    }

    return NextResponse.json({ results, total: results.length });
  } catch (error) {
    console.error("Compare error:", error);
    return NextResponse.json({ error: "Erreur lors de la comparaison" }, { status: 500 });
  }
}

/**
 * Legacy price calculation — used as fallback when no coverages are priced
 */
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