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

    // ── Contrat : naît automatiquement à l'approbation du devis ──
    if (status === "APPROVED" && quote.userId) {
      const { data: existingContract } = await db
        .from("contracts")
        .select("id")
        .eq("quote_id", id)
        .maybeSingle();

      if (!existingContract) {
        const contractRef = `NOLI-CON-${Date.now().toString(36).toUpperCase()}${Math.random()
          .toString(36)
          .slice(2, 6)
          .toUpperCase()}`;
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);

        const { error: contractError } = await db.from("contracts").insert({
          reference: contractRef,
          quote_id: id,
          profile_id: quote.userId,
          insurer_id: account.insurerId,
          offer_id: quote.offerId ?? null,
          status: "ACTIVE",
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          premium: quote.finalPrice ?? quote.estimatedPrice ?? null,
        });
        if (contractError) {
          // Rollback : le contrat n'a pas pu être créé → on restaure le devis
          // dans son état précédent plutôt que d'annoncer un contrat fantôme
          // (le devis serait resté APPROVED avec une notification trompeuse).
          await db
            .from("quotes")
            .update({ status: quote.status, final_price: quote.finalPrice })
            .eq("id", id);
          console.error("Erreur création contrat:", contractError);
          return NextResponse.json(
            { error: "Le contrat n'a pas pu être créé. Le devis a été restauré, veuillez réessayer." },
            { status: 500 }
          );
        }
      }
    }

    // Notify the quote owner
    if (quote.userId) {
      if (status === "APPROVED") {
        createNotification({
          userId: quote.userId,
          type: "SUCCESS",
          title: "Devis approuvé",
          message: `Votre devis ${quote.reference} a été approuvé. Votre contrat est en cours d'activation.`,
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
