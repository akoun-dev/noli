import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const offer = await db.offer.findUnique({
      where: { id },
      include: {
        insurer: true,
      },
    });

    if (!offer) {
      return NextResponse.json(
        { error: "Offer not found" },
        { status: 404 }
      );
    }

    const offerWithParsedFeatures = {
      ...offer,
      features: JSON.parse(offer.features),
    };

    return NextResponse.json(offerWithParsedFeatures);
  } catch (error) {
    console.error("Error fetching offer:", error);
    return NextResponse.json(
      { error: "Failed to fetch offer" },
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

    const existing = await db.offer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Offer not found" },
        { status: 404 }
      );
    }

    const features = Array.isArray(body.features)
      ? JSON.stringify(body.features)
      : undefined;

    const offer = await db.offer.update({
      where: { id },
      data: {
        insurerId: body.insurerId,
        name: body.name,
        coverageType: body.coverageType,
        description: body.description,
        basePrice: body.basePrice,
        annualPrice: body.annualPrice,
        deductible: body.deductible,
        maxCoverage: body.maxCoverage,
        features,
        conditions: body.conditions,
        isActive: body.isActive,
      },
      include: {
        insurer: {
          select: { id: true, name: true, logo: true },
        },
      },
    });

    const offerWithParsedFeatures = {
      ...offer,
      features: JSON.parse(offer.features),
    };

    return NextResponse.json(offerWithParsedFeatures);
  } catch (error) {
    console.error("Error updating offer:", error);
    return NextResponse.json(
      { error: "Failed to update offer" },
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

    const existing = await db.offer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Offer not found" },
        { status: 404 }
      );
    }

    await db.offer.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Offer deleted successfully" });
  } catch (error) {
    console.error("Error deleting offer:", error);
    return NextResponse.json(
      { error: "Failed to delete offer" },
      { status: 500 }
    );
  }
}