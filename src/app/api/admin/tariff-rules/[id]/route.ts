import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rule = await db.coverageTariffRule.findUnique({ where: { id } });
    if (!rule) {
      return NextResponse.json(
        { error: "Règle tarifaire introuvable" },
        { status: 404 }
      );
    }

    await db.coverageTariffRule.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        action: "DELETE",
        entity: "CoverageTariffRule",
        entityId: id,
        details: JSON.stringify({ coverageId: rule.coverageId, fuelType: rule.fuelType, minFiscalPower: rule.minFiscalPower, maxFiscalPower: rule.maxFiscalPower }),
        userName: "SYSTEM",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur tariff-rule DELETE:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la règle tarifaire" },
      { status: 500 }
    );
  }
}