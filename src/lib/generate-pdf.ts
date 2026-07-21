// ──────────────────────────────────────────────────────────────
// NOLI Assurance — PDF Quote Generator
// Uses jsPDF to generate a downloadable quote PDF
// ──────────────────────────────────────────────────────────────

import { jsPDF } from "jspdf";
import type { PersonalInfo, VehicleInfo, InsurerOffer } from "@/types";

/** Format a number in FCFA */
function fmt(amount: number | null | undefined, suffix = " FCFA"): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("fr-FR").format(amount) + suffix;
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

// ── Colors ──────────────────────────────────────────────────
const PRIMARY = "#1B464D";
const ACCENT = "#B9E54D";
const GRAY = "#6B7280";
const LIGHT_GRAY = "#F3F4F6";

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
 * Generate and download a PDF quote document.
 */
export function downloadQuotePDF(
  personalInfo: PersonalInfo,
  vehicleInfo: VehicleInfo,
  contractType: string,
  offers: InsurerOffer[],
  contractDuration: number
) {
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const pageW = 210; // A4 width in mm
  const margin = 20;
  const contentW = pageW - 2 * margin;
  let y = margin;

  // ═══════════════════ HEADER ═══════════════════
  // Top accent bar
  doc.setFillColor(ACCENT);
  doc.rect(0, 0, pageW, 6, "F");

  // Brand bar
  doc.setFillColor(PRIMARY);
  doc.rect(0, 6, pageW, 18, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("NOLI ASSURANCE", margin, 18);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Comparateur d'assurances en C\u00f4te d'Ivoire", margin, 24);

  // Right side: ref + date
  const ref = `NOLI-${Date.now().toString(36).toUpperCase()}`;
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.setFontSize(9);
  doc.text(`R\u00e9f : ${ref}`, pageW - margin, 16, { align: "right" });
  doc.text(`Date : ${today}`, pageW - margin, 22, { align: "right" });

  y = 30;

  // ═══════════════════ TITLE ═══════════════════
  doc.setTextColor(PRIMARY);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("DEVIS D'ASSURANCE AUTOMOBILE", margin, y);
  y += 10;

  // Accent underline
  doc.setDrawColor(ACCENT);
  doc.setLineWidth(1.5);
  doc.line(margin, y, margin + 60, y);
  y += 8;

  // ═══════════════════ SECTION: INFORMATIONS ═══════════════════
  // ── Personal Info ──
  roundedRect(doc, margin, y, contentW, 36, 3, LIGHT_GRAY);
  doc.setTextColor(PRIMARY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMATIONS PERSONNELLES", margin + 4, y + 6);
  doc.setTextColor("#374151");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(
    `${personalInfo.firstName} ${personalInfo.lastName}`,
    margin + 4,
    y + 14
  );
  doc.text(`Email : ${personalInfo.email}`, margin + 4, y + 20);
  doc.text(`T\u00e9l\u00e9phone : +225 ${personalInfo.phone}`, margin + 4, y + 26);
  y += 42;

  // ── Vehicle Info ──
  roundedRect(doc, margin, y, contentW, 42, 3, LIGHT_GRAY);
  doc.setTextColor(PRIMARY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMATIONS V\u00c9HICULE", margin + 4, y + 6);
  doc.setTextColor("#374151");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  const vLines = [
    `Carburant : ${FUEL_LABELS[vehicleInfo.fuelType] || vehicleInfo.fuelType}`,
    `Puissance fiscale : ${vehicleInfo.fiscalPower} CV`,
    `Places : ${vehicleInfo.seats}`,
    `Mise en circulation : ${vehicleInfo.year}`,
  ];
  const vLines2 = [
    `Valeur neuve : ${fmt(Number(vehicleInfo.newValue))}`,
    `Valeur actuelle : ${fmt(Number(vehicleInfo.currentValue))}`,
    `Usage : ${USAGE_LABELS[vehicleInfo.usage] || vehicleInfo.usage}`,
    `Dur\u00e9e : ${contractDuration} mois`,
  ];

  vLines.forEach((line, i) => {
    doc.text(line, margin + 4, y + 14 + i * 6);
  });
  vLines2.forEach((line, i) => {
    doc.text(line, margin + contentW / 2 + 4, y + 14 + i * 6);
  });
  y += 48;

  // ── Contract Type ──
  const ctLabel = CONTRACT_LABELS[contractType] || contractType || "Non sp\u00e9cifi\u00e9";
  roundedRect(doc, margin, y, contentW, 14, 3, ACCENT + "30");
  doc.setTextColor(PRIMARY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TYPE DE CONTRAT", margin + 4, y + 10);
  doc.setTextColor("#374151");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(ctLabel, margin + contentW / 2 + 4, y + 10);
  y += 20;

  // ═══════════════════ SECTION: OFFERS ═══════════════════
  doc.setTextColor(PRIMARY);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("OFFRES DISPONIBLES", margin, y);
  y += 6;
  doc.setDrawColor(ACCENT);
  doc.setLineWidth(1.5);
  doc.line(margin, y, margin + 50, y);
  y += 8;

  if (offers.length === 0) {
    doc.setTextColor(GRAY);
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("Aucune offre trouv\u00e9e pour vos crit\u00e8res.", margin, y + 10);
    y += 20;
  } else {
    // Table header
    const colX = [margin, margin + 55, margin + 105, margin + 145];
    const colW = [50, 45, 35, 40];

    // Header row
    roundedRect(doc, margin, y, contentW, 8, 2, PRIMARY);
    doc.setTextColor("#FFFFFF");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    const headers = ["Assureur", "Formule", "Mensuel", "Annuel"];
    headers.forEach((h, i) => {
      doc.text(h, colX[i] + 3, y + 5.5);
    });
    y += 10;

    // Offer rows
    offers.slice(0, 8).forEach((offer, idx) => {
      const rowH = 8;
      const isEven = idx % 2 === 0;
      if (isEven) {
        roundedRect(doc, margin, y, contentW, rowH, 1, LIGHT_GRAY);
      }
      doc.setTextColor("#374151");
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");

      // Ensure insurer name fits
      const name =
        offer.insurerName.length > 18
          ? offer.insurerName.slice(0, 16) + "..."
          : offer.insurerName;
      doc.text(name, colX[0] + 3, y + 5.5);
      doc.text(offer.coverageType, colX[1] + 3, y + 5.5);
      doc.text(fmt(offer.monthlyPrice, ""), colX[2] + 3, y + 5.5);
      doc.text(fmt(offer.annualPrice, ""), colX[3] + 3, y + 5.5);

      // Add monthly suffix
      doc.setFontSize(6);
      doc.setTextColor(GRAY);
      doc.text("FCFA/mois", colX[2] + 3 + doc.getTextWidth(fmt(offer.monthlyPrice, "")) + 1, y + 5.5);
      doc.text("FCFA/an", colX[3] + 3 + doc.getTextWidth(fmt(offer.annualPrice, "")) + 1, y + 5.5);

      y += rowH + 1;
    });

    y += 4;

    // Best offer highlight
    if (offers.length > 0) {
      const best = [...offers].sort((a, b) => a.annualPrice - b.annualPrice)[0];
      roundedRect(doc, margin, y, contentW, 12, 3, ACCENT + "40");
      doc.setTextColor(PRIMARY);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("MEILLEURE OFFRE", margin + 4, y + 8);
      doc.setTextColor("#374151");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(
        `${best.insurerName} - ${fmt(best.annualPrice)}/an`,
        margin + contentW / 2 + 4,
        y + 8
      );
      y += 18;
    }
  }

  // ═══════════════════ FOOTER ═══════════════════
  // Check if we need a new page
  if (y > 240) {
    doc.addPage();
    y = margin;
  }

  // Bottom bar
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
  doc.text(
    "Contact : contact@noli.ci | +225 27 00 00 00 00",
    margin,
    footerY + 13
  );
  doc.text(
    "Ce document est un devis indicatif sans valeur contractuelle.",
    pageW - margin,
    footerY + 13,
    { align: "right" }
  );

  // ═══════════════════ DOWNLOAD ═══════════════════
  doc.save(`NOLI-Devis-${ref}.pdf`);
}
