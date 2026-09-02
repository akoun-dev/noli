import { db, mapRows } from "@/lib/db";
import { NextResponse } from "next/server";
import { getInsurerAccount, getSessionProfile, requireAuth } from "@/lib/auth-guard";

/** Sinistres déclarés sur les contrats de l'assureur connecté. */
export async function GET() {
  try {
    const guard = await requireAuth(["INSURER"]);
    if (guard) return guard;

    const profile = await getSessionProfile();
    if (!profile) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    const account = await getInsurerAccount(profile.id);
    if (!account) {
      return NextResponse.json(
        { error: "Aucun compte assureur trouvé pour cet utilisateur" },
        { status: 404 }
      );
    }

    const { data, error } = await db
      .from("claims")
      .select(
        "id, reference, type, description, incident_date, status, created_at, " +
          "client:profiles(firstName:first_name, lastName:last_name, email), " +
          "contract:contracts(reference, offer:insurance_offers(name))"
      )
      .eq("insurer_id", account.insurerId)
      .order("created_at", { ascending: false });
    if (error) throw error;

    return NextResponse.json({ claims: mapRows(data as unknown as Record<string, unknown>[] | null) });
  } catch (error) {
    console.error("Erreur insurer/claims GET:", error);
    return NextResponse.json({ error: "Erreur lors du chargement des sinistres" }, { status: 500 });
  }
}
