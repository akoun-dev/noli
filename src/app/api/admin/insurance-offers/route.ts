import { db, mapRow, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

function parseFeatures(offer: Record<string, unknown>) {
  try {
    return { ...offer, features: JSON.parse((offer.features as string) || "[]") };
  } catch {
    return { ...offer, features: [] };
  }
}

export async function GET(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const { searchParams } = request.nextUrl;
    const insurerId = searchParams.get("insurerId");
    const contractType = searchParams.get("contractType");
    const search = searchParams.get("search") || "";

    let query = db
      .from("insurance_offers")
      .select(
        "*, insurer:insurers(id, name, code, logoUrl:logo_url), category:insurance_categories(id, name, icon)"
      )
      .order("created_at", { ascending: false });

    if (insurerId) {
      query = query.eq("insurer_id", insurerId);
    }
    if (contractType) {
      query = query.eq("contract_type", contractType);
    }
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const offers = mapRows(data || []);
    const parsed = offers.map((o) => parseFeatures(o as unknown as Record<string, unknown>));
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Erreur insurance-offers GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des offres" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const body = await request.json();
    const {
      insurerId,
      categoryId,
      name,
      description,
      priceMin,
      priceMax,
      coverageAmount,
      deductible,
      features,
      contractType,
      isActive,
      fiscalPowerMin,
      fiscalPowerMax,
      fuelTypes,
      newValueMin,
      newValueMax,
      venalValueMin,
      venalValueMax,
      vehicleUsage,
    } = body;

    if (!insurerId) {
      return NextResponse.json(
        { error: "L'assureur est requis" },
        { status: 400 }
      );
    }
    if (!name) {
      return NextResponse.json(
        { error: "Le nom est requis" },
        { status: 400 }
      );
    }

    const { data: offer, error } = await db
      .from("insurance_offers")
      .insert({
        insurer_id: insurerId,
        category_id: categoryId || null,
        name,
        description: description || null,
        price_min: priceMin ?? null,
        price_max: priceMax ?? null,
        coverage_amount: coverageAmount ?? null,
        deductible: deductible ?? 0,
        features: Array.isArray(features) ? JSON.stringify(features) : (features || "[]"),
        contract_type: contractType || null,
        is_active: isActive ?? true,
        fiscal_power_min: fiscalPowerMin ? Number(fiscalPowerMin) : null,
        fiscal_power_max: fiscalPowerMax ? Number(fiscalPowerMax) : null,
        fuel_types: Array.isArray(fuelTypes) ? JSON.stringify(fuelTypes) : (fuelTypes || "[]"),
        new_value_min: newValueMin ? Number(newValueMin) : null,
        new_value_max: newValueMax ? Number(newValueMax) : null,
        venal_value_min: venalValueMin ? Number(venalValueMin) : null,
        venal_value_max: venalValueMax ? Number(venalValueMax) : null,
        vehicle_usage: Array.isArray(vehicleUsage) ? JSON.stringify(vehicleUsage) : (vehicleUsage || "[]"),
      })
      .select()
      .single();
    if (error) throw error;

    await db.from("audit_logs").insert({
      action: "CREATE",
      entity: "InsuranceOffer",
      entity_id: offer.id,
      details: JSON.stringify({ name: offer.name, contractType: offer.contractType, insurerId }),
      user_name: "SYSTEM",
    });

    return NextResponse.json(parseFeatures(mapRow(offer) as unknown as Record<string, unknown>), { status: 201 });
  } catch (error) {
    console.error("Erreur insurance-offers POST:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'offre" },
      { status: 500 }
    );
  }
}
