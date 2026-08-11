import { db, mapRows } from "@/lib/db";
import { NextResponse } from "next/server";
import { getInsurerAccount, getSessionProfile, requireAuth } from "@/lib/auth-guard";

/**
 * Contrats liés aux offres de l'assureur connecté.
 * La table `contracts` porte directement `insurer_id` (renseigné à la création
 * du contrat lors de l'approbation d'un devis) — on filtre donc dessus.
 */
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
      .from("contracts")
      .select(
        "id, reference, status, start_date, end_date, premium, created_at, " +
          "client:profiles(firstName:first_name, lastName:last_name, email), " +
          "offer:insurance_offers(id, name), " +
          "quote:quotes(reference)"
      )
      .eq("insurer_id", account.insurerId)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const contracts = mapRows(data as unknown as Record<string, unknown>[] | null);

    return NextResponse.json({ contracts });
  } catch (error) {
    console.error("Erreur insurer/contracts GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des contrats" },
      { status: 500 }
    );
  }
}
