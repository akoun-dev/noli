import { db, mapRow, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

function parseMetadata(coverage: Record<string, unknown>) {
  try {
    return { ...coverage, metadata: JSON.parse((coverage.metadata as string) || "{}") };
  } catch {
    return { ...coverage, metadata: {} };
  }
}

export async function GET(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const { searchParams } = request.nextUrl;
    const insurerId = searchParams.get("insurerId");
    const categoryId = searchParams.get("categoryId");
    const calculationType = searchParams.get("calculationType");
    const search = searchParams.get("search") || "";

    let query = db
      .from("coverages")
      .select(
        "id, code, type, name, description, calculation_type, is_mandatory, is_optional, conditions, is_active, display_order, metadata, variable_source, rate_percent, conditioned_by_new_value, new_value_threshold, rate_below_threshold, rate_above_threshold, fixed_amount, pack_price_reduced, capital, min_amount, max_amount, matrix_dimension, requires_guarantee, created_at, updated_at, category_id, insurer_id, insurer:insurers(id, name, code, logoUrl:logo_url), category:coverage_categories(id, name, code)"
      )
      .order("display_order", { ascending: true });

    if (insurerId) {
      query = query.eq("insurer_id", insurerId);
    }
    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }
    if (calculationType) {
      query = query.eq("calculation_type", calculationType);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    const coverages = mapRows(data || []);

    const ids = coverages.map((c) => (c as { id: string }).id);
    const tariffCounts = new Map<string, number>();
    if (ids.length > 0) {
      const { data: rulesData } = await db
        .from("coverage_tariff_rules")
        .select("coverage_id")
        .in("coverage_id", ids);
      for (const r of rulesData || []) {
        const key = String(r.coverage_id);
        tariffCounts.set(key, (tariffCounts.get(key) || 0) + 1);
      }
    }

    const parsed = coverages.map((c) =>
      parseMetadata({
        ...c,
        _count: { tariffRules: tariffCounts.get(String((c as { id: string }).id)) || 0 },
      } as unknown as Record<string, unknown>)
    );
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Erreur coverages GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des garanties" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
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

    if (!name) {
      return NextResponse.json(
        { error: "Le nom est requis" },
        { status: 400 }
      );
    }
    if (!calculationType) {
      return NextResponse.json(
        { error: "Le type de calcul est requis" },
        { status: 400 }
      );
    }
    if (!insurerId) {
      return NextResponse.json(
        { error: "L'assureur est requis" },
        { status: 400 }
      );
    }

    // Auto-generate code: TYPE_INSURER_CODE
    let genCode = code;
    if (!genCode) {
      const { data: insurer } = await db
        .from("insurers")
        .select("code")
        .eq("id", insurerId)
        .maybeSingle();
      const insCode = insurer?.code || "INS";
      const typePrefix = (type || name).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, "").substring(0, 10);
      genCode = `${typePrefix}_${insCode}`;
      // Ensure uniqueness
      let suffix = 1;
      let unique = genCode;
      while (true) {
        const { data: dup } = await db
          .from("coverages")
          .select("id")
          .eq("code", unique)
          .maybeSingle();
        if (!dup) break;
        unique = `${genCode}_${suffix++}`;
      }
      genCode = unique;
    } else {
      const { data: existing } = await db
        .from("coverages")
        .select("id")
        .eq("code", genCode)
        .maybeSingle();
      if (existing) {
        return NextResponse.json(
          { error: "Une garantie avec ce code existe déjà" },
          { status: 400 }
        );
      }
    }

    const { data: coverage, error } = await db
      .from("coverages")
      .insert({
        code: genCode,
        type: type || genCode,
        name,
        description: description || null,
        calculation_type: calculationType,
        category_id: categoryId && categoryId !== "__none__" ? categoryId : null,
        insurer_id: insurerId,
        is_mandatory: isMandatory ?? false,
        is_optional: isOptional ?? false,
        conditions: typeof conditions === "string" ? conditions : (conditions ? JSON.stringify(conditions) : "{}"),
        is_active: isActive ?? true,
        display_order: displayOrder ?? 0,
        metadata: typeof metadata === "object" ? JSON.stringify(metadata) : (metadata || "{}"),
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
      .select()
      .single();
    if (error) throw error;

    await db.from("audit_logs").insert({
      action: "CREATE",
      entity: "Coverage",
      entity_id: coverage.id,
      details: JSON.stringify({ code: coverage.code, name: coverage.name, calculationType }),
      user_name: "SYSTEM",
    });

    return NextResponse.json(parseMetadata(mapRow(coverage) as unknown as Record<string, unknown>), { status: 201 });
  } catch (error) {
    console.error("Erreur coverages POST:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la garantie", details: msg },
      { status: 500 }
    );
  }
}
