import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

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
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const quotesWithParsedData = quotes.map((quote) => ({
      ...quote,
      personalInfo: JSON.parse(quote.personalInfo),
      vehicleInfo: JSON.parse(quote.vehicleInfo),
      coverageNeeds: JSON.parse(quote.coverageNeeds),
      offer: quote.offer
        ? {
            ...quote.offer,
            features: JSON.parse(quote.offer.features),
          }
        : null,
    }));

    return NextResponse.json(quotesWithParsedData);
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "Quote id is required" },
        { status: 400 }
      );
    }

    const existing = await db.quote.findUnique({ where: { id: body.id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Quote not found" },
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
          },
        },
      },
    });

    const quoteWithParsedData = {
      ...quote,
      personalInfo: JSON.parse(quote.personalInfo),
      vehicleInfo: JSON.parse(quote.vehicleInfo),
      coverageNeeds: JSON.parse(quote.coverageNeeds),
      offer: quote.offer
        ? {
            ...quote.offer,
            features: JSON.parse(quote.offer.features),
          }
        : null,
    };

    return NextResponse.json(quoteWithParsedData);
  } catch (error) {
    console.error("Error updating quote:", error);
    return NextResponse.json(
      { error: "Failed to update quote" },
      { status: 500 }
    );
  }
}