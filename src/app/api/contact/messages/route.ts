import { db, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * Formulaire de contact — endpoint réel (remplace l'ancien setTimeout simulé).
 * Les messages sont transmis aux administrateurs via le système de
 * notifications, avec les coordonnées du demandeur.
 */
export async function POST(request: NextRequest) {
  try {
    // Anti-spam : 5 messages / 10 min par IP.
    const limit = checkRateLimit(getClientIp(request), "contact-message", {
      maxAttempts: 5,
      windowMs: 10 * 60_000,
      lockoutMs: 60 * 60_000,
    });
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Trop de messages envoyés. Réessayez plus tard." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Nom, email, sujet et message sont requis" },
        { status: 400 }
      );
    }
    if (typeof name !== "string" || typeof email !== "string" ||
        typeof subject !== "string" || typeof message !== "string") {
      return NextResponse.json(
        { error: "Données invalides" },
        { status: 400 }
      );
    }

    // Notifier les administrateurs actifs
    const { data: adminProfilesData } = await db
      .from("profiles")
      .select("id")
      .eq("role", "ADMIN")
      .eq("is_active", true);
    const adminProfiles = mapRows<{ id: string }>(adminProfilesData || []);

    const contactData = JSON.stringify({
      name,
      email,
      phone: phone || null,
      subject,
      message,
    });

    let notified = 0;
    for (const ap of adminProfiles) {
      try {
        const { error: notifErr } = await db.from("notifications").insert({
          user_id: ap.id,
          type: "INFO",
          title: "📩 Nouveau message de contact",
          message: `${name} — ${subject}`,
          link: contactData,
        });
        if (notifErr) throw notifErr;
        notified += 1;
      } catch (notifErr) {
        console.error("[contact] Erreur notification:", notifErr);
      }
    }

    console.log("[contact] Message de contact enregistré →", email, "| sujet:", subject);
    return NextResponse.json({
      success: true,
      notified,
      message: "Message envoyé avec succès",
    });
  } catch (error) {
    console.error("Erreur message de contact:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      { status: 500 }
    );
  }
}
