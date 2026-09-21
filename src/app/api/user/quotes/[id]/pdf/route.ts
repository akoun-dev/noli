import { db, mapRow } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth-guard";
import { generateQuotePDFBuffer } from "@/lib/generate-pdf";
import type { PersonalInfo, VehicleInfo, InsurerOffer } from "@/types";

function parseJsonField<T>(value: string | null, fallback: T): T {
  try {
    return JSON.parse(value || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

type QuotePdfRow = {
  userId: string;
  reference: string;
  estimatedPrice: number | null;
  finalPrice: number | null;
  personalData: string | null;
  vehicleData: string | null;
  coverageRequirements: string | null;
  offer: {
    name: string | null;
    description: string | null;
    deductible: number | null;
    coverageAmount: number | null;
    contractType: string | null;
    features: string | null;
    insurer: { id: string; name: string | null } | null;
  } | null;
};

/**
 * Télécharge le devis d'un utilisateur au format PDF.
 * Le devis est reconstruit depuis les données stockées (personal_data,
 * vehicle_data, offre liée) puis rendu via le même générateur que la
 * pièce jointe des emails. Contrôle d'appartenance strict (anti-IDOR) :
 * seul le propriétaire du devis peut le télécharger.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionProfile = await getSessionProfile();
    if (!sessionProfile) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const { id } = await params;

    const { data, error } = await db
      .from("quotes")
      .select(
        "user_id, reference, estimatedPrice:estimated_price, finalPrice:final_price, personalData:personal_data, vehicleData:vehicle_data, coverageRequirements:coverage_requirements, offer:insurance_offers(name, description, deductible, coverageAmount:coverage_amount, contractType:contract_type, features, insurer:insurers(id, name))"
      )
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    const quote = mapRow<QuotePdfRow>(data);

    if (!quote) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }

    // Anti-IDOR : l'identité vient de la session, jamais d'un paramètre client.
    if (quote.userId !== sessionProfile.id) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à consulter ce devis" },
        { status: 403 }
      );
    }

    const personalInfo = parseJsonField<Partial<PersonalInfo>>(quote.personalData, {});
    const vehicleInfo = parseJsonField<Partial<VehicleInfo>>(quote.vehicleData, {});
    const coverage = parseJsonField<Record<string, unknown>>(quote.coverageRequirements, {});

    // Prix stocké = mensuel ; on en déduit l'annuel pour le PDF.
    const monthlyPrice = Math.max(0, Math.round(quote.finalPrice ?? quote.estimatedPrice ?? 0));
    const contractType =
      quote.offer?.contractType ||
      (typeof coverage.contractType === "string" ? coverage.contractType : "") ||
      "basic";
    const contractDuration =
      typeof coverage.contractDuration === "number" ? coverage.contractDuration : 12;

    const offers: InsurerOffer[] = quote.offer
      ? [
          {
            id: quote.offer.insurer?.id || quote.reference,
            insurerId: quote.offer.insurer?.id || "",
            insurerName: quote.offer.insurer?.name || "Assureur",
            insurerLogo: null,
            insurerRating: 0,
            name: quote.offer.name || "Offre",
            coverageType: contractType,
            description: quote.offer.description || null,
            monthlyPrice,
            annualPrice: monthlyPrice * 12,
            contractDuration,
            deductible: quote.offer.deductible || 0,
            maxCoverage: quote.offer.coverageAmount || 0,
            features: parseJsonField<string[]>(quote.offer.features, []),
            conditions: null,
          },
        ]
      : [];

    const pdf = generateQuotePDFBuffer(
      personalInfo as PersonalInfo,
      vehicleInfo as VehicleInfo,
      contractType,
      offers,
      contractDuration,
      quote.reference
    );

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="NOLI-Devis-${quote.reference}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Erreur user/quotes/[id]/pdf:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF" },
      { status: 500 }
    );
  }
}
