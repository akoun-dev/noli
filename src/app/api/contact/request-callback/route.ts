import { db, mapRows } from "@/lib/db";
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
      const { data: insurerProfilesData } = await db
        .from("insurer_accounts")
        .select("profileId:profile_id")
        .eq("insurer_id", insurerId);
      const insurerProfiles = mapRows<{ profileId: string }>(insurerProfilesData || []);

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
          const { error: notifErr } = await db.from("notifications").insert({
            user_id: ip.profileId,
            type: "CALLBACK",
            title: "📞 Demande de rappel",
            message: `${clientName} — ${phone}${preferredTime ? ` (${preferredTime})` : ""}`,
            link: callbackData,
          });
          if (notifErr) throw notifErr;
        } catch (notifErr) {
          console.error("[callback] Erreur notification:", notifErr);
        }
      }

      // Notifier aussi les admins
      const { data: adminProfilesData } = await db
        .from("profiles")
        .select("id")
        .eq("role", "ADMIN")
        .eq("is_active", true);
      const adminProfiles = mapRows<{ id: string }>(adminProfilesData || []);
      for (const ap of adminProfiles) {
        try {
          const { error: notifErr } = await db.from("notifications").insert({
            user_id: ap.id,
            type: "CALLBACK",
            title: "📞 Demande de rappel",
            message: `${clientName} — ${phone}${preferredTime ? ` (${preferredTime})` : ""}`,
            link: callbackData,
          });
          if (notifErr) throw notifErr;
        } catch (notifErr) {
          console.error("[callback] Erreur notification admin:", notifErr);
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
