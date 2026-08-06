import { db, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  try {
    const sessionProfile = await getSessionProfile();
    if (!sessionProfile) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || sessionProfile.id;
    if (userId !== sessionProfile.id && sessionProfile.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { data, error } = await db
      .from("contracts")
      .select(
        "id, reference, status, start_date, end_date, premium, created_at, " +
          "quote:quotes(reference, final_price), " +
          "insurer:insurers(id, name, code, logo_url), " +
          "offer:insurance_offers(id, name)"
      )
      .eq("profile_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const contracts = mapRows(data as unknown as Record<string, unknown>[] | null);

    return NextResponse.json({
      contracts: contracts.map((c: Record<string, unknown>) => ({
        id: c.id,
        reference: c.reference,
        status: c.status,
        startDate: c.startDate,
        endDate: c.endDate,
        premium: c.premium,
        createdAt: c.createdAt,
        quote: c.quote,
        insurer: c.insurer,
        offer: c.offer,
      })),
    });
  } catch (error) {
    console.error("Erreur user/contracts GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des contrats" },
      { status: 500 }
    );
  }
}
