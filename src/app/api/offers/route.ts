import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { isVehicleEligible, type VehiclePricingData } from "@/lib/pricing-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const insurerId = searchParams.get("insurerId");
    const contractType = searchParams.get("contractType");
    const sortBy = searchParams.get("sortBy") || "price_asc";

    // Vehicle data filters (from comparison flow)
    const fiscalPower = searchParams.get("fiscalPower");
    const fuelType = searchParams.get("fuelType");
    const newValue = searchParams.get("newValue");
    const venalValue = searchParams.get("venalValue");
    const vehicleUsage = searchParams.get("vehicleUsage");

    const where: Record<string, unknown> = {
      isActive: true,
      insurer: { isActive: true },
    };

    if (categoryId) where.categoryId = categoryId;
    if (insurerId) where.insurerId = insurerId;
    if (contractType) where.contractType = contractType;

    const orderBy: Record<string, string> =
      sortBy === "price_desc"
        ? { priceMin: "desc" }
        : sortBy === "name_asc"
          ? { name: "asc" }
          : { priceMin: "asc" };

    const offers = await db.insuranceOffer.findMany({
      where,
      include: {
        insurer: { select: { id: true, name: true, logoUrl: true, code: true } },
        category: { select: { id: true, name: true, icon: true } },
      },
      orderBy,
    });

    // Build vehicle data object if any vehicle filter is provided
    const hasVehicleFilters = fiscalPower || fuelType || newValue || venalValue || vehicleUsage;
    let vehicleData: VehiclePricingData | null = null;
    if (hasVehicleFilters) {
      vehicleData = {
        fuelType: fuelType || "",
        fiscalPower: fiscalPower || "",
        seats: "",
        year: "",
        newValue: newValue || "0",
        currentValue: venalValue || "0",
        usage: vehicleUsage || "personnel",
      };
    }

    // Parse offer arrays and filter by vehicle eligibility
    const filteredOffers = hasVehicleFilters && vehicleData
      ? offers.filter((o) => {
          let offerFuelTypes: string[] = [];
          let offerVehicleUsage: string[] = [];
          try { offerFuelTypes = JSON.parse(o.fuelTypes || "[]"); } catch { /* ignore */ }
          try { offerVehicleUsage = JSON.parse(o.vehicleUsage || "[]"); } catch { /* ignore */ }

          return isVehicleEligible(
            {
              fiscalPowerMin: o.fiscalPowerMin,
              fiscalPowerMax: o.fiscalPowerMax,
              fuelTypes: offerFuelTypes,
              newValueMin: o.newValueMin,
              newValueMax: o.newValueMax,
              venalValueMin: o.venalValueMin,
              venalValueMax: o.venalValueMax,
              vehicleUsage: offerVehicleUsage,
            },
            vehicleData
          );
        })
      : offers;

    // Also fetch categories and insurers for filtering
    const categories = await db.insuranceCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    const insurers = await db.insurer.findMany({
      where: { isActive: true },
      select: { id: true, name: true, logoUrl: true, code: true },
      orderBy: { name: "asc" },
    });

    const formattedOffers = filteredOffers.map((o) => ({
      id: o.id,
      name: o.name,
      description: o.description,
      priceMin: o.priceMin,
      priceMax: o.priceMax,
      coverageAmount: o.coverageAmount,
      deductible: o.deductible,
      contractType: o.contractType,
      features: (() => { try { return JSON.parse(o.features || "[]"); } catch { return []; } })(),
      insurer: o.insurer,
      category: o.category,
      createdAt: o.createdAt,
      // Vehicle eligibility info (for display)
      vehicleEligibility: {
        fiscalPowerMin: o.fiscalPowerMin,
        fiscalPowerMax: o.fiscalPowerMax,
        fuelTypes: (() => { try { return JSON.parse(o.fuelTypes || "[]"); } catch { return []; } })(),
        newValueMin: o.newValueMin,
        newValueMax: o.newValueMax,
        venalValueMin: o.venalValueMin,
        venalValueMax: o.venalValueMax,
        vehicleUsage: (() => { try { return JSON.parse(o.vehicleUsage || "[]"); } catch { return []; } })(),
      },
    }));

    return NextResponse.json({
      offers: formattedOffers,
      categories,
      insurers,
      total: formattedOffers.length,
    });
  } catch (error) {
    console.error("Offers fetch error:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des offres" },
      { status: 500 }
    );
  }
}