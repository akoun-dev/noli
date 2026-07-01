import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

function parseQuoteOffer(offer: {
  features: string;
  guaranteeLinks: Array<{
    guarantee: {
      rateConditions: string | null;
      capital: string | null;
      franchise: string | null;
      matrixConfig: string | null;
    };
  }>;
}) {
  return {
    ...offer,
    features: JSON.parse(offer.features),
    guaranteeLinks: offer.guaranteeLinks.map((link) => ({
      ...link,
      guarantee: {
        ...link.guarantee,
        rateConditions: link.guarantee.rateConditions
          ? JSON.parse(link.guarantee.rateConditions)
          : null,
        capital: link.guarantee.capital
          ? JSON.parse(link.guarantee.capital)
          : null,
        franchise: link.guarantee.franchise
          ? JSON.parse(link.guarantee.franchise)
          : null,
        matrixConfig: link.guarantee.matrixConfig
          ? JSON.parse(link.guarantee.matrixConfig)
          : null,
      },
    })),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }
    if (search) {
      where.reference = { contains: search };
    }

    const quotes = await db.quote.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        offer: {
          include: {
            insurer: {
              select: { id: true, name: true, logo: true },
            },
            guaranteeLinks: {
              include: {
                guarantee: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const quotesParsed = quotes.map((quote) => ({
      ...quote,
      personalInfo: JSON.parse(quote.personalInfo),
      vehicleInfo: JSON.parse(quote.vehicleInfo),
      coverageNeeds: JSON.parse(quote.coverageNeeds),
      offer: quote.offer
        ? parseQuoteOffer(
            quote.offer as unknown as Parameters<typeof parseQuoteOffer>[0]
          )
        : null,
    }));

    return NextResponse.json(quotesParsed);
  } catch (error) {
    console.error("Erreur lors de la récupération des devis:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des devis" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "L'identifiant du devis est obligatoire" },
        { status: 400 }
      );
    }

    const existing = await db.quote.findUnique({ where: { id: body.id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Devis introuvable" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.finalPrice !== undefined) updateData.finalPrice = body.finalPrice;

    const quote = await db.quote.update({
      where: { id: body.id },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        offer: {
          include: {
            insurer: {
              select: { id: true, name: true, logo: true },
            },
            guaranteeLinks: {
              include: {
                guarantee: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    const quoteParsed = {
      ...quote,
      personalInfo: JSON.parse(quote.personalInfo),
      vehicleInfo: JSON.parse(quote.vehicleInfo),
      coverageNeeds: JSON.parse(quote.coverageNeeds),
      offer: quote.offer
        ? parseQuoteOffer(
            quote.offer as unknown as Parameters<typeof parseQuoteOffer>[0]
          )
        : null,
    };

    return NextResponse.json(quoteParsed);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du devis:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du devis" },
      { status: 500 }
    );
  }
}