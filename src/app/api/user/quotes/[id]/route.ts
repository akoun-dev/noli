import { db, mapRow } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth-guard";

function parseJsonField<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

type QuoteDetail = {
  id: string;
  userId: string;
  reference: string;
  status: string;
  estimatedPrice: number | null;
  finalPrice: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  vehicleData: string;
  personalData: string;
  coverageRequirements: string;
  category: { id: string; name: string; description: string | null } | null;
  offer: {
    id: string;
    name: string;
    description: string | null;
    priceMin: number | null;
    priceMax: number | null;
    coverageAmount: number | null;
    deductible: number | null;
    contractType: string | null;
    features: string;
    category: { id: string; name: string } | null;
    insurer: {
      id: string;
      code: string;
      name: string;
      logoUrl: string | null;
      contactEmail: string | null;
      phone: string | null;
      website: string | null;
    } | null;
  } | null;
  coverageLines: Array<{
    id: string;
    premiumAmount: number | null;
    calculationParameters: string;
    isIncluded: boolean;
    isMandatory: boolean;
    coverage: {
      id: string;
      code: string;
      name: string;
      type: string;
      description: string | null;
      isMandatory: boolean;
    };
  }>;
};

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
        "*, user:profiles(id, firstName:first_name, lastName:last_name, email, phone), category:insurance_categories(id, name, description), offer:insurance_offers(id, name, description, priceMin:price_min, priceMax:price_max, coverageAmount:coverage_amount, deductible, contractType:contract_type, features, insurer:insurers(id, code, name, logoUrl:logo_url, contactEmail:contact_email, phone, website), category:insurance_categories(id, name)), coverageLines:quote_coverages(id, premiumAmount:premium_amount, calculationParameters:calculation_parameters, isIncluded:is_included, isMandatory:is_mandatory, coverage:coverages(id, code, name, type, description, isMandatory:is_mandatory))"
      )
      .eq("id", id)
      .order("created_at", { ascending: true, referencedTable: "coverageLines" })
      .maybeSingle();
    if (error) throw error;
    const quote = mapRow<QuoteDetail>(data);

    if (!quote) {
      return NextResponse.json(
        { error: "Devis introuvable" },
        { status: 404 }
      );
    }

    // Auth check: ensure the quote belongs to the requesting user (session)
    if (quote.userId !== sessionProfile.id) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à consulter ce devis" },
        { status: 403 }
      );
    }

    const formatted = {
      id: quote.id,
      reference: quote.reference,
      status: quote.status,
      estimatedPrice: quote.estimatedPrice,
      finalPrice: quote.finalPrice,
      notes: quote.notes,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
      vehicleData: parseJsonField(quote.vehicleData, {}),
      personalData: parseJsonField(quote.personalData, {}),
      coverageRequirements: parseJsonField(quote.coverageRequirements, {}),
      category: quote.category
        ? { id: quote.category.id, name: quote.category.name, description: quote.category.description }
        : null,
      offer: quote.offer
        ? {
            id: quote.offer.id,
            name: quote.offer.name,
            description: quote.offer.description,
            priceMin: quote.offer.priceMin,
            priceMax: quote.offer.priceMax,
            coverageAmount: quote.offer.coverageAmount,
            deductible: quote.offer.deductible,
            contractType: quote.offer.contractType,
            features: parseJsonField<string[]>(quote.offer.features, []),
            category: quote.offer.category
              ? { id: quote.offer.category.id, name: quote.offer.category.name }
              : null,
            insurer: quote.offer.insurer
              ? {
                  id: quote.offer.insurer.id,
                  code: quote.offer.insurer.code,
                  name: quote.offer.insurer.name,
                  logoUrl: quote.offer.insurer.logoUrl,
                  contactEmail: quote.offer.insurer.contactEmail,
                  phone: quote.offer.insurer.phone,
                  website: quote.offer.insurer.website,
                }
              : null,
          }
        : null,
      coverageLines: quote.coverageLines.map((line) => ({
        id: line.id,
        premiumAmount: line.premiumAmount,
        calculationParameters: parseJsonField(line.calculationParameters, {}),
        isIncluded: line.isIncluded,
        isMandatory: line.isMandatory,
        coverage: {
          id: line.coverage.id,
          code: line.coverage.code,
          name: line.coverage.name,
          type: line.coverage.type,
          description: line.coverage.description,
          isMandatory: line.coverage.isMandatory,
        },
      })),
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Erreur user/quotes/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement du devis" },
      { status: 500 }
    );
  }
}
