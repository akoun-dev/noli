import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;

    const coverage = await db.coverage.findUnique({ where: { id } });
    if (!coverage) {
      return NextResponse.json(
        { error: "Garantie introuvable" },
        { status: 404 }
      );
    }

    const rules = await db.coverageTariffRule.findMany({
      where: { coverageId: id },
      orderBy: { minFiscalPower: "asc" },
    });

    return NextResponse.json(rules);
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
    const body = await request.json();
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
    } = body;

    const coverage = await db.coverage.findUnique({ where: { id } });
    if (!coverage) {
      return NextResponse.json(
        { error: "Garantie introuvable" },
        { status: 404 }
      );
    }

    const rule = await db.coverageTariffRule.create({
      data: {
        coverageId: id,
        vehicleCategory: vehicleCategory || null,
        minFiscalPower: minFiscalPower ?? null,
        maxFiscalPower: maxFiscalPower ?? null,
        minVehicleValue: minVehicleValue ?? null,
        maxVehicleValue: maxVehicleValue ?? null,
        fuelType: fuelType || null,
        formulaName: formulaName || null,
        baseRate: baseRate ?? null,
        fixedAmount: fixedAmount ?? null,
        minAmount: minAmount ?? null,
        maxAmount: maxAmount ?? null,
        conditions: typeof conditions === "object" ? JSON.stringify(conditions) : (conditions || "{}"),
      },
    });

    await db.auditLog.create({
      data: { action: "CREATE", entity: "CoverageTariffRule", entityId: rule.id, details: JSON.stringify({ coverageId: id, fuelType: rule.fuelType, minFiscalPower: rule.minFiscalPower, maxFiscalPower: rule.maxFiscalPower }), userName: "SYSTEM" },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Erreur tariff-rules POST:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la règle tarifaire" },
      { status: 500 }
    );
  }
}