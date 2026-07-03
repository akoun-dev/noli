import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

function parseJsonField<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

async function getInsurerId(userId: string) {
  const account = await db.insurerAccount.findFirst({
    where: { profileId: userId },
    select: { insurerId: true },
  });
  if (!account) return null;
  return account.insurerId;
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Le paramètre userId est requis" },
        { status: 400 }
      );
    }

    const insurerId = await getInsurerId(userId);
    if (!insurerId) {
      return NextResponse.json(
        { error: "Aucun compte assureur trouvé pour cet utilisateur" },
        { status: 404 }
      );
    }

    const offerWhere = { insurerId };

    const [
      totalOffers,
      activeOffers,
      totalQuotes,
      pendingQuotes,
      approvedQuotes,
      rejectedQuotes,
      draftQuotes,
      totalCoverages,
      recentQuotes,
    ] = await Promise.all([
      db.insuranceOffer.count({ where: offerWhere }),
      db.insuranceOffer.count({ where: { ...offerWhere, isActive: true } }),
      db.quote.count({
        where: { offer: { ...offerWhere } },
      }),
      db.quote.count({
        where: { offer: { ...offerWhere }, status: "PENDING" },
      }),
      db.quote.count({
        where: { offer: { ...offerWhere }, status: "APPROVED" },
      }),
      db.quote.count({
        where: { offer: { ...offerWhere }, status: "REJECTED" },
      }),
      db.quote.count({
        where: { offer: { ...offerWhere }, status: "DRAFT" },
      }),
      db.coverage.count({ where: { insurerId } }),
      db.quote.findMany({
        where: { offer: { ...offerWhere } },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    const recentQuotesFormatted = recentQuotes.map((q) => ({
      id: q.id,
      reference: q.reference,
      status: q.status,
      estimatedPrice: q.estimatedPrice,
      finalPrice: q.finalPrice,
      createdAt: q.createdAt.toISOString(),
      userName: q.user
        ? `${q.user.firstName || ""} ${q.user.lastName || ""}`.trim()
        : null,
      vehicleInfo: parseJsonField(q.vehicleData, {}),
    }));

    return NextResponse.json({
      totalOffers,
      activeOffers,
      totalQuotes,
      pendingQuotes,
      approvedQuotes,
      rejectedQuotes,
      draftQuotes,
      totalCoverages,
      recentQuotes: recentQuotesFormatted,
    });
  } catch (error) {
    console.error("Erreur insurer/stats:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des statistiques" },
      { status: 500 }
    );
  }
}