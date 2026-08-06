import { db, mapRow, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getInsurerAccount, getSessionProfile, requireAuth } from "@/lib/auth-guard";

async function resolveInsurerId(): Promise<string | null> {
  const profile = await getSessionProfile();
  if (!profile) return null;
  const account = await getInsurerAccount(profile.id);
  return account?.insurerId || null;
}

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAuth(["INSURER"]);
    if (guard) return guard;

    const insurerId = await resolveInsurerId();
    if (!insurerId) {
      return NextResponse.json(
        { error: "Aucun compte assureur trouvé pour cet utilisateur" },
        { status: 404 }
      );
    }
    const activeOnly = request.nextUrl.searchParams.get("active");

    let query = db
      .from("insurance_offers")
      .select("*, category:insurance_categories(id, name, icon), insurer:insurers(id, name, code, logoUrl:logo_url)")
      .eq("insurer_id", insurerId)
      .order("created_at", { ascending: false });

    if (activeOnly === "true") {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;
    if (error) throw error;
    const offers = mapRows(data || []);

    // Parse features JSON for each offer
    const parsed = offers.map((o) => ({
      ...o,
      features: JSON.parse(o.features || "[]"),
    }));

    return NextResponse.json({ offers: parsed });
  } catch (error) {
    console.error("Erreur insurer/offers GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des offres" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAuth(["INSURER"]);
    if (guard) return guard;

    const insurerId = await resolveInsurerId();
    if (!insurerId) {
      return NextResponse.json(
        { error: "Aucun compte assureur trouvé pour cet utilisateur" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      categoryId,
      name,
      description,
      priceMin,
      priceMax,
      coverageAmount,
      deductible,
      features,
      contractType,
      fiscalPowerMin,
      fiscalPowerMax,
      fuelTypes,
      newValueMin,
      newValueMax,
      venalValueMin,
      venalValueMax,
      vehicleUsage,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Le nom est requis" },
        { status: 400 }
      );
    }

    const { data, error } = await db
      .from("insurance_offers")
      .insert({
        insurer_id: insurerId,
        category_id: categoryId || null,
        name,
        description: description || null,
        price_min: priceMin != null ? Number(priceMin) : null,
        price_max: priceMax != null ? Number(priceMax) : null,
        coverage_amount: coverageAmount != null ? Number(coverageAmount) : null,
        deductible: deductible != null ? Number(deductible) : 0,
        features: JSON.stringify(features || []),
        contract_type: contractType || null,
        is_active: true,
        fiscal_power_min: fiscalPowerMin ? Number(fiscalPowerMin) : null,
        fiscal_power_max: fiscalPowerMax ? Number(fiscalPowerMax) : null,
        fuel_types: Array.isArray(fuelTypes) ? JSON.stringify(fuelTypes) : (fuelTypes || "[]"),
        new_value_min: newValueMin ? Number(newValueMin) : null,
        new_value_max: newValueMax ? Number(newValueMax) : null,
        venal_value_min: venalValueMin ? Number(venalValueMin) : null,
        venal_value_max: venalValueMax ? Number(venalValueMax) : null,
        vehicle_usage: Array.isArray(vehicleUsage) ? JSON.stringify(vehicleUsage) : (vehicleUsage || "[]"),
      })
      .select("*, category:insurance_categories(id, name, icon), insurer:insurers(id, name, code, logoUrl:logo_url)")
      .single();
    if (error) throw error;
    const offer = mapRow(data);

    return NextResponse.json(
      { ...offer, features: JSON.parse(offer.features || "[]") },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur insurer/offers POST:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'offre" },
      { status: 500 }
    );
  }
}
