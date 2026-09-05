import nodemailer from "nodemailer";
import { Resend } from "resend";
import { escapeHtml } from "@/lib/security";

// ── Provider SMTP (principal) ──────────────────────────────────────────────
// Gmail impose que l'adresse « From » soit celle du compte authentifié
// (SMTP_USER). Un « mot de passe d'application » (16 caractères) est requis :
// https://myaccount.google.com/apppasswords
const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT) || 465;
const smtpSecure = (process.env.SMTP_SECURE ?? "true") !== "false"; // 465=SSL, 587=STARTTLS
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const smtpConfigured = Boolean(smtpUser && smtpPass);

const smtpTransporter = smtpConfigured
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPass },
    })
  : null;

// ── Provider Resend (fallback) ─────────────────────────────────────────────
// Utilisé uniquement si SMTP n'est pas configuré.
const resendApiKey = process.env.RESEND_API_KEY || "";
const resend = !smtpConfigured && resendApiKey ? new Resend(resendApiKey) : null;

// ── Expéditeur ─────────────────────────────────────────────────────────────
const FROM_EMAIL =
  process.env.SMTP_FROM ||
  process.env.EMAIL_FROM ||
  (smtpUser ? `NOLI Assurance <${smtpUser}>` : "NOLI Assurance <devis@noli.ci>");

/**
 * Indique si au moins un provider d'envoi (SMTP ou Resend) est configuré.
 * À utiliser en amont des routes API pour décider d'envoyer ou non.
 */
export function isEmailConfigured(): boolean {
  return smtpConfigured || Boolean(resendApiKey);
}

/**
 * Assainit une chaîne pour un en-tête d'email (sujet) : supprime les sauts
 * de ligne (injection d'en-tête) et les caractères de contrôle.
 */
function sanitizeSubject(value: string): string {
  return value.replace(/[\r\n\u0000-\u001f]/g, " ").trim();
}

interface EmailAttachment {
  filename: string;
  content: Buffer;
}

interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

/**
 * Routeur d'envoi : SMTP (principal) puis Resend (fallback).
 * Aucun provider configuré → no-op (retourne success: false sans lever).
 */
async function sendMail({ to, subject, html, attachments }: SendMailInput) {
  if (!smtpTransporter && !resend) {
    console.warn("[email] Aucun provider configuré (SMTP ni Resend)");
    return { success: false, error: "Email non configuré" };
  }

  const safeSubject = sanitizeSubject(subject);

  // ── SMTP (principal) ───────────────────────────────────────────────────
  if (smtpTransporter) {
    try {
      const info = await smtpTransporter.sendMail({
        from: FROM_EMAIL,
        to,
        subject: safeSubject,
        html,
        attachments,
      });
      console.log("[email] Email envoyé (SMTP) →", to, "| id:", info.messageId);
      return { success: true, data: { messageId: info.messageId } };
    } catch (err) {
      console.error("[email] Erreur SMTP:", err);
      return { success: false, error: err };
    }
  }

  // ── Resend (fallback) ──────────────────────────────────────────────────
  try {
    const { data, error } = await resend!.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: safeSubject,
      html,
      attachments,
    });
    if (error) {
      console.error("[email] Erreur Resend:", error);
      return { success: false, error };
    }
    console.log("[email] Email envoyé (Resend) →", to);
    return { success: true, data };
  } catch (err) {
    console.error("[email] Exception Resend:", err);
    return { success: false, error: err };
  }
}

export interface QuoteEmailParams {
  to: string;
  reference: string;
  insurerName: string;
  offerName: string;
  estimatedPrice: number;
  contactPhone?: string;
  contractType?: string;
  /** PDF du devis en pièce jointe (côté serveur). */
  pdf?: { filename: string; content: Buffer };
}

/**
 * Envoie un email de confirmation de devis au client.
 *
 * C-06 : toutes les variables issues de la base ou de l'utilisateur sont
 * échappées HTML avant interpolation — un assureur nommant son entreprise
 * avec du HTML malveillant ne peut pas exécuter de script dans le client
 * email du destinataire.
 */
