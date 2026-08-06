import { db, mapRow } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { getInsurerAccount, getSessionProfile, requireAuth } from "@/lib/auth-guard";

const VALID_STATUSES = ["APPROVED", "REJECTED", "PENDING"];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["INSURER"]);
    if (guard) return guard;

    const profile = await getSessionProfile();
    if (!profile) return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    const account = await getInsurerAccount(profile.id);

    if (!account) {
      return NextResponse.json(
        { error: "Aucun compte assureur trouvé pour cet utilisateur" },
        { status: 404 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Statut invalide. Valeurs autorisées : ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify the quote exists and belongs to this insurer's offers
    const { data: quoteData } = await db
      .from("quotes")
      .select("*, offer:insurance_offers(insurer_id)")
      .eq("id", id)
      .maybeSingle();
    const quote = mapRow(quoteData);

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
      updateData.final_price = quote.estimatedPrice;
    }

    const { data, error } = await db
      .from("quotes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    const updated = mapRow(data);

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
