// ──────────────────────────────────────────────────────────────
// NOLI Assurance — PDF Quote Generator
// Uses jsPDF to generate a downloadable quote PDF
// ──────────────────────────────────────────────────────────────

import { jsPDF } from "jspdf";
import type { PersonalInfo, VehicleInfo, InsurerOffer } from "@/types";
import { parseFCFA } from "@/lib/utils";

/** Format a number in FCFA (exporté pour tests de régression du séparateur). */
export function fmt(amount: number | null | undefined, suffix = " FCFA"): string {
  if (amount == null) return "—";
  // Intl.NumberFormat("fr-FR") sépare les milliers par une ESPACE FINE
  // INSÉCABLE (U+202F) — absente des polices standard de jsPDF, elle s'affiche
  // alors comme un « ¥ »/carré (ex. « 2¥075¥000 »). On la remplace, ainsi que
  // l'espace insécable normale (U+00A0), par une espace ASCII rendue correctement.
  return new Intl.NumberFormat("fr-FR").format(amount).replace(/[  ]/g, " ") + suffix;
}

/** Contract type label map */
const CONTRACT_LABELS: Record<string, string> = {
  basic: "Tiers",
  third_party_plus: "Tiers+",
  all_risks: "Tous Risques",
};

/** Usage label map */
const USAGE_LABELS: Record<string, string> = {
  personnel: "Personnel",
  professionnel: "Professionnel",
  taxi_vtc: "Taxi / VTC",
  autre: "Autre",
};

/** Fuel label map */
const FUEL_LABELS: Record<string, string> = {
  essence: "Essence",
  diesel: "Diesel",
};

// ── Couleurs ────────────────────────────────────────────────
const PRIMARY = "#1B464D";
const ACCENT = "#B9E54D";
const ACCENT_SOFT = "#EDF6C3";
const INK = "#16282D";
const MUTED = "#64748B";
const CARD = "#F3F8F7";
const LINE = "#DDE7E4";
const GRAY = "#6B7280";
const LIGHT_GRAY = "#F3F4F6";

// ── Layout (A4) ─────────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const FOOTER_Y = 282;

/**
 * Draw a filled rectangle with rounded corners (approximation using lines)
 */
function roundedRect(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string
) {
  doc.setFillColor(color);
  doc.roundedRect(x, y, w, h, r, r, "F");
}

/**
 * Dessine le pied de page (barre sombre + mentions) sur toutes les pages.
 */
function drawFooter(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFillColor(ACCENT);
    doc.rect(0, FOOTER_Y, PAGE_W, 1.2, "F");
    doc.setFillColor(PRIMARY);
    doc.rect(0, FOOTER_Y + 1.2, PAGE_W, PAGE_H - FOOTER_Y - 1.2, "F");
    doc.setTextColor("#FFFFFF");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("NOLI Assurance — Comparateur d'assurances en C\u00f4te d'Ivoire", MARGIN, FOOTER_Y + 6.5);
    doc.text("contact@noli.ci | +225 27 00 00 00 00", MARGIN, FOOTER_Y + 11.5);
    doc.text(`Page ${p} / ${pages}`, PAGE_W - MARGIN, FOOTER_Y + 6.5, { align: "right" });
    doc.text("Devis indicatif sans valeur contractuelle", PAGE_W - MARGIN, FOOTER_Y + 11.5, { align: "right" });
  }
}

/**
 * Ligne label / valeur alignée à droite (cartes d'information).
 */
function rowValue(doc: jsPDF, x: number, baseline: number, label: string, value: string, rightEdge: number) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(MUTED);
  doc.text(label, x, baseline);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(INK);
  doc.text(value, rightEdge, baseline, { align: "right" });
}

/**
 * Build the PDF quote document (partagé entre le téléchargement client
 * et la pièce jointe des emails serveur).
 */
