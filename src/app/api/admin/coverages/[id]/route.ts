import { db, mapRow, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

function parseMetadata(obj: Record<string, unknown>) {
  try {
    return { ...obj, metadata: JSON.parse((obj.metadata as string) || "{}") };
  } catch {
    return { ...obj, metadata: {} };
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
      .from("coverages")
      .select("*, insurer:insurers(id, name, code), category:coverage_categories(id, name, code)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    const coverage = mapRow(data);

    if (!coverage) {
      return NextResponse.json(
        { error: "Garantie introuvable" },
        { status: 404 }
      );
    }

    const { data: rulesData } = await db
      .from("coverage_tariff_rules")
      .select("*")
      .eq("coverage_id", id)
      .order("min_fiscal_power", { ascending: true });

    return NextResponse.json(
      parseMetadata({
        ...coverage,
        tariffRules: mapRows(rulesData || []),
      } as unknown as Record<string, unknown>)
    );
  } catch (error) {
    console.error("Erreur coverage GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement de la garantie" },
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
      code,
      type,
      name,
      description,
      calculationType,
      categoryId,
      insurerId,
      isMandatory,
      isOptional,
      conditions,
      isActive,
      displayOrder,
      metadata,
      variableSource,
      ratePercent,
      conditionedByNewValue,
      newValueThreshold,
      rateBelowThreshold,
      rateAboveThreshold,
      fixedAmount,
      packPriceReduced,
      capital,
      minAmount,
      maxAmount,
      matrixDimension,
      requiresGuarantee,
    } = body;

    const { data: existingData } = await db
      .from("coverages")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    const existing = mapRow(existingData);
    if (!existing) {
      return NextResponse.json(
        { error: "Garantie introuvable" },
        { status: 404 }
      );
    }

    if (code && code !== existing.code) {
      const { data: codeTaken } = await db
        .from("coverages")
        .select("id")
        .eq("code", code)
        .maybeSingle();
      if (codeTaken) {
        return NextResponse.json(
          { error: "Une garantie avec ce code existe déjà" },
          { status: 400 }
        );
      }
    }

    const { data: coverage, error } = await db
      .from("coverages")
      .update({
        ...(code !== undefined && { code }),
        ...(type !== undefined && { type }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(calculationType !== undefined && { calculation_type: calculationType }),
        ...(categoryId !== undefined && { category_id: categoryId && categoryId !== "__none__" ? categoryId : null }),
        ...(insurerId !== undefined && { insurer_id: insurerId }),
        ...(isMandatory !== undefined && { is_mandatory: isMandatory }),
        ...(isOptional !== undefined && { is_optional: isOptional }),
        ...(conditions !== undefined && { conditions: typeof conditions === "string" ? conditions : (conditions ? JSON.stringify(conditions) : "{}") }),
        ...(isActive !== undefined && { is_active: isActive }),
        ...(displayOrder !== undefined && { display_order: displayOrder }),
        ...(metadata !== undefined && {
          metadata: typeof metadata === "object" ? JSON.stringify(metadata) : (metadata || "{}"),
        }),
        ...(variableSource !== undefined && { variable_source: variableSource }),
        ...(ratePercent !== undefined && { rate_percent: ratePercent }),
        ...(conditionedByNewValue !== undefined && { conditioned_by_new_value: conditionedByNewValue }),
        ...(newValueThreshold !== undefined && { new_value_threshold: newValueThreshold }),
        ...(rateBelowThreshold !== undefined && { rate_below_threshold: rateBelowThreshold }),
        ...(rateAboveThreshold !== undefined && { rate_above_threshold: rateAboveThreshold }),
        ...(fixedAmount !== undefined && { fixed_amount: fixedAmount }),
        ...(packPriceReduced !== undefined && { pack_price_reduced: packPriceReduced }),
        ...(capital !== undefined && { capital }),
        ...(minAmount !== undefined && { min_amount: minAmount }),
        ...(maxAmount !== undefined && { max_amount: maxAmount }),
        ...(matrixDimension !== undefined && { matrix_dimension: matrixDimension }),
        ...(requiresGuarantee !== undefined && { requires_guarantee: requiresGuarantee }),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    await db.from("audit_logs").insert({
      action: "UPDATE",
      entity: "Coverage",
      entity_id: id,
      details: JSON.stringify({ code: coverage.code, name: coverage.name }),
      user_name: "SYSTEM",
    });

    return NextResponse.json(parseMetadata(mapRow(coverage) as unknown as Record<string, unknown>));
  } catch (error) {
    console.error("Erreur coverage PUT:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la garantie", details: msg },
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
      .from("coverages")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    const existing = mapRow(data);
    if (!existing) {
      return NextResponse.json(
        { error: "Garantie introuvable" },
        { status: 404 }
      );
    }

    await db.from("coverages").delete().eq("id", id);

    await db.from("audit_logs").insert({
      action: "DELETE",
      entity: "Coverage",
      entity_id: id,
      details: JSON.stringify({ code: existing.code, name: existing.name }),
      user_name: "SYSTEM",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur coverage DELETE:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la garantie" },
      { status: 500 }
    );
  }
}
