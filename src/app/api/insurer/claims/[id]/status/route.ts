import { db, mapRow } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { getInsurerAccount, getSessionProfile, requireAuth } from "@/lib/auth-guard";

const VALID_STATUSES = ["SUBMITTED", "IN_REVIEW", "APPROVED", "REJECTED", "CLOSED"];

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "reçu",
  IN_REVIEW: "en cours d'examen",
  APPROVED: "approuvé",
  REJECTED: "rejeté",
  CLOSED: "clôturé",
};

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

    // Le sinistre doit appartenir à cet assureur.
    const { data: claimData } = await db
      .from("claims")
      .select("id, reference, insurer_id, profile_id")
      .eq("id", id)
      .maybeSingle();
    const claim = mapRow(claimData);
    if (!claim) {
      return NextResponse.json({ error: "Sinistre introuvable" }, { status: 404 });
    }
    if (claim.insurerId !== account.insurerId) {
      return NextResponse.json({ error: "Ce sinistre ne concerne pas vos contrats" }, { status: 403 });
    }

    const { data: updatedData, error } = await db
      .from("claims")
      .update({ status })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw error;

    // Notifier le client (best-effort).
    if (claim.profileId) {
      try {
        await createNotification({
          userId: claim.profileId as string,
          type: status === "REJECTED" ? "WARNING" : "INFO",
          title: "Mise à jour de votre sinistre",
          message: `Votre sinistre ${claim.reference} est désormais « ${STATUS_LABEL[status] || status} ».`,
        });
      } catch (notifyError) {
        console.error("[notify] Notification de sinistre non envoyée:", notifyError);
      }
    }

    return NextResponse.json(mapRow(updatedData));
  } catch (error) {
    console.error("Erreur insurer/claims/[id]/status:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour du sinistre" }, { status: 500 });
  }
}
