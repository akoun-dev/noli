import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getClientIp, checkPublicReadLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    // Endpoint public : rate limit par IP (anti-énumération du nombre d'utilisateurs).
    const limited = rateLimitResponse(checkPublicReadLimit(getClientIp(request), "stats"));
    if (limited) return limited;

    const [{ count: insurers }, { count: offers }, { count: profiles }] = await Promise.all([
      db.from("insurers").select("id", { count: "exact", head: true }),
      db.from("insurance_offers").select("id", { count: "exact", head: true }),
      db.from("profiles").select("id", { count: "exact", head: true }),
    ]);

    return NextResponse.json({ insurers, offers, users: profiles });
  } catch (error) {
    console.error("Stats GET error:", error);
    return NextResponse.json({ error: "Erreur lors du chargement des statistiques" }, { status: 500 });
  }
}
