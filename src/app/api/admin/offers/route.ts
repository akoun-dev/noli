import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const insurerId = searchParams.get("insurerId") || "";
    const coverageType = searchParams.get("coverageType") || "";
    const active = searchParams.get("active");

    const where: Record<string, unknown> = {};

    if (search) {
      where.name = { contains: search };
    }
    if (insurerId) {
      where.insurerId = insurerId;
    }
    if (coverageType) {
      where.coverageType = coverageType;
    }
    if (active !== null && active !== undefined && active !== "") {
      where.isActive = active === "true";
    }

    const offers = await db.offer.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        insurer: {
          select: { id: true, name: true, logo: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const offersWithParsedFeatures = offers.map((offer) => ({
      ...offer,
      features: JSON.parse(offer.features),
    }));

    return NextResponse.json(offersWithParsedFeatures);
  } catch (error) {
    console.error("Error fetching offers:", error);
    return NextResponse.json(
      { error: "Failed to fetch offers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.insurerId || !body.name || !body.coverageType || body.basePrice === undefined) {
      return NextResponse.json(
        { error: "insurerId, name, coverageType, and basePrice are required" },
        { status: 400 }
      );
    }

    // Validate insurer exists
    const insurer = await db.insurer.findUnique({
      where: { id: body.insurerId },
    });
    if (!insurer) {
      return NextResponse.json(
        { error: "Insurer not found" },
        { status: 400 }
      );
    }

    const features = Array.isArray(body.features)
      ? JSON.stringify(body.features)
      : "[]";

    const offer = await db.offer.create({
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
        isActive: body.isActive ?? true,
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

    return NextResponse.json(offerWithParsedFeatures, { status: 201 });
  } catch (error) {
    console.error("Error creating offer:", error);
    return NextResponse.json(
      { error: "Failed to create offer" },
      { status: 500 }
    );
  }
}