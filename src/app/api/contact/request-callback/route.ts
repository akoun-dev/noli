import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { sendCallbackConfirmation } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      phone,
      preferredTime,
      insurerName,
      insurerId,
      personalInfo,
    } = body;

    if (!phone || !insurerName) {
      return NextResponse.json(
        { error: "Numéro de téléphone et assureur requis" },
        { status: 400 }
      );
    }

    // Envoi d'email de confirmation au client (si email fourni)
    if (personalInfo?.email && process.env.RESEND_API_KEY) {
      sendCallbackConfirmation(
        personalInfo.email,
        insurerName,
        preferredTime || "Non spécifié"
      ).catch(err => console.error("[callback] Erreur email:", err));
    }

    // Notifier les comptes assureurs concernés
    if (insurerId) {
      const insurerProfiles = await db.insurerAccount.findMany({
        where: { insurerId },
        select: { profileId: true },
      });

      const clientName = personalInfo?.firstName || personalInfo?.lastName
        ? `${personalInfo.firstName || ""} ${personalInfo.lastName || ""}`.trim()
        : "Un client";

      const callbackData = JSON.stringify({
        phone,
        preferredTime: preferredTime || null,
        clientName,
        clientFirstName: personalInfo?.firstName || null,
        clientLastName: personalInfo?.lastName || null,
        clientEmail: personalInfo?.email || null,
        insurerName,
        insurerId,
      });

      for (const ip of insurerProfiles) {
        try {
          await db.notification.create({
            data: {
              userId: ip.profileId,
              type: "CALLBACK",
              title: "📞 Demande de rappel",
              message: `${clientName} — ${phone}${preferredTime ? ` (${preferredTime})` : ""}`,
              link: callbackData,
            },
          });
        } catch (notifErr) {
          console.error("[callback] Erreur notification:", notifErr);
        }
      }
    }

    console.log("[callback] Demande de rappel enregistrée pour", insurerName, "→", phone);

    return NextResponse.json({
      success: true,
      message: "Demande de rappel enregistrée",
    });
  } catch (error) {
    console.error("Erreur demande de rappel:", error);
    return NextResponse.json(
      { error: "Erreur lors de la demande de rappel" },
      { status: 500 }
    );
  }
}
