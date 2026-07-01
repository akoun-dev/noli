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

  // Vehicle age
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - parseInt(vehicle.year || String(currentYear));
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

    // Determine coverage type from selected guarantees
    const cats = needs.guaranteeCategories || [];
    let coverageType = "tiers";
    if (cats.length >= 6 || cats.includes("individuelle_conducteur") || cats.includes("dommages")) {
      coverageType = "tous_risques";
    } else if (cats.includes("incendie") || cats.includes("vol") || cats.length >= 3) {
      coverageType = "tiers_plus";
    }

    const offers = await db.offer.findMany({
      where: {
        coverageType,
        isActive: true,
        insurer: { isActive: true },
      },
      include: { insurer: true },
    });

    const results: InsurerOffer[] = offers.map((offer) => {
      const monthlyPrice = calculatePrice(offer.basePrice, personal, vehicle, needs);
      return {
        id: offer.id,
        insurerId: offer.insurerId,
        insurerName: offer.insurer.name,
        insurerLogo: offer.insurer.logo,
        insurerRating: offer.insurer.rating,
        name: offer.name,
        coverageType: offer.coverageType,
        description: offer.description,
        monthlyPrice,
        annualPrice: monthlyPrice * 11,
        deductible: offer.deductible || 0,
        maxCoverage: offer.maxCoverage || 0,
        features: JSON.parse(offer.features || "[]"),
        conditions: offer.conditions,
      };
    });

    results.sort((a, b) => a.monthlyPrice - b.monthlyPrice);

    if (body.userId) {
      const ref = `NOLI-${Date.now().toString(36).toUpperCase()}`;
      try {
        await db.quote.create({
          data: {
            reference: ref,
            userId: body.userId,
            status: "pending",
            personalInfo: JSON.stringify(personal),
            vehicleInfo: JSON.stringify(vehicle),
            coverageNeeds: JSON.stringify(needs),
            proposedPrice: results.length > 0 ? results[0].monthlyPrice : 0,
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