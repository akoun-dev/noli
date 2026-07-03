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
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));

    if (!userId) {
      return NextResponse.json(
        { error: "Le paramètre userId est requis" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { userId };

    if (status) {
      where.status = status;
    }

    if (search) {
      (where as Record<string, unknown>).OR = [
        { reference: { contains: search } },
        { offer: { name: { contains: search } } },
      ];
    }

    const [quotes, total] = await Promise.all([
      db.quote.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          offer: {
            include: {
              insurer: { select: { name: true, logoUrl: true } },
            },
          },
          category: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.quote.count({ where }),
    ]);

    const formatted = quotes.map((q) => ({
      id: q.id,
      reference: q.reference,
      status: q.status,
      estimatedPrice: q.estimatedPrice,
      finalPrice: q.finalPrice,
      notes: q.notes,
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
      offerName: q.offer?.name || null,
      offerDescription: q.offer?.description || null,
      categoryName: q.category?.name || null,
      vehicleData: parseJsonField(q.vehicleData, {}),
      personalData: parseJsonField(q.personalData, {}),
      insurerName: q.offer?.insurer?.name || null,
      insurerLogo: q.offer?.insurer?.logoUrl || null,
    }));

    return NextResponse.json({ quotes: formatted, total, page, limit });
  } catch (error) {
    console.error("Erreur user/quotes:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des devis" },
      { status: 500 }
    );
  }
}