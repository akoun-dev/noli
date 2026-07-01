import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const activeParam = searchParams.get("active");

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
      ];
    }
    if (activeParam !== null && activeParam !== "") {
      where.isActive = activeParam === "true";
    }

    const insurers = await db.insurer.findMany({
      where,
      include: {
        _count: { select: { offers: true, coverages: true, accounts: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(insurers);
  } catch (error) {
    console.error("Erreur insurers GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des assureurs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, logoUrl, contactEmail, phone, website, isActive } =
      body;

    if (!code) {
      return NextResponse.json(
        { error: "Le code est requis" },
        { status: 400 }
      );
    }
    if (!name) {
      return NextResponse.json(
        { error: "Le nom est requis" },
        { status: 400 }
      );
    }

    const existing = await db.insurer.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { error: "Un assureur avec ce code existe déjà" },
        { status: 400 }
      );
    }

    const insurer = await db.insurer.create({
      data: {
        code,
        name,
        logoUrl: logoUrl || null,
        contactEmail: contactEmail || null,
        phone: phone || null,
        website: website || null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(insurer, { status: 201 });
  } catch (error) {
    console.error("Erreur insurers POST:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'assureur" },
      { status: 500 }
    );
  }
}