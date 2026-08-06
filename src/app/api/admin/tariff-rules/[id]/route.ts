import { NextRequest, NextResponse } from "next/server";
import { db, mapRow } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";

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

    await db.from("audit_logs").insert({
      action: "DELETE",
      entity: "CoverageTariffRule",
      entity_id: id,
      details: JSON.stringify({ coverageId: rule.coverageId, fuelType: rule.fuelType, minFiscalPower: rule.minFiscalPower, maxFiscalPower: rule.maxFiscalPower }),
      user_name: "SYSTEM",
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
