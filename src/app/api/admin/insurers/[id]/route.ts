import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const insurer = await db.insurer.findUnique({
      where: { id },
      include: {
        offers: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!insurer) {
      return NextResponse.json(
        { error: "Insurer not found" },
        { status: 404 }
      );
    }

    // Parse features for each offer
    const insurerWithParsedOffers = {
      ...insurer,
      offers: insurer.offers.map((offer) => ({
        ...offer,
        features: JSON.parse(offer.features),
      })),
    };

    return NextResponse.json(insurerWithParsedOffers);
  } catch (error) {
    console.error("Error fetching insurer:", error);
    return NextResponse.json(
      { error: "Failed to fetch insurer" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.insurer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Insurer not found" },
        { status: 404 }
      );
    }

    const insurer = await db.insurer.update({
      where: { id },
      data: {
        name: body.name,
        logo: body.logo,
        description: body.description,
        phone: body.phone,
        email: body.email,
        website: body.website,
        rating: body.rating,
        isVerified: body.isVerified,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(insurer);
  } catch (error) {
    console.error("Error updating insurer:", error);
    return NextResponse.json(
      { error: "Failed to update insurer" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.insurer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Insurer not found" },
        { status: 404 }
      );
    }

    await db.insurer.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Insurer deleted successfully" });
  } catch (error) {
    console.error("Error deleting insurer:", error);
    return NextResponse.json(
      { error: "Failed to delete insurer" },
      { status: 500 }
    );
  }
}