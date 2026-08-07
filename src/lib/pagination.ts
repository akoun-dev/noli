/**
 * Pagination standard des endpoints de liste (A-06).
 *
 * Rétro-compatible :
 * - Sans paramètre `page` ni `limit`, l'endpoint renvoie TOUTES les lignes
 *   (comportement historique inchangé), mais ajoute l'en-tête X-Total-Count
 *   pour permettre la migration progressive des clients.
 * - Avec `?page=1&limit=50`, la réponse est découpée (offset/limit) et les
 *   en-têtes X-Page / X-Limit / X-Page-Count / X-Total-Count sont renvoyés.
 */

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export const DEFAULT_PAGE_SIZE = 50;
const MAX_LIMIT = 200;

export function getPagination(searchParams: URLSearchParams): PaginationParams {
  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const rawLimit = parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, MAX_LIMIT)
      : DEFAULT_PAGE_SIZE;

  return { page, limit, offset: (page - 1) * limit };
}

/** true si le client demande explicitement la pagination. */
export function hasPaginationParams(searchParams: URLSearchParams): boolean {
  return searchParams.has("page") || searchParams.has("limit");
}

/** En-têtes de pagination standard. */
export function paginationHeaders(
  total: number,
  page: number,
  limit: number
): Record<string, string> {
  return {
    "X-Total-Count": String(total),
    "X-Page": String(page),
    "X-Limit": String(limit),
    "X-Page-Count": String(Math.max(1, Math.ceil(total / limit))),
  };
}
