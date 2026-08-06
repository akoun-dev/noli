import { db, mapRow } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

function parseFeatures(offer: Record<string, unknown>) {
  try {
    return { ...offer, features: JSON.parse((offer.features as string) || "[]") };
  } catch {
    return { ...offer, features: [] };
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;

    const { data, error } = await db
      .from("insurance_offers")
      .select(
        "*, insurer:insurers(id, name, code), category:insurance_categories(id, name, icon)"
      )
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    const offer = mapRow(data);

    if (!offer) {
      return NextResponse.json(
        { error: "Offre introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(parseFeatures(offer as unknown as Record<string, unknown>));
  } catch (error) {
    console.error("Erreur insurance-offer GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement de l'offre" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;
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

    const { data: existing } = await db
      .from("insurance_offers")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json(
        { error: "Offre introuvable" },
        { status: 404 }
      );
    }

    const { data: offer, error } = await db
      .from("insurance_offers")
      .update({
        ...(insurerId !== undefined && { insurer_id: insurerId }),
        ...(categoryId !== undefined && { category_id: categoryId || null }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(priceMin !== undefined && { price_min: priceMin ?? null }),
        ...(priceMax !== undefined && { price_max: priceMax ?? null }),
        ...(coverageAmount !== undefined && { coverage_amount: coverageAmount ?? null }),
        ...(deductible !== undefined && { deductible }),
        ...(features !== undefined && {
          features: Array.isArray(features) ? JSON.stringify(features) : (features || "[]"),
        }),
        ...(contractType !== undefined && { contract_type: contractType || null }),
        ...(isActive !== undefined && { is_active: isActive }),
        ...(fiscalPowerMin !== undefined && { fiscal_power_min: fiscalPowerMin ? Number(fiscalPowerMin) : null }),
        ...(fiscalPowerMax !== undefined && { fiscal_power_max: fiscalPowerMax ? Number(fiscalPowerMax) : null }),
        ...(fuelTypes !== undefined && {
          fuel_types: Array.isArray(fuelTypes) ? JSON.stringify(fuelTypes) : (fuelTypes || "[]"),
        }),
        ...(newValueMin !== undefined && { new_value_min: newValueMin ? Number(newValueMin) : null }),
        ...(newValueMax !== undefined && { new_value_max: newValueMax ? Number(newValueMax) : null }),
        ...(venalValueMin !== undefined && { venal_value_min: venalValueMin ? Number(venalValueMin) : null }),
        ...(venalValueMax !== undefined && { venal_value_max: venalValueMax ? Number(venalValueMax) : null }),
        ...(vehicleUsage !== undefined && {
          vehicle_usage: Array.isArray(vehicleUsage) ? JSON.stringify(vehicleUsage) : (vehicleUsage || "[]"),
        }),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    await db.from("audit_logs").insert({
      action: "UPDATE",
      entity: "InsuranceOffer",
      entity_id: id,
      details: JSON.stringify({ name: offer.name, contractType: offer.contractType }),
      user_name: "SYSTEM",
    });

    return NextResponse.json(parseFeatures(mapRow(offer) as unknown as Record<string, unknown>));
  } catch (error) {
    console.error("Erreur insurance-offer PUT:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'offre" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;

    const { data } = await db
      .from("insurance_offers")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    const existing = mapRow(data);
    if (!existing) {
      return NextResponse.json(
        { error: "Offre introuvable" },
        { status: 404 }
      );
    }

    await db.from("insurance_offers").delete().eq("id", id);

    await db.from("audit_logs").insert({
      action: "DELETE",
      entity: "InsuranceOffer",
      entity_id: id,
      details: JSON.stringify({ name: existing.name, contractType: existing.contractType }),
      user_name: "SYSTEM",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur insurance-offer DELETE:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'offre" },
      { status: 500 }
    );
  }
}
