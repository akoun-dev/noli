import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth-guard";

/**
 * POST /api/user/quotes/reconcile — LOT D (devis anonymes orphelins).
 *
 * Rattache au compte fraîchement authentifié les devis créés en anonyme
 * (`user_id IS NULL`) dont l'email saisi dans `personal_data` correspond
 * EXACTEMENT à l'email du compte connecté.
 *
 * Sécurité :
 *  - l'identité vient TOUJOURS de la session (getSessionProfile), jamais du
 *    corps de la requête ;
 *  - on ne rattache que les lignes `user_id IS NULL` (double contrôle : filtre
 *    de lecture ET clause de l'UPDATE) ;
 *  - la correspondance d'email est re-vérifiée en JS après lecture (le ILIKE
 *    n'est qu'un pré-filtre), en comparaison stricte insensible à la casse.
 */
export async function POST() {
  try {
    const profile = await getSessionProfile();
    if (!profile) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const email = (profile.email || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ attached: 0 });
    }

    // Pré-filtre : devis anonymes contenant l'email dans le JSON `personal_data`
    // (colonne texte). On échappe les métacaractères LIKE avant l'ILIKE.
    const escaped = email.replace(/[\\%_]/g, (m) => `\\${m}`);
    const { data, error } = await db
      .from("quotes")
      .select("id, personal_data")
      .is("user_id", null)
      .ilike("personal_data", `%${escaped}%`)
      .limit(500);
    if (error) throw error;

    const rows = (data || []) as { id: string; personal_data: string | null }[];

    // Re-vérification stricte de l'email (le ILIKE peut matcher un sous-champ).
    const idsToAttach: string[] = [];
    for (const row of rows) {
      let parsedEmail: unknown;
      try {
        parsedEmail = JSON.parse(row.personal_data || "null")?.email;
      } catch {
        parsedEmail = undefined;
      }
      if (
        typeof parsedEmail === "string" &&
        parsedEmail.trim().toLowerCase() === email
      ) {
        idsToAttach.push(row.id);
      }
    }

    if (idsToAttach.length === 0) {
      return NextResponse.json({ attached: 0 });
    }

    // UPDATE borné aux ids validés ET aux lignes encore anonymes.
    const { data: updated, error: updateError } = await db
      .from("quotes")
      .update({ user_id: profile.id })
      .in("id", idsToAttach)
      .is("user_id", null)
      .select("id");
    if (updateError) throw updateError;

    return NextResponse.json({ attached: (updated || []).length });
  } catch (error) {
    console.error("Erreur réconciliation devis:", error);
    return NextResponse.json(
      { error: "Erreur lors du rattachement des devis" },
      { status: 500 }
    );
  }
}
