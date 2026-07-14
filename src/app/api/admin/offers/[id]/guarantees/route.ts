import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

// PUT /api/admin/offers/[id]/guarantees
// Body: { guarantees: [{ guaranteeId, isIncluded }] }
// Bulk-replace all OfferGuarantee links for a given offer.

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;
    const body = await request.json();

    // Validate offer exists
    const offer = await db.offer.findUnique({ where: { id } });
    if (!offer) {
      return NextResponse.json(
        { error: "Offre introuvable" },
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
    await db.offerGuarantee.deleteMany({
      where: { offerId: id },
    });

    // Create new links
    if (body.guarantees.length > 0) {
      await db.offerGuarantee.createMany({
        data: body.guarantees.map(
          (g: { guaranteeId: string; isIncluded: boolean }) => ({
            offerId: id,
            guaranteeId: g.guaranteeId,
            isIncluded: g.isIncluded ?? true,
          })
        ),
      });
    }

    // Return updated list
    const updatedLinks = await db.offerGuarantee.findMany({
      where: { offerId: id },
      include: { guarantee: true },
      orderBy: { createdAt: "asc" },
    });

    // Also update InsuranceOffer.features with included guarantee names
    try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
      const includedNames = updatedLinks
        .filter((l: { isIncluded: boolean }) => l.isIncluded)
        .map((l: { guarantee: { name: string } }) => l.guarantee.name);
      if (includedNames.length > 0) {
        await db.insuranceOffer.update({
          where: { id },
          data: { features: JSON.stringify(includedNames) },
        });
      }
    } catch (err) {
      console.error("Erreur lors de la synchro features InsuranceOffer:", err);
    }

    return NextResponse.json(updatedLinks);
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour des garanties de l'offre:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des garanties de l'offre" },
      { status: 500 }
    );
  }
}