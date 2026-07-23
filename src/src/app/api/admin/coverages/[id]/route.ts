import { db } from "@/lib/db";
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

    const coverage = await db.coverage.findUnique({
      where: { id },
      include: {
        insurer: { select: { id: true, name: true, code: true } },
        category: { select: { id: true, name: true, code: true } },
        tariffRules: { orderBy: { minFiscalPower: "asc" } },
      },
    });

    if (!coverage) {
      return NextResponse.json(
        { error: "Garantie introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(parseMetadata(coverage as unknown as Record<string, unknown>));
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

    const existing = await db.coverage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Garantie introuvable" },
        { status: 404 }
      );
    }

    if (code && code !== existing.code) {
      const codeTaken = await db.coverage.findUnique({ where: { code } });
      if (codeTaken) {
        return NextResponse.json(
          { error: "Une garantie avec ce code existe déjà" },
          { status: 400 }
        );
      }
    }

    const coverage = await db.coverage.update({
      where: { id },
      data: {
        ...(code !== undefined && { code }),
        ...(type !== undefined && { type }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(calculationType !== undefined && { calculationType }),
        ...(categoryId !== undefined && { categoryId: categoryId && categoryId !== "__none__" ? categoryId : null }),
        ...(insurerId !== undefined && { insurerId }),
        ...(isMandatory !== undefined && { isMandatory }),
        ...(isOptional !== undefined && { isOptional }),
        ...(conditions !== undefined && { conditions: typeof conditions === "string" ? conditions : (conditions ? JSON.stringify(conditions) : "{}") }),
        ...(isActive !== undefined && { isActive }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(metadata !== undefined && {
          metadata: typeof metadata === "object" ? JSON.stringify(metadata) : (metadata || "{}"),
        }),
        ...(variableSource !== undefined && { variableSource }),
        ...(ratePercent !== undefined && { ratePercent }),
        ...(conditionedByNewValue !== undefined && { conditionedByNewValue }),
        ...(newValueThreshold !== undefined && { newValueThreshold }),
        ...(rateBelowThreshold !== undefined && { rateBelowThreshold }),
        ...(rateAboveThreshold !== undefined && { rateAboveThreshold }),
        ...(fixedAmount !== undefined && { fixedAmount }),
        ...(packPriceReduced !== undefined && { packPriceReduced }),
        ...(capital !== undefined && { capital }),
        ...(minAmount !== undefined && { minAmount }),
        ...(maxAmount !== undefined && { maxAmount }),
        ...(matrixDimension !== undefined && { matrixDimension }),
        ...(requiresGuarantee !== undefined && { requiresGuarantee }),
      },
    });

    await db.auditLog.create({
      data: { action: "UPDATE", entity: "Coverage", entityId: id, details: JSON.stringify({ code: coverage.code, name: coverage.name }), userName: "SYSTEM" },
    });

    return NextResponse.json(parseMetadata(coverage as unknown as Record<string, unknown>));
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

    const existing = await db.coverage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Garantie introuvable" },
        { status: 404 }
      );
    }

    await db.coverage.delete({ where: { id } });

    await db.auditLog.create({
      data: { action: "DELETE", entity: "Coverage", entityId: id, details: JSON.stringify({ code: existing.code, name: existing.name }), userName: "SYSTEM" },
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