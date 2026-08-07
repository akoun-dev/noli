import { NextRequest, NextResponse } from "next/server";
import { db, mapRow } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;

    const { data, error } = await db
      .from("coverage_tariff_rules")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    const rule = mapRow(data);
    if (!rule) {
      return NextResponse.json(
        { error: "Règle tarifaire introuvable" },
        { status: 404 }
      );
    }

    await db.from("coverage_tariff_rules").delete().eq("id", id);

    await logAudit({
      action: "DELETE",
      entity: "CoverageTariffRule",
      entityId: id,
      details: { coverageId: rule.coverageId, fuelType: rule.fuelType, minFiscalPower: rule.minFiscalPower, maxFiscalPower: rule.maxFiscalPower },
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
