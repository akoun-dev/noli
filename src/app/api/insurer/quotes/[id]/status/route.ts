import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";

const VALID_STATUSES = ["APPROVED", "REJECTED", "PENDING"];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Le paramètre userId est requis" },
        { status: 400 }
      );
    }

    const account = await db.insurerAccount.findFirst({
      where: { profileId: userId },
      select: { insurerId: true },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Aucun compte assureur trouvé pour cet utilisateur" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Statut invalide. Valeurs autorisées : ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify the quote exists and belongs to this insurer's offers
    const quote = await db.quote.findUnique({
      where: { id },
      include: { offer: { select: { insurerId: true } } },
    });

    if (!quote) {
      return NextResponse.json(
        { error: "Devis introuvable" },
        { status: 404 }
      );
    }

    if (!quote.offer || quote.offer.insurerId !== account.insurerId) {
      return NextResponse.json(
        { error: "Ce devis n'appartient pas à vos offres" },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = { status };

    // If approving and no finalPrice set, use estimatedPrice
    if (status === "APPROVED" && quote.finalPrice === null && quote.estimatedPrice !== null) {
      updateData.finalPrice = quote.estimatedPrice;
    }

    const updated = await db.quote.update({
      where: { id },
      data: updateData,
    });

    // Notify the quote owner
    if (quote.userId) {
      if (status === "APPROVED") {
        createNotification({
          userId: quote.userId,
          type: "SUCCESS",
          title: "Devis approuvé",
          message: `Votre devis ${quote.reference} a été approuvé par l'assureur.`,
        });
      } else if (status === "REJECTED") {
        createNotification({
          userId: quote.userId,
          type: "WARNING",
          title: "Devis rejeté",
          message: `Votre devis ${quote.reference} a été rejeté par l'assureur.`,
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur insurer/quotes/[id]/status:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du statut du devis" },
      { status: 500 }
    );
  }
}