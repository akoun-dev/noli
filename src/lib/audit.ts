import { db } from "@/lib/db";
import { getSessionProfile } from "@/lib/auth-guard";

export interface AuditParams {
  action: string;
  entity: string;
  entityId?: string | null;
  details?: unknown;
}

/**
 * Écrit un log d'audit attribué à l'utilisateur réellement connecté
 * (email + id), au lieu de "SYSTEM". En l'absence de session, repli sur
 * "SYSTEM" afin de ne jamais bloquer l'action principale.
 */
export async function logAudit({ action, entity, entityId, details }: AuditParams) {
  let userName = "SYSTEM";
  let userId: string | null = null;
  let userEmail: string | null = null;
  try {
    const profile = await getSessionProfile();
    if (profile) {
      userEmail = profile.email || null;
      userName = profile.email || profile.id;
      userId = profile.id;
    }
  } catch {
    // Session illisible → repli SYSTEM, l'audit ne doit pas casser l'action.
  }

  try {
    await db.from("audit_logs").insert({
      action,
      entity,
      entity_id: entityId ?? null,
      details: details === undefined || details === null ? null : JSON.stringify(details),
      user_name: userName,
      user_email: userEmail,
      user_id: userId,
    });
  } catch (err) {
    console.error("[audit] Impossible d'écrire le log:", err);
  }
}
