import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const coverage = await db.coverage.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, code: true } },
      },
    });

    if (!coverage) {
      return NextResponse.json(
        { error: "Garantie non trouvée" },
        { status: 404 }
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

    const existing = await db.coverage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Garantie non trouvée" },
        { status: 404 }
      );
    }

    // If code is being changed, check uniqueness
    if (code && code !== existing.code) {
      const codeExists = await db.coverage.findUnique({
        where: { code: code.toUpperCase().trim() },
      });
      if (codeExists) {
        return NextResponse.json(
          { error: "Une garantie avec ce code existe déjà" },
          { status: 409 }
        );
      }
    }

    const updated = await db.coverage.update({
      where: { id },
      data: {
        ...(categoryId !== undefined ? { categoryId: categoryId || null } : {}),
        ...(code !== undefined ? { code: code.toUpperCase().trim() } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description: description || null } : {}),
        ...(calculationType !== undefined ? { calculationType } : {}),
        ...(isMandatory !== undefined ? { isMandatory: Boolean(isMandatory) } : {}),
        ...(isOptional !== undefined ? { isOptional: Boolean(isOptional) } : {}),
        ...(conditions !== undefined ? { conditions: conditions || "{}" } : {}),
        ...(displayOrder !== undefined ? { displayOrder: Number(displayOrder) } : {}),
        ...(metadata !== undefined
          ? {
              metadata:
                typeof metadata === "string" ? metadata : JSON.stringify(metadata),
            }
          : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        // Structured columns
        ...(variableSource !== undefined ? { variableSource: variableSource || null } : {}),
        ...(ratePercent !== undefined ? { ratePercent: ratePercent != null ? Number(ratePercent) : null } : {}),
        ...(conditionedByNewValue !== undefined ? { conditionedByNewValue: Boolean(conditionedByNewValue) } : {}),
        ...(newValueThreshold !== undefined ? { newValueThreshold: newValueThreshold != null ? Number(newValueThreshold) : null } : {}),
        ...(rateBelowThreshold !== undefined ? { rateBelowThreshold: rateBelowThreshold != null ? Number(rateBelowThreshold) : null } : {}),
        ...(rateAboveThreshold !== undefined ? { rateAboveThreshold: rateAboveThreshold != null ? Number(rateAboveThreshold) : null } : {}),
        ...(fixedAmount !== undefined ? { fixedAmount: fixedAmount != null ? Number(fixedAmount) : null } : {}),
        ...(matrixDimension !== undefined ? { matrixDimension: matrixDimension || null } : {}),
        ...(minAmount !== undefined ? { minAmount: minAmount != null ? Number(minAmount) : null } : {}),
        ...(maxAmount !== undefined ? { maxAmount: maxAmount != null ? Number(maxAmount) : null } : {}),
        ...(capital !== undefined ? { capital: capital != null ? Number(capital) : null } : {}),
        ...(requiresGuarantee !== undefined ? { requiresGuarantee: requiresGuarantee || null } : {}),
      },
      include: {
        category: { select: { id: true, name: true, code: true } },
      },
    });

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
    const { id } = await params;

    const existing = await db.coverage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Garantie non trouvée" },
        { status: 404 }
      );
    }

    await db.coverage.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur insurer/coverages/[id] DELETE:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la garantie" },
      { status: 500 }
    );
  }
}