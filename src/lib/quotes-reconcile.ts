import { db } from "@/lib/db";

/**
 * Sélectionne les ids des devis dont l'email stocké dans `personal_data` (chaîne
 * JSON) correspond EXACTEMENT (insensible à la casse) à l'email fourni.
 *
 * Fonction pure et testée : c'est ici que vit le garde de sécurité (email exact).
 */
export function selectMatchingQuoteIds(
  quotes: Array<{ id: number | string; personal_data: string | null }>,
  email: string
): Array<number | string> {
  const target = email.trim().toLowerCase();
  if (!target) return [];

  const ids: Array<number | string> = [];
  for (const q of quotes) {
    let parsedEmail: unknown;
    try {
      parsedEmail = (JSON.parse(q.personal_data || "{}") as { email?: unknown })?.email;
    } catch {
      continue; // personal_data illisible → ignoré
    }
    if (typeof parsedEmail === "string" && parsedEmail.trim().toLowerCase() === target) {
      ids.push(q.id);
    }
  }
  return ids;
}

const RECONCILE_LIMIT = 500;

/**
 * Rattache les devis anonymes (`user_id` NULL) dont l'email correspond au compte
 * fraîchement authentifié.
 *
 * Sécurité : correspondance email **exacte** uniquement, et seuls les devis **sans
 * propriétaire** sont modifiés. Best-effort : ne lève jamais (n'interrompt pas
 * le login/inscription). Renvoie le nombre de devis rattachés.
 *
 * NB : `personal_data` est stocké en `text` (chaîne JSON), non filtrable côté
 * PostgREST → on récupère les devis anonymes (borné à 500) et on filtre en JS.
 * Optimisation future : migrer `personal_data` en `jsonb` + index et filtrer en base.
 */
export async function reconcileAnonymousQuotes(
  profileId: string,
  email: string
): Promise<number> {
  try {
    if (!profileId || !email?.trim()) return 0;

    const { data, error } = await db
      .from("quotes")
      .select("id, personal_data")
      .is("user_id", null)
      .limit(RECONCILE_LIMIT);
    if (error || !data?.length) return 0;

    const ids = selectMatchingQuoteIds(data, email);
    if (!ids.length) return 0;

    const { error: updateError } = await db
      .from("quotes")
      .update({ user_id: profileId })
      .in("id", ids);
    if (updateError) {
      console.error("[reconcile] échec du rattachement des devis:", updateError);
      return 0;
    }
    return ids.length;
  } catch (err) {
    console.error("[reconcile] erreur inattendue:", err);
    return 0;
  }
}
