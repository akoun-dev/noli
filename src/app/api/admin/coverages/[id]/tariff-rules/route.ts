import { db, mapRow, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";
import { createTariffRuleSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;

    const { data: coverage } = await db
      .from("coverages")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (!coverage) {
      return NextResponse.json(
        { error: "Garantie introuvable" },
        { status: 404 }
      );
    }

    const { data: rulesData, error } = await db
      .from("coverage_tariff_rules")
      .select("*")
      .eq("coverage_id", id)
      .order("min_fiscal_power", { ascending: true });
    if (error) throw error;

    return NextResponse.json(mapRows(rulesData || []));
  } catch (error) {
    console.error("Erreur tariff-rules GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des règles tarifaires" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }
    const parsed = createTariffRuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
        { status: 400 }
      );
    }
    const {
      vehicleCategory,
      minFiscalPower,
      maxFiscalPower,
      minVehicleValue,
      maxVehicleValue,
      fuelType,
      formulaName,
      baseRate,
      fixedAmount,
      minAmount,
      maxAmount,
      conditions,
    } = parsed.data;

    const { data: coverage } = await db
      .from("coverages")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (!coverage) {
      return NextResponse.json(
        { error: "Garantie introuvable" },
        { status: 404 }
      );
    }

    const { data: rule, error } = await db
      .from("coverage_tariff_rules")
      .insert({
        coverage_id: id,
        vehicle_category: vehicleCategory || null,
        min_fiscal_power: minFiscalPower ?? null,
        max_fiscal_power: maxFiscalPower ?? null,
        min_vehicle_value: minVehicleValue ?? null,
        max_vehicle_value: maxVehicleValue ?? null,
        fuel_type: fuelType || null,
        formula_name: formulaName || null,
        base_rate: baseRate ?? null,
        fixed_amount: fixedAmount ?? null,
        min_amount: minAmount ?? null,
        max_amount: maxAmount ?? null,
        conditions: typeof conditions === "object" ? JSON.stringify(conditions) : (conditions || "{}"),
      })
      .select()
      .single();
    if (error) throw error;

    await logAudit({
      action: "CREATE",
      entity: "CoverageTariffRule",
      entityId: rule.id,
      details: { coverageId: id, fuelType: rule.fuelType, minFiscalPower: rule.minFiscalPower, maxFiscalPower: rule.maxFiscalPower },
    });

    return NextResponse.json(mapRow(rule), { status: 201 });
  } catch (error) {
    console.error("Erreur tariff-rules POST:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la règle tarifaire" },
      { status: 500 }
    );
  }
}
