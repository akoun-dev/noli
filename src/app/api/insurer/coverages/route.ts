import { db, mapRow, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getInsurerAccount, getSessionProfile, requireAuth } from "@/lib/auth-guard";

async function resolveInsurerId(): Promise<string | null> {
  const profile = await getSessionProfile();
  if (!profile) return null;
  const account = await getInsurerAccount(profile.id);
  return account?.insurerId || null;
}

export async function GET(_request: NextRequest) {
  try {
    const guard = await requireAuth(["INSURER"]);
    if (guard) return guard;

    const insurerId = await resolveInsurerId();
    if (!insurerId) {
      return NextResponse.json(
        { error: "Aucun compte assureur trouvé pour cet utilisateur" },
        { status: 404 }
      );
    }

    const { data, error } = await db
      .from("coverages")
      .select("*, category:coverage_categories(id, name, code)")
      .eq("insurer_id", insurerId)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw error;
    const coverages = mapRows(data || []);

    return NextResponse.json({ coverages });
  } catch (error) {
    console.error("Erreur insurer/coverages GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des garanties" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAuth(["INSURER"]);
    if (guard) return guard;

    const insurerId = await resolveInsurerId();
    if (!insurerId) {
      return NextResponse.json(
        { error: "Aucun compte assureur trouvé pour cet utilisateur" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      categoryId,
      code,
      type,
      name,
      description,
      calculationType,
      isMandatory,
      isOptional,
      conditions,
      displayOrder,
      metadata,
      variableSource,
      ratePercent,
      conditionedByNewValue,
      newValueThreshold,
      rateBelowThreshold,
      rateAboveThreshold,
      fixedAmount,
      matrixDimension,
      minAmount,
      maxAmount,
      capital,
      requiresGuarantee,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Le nom est requis" },
        { status: 400 }
      );
    }

    // Auto-generate code if not provided (like admin)
    let genCode = code;
    if (!genCode) {
      const { data: insurerData } = await db
        .from("insurers")
        .select("code")
        .eq("id", insurerId)
        .maybeSingle();
      const insurer = mapRow(insurerData);
      const insCode = insurer?.code || "INS";
      const typePrefix = name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, "").substring(0, 10);
      genCode = `${typePrefix}_${insCode}`;
      let suffix = 1;
      let unique = genCode;
      while (true) {
        const { data: existing } = await db
          .from("coverages")
          .select("id")
          .eq("code", unique)
          .maybeSingle();
        if (!existing) break;
        unique = `${genCode}_${suffix++}`;
      }
      genCode = unique;
    } else {
      genCode = genCode.toUpperCase().trim();
      const { data: existing } = await db
        .from("coverages")
        .select("id")
        .eq("code", genCode)
        .maybeSingle();
      if (existing) {
        return NextResponse.json(
          { error: "Une garantie avec ce code existe déjà" },
          { status: 409 }
        );
      }
    }

    const { data, error } = await db
      .from("coverages")
      .insert({
        insurer_id: insurerId,
        category_id: categoryId || null,
        code: genCode,
        type: genCode,
        name,
        description: description || null,
        calculation_type: calculationType || "FIXED_AMOUNT",
        is_mandatory: Boolean(isMandatory),
        is_optional: Boolean(isOptional),
        conditions: conditions || "{}",
        display_order: displayOrder ?? 0,
        is_active: true,
        metadata: metadata
          ? typeof metadata === "string"
            ? metadata
            : JSON.stringify(metadata)
          : "{}",
        // Structured columns
        variable_source: variableSource || null,
        rate_percent: ratePercent != null ? Number(ratePercent) : null,
        conditioned_by_new_value: Boolean(conditionedByNewValue),
        new_value_threshold: newValueThreshold != null ? Number(newValueThreshold) : null,
        rate_below_threshold: rateBelowThreshold != null ? Number(rateBelowThreshold) : null,
        rate_above_threshold: rateAboveThreshold != null ? Number(rateAboveThreshold) : null,
        fixed_amount: fixedAmount != null ? Number(fixedAmount) : null,
        matrix_dimension: matrixDimension || null,
        min_amount: minAmount != null ? Number(minAmount) : null,
        max_amount: maxAmount != null ? Number(maxAmount) : null,
        capital: capital != null ? Number(capital) : null,
        requires_guarantee: requiresGuarantee || null,
      })
      .select("*, category:coverage_categories(id, name, code)")
      .single();
    if (error) throw error;
    const coverage = mapRow(data);

    return NextResponse.json(coverage, { status: 201 });
  } catch (error) {
    console.error("Erreur insurer/coverages POST:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la garantie" },
      { status: 500 }
    );
  }
}
