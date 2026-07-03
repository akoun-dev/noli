import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const all = searchParams.get("all") === "true";
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const whereClause: Record<string, unknown> = {};
    if (userId && !all) {
      whereClause.userId = userId;
    }

    const quotes = await db.quote.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        category: { select: { id: true, name: true } },
        offer: {
          select: {
            id: true,
            name: true,
            insurer: { select: { id: true, name: true, logoUrl: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error("Quotes error:", error);
    return NextResponse.json({ error: "Erreur de chargement" }, { status: 500 });
  }
}