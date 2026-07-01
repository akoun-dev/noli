import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

function parseJsonField<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { reference: { contains: search } },
        { user: { OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { email: { contains: search } },
        ] } },
      ];
    }

    const quotes = await db.quote.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        offer: {
          include: {
            insurer: { select: { id: true, name: true, code: true } },
          },
        },
        category: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const parsed = quotes.map((q) => ({
      ...q,
      vehicleData: parseJsonField(q.vehicleData, {}),
      personalData: parseJsonField(q.personalData, {}),
      coverageRequirements: parseJsonField(q.coverageRequirements, {}),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Erreur quotes GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des devis" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: "L'identifiant du devis est requis" },
        { status: 400 }
      );
    }
    if (!status) {
      return NextResponse.json(
        { error: "Le statut est requis" },
        { status: 400 }
      );
    }

    const validStatuses = ["DRAFT", "PENDING", "APPROVED", "REJECTED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Statut invalide. Valeurs autorisées : DRAFT, PENDING, APPROVED, REJECTED" },
        { status: 400 }
      );
    }

    const existing = await db.quote.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Devis introuvable" },
        { status: 404 }
      );
    }

    const quote = await db.quote.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(quote);
  } catch (error) {
    console.error("Erreur quotes PUT:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du devis" },
      { status: 500 }
    );
  }
}