function buildQuoteDoc(
  personalInfo: PersonalInfo,
  vehicleInfo: VehicleInfo,
  contractType: string,
  offers: InsurerOffer[],
  contractDuration: number,
  reference?: string
) {
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const pageW = PAGE_W;
  const margin = MARGIN;
  const contentW = PAGE_W - 2 * MARGIN;
  const ref = reference || `NOLI-${Date.now().toString(36).toUpperCase()}`;
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const ctLabel = CONTRACT_LABELS[contractType] || contractType || "Non sp\u00e9cifi\u00e9";

  let y = MARGIN;

  function ensureSpace(needed: number) {
    if (y + needed > FOOTER_Y - 10) {
      doc.addPage();
      y = MARGIN;
    }
  }

  function sectionTitle(title: string) {
    ensureSpace(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(PRIMARY);
    doc.text(title.toUpperCase(), margin, y);
    doc.setDrawColor(ACCENT);
    doc.setLineWidth(1);
    doc.line(margin, y + 2, margin + 34, y + 2);
    y += 8;
  }

  // ═══════════════════ HEADER ═══════════════════
  // Fine barre lime + bande marque sombre
  doc.setFillColor(ACCENT);
  doc.rect(0, 0, pageW, 4, "F");
  doc.setFillColor(PRIMARY);
  doc.rect(0, 4, pageW, 28, "F");

  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("NOLI ASSURANCE", margin, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(ACCENT);
  doc.text("Comparateur d'assurances en C\u00f4te d'Ivoire", margin, 24);

  // Badge référence (lime) à droite
  const refLabel = `R\u00c9F : ${ref}`;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  const badgeW = doc.getTextWidth(refLabel) + 14;
  doc.setFillColor(ACCENT);
  doc.roundedRect(pageW - margin - badgeW, 10, badgeW, 7, 3.5, 3.5, "F");
  doc.setTextColor(PRIMARY);
  doc.text(refLabel, pageW - margin - 7, 15, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor("#FFFFFF");
  doc.setFontSize(8);
  doc.text(today, pageW - margin, 27, { align: "right" });

  y = 42;

  // ═══════════════════ TITRE ═══════════════════
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(PRIMARY);
  doc.text("DEVIS D'ASSURANCE AUTOMOBILE", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(MUTED);
  doc.text("Valable 30 jours", pageW - margin, y, { align: "right" });
  doc.setDrawColor(ACCENT);
  doc.setLineWidth(1.2);
  doc.line(margin, y + 3, margin + 66, y + 3);
  y += 12;

  // ═══════════════════ OFFRE ═══════════════════
  sectionTitle("Votre offre");

  if (offers.length === 0) {
    ensureSpace(10);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(MUTED);
    doc.text("Aucune offre trouv\u00e9e pour vos crit\u00e8res.", margin, y);
    y += 14;
  } else if (offers.length === 1) {
    // ── Carte d'offre (email : offre sélectionnée) ──
    const offer = offers[0];
    ensureSpace(36);
    roundedRect(doc, margin, y, contentW, 34, 4, CARD);
    doc.setFillColor(ACCENT);
    doc.rect(margin, y, 2.5, 34, "F");

    const leftX = margin + 9;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(PRIMARY);
    doc.text("OFFRE S\u00c9LECTIONN\u00c9E", leftX, y + 7);

    doc.setFontSize(13);
    doc.setTextColor(INK);
    doc.text(offer.insurerName, leftX, y + 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(MUTED);
    doc.text(offer.name || offer.coverageType, leftX, y + 20);

    // Pastille type de contrat
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    const pillW = doc.getTextWidth(ctLabel) + 10;
    doc.setFillColor(ACCENT);
    doc.roundedRect(leftX, y + 23.5, pillW, 6, 3, 3, "F");
    doc.setTextColor(PRIMARY);
    doc.text(ctLabel, leftX + 5, y + 28);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(MUTED);
    doc.text(`Dur\u00e9e : ${contractDuration} mois`, leftX + pillW + 6, y + 28);

    // Bloc prix
    const blockRight = pageW - margin - 8;
    const blockLeft = pageW - margin - 64;
    doc.setDrawColor(LINE);
    doc.setLineWidth(0.4);
    doc.line(blockLeft, y + 6, blockLeft, y + 28);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(PRIMARY);
    doc.text("ESTIMATION ANNUELLE", blockRight, y + 9, { align: "right" });

    doc.setFontSize(16);
    doc.text(`${fmt(offer.annualPrice, "")} FCFA`, blockRight, y + 18, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(MUTED);
    doc.text(`Soit ${fmt(offer.monthlyPrice, "")} FCFA / mois`, blockRight, y + 25, { align: "right" });

    y += 38;
  } else {
    // ── Tableau comparatif (téléchargement multi-offres) ──
    ensureSpace(12);
    const colA = margin + 8;                 // assureur (gauche)
    const colB = margin + 64;                // formule (gauche)
    const colC = margin + 128;               // mensuel (droite)
    const colD = pageW - margin - 8;         // annuel (droite)

    roundedRect(doc, margin, y, contentW, 9, 2, PRIMARY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor("#FFFFFF");
    doc.text("ASSUREUR", colA, y + 6);
    doc.text("FORMULE", colB, y + 6);
    doc.text("MENSUEL", colC, y + 6, { align: "right" });
    doc.text("ANNUEL", colD, y + 6, { align: "right" });
    y += 11;

    const best = [...offers].sort((a, b) => a.annualPrice - b.annualPrice)[0];
    const visible = offers.slice(0, 8);
    visible.forEach((offer, idx) => {
      ensureSpace(9);
      const isBest = offer === best;
      roundedRect(doc, margin, y, contentW, 8, 1, isBest ? ACCENT_SOFT : idx % 2 === 0 ? CARD : "#FFFFFF");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(INK);
      const name = offer.insurerName.length > 20 ? offer.insurerName.slice(0, 18) + "..." : offer.insurerName;
      doc.text(name, colA, y + 5.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(MUTED);
      const formula = CONTRACT_LABELS[offer.coverageType] || offer.coverageType || "—";
      doc.text(formula.length > 18 ? formula.slice(0, 16) + "..." : formula, colB, y + 5.5);
      doc.setTextColor(INK);
      doc.text(fmt(offer.monthlyPrice, "") + " FCFA", colC, y + 5.5, { align: "right" });
      doc.text(fmt(offer.annualPrice, "") + " FCFA", colD, y + 5.5, { align: "right" });
      y += 9;
    });

    y += 2;
    ensureSpace(11);
    roundedRect(doc, margin, y, contentW, 11, 3, ACCENT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(PRIMARY);
    doc.text("MEILLEURE OFFRE", margin + 8, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(INK);
    doc.text(`${best.insurerName} — ${fmt(best.annualPrice)} / an`, pageW - margin - 8, y + 7, { align: "right" });
    y += 13;
  }

  // ═══════════════════ SITUATION ═══════════════════
  sectionTitle("Votre situation");
  ensureSpace(62);
  const boxW = (contentW - 6) / 2;
  const boxH = 58;
  const gap = 6;

  // ── VÉHICULE ──
  const vx = margin;
  roundedRect(doc, vx, y, boxW, boxH, 4, CARD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(PRIMARY);
  doc.text("V\u00c9HICULE", vx + 8, y + 9);
  doc.setDrawColor(ACCENT);
  doc.setLineWidth(0.8);
  doc.line(vx + 8, y + 11.5, vx + boxW - 8, y + 11.5);

  const vRows: Array<[string, string]> = [
    ["Carburant", FUEL_LABELS[vehicleInfo.fuelType] || vehicleInfo.fuelType || "—"],
    ["Puissance fiscale", `${vehicleInfo.fiscalPower ?? "—"} CV`],
    ["Nombre de places", vehicleInfo.seats ?? "—"],
    ["Mise en circulation", vehicleInfo.year ?? "—"],
    ["Usage", USAGE_LABELS[vehicleInfo.usage] || vehicleInfo.usage || "—"],
    ["Valeur neuve", fmt(parseFCFA(vehicleInfo.newValue))],
    ["Valeur actuelle", fmt(parseFCFA(vehicleInfo.currentValue))],
    ["Dur\u00e9e du contrat", `${contractDuration} mois`],
  ];
  vRows.forEach(([label, value], i) => {
    rowValue(doc, vx + 8, y + 19 + i * 5.3, label, value, vx + boxW - 8);
  });

  // ── ASSURÉ ──
  const ax = margin + boxW + gap;
  roundedRect(doc, ax, y, boxW, boxH, 4, CARD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(PRIMARY);
  doc.text("ASSUR\u00c9", ax + 8, y + 9);
  doc.setDrawColor(ACCENT);
  doc.setLineWidth(0.8);
  doc.line(ax + 8, y + 11.5, ax + boxW - 8, y + 11.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(INK);
  doc.text(`${personalInfo.firstName} ${personalInfo.lastName}`, ax + 8, y + 20);
  doc.setFont("helvetica", "normal");
  const aRows: Array<[string, string]> = [
    ["Email", personalInfo.email || "—"],
    ["T\u00e9l\u00e9phone", `+225 ${String(personalInfo.phone || "").replace(/^\+225\s*/, "")}`],
  ];
  aRows.forEach(([label, value], i) => {
    rowValue(doc, ax + 8, y + 32 + i * 6.5, label, value, ax + boxW - 8);
  });
  y += boxH + 8;

  // ═══════════════════ GARANTIES ═══════════════════
  const features = offers.length === 1 ? offers[0].features || [] : [];
  if (features.length > 0) {
    sectionTitle("Garanties couvertes");
    const half = Math.ceil(features.length / 2);
    const maxW = contentW / 2 - 14;
    features.forEach((feature, i) => {
      const col = i < half ? 0 : 1;
      const row = i < half ? i : i - half;
      ensureSpace(7);
      const bx = margin + (col === 0 ? 0 : contentW / 2 + 6);
      const by = y + row * 6.5;
      doc.setFillColor(ACCENT);
      doc.roundedRect(bx, by - 1.5, 1.6, 1.6, 0.4, 0.4, "F");
      const line = doc.splitTextToSize(feature, maxW)[0] || feature;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(INK);
      doc.text(line, bx + 4, by);
    });
    y += half * 6.5 + 4;
  }

  // ═══════════════════ PIED DE PAGE ═══════════════════
  drawFooter(doc);

  return { doc, ref };
}

/**
 * Generate and download a PDF quote document (côté client).
 */
export function downloadQuotePDF(
  personalInfo: PersonalInfo,
  vehicleInfo: VehicleInfo,
  contractType: string,
  offers: InsurerOffer[],
  contractDuration: number
) {
  const { doc, ref } = buildQuoteDoc(personalInfo, vehicleInfo, contractType, offers, contractDuration);
  doc.save(`NOLI-Devis-${ref}.pdf`);
}

/**
 * Generate the PDF quote as a buffer (côté serveur) — utilisé en pièce
 * jointe des emails. `reference` doit correspondre au devis en base.
 */
export function generateQuotePDFBuffer(
  personalInfo: PersonalInfo,
  vehicleInfo: VehicleInfo,
  contractType: string,
  offers: InsurerOffer[],
  contractDuration: number,
  reference?: string
): Uint8Array {
  const { doc } = buildQuoteDoc(personalInfo, vehicleInfo, contractType, offers, contractDuration, reference);
  return new Uint8Array(doc.output("arraybuffer"));
}

// ── Attestation d'assurance ──────────────────────────────────────────────────

export interface AttestationContract {
  reference: string;
  insurerName: string;
  offerName: string | null;
  premium: number | null;
  startDate: string | null;
  endDate: string | null;
  clientName?: string;
}

/**
 * Generate and download an insurance attestation (certificate) PDF.
 */
export function downloadAttestationPDF(contract: AttestationContract) {
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const pageW = 210; // A4 width in mm
  const margin = 20;
  const contentW = pageW - 2 * margin;
  let y = margin;

  // ═══════════════════ HEADER ═══════════════════
  doc.setFillColor(ACCENT);
  doc.rect(0, 0, pageW, 6, "F");
  doc.setFillColor(PRIMARY);
  doc.rect(0, 6, pageW, 18, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("NOLI ASSURANCE", margin, 18);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Comparateur d'assurances en C\u00f4te d'Ivoire", margin, 24);

  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.setFontSize(9);
  doc.text(`Date : ${today}`, pageW - margin, 16, { align: "right" });
  doc.text(`R\u00e9f : ${contract.reference}`, pageW - margin, 22, { align: "right" });

  y = 32;

  // ═══════════════════ TITLE ═══════════════════
  doc.setTextColor(PRIMARY);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("ATTESTATION D'ASSURANCE", margin, y);
  y += 8;
  doc.setDrawColor(ACCENT);
  doc.setLineWidth(1.5);
  doc.line(margin, y, margin + 80, y);
  y += 14;

  // ═══════════════════ CONTRACT INFO ═══════════════════
  roundedRect(doc, margin, y, contentW, 44, 3, LIGHT_GRAY);
  doc.setTextColor(PRIMARY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMATIONS DU CONTRAT", margin + 4, y + 7);
  doc.setTextColor("#374151");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`R\u00e9f\u00e9rence : ${contract.reference}`, margin + 4, y + 16);
  doc.text(`Assureur : ${contract.insurerName}`, margin + 4, y + 23);
  doc.text(`Formule : ${contract.offerName || "Non sp\u00e9cifi\u00e9"}`, margin + contentW / 2 + 4, y + 16);
  doc.text(`Prime : ${fmt(contract.premium)}`, margin + contentW / 2 + 4, y + 23);
  if (contract.clientName) {
    doc.text(`Assur\u00e9 : ${contract.clientName}`, margin + 4, y + 30);
  }
  y += 50;

  // ═══════════════════ VALIDITY ═══════════════════
  doc.setTextColor(PRIMARY);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("P\u00c9RIODE DE VALIDIT\u00c9", margin, y);
  y += 6;
  doc.setDrawColor(ACCENT);
  doc.setLineWidth(1.5);
  doc.line(margin, y, margin + 55, y);
  y += 10;

  roundedRect(doc, margin, y, contentW, 26, 3, ACCENT_SOFT);
  doc.setTextColor(PRIMARY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Du", margin + 6, y + 12);
  doc.text("Au", margin + 70, y + 12);
  doc.setTextColor("#374151");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    contract.startDate
      ? new Date(contract.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
      : "—",
    margin + 16,
    y + 12
  );
  doc.text(
    contract.endDate
      ? new Date(contract.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
      : "—",
    margin + 86,
    y + 12
  );
  y += 34;

  // ═══════════════════ FOOTER ═══════════════════
  if (y > 230) {
    doc.addPage();
    y = margin;
  }

  doc.setTextColor(GRAY);
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  const note =
    "La pr\u00e9sente attestation certifie qu'un contrat d'assurance est actif pour la p\u00e9riode mentionn\u00e9e ci-dessus. " +
    "Elle n'engage la compagnie que dans les limites des conditions g\u00e9n\u00e9rales et particuli\u00e8res du contrat.";
  const lines = doc.splitTextToSize(note, contentW);
  doc.text(lines, margin, y);

  const footerY = 280;
  doc.setFillColor(PRIMARY);
  doc.rect(0, footerY, pageW, 17, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(
    "NOLI Assurance - Comparateur d'assurances en C\u00f4te d'Ivoire",
    margin,
    footerY + 7
  );
  doc.text("Contact : contact@noli.ci | +225 27 00 00 00 00", margin, footerY + 13);
  doc.text(
    "Attestation d'assurance - document non n\u00e9gociable.",
    pageW - margin,
    footerY + 13,
    { align: "right" }
  );

  doc.save(`${contract.reference}-Attestation.pdf`);
}
