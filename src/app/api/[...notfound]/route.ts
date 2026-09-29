import { NextResponse } from "next/server";

/**
 * Catch-all des routes /api/* inexistantes.
 *
 * Sans ce handler, une requête vers une route API inconnue (ex.
 * /api/insurer/users) n'est captée par aucun route handler et retombe sur
 * le catch-all de page `[...slug]`, qui répond **200 + page HTML** « 404
 * introuvable » (TEC-RBAC-02). On renvoie ici une vraie **404 JSON**,
 * cohérente avec le contrat d'API ({ error }), pour toutes les méthodes.
 *
 * Les routes API réelles sont plus spécifiques : elles ont toujours la
 * priorité sur ce catch-all, qui ne s'applique qu'aux chemins non résolus.
 */
function notFound() {
  return NextResponse.json({ error: "Ressource introuvable" }, { status: 404 });
}

export const GET = notFound;
export const POST = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;
export const HEAD = notFound;
export const OPTIONS = notFound;
