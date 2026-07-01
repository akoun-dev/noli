import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import type { PersonalInfo, VehicleInfo, CoverageNeeds, InsurerOffer } from "@/types";

function calculatePrice(
  basePrice: number,
  coverageType: string,
  personal: PersonalInfo,
  vehicle: VehicleInfo,
  needs: CoverageNeeds
): number {
  let price = basePrice;

  // Age factor: younger = more expensive
  const age = getAge(personal.dateOfBirth);
  if (age < 25) price *= 1.3;
  else if (age < 30) price *= 1.15;
  else if (age >= 50) price *= 0.95;

  // License experience
  const licenseYears = getYearsSince(personal.licenseDate);
  if (licenseYears < 2) price *= 1.2;
  else if (licenseYears < 5) price *= 1.1;
  else if (licenseYears >= 10) price *= 0.92;

  // Claims history
  if (personal.hasClaims) {
    price *= 1 + Math.min(personal.claimsCount * 0.15, 0.6);
  }

  // Vehicle age
  const vehicleAge = new Date().getFullYear() - parseInt(vehicle.year || "2020");
  if (vehicleAge > 10) price *= 1.2;
  else if (vehicleAge > 5) price *= 1.1;
  else if (vehicleAge <= 1) price *= 1.05;

  // Fiscal power
  const fp = parseInt(vehicle.fiscalPower || "6");
  if (fp > 12) price *= 1.25;
  else if (fp > 8) price *= 1.12;

  // Usage
  if (personal.usage === "professionnel") price *= 1.15;

  // Annual mileage
  const mileage = parseInt(personal.annualMileage || "10000");
  if (mileage > 25000) price *= 1.2;
  else if (mileage > 15000) price *= 1.08;

  // Deductible level
  if (needs.deductibleLevel === "low") price *= 1.15;
  else if (needs.deductibleLevel === "high") price *= 0.88;

  // Imported vehicle
  if (vehicle.isImported) price *= 1.1;

  // Round to nearest 500
  return Math.round(price / 500) * 500;
}

function getAge(dateStr: string): number {
  if (!dateStr) return 30;
  const birth = new Date(dateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return Math.max(18, age);
}

function getYearsSince(dateStr: string): number {
  if (!dateStr) return 5;
  const d = new Date(dateStr);
  const today = new Date();
  let years = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) years--;
  return Math.max(0, years);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const personal: PersonalInfo = body.personalInfo;
    const vehicle: VehicleInfo = body.vehicleInfo;
    const needs: CoverageNeeds = body.coverageNeeds;

    // Validate required fields
    if (!personal.firstName || !personal.lastName || !personal.email || !personal.phone) {
      return NextResponse.json({ error: "Informations personnelles incomplètes" }, { status: 400 });
    }
    if (!vehicle.brand || !vehicle.model || !vehicle.year || !vehicle.fiscalPower) {
      return NextResponse.json({ error: "Informations véhicule incomplètes" }, { status: 400 });
    }

    // Fetch all active offers matching the coverage type
    const offers = await db.offer.findMany({
      where: {
        coverageType: needs.coverageType,
        isActive: true,
        insurer: { isActive: true },
      },
      include: { insurer: true },
    });

    // Calculate prices and format results
    const results: InsurerOffer[] = offers.map((offer) => {
      const monthlyPrice = calculatePrice(
        offer.basePrice,
        offer.coverageType,
        personal,
        vehicle,
        needs
      );

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

    // Sort by price ascending by default
    results.sort((a, b) => a.monthlyPrice - b.monthlyPrice);

    // Save quote if user is logged in
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
      } catch {
        // Non-critical: quote save failure shouldn't block results
      }
    }

    return NextResponse.json({ results, total: results.length });
  } catch (error) {
    console.error("Compare error:", error);
    return NextResponse.json({ error: "Erreur lors de la comparaison" }, { status: 500 });
  }
}