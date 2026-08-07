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
      .from("coverages")
      .select("*, category:coverage_categories(id, name, code)")
      .eq("id", id)
      .maybeSingle();
    const coverage = mapRow(data);

    if (!coverage) {
      return NextResponse.json(
        { error: "Garantie non trouvée" },
        { status: 404 }
      );
    }

    if (!insurerId || coverage.insurerId !== insurerId) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    return NextResponse.json(coverage);
  } catch (error) {
    console.error("Erreur insurer/coverages/[id] GET:", error);
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
    const guard = await requireAuth(["INSURER"]);
    if (guard) return guard;

    const insurerId = await resolveInsurerId();
    const { id } = await params;
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
      isActive,
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

    const { data: existingData } = await db
      .from("coverages")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    const existing = mapRow(existingData);
    if (!existing) {
      return NextResponse.json(
        { error: "Garantie non trouvée" },
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
    const collect = (name: string, value: unknown) => {
      if (value !== undefined && value !== null && value !== "") {
        numericFields.push({ name, value });
      }
    };
    collect("Taux (ratePercent)", ratePercent);
    collect("Seuil valeur neuve", newValueThreshold);
    collect("Taux sous le seuil", rateBelowThreshold);
    collect("Taux au-dessus du seuil", rateAboveThreshold);
    collect("Montant fixe", fixedAmount);
    collect("Montant min", minAmount);
    collect("Montant max", maxAmount);
    collect("Capital", capital);
    for (const { name, value } of numericFields) {
      const res = parseNumberField(value, { field: name, min: 0, optional: false });
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
    }

    // If code is being changed, check uniqueness
    if (code && code !== existing.code) {
      const { data: codeExists } = await db
        .from("coverages")
        .select("id")
        .eq("code", code.toUpperCase().trim())
        .maybeSingle();
      if (codeExists) {
        return NextResponse.json(
          { error: "Une garantie avec ce code existe déjà" },
          { status: 409 }
        );
      }
    }

    const { data, error } = await db
      .from("coverages")
      .update({
        ...(categoryId !== undefined ? { category_id: categoryId || null } : {}),
        ...(code !== undefined ? { code: code.toUpperCase().trim() } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description: description || null } : {}),
        ...(calculationType !== undefined ? { calculation_type: calculationType } : {}),
        ...(isMandatory !== undefined ? { is_mandatory: Boolean(isMandatory) } : {}),
        ...(isOptional !== undefined ? { is_optional: Boolean(isOptional) } : {}),
        ...(conditions !== undefined ? { conditions: conditions || "{}" } : {}),
        ...(displayOrder !== undefined ? { display_order: Number(displayOrder) } : {}),
        ...(metadata !== undefined
          ? {
              metadata:
                typeof metadata === "string" ? metadata : JSON.stringify(metadata),
            }
          : {}),
        ...(isActive !== undefined ? { is_active: Boolean(isActive) } : {}),
        // Structured columns
        ...(variableSource !== undefined ? { variable_source: variableSource || null } : {}),
        ...(ratePercent !== undefined ? { rate_percent: ratePercent != null ? Number(ratePercent) : null } : {}),
        ...(conditionedByNewValue !== undefined ? { conditioned_by_new_value: Boolean(conditionedByNewValue) } : {}),
        ...(newValueThreshold !== undefined ? { new_value_threshold: newValueThreshold != null ? Number(newValueThreshold) : null } : {}),
        ...(rateBelowThreshold !== undefined ? { rate_below_threshold: rateBelowThreshold != null ? Number(rateBelowThreshold) : null } : {}),
        ...(rateAboveThreshold !== undefined ? { rate_above_threshold: rateAboveThreshold != null ? Number(rateAboveThreshold) : null } : {}),
        ...(fixedAmount !== undefined ? { fixed_amount: fixedAmount != null ? Number(fixedAmount) : null } : {}),
        ...(matrixDimension !== undefined ? { matrix_dimension: matrixDimension || null } : {}),
        ...(minAmount !== undefined ? { min_amount: minAmount != null ? Number(minAmount) : null } : {}),
        ...(maxAmount !== undefined ? { max_amount: maxAmount != null ? Number(maxAmount) : null } : {}),
        ...(capital !== undefined ? { capital: capital != null ? Number(capital) : null } : {}),
        ...(requiresGuarantee !== undefined ? { requires_guarantee: requiresGuarantee || null } : {}),
      })
      .eq("id", id)
      .select("*, category:coverage_categories(id, name, code)")
      .single();
    if (error) throw error;
    const updated = mapRow(data);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur insurer/coverages/[id] PUT:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la garantie" },
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
      .from("coverages")
      .select("id, insurer_id")
      .eq("id", id)
      .maybeSingle();
    const existing = mapRow(existingData);
    if (!existing) {
      return NextResponse.json(
        { error: "Garantie non trouvée" },
        { status: 404 }
      );
    }

    if (!insurerId || existing.insurerId !== insurerId) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    await db.from("coverages").update({ is_active: false }).eq("id", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur insurer/coverages/[id] DELETE:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la garantie" },
      { status: 500 }
    );
  }
}
