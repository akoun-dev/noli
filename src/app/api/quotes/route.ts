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
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const { data, error } = await db
      .from("quotes")
      .select(
        "*, user:profiles(id, firstName:first_name, lastName:last_name, email), category:insurance_categories(id, name), offer:insurance_offers(id, name, insurer:insurers(id, name, logoUrl:logo_url))"
      )
      .eq("user_id", sessionProfile.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;

    const quotes = mapRows(data || []);
    return NextResponse.json({ quotes });
  } catch (error) {
    console.error("Quotes error:", error);
    return NextResponse.json({ error: "Erreur de chargement" }, { status: 500 });
  }
}
