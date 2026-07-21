import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

// PUT /api/admin/insurers/[id]/guarantees
// Body: { guarantees: [{ guaranteeId, isEnabled, customRate?, customPrice? }] }
// Bulk-replace all InsurerGuarantee links for a given insurer.

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;
    const body = await request.json();

    // Validate insurer exists
    const insurer = await db.insurer.findUnique({ where: { id } });
    if (!insurer) {
      return NextResponse.json(
        { error: "Assureur introuvable" },
        { status: 404 }
      );
    }

    if (!Array.isArray(body.guarantees)) {
      return NextResponse.json(
        { error: "Le champ 'guarantees' doit être un tableau" },
        { status: 400 }
      );
    }

    // Validate all guaranteeIds exist
    const guaranteeIds = body.guarantees.map(
      (g: { guaranteeId: string }) => g.guaranteeId
    );
    if (guaranteeIds.length > 0) {
      const existingGuarantees = await db.guarantee.findMany({
        where: { id: { in: guaranteeIds } },
        select: { id: true },
      });
      const existingIds = new Set(existingGuarantees.map((g) => g.id));
      const missing = guaranteeIds.filter((gid: string) => !existingIds.has(gid));
      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Garanties introuvables : ${missing.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Delete all existing links
    await db.insurerGuarantee.deleteMany({
      where: { insurerId: id },
    });

    // Create new links
    if (body.guarantees.length > 0) {
      await db.insurerGuarantee.createMany({
        data: body.guarantees.map(
          (g: {
            guaranteeId: string;
            isEnabled: boolean;
            customRate?: number;
            customPrice?: number;
          }) => ({
            insurerId: id,
            guaranteeId: g.guaranteeId,
            isEnabled: g.isEnabled ?? true,
            customRate: g.customRate ?? null,
            customPrice: g.customPrice ?? null,
          })
        ),
      });
    }

    // Return updated list
    const updatedLinks = await db.insurerGuarantee.findMany({
      where: { insurerId: id },
      include: { guarantee: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(updatedLinks);
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour des garanties de l'assureur:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des garanties de l'assureur" },
      { status: 500 }
    );
  }
}