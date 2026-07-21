import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

function parseJsonField<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Le paramètre userId est requis" },
        { status: 400 }
      );
    }

    const quote = await db.quote.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        category: { select: { id: true, name: true, description: true } },
        offer: {
          include: {
            insurer: { select: { id: true, code: true, name: true, logoUrl: true, contactEmail: true, phone: true, website: true } },
            category: { select: { id: true, name: true } },
          },
        },
        coverageLines: {
          include: {
            coverage: { select: { id: true, code: true, name: true, type: true, description: true, isMandatory: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: "Devis introuvable" },
        { status: 404 }
      );
    }

    // Auth check: ensure the quote belongs to the requesting user
    if (quote.userId !== userId) {
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
      createdAt: quote.createdAt.toISOString(),
      updatedAt: quote.updatedAt.toISOString(),
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