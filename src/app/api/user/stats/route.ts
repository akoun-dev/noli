import { db, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  try {
    const sessionProfile = await getSessionProfile();
    if (!sessionProfile) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const userId = sessionProfile.id;

    const [
      { count: totalQuotes },
      { count: pendingQuotes },
      { count: approvedQuotes },
      { count: rejectedQuotes },
      { count: draftQuotes },
      quotesWithPricesResult,
    ] = await Promise.all([
      db.from("quotes").select("id", { count: "exact", head: true }).eq("user_id", userId),
      db.from("quotes").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "PENDING"),
      db.from("quotes").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "APPROVED"),
      db.from("quotes").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "REJECTED"),
      db.from("quotes").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "DRAFT"),
      db.from("quotes")
        .select("estimatedPrice:estimated_price, offer:insurance_offers(priceMin:price_min, priceMax:price_max)")
        .eq("user_id", userId)
        .not("estimated_price", "is", null)
        .not("offer_id", "is", null),
    ]);

    if (quotesWithPricesResult.error) throw quotesWithPricesResult.error;
    const quotesWithPrices = mapRows<{
      estimatedPrice: number | null;
      offer: { priceMin: number | null; priceMax: number | null } | null;
    }>(quotesWithPricesResult.data || []);

    // Total savings = sum of (priceMax - priceMin) for each quote's linked offer
    const totalSavings = quotesWithPrices.reduce((sum, q) => {
      const max = q.offer?.priceMax ?? 0;
      const min = q.offer?.priceMin ?? 0;
      return sum + (max - min);
    }, 0);

    return NextResponse.json({
      totalQuotes,
      pendingQuotes,
      approvedQuotes,
      rejectedQuotes,
      draftQuotes,
      totalSavings,
    });
  } catch (error) {
    console.error("Erreur user/stats:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des statistiques" },
      { status: 500 }
    );
  }
}