export async function sendQuoteConfirmation(params: QuoteEmailParams) {
  const { to, reference, insurerName, offerName, estimatedPrice, contactPhone, contractType, pdf } = params;

  const formattedPrice = new Intl.NumberFormat("fr-FR").format(estimatedPrice);

  const h = {
    reference: escapeHtml(reference),
    insurerName: escapeHtml(insurerName),
    offerName: escapeHtml(offerName),
    contractType: escapeHtml(contractType),
    contactPhone: escapeHtml(contactPhone),
    formattedPrice: escapeHtml(formattedPrice),
  };

  return sendMail({
    to,
    subject: `Votre devis NOLI ${reference} — ${insurerName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #E8F4F0; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px; }
    .header { background: #1B464D; color: #DEEF4A; padding: 32px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; }
    .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
    .body { background: #FFFFFF; padding: 32px; border-radius: 0 0 12px 12px; }
    .reference { background: #E8F4F0; border: 1px solid #A0B6AC; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px; }
    .reference span { font-size: 20px; font-weight: bold; color: #1B464D; letter-spacing: 1px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E8F4F0; font-size: 14px; }
    .detail-label { color: #36636D; }
    .detail-value { font-weight: 600; color: #171717; }
    .price { text-align: center; padding: 20px; background: #f4f9e8; border: 1px solid #B9E54D; border-radius: 8px; margin: 20px 0; }
    .price .amount { font-size: 28px; font-weight: bold; color: #1B464D; }
    .price .period { font-size: 13px; color: #36636D; }
    .footer { text-align: center; padding: 24px; font-size: 12px; color: #36636D; }
    .btn { display: inline-block; background: #B9E54D; color: #171717; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>NOLI Assurance</h1>
      <p>Votre devis personnalisé</p>
    </div>
    <div class="body">
      <div class="reference">
        <p style="margin: 0 0 4px; font-size: 13px; color: #36636D;">Référence</p>
        <span>${h.reference}</span>
      </div>

      <p style="font-size: 15px; color: #171717; margin: 0 0 20px;">
        Bonjour,<br><br>
        Merci d'avoir utilisé NOLI pour comparer les offres d'assurance.
        Voici un récapitulatif de votre demande de devis${pdf ? " et votre devis en pièce jointe" : ""} :
      </p>

      <div class="detail-row">
        <span class="detail-label">Assureur</span>
        <span class="detail-value">${h.insurerName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Formule</span>
        <span class="detail-value">${h.offerName}${h.contractType ? ` — ${h.contractType}` : ""}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Référence</span>
        <span class="detail-value">${h.reference}</span>
      </div>
      ${h.contactPhone ? `
      <div class="detail-row">
        <span class="detail-label">Téléphone de contact</span>
        <span class="detail-value">${h.contactPhone}</span>
      </div>` : ""}

      <div class="price">
        <p style="margin: 0 0 4px; font-size: 13px; color: #36636D;">Estimation mensuelle</p>
        <div class="amount">${h.formattedPrice} FCFA</div>
        <div class="period">Soit ${h.formattedPrice} FCFA/mois</div>
      </div>

      <p style="font-size: 13px; color: #36636D; margin: 16px 0 0;">
        Un conseiller NOLI vous contactera dans les plus brefs délais
        pour finaliser votre souscription.
      </p>

      <div style="text-align: center; margin-top: 24px;">
        <p style="font-size: 12px; color: #36636D;">
          Cet email est un accusé de réception automatique.<br>
          Merci de ne pas y répondre.
        </p>
      </div>
    </div>
    <div class="footer">
      <p>NOLI Assurance — Comparateur d'assurances en Côte d'Ivoire</p>
      <p>contact@noli.ci | +225 27 00 00 00 00</p>
    </div>
  </div>
</body>
</html>`,
    attachments: pdf
      ? [{ filename: pdf.filename, content: pdf.content }]
      : undefined,
  });
}

/**
 * Envoie un email de notification de demande de rappel au client.
 */
export async function sendCallbackConfirmation(to: string, insurerName: string, preferredTime: string) {
  const h = {
    insurerName: escapeHtml(insurerName),
    preferredTime: escapeHtml(preferredTime),
  };

  return sendMail({
    to,
    subject: `Demande de rappel — ${insurerName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #E8F4F0; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px; }
    .header { background: #1B464D; color: #DEEF4A; padding: 32px; border-radius: 12px 12px 0 0; text-align: center; }
    .body { background: #FFFFFF; padding: 32px; border-radius: 0 0 12px 12px; }
    .footer { text-align: center; padding: 24px; font-size: 12px; color: #36636D; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Demande de rappel</h1>
      <p>${h.insurerName}</p>
    </div>
    <div class="body">
      <p style="font-size: 15px; color: #171717;">
        Votre demande de rappel pour <strong>${h.insurerName}</strong> a bien été prise en compte.
      </p>
      <p style="font-size: 14px; color: #36636D;">
        Créneau demandé : <strong style="color:#1B464D;">${h.preferredTime}</strong>
      </p>
      <p style="font-size: 14px; color: #36636D; margin-top: 16px;">
        Un conseiller vous contactera prochainement sur le numéro que vous avez communiqué.
      </p>
    </div>
    <div class="footer">
      <p>NOLI Assurance — contact@noli.ci</p>
    </div>
  </div>
</body>
</html>`,
  });
}

/** Envoie un lien de reinitialisation pour l'authentification locale. */
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const safeUrl = escapeHtml(resetUrl);
  return sendMail({
    to,
    subject: "Réinitialisation de votre mot de passe NOLI",
    html: `
      <p>Une demande de réinitialisation de mot de passe a été reçue.</p>
      <p><a href="${safeUrl}">Réinitialiser mon mot de passe</a></p>
      <p>Ce lien expire prochainement. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    `,
  });
}
