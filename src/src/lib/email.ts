import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY || "";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

const FROM_EMAIL = process.env.EMAIL_FROM || "NOLI Assurance <devis@noli.ci>";

export interface QuoteEmailParams {
  to: string;
  reference: string;
  insurerName: string;
  offerName: string;
  estimatedPrice: number;
  contactPhone?: string;
  contractType?: string;
}

/**
 * Envoie un email de confirmation de devis au client.
 */
export async function sendQuoteConfirmation(params: QuoteEmailParams) {
  if (!resend) {
    console.warn("[email] Resend non configuré — clé API manquante");
    return { success: false, error: "Resend non configuré" };
  }

  const { to, reference, insurerName, offerName, estimatedPrice, contactPhone, contractType } = params;

  const formattedPrice = new Intl.NumberFormat("fr-FR").format(estimatedPrice);

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `🔷 Votre devis NOLI ${reference} — ${insurerName}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f4f6f9; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px; }
    .header { background: linear-gradient(135deg, #2563eb, #1e40af); color: white; padding: 32px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; }
    .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
    .body { background: white; padding: 32px; border-radius: 0 0 12px 12px; }
    .reference { background: #f0f4ff; border: 1px solid #dbeafe; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px; }
    .reference span { font-size: 20px; font-weight: bold; color: #2563eb; letter-spacing: 1px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .detail-label { color: #64748b; }
    .detail-value { font-weight: 600; color: #1e293b; }
    .price { text-align: center; padding: 20px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; margin: 20px 0; }
    .price .amount { font-size: 28px; font-weight: bold; color: #16a34a; }
    .price .period { font-size: 13px; color: #64748b; }
    .footer { text-align: center; padding: 24px; font-size: 12px; color: #94a3b8; }
    .btn { display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔷 NOLI Assurance</h1>
      <p>Votre devis personnalisé</p>
    </div>
    <div class="body">
      <div class="reference">
        <p style="margin: 0 0 4px; font-size: 13px; color: #64748b;">Référence</p>
        <span>${reference}</span>
      </div>

      <p style="font-size: 15px; color: #1e293b; margin: 0 0 20px;">
        Bonjour,<br><br>
        Merci d'avoir utilisé NOLI pour comparer les offres d'assurance.
        Voici un récapitulatif de votre demande de devis :
      </p>

      <div class="detail-row">
        <span class="detail-label">Assureur</span>
        <span class="detail-value">${insurerName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Formule</span>
        <span class="detail-value">${offerName}${contractType ? ` — ${contractType}` : ""}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Référence</span>
        <span class="detail-value">${reference}</span>
      </div>
      ${contactPhone ? `
      <div class="detail-row">
        <span class="detail-label">Téléphone de contact</span>
        <span class="detail-value">${contactPhone}</span>
      </div>` : ""}

      <div class="price">
        <p style="margin: 0 0 4px; font-size: 13px; color: #64748b;">Estimation mensuelle</p>
        <div class="amount">${formattedPrice} FCFA</div>
        <div class="period">Soit ${formattedPrice} FCFA/mois</div>
      </div>

      <p style="font-size: 13px; color: #64748b; margin: 16px 0 0;">
        Un conseiller NOLI vous contactera dans les plus brefs délais
        pour finaliser votre souscription.
      </p>

      <div style="text-align: center; margin-top: 24px;">
        <p style="font-size: 12px; color: #94a3b8;">
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
    });

    if (error) {
      console.error("[email] Erreur Resend:", error);
      return { success: false, error };
    }

    console.log("[email] Email envoyé avec succès →", to, "| ref:", reference);
    return { success: true, data };
  } catch (err) {
    console.error("[email] Exception:", err);
    return { success: false, error: err };
  }
}

/**
 * Envoie un email de notification de demande de rappel au client.
 */
export async function sendCallbackConfirmation(to: string, insurerName: string, preferredTime: string) {
  if (!resend) {
    console.warn("[email] Resend non configuré — clé API manquante");
    return { success: false, error: "Resend non configuré" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `📞 Demande de rappel — ${insurerName}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f4f6f9; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px; }
    .header { background: linear-gradient(135deg, #2563eb, #1e40af); color: white; padding: 32px; border-radius: 12px 12px 0 0; text-align: center; }
    .body { background: white; padding: 32px; border-radius: 0 0 12px 12px; }
    .footer { text-align: center; padding: 24px; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📞 Demande de rappel</h1>
      <p>${insurerName}</p>
    </div>
    <div class="body">
      <p style="font-size: 15px; color: #1e293b;">
        Votre demande de rappel pour <strong>${insurerName}</strong> a bien été prise en compte.
      </p>
      <p style="font-size: 14px; color: #64748b;">
        Créneau demandé : <strong>${preferredTime}</strong>
      </p>
      <p style="font-size: 14px; color: #64748b; margin-top: 16px;">
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

    if (error) {
      console.error("[email] Erreur envoi confirmation rappel:", error);
      return { success: false, error };
    }

    console.log("[email] Confirmation rappel envoyée →", to);
    return { success: true, data };
  } catch (err) {
    console.error("[email] Exception rappel:", err);
    return { success: false, error: err };
  }
}
