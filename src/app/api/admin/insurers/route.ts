import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const active = searchParams.get("active");

    const where: Record<string, unknown> = {};

    if (search) {
      where.name = { contains: search };
    }
    if (active !== null && active !== undefined && active !== "") {
      where.isActive = active === "true";
    }

    const insurers = await db.insurer.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        _count: {
          select: {
            offers: true,
            guaranteeLinks: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(insurers);
  } catch (error) {
    console.error("Erreur lors de la récupération des assureurs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des assureurs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Le nom est obligatoire" },
        { status: 400 }
      );
    }

    const insurer = await db.insurer.create({
      data: {
        name: body.name,
        logo: body.logo,
        description: body.description,
        phone: body.phone,
        email: body.email,
        website: body.website,
        rating: body.rating ?? 0,
        isVerified: body.isVerified ?? false,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(insurer, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de l'assureur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'assureur" },
      { status: 500 }
    );
  }
}