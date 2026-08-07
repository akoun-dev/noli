import { db, mapRow } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getInsurerAccount, getSessionProfile, requireAuth } from "@/lib/auth-guard";
import { parseNumberField } from "@/lib/security";

async function resolveInsurerId(): Promise<string | null> {
  const profile = await getSessionProfile();
  if (!profile) return null;
  const account = await getInsurerAccount(profile.id);
  return account?.insurerId || null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["INSURER"]);
    if (guard) return guard;

    const insurerId = await resolveInsurerId();
    const { id } = await params;

    const { data } = await db
      .from("insurance_offers")
      .select("*, category:insurance_categories(id, name, icon), insurer:insurers(id, name, code, logoUrl:logo_url)")
      .eq("id", id)
      .maybeSingle();
    const offer = mapRow(data);

    if (!offer) {
      return NextResponse.json(
        { error: "Offre non trouvée" },
        { status: 404 }
      );
    }

    if (!insurerId || offer.insurerId !== insurerId) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ...offer,
      features: JSON.parse(offer.features || "[]"),
    });
  } catch (error) {
    console.error("Erreur insurer/offers/[id] GET:", error);
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
    const guard = await requireAuth(["INSURER"]);
    if (guard) return guard;

    const insurerId = await resolveInsurerId();
    const { id } = await params;
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

    const { data: existingData } = await db
      .from("insurance_offers")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    const existing = mapRow(existingData);
    if (!existing) {
      return NextResponse.json(
        { error: "Offre non trouvée" },
        { status: 404 }
      );
    }

    if (!insurerId || existing.insurerId !== insurerId) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    // H-04 : validation des champs numériques avant écriture
    const numericFields: { name: string; value: unknown }[] = [];
    if (priceMin !== undefined) numericFields.push({ name: "Prix minimum", value: priceMin });
    if (priceMax !== undefined) numericFields.push({ name: "Prix maximum", value: priceMax });
    if (coverageAmount !== undefined) numericFields.push({ name: "Montant couvert", value: coverageAmount });
    if (deductible !== undefined) numericFields.push({ name: "Franchise", value: deductible });
    if (fiscalPowerMin !== undefined) numericFields.push({ name: "Puissance fiscale min", value: fiscalPowerMin });
    if (fiscalPowerMax !== undefined) numericFields.push({ name: "Puissance fiscale max", value: fiscalPowerMax });
    if (newValueMin !== undefined) numericFields.push({ name: "Valeur neuve min", value: newValueMin });
    if (newValueMax !== undefined) numericFields.push({ name: "Valeur neuve max", value: newValueMax });
    if (venalValueMin !== undefined) numericFields.push({ name: "Valeur vénale min", value: venalValueMin });
    if (venalValueMax !== undefined) numericFields.push({ name: "Valeur vénale max", value: venalValueMax });
    for (const { name, value } of numericFields) {
      if (value === null || value === "") continue;
      const res = parseNumberField(value, { field: name, min: 0, optional: false });
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
    }

    const { data, error } = await db
      .from("insurance_offers")
      .update({
        ...(categoryId !== undefined ? { category_id: categoryId || null } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description: description || null } : {}),
        ...(priceMin !== undefined ? { price_min: priceMin != null ? Number(priceMin) : null } : {}),
        ...(priceMax !== undefined ? { price_max: priceMax != null ? Number(priceMax) : null } : {}),
        ...(coverageAmount !== undefined ? { coverage_amount: coverageAmount != null ? Number(coverageAmount) : null } : {}),
        ...(deductible !== undefined ? { deductible: Number(deductible) } : {}),
        ...(features !== undefined ? { features: JSON.stringify(features) } : {}),
        ...(contractType !== undefined ? { contract_type: contractType || null } : {}),
        ...(isActive !== undefined ? { is_active: Boolean(isActive) } : {}),
        ...(fiscalPowerMin !== undefined ? { fiscal_power_min: fiscalPowerMin ? Number(fiscalPowerMin) : null } : {}),
        ...(fiscalPowerMax !== undefined ? { fiscal_power_max: fiscalPowerMax ? Number(fiscalPowerMax) : null } : {}),
        ...(fuelTypes !== undefined ? { fuel_types: Array.isArray(fuelTypes) ? JSON.stringify(fuelTypes) : (fuelTypes || "[]") } : {}),
        ...(newValueMin !== undefined ? { new_value_min: newValueMin ? Number(newValueMin) : null } : {}),
        ...(newValueMax !== undefined ? { new_value_max: newValueMax ? Number(newValueMax) : null } : {}),
        ...(venalValueMin !== undefined ? { venal_value_min: venalValueMin ? Number(venalValueMin) : null } : {}),
        ...(venalValueMax !== undefined ? { venal_value_max: venalValueMax ? Number(venalValueMax) : null } : {}),
        ...(vehicleUsage !== undefined ? { vehicle_usage: Array.isArray(vehicleUsage) ? JSON.stringify(vehicleUsage) : (vehicleUsage || "[]") } : {}),
      })
      .eq("id", id)
      .select("*, category:insurance_categories(id, name, icon), insurer:insurers(id, name, code, logoUrl:logo_url)")
      .single();
    if (error) throw error;
    const updated = mapRow(data);

    return NextResponse.json({
      ...updated,
      features: JSON.parse(updated.features || "[]"),
    });
  } catch (error) {
    console.error("Erreur insurer/offers/[id] PUT:", error);
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
    const guard = await requireAuth(["INSURER"]);
    if (guard) return guard;

    const insurerId = await resolveInsurerId();
    const { id } = await params;

    const { data: existingData } = await db
      .from("insurance_offers")
      .select("id, insurer_id")
      .eq("id", id)
      .maybeSingle();
    const existing = mapRow(existingData);
    if (!existing) {
      return NextResponse.json(
        { error: "Offre non trouvée" },
        { status: 404 }
      );
    }

    if (!insurerId || existing.insurerId !== insurerId) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    await db.from("insurance_offers").update({ is_active: false }).eq("id", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur insurer/offers/[id] DELETE:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'offre" },
      { status: 500 }
    );
  }
}
