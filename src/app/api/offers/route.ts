import { db, mapRows } from "@/lib/db";
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

    let query = db
      .from("insurance_offers")
      .select(
        "*, insurer:insurers!inner(id, name, logoUrl:logo_url, code, is_active), category:insurance_categories(id, name, icon)"
      )
      .eq("is_active", true)
      .eq("insurer.is_active", true);

    if (categoryId) query = query.eq("category_id", categoryId);
    if (insurerId) query = query.eq("insurer_id", insurerId);
    if (contractType) query = query.eq("contract_type", contractType);

    const sortCol = sortBy === "name_asc" ? "name" : "price_min";
    const ascending = sortBy !== "price_desc";
    query = query.order(sortCol, { ascending });

    const { data, error } = await query;
    if (error) throw error;
    const offers = mapRows(data || []);

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
              fuelTypes: offerFuelTypes as unknown as string,
              newValueMin: o.newValueMin,
              newValueMax: o.newValueMax,
              venalValueMin: o.venalValueMin,
              venalValueMax: o.venalValueMax,
              vehicleUsage: offerVehicleUsage as unknown as string,
            },
            vehicleData
          );
        })
      : offers;

    // Also fetch categories and insurers for filtering
    const { data: categoriesData } = await db
      .from("insurance_categories")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });
    const categories = mapRows(categoriesData || []);

    const { data: insurersData } = await db
      .from("insurers")
      .select("id, name, logoUrl:logo_url, code")
      .eq("is_active", true)
      .order("name", { ascending: true });
    const insurers = mapRows(insurersData || []);

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
