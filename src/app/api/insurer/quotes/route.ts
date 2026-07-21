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

    const account = await db.insurerAccount.findFirst({
      where: { profileId: userId },
      select: { insurerId: true },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Aucun compte assureur trouvé pour cet utilisateur" },
        { status: 404 }
      );
    }

    const where: Record<string, unknown> = {
      offer: { insurerId: account.insurerId },
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      (where as Record<string, unknown>).OR = [
        { reference: { contains: search } },
        { user: { OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
        ] } },
      ];
    }

    const [quotes, total] = await Promise.all([
      db.quote.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          offer: { select: { name: true } },
          category: { select: { name: true } },
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
      categoryName: q.category?.name || null,
      userName: q.user
        ? `${q.user.firstName || ""} ${q.user.lastName || ""}`.trim()
        : null,
      personalData: parseJsonField(q.personalData, {}),
      vehicleData: parseJsonField(q.vehicleData, {}),
    }));

    return NextResponse.json({ quotes: formatted, total, page, limit });
  } catch (error) {
    console.error("Erreur insurer/quotes:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des devis" },
      { status: 500 }
    );
  }
}