/**
 * Helpers de sécurité réutilisables.
 *
 * - escapeHtml        : échappe les valeurs avant interpolation HTML (emails, ...)
 * - sanitizePostgrest : échappe les caractères spéciaux du filtre PostgREST (.or(), .ilike())
 * - parseNumberField  : valide un champ numérique (évite NaN / Infinity / valeurs négatives)
 */

export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Échappe les caractères réservés de la syntaxe de filtre PostgREST
 * (%, ,, (, ), *) afin qu'un paramètre `search` ne puisse pas modifier
 * la sémantique de la requête (injection de filtre).
 */
export function sanitizePostgrestSearch(value: string): string {
  return value.replace(/([%,()*])/g, "\\$1");
}

export interface ParseNumberOptions {
  field: string;
  /** Valeur minimale autorisée (défaut 0). */
  min?: number;
  /** Valeur maximale autorisée (défaut MAX_SAFE_INTEGER). */
  max?: number;
  /** Si true, null/undefined/"" → null (champ optionnel). */
  optional?: boolean;
}

export type ParseNumberResult =
  | { ok: true; value: number | null }
  | { ok: false; error: string };

/**
 * Convertit une valeur en nombre fini validé.
 * Renvoie { ok: false, error } si la valeur n'est pas un nombre fini
 * ou sort des bornes. Évite les NaN / Infinity / prix négatifs.
 */
export function parseNumberField(
  value: unknown,
  { field, min = 0, max = Number.MAX_SAFE_INTEGER, optional = false }: ParseNumberOptions
): ParseNumberResult {
  if (value === null || value === undefined || value === "") {
    if (optional) return { ok: true, value: null };
    return { ok: false, error: `${field} est requis` };
  }

  if (Array.isArray(value) || typeof value === "boolean") {
    return { ok: false, error: `${field} doit être un nombre valide` };
  }

  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) {
    return { ok: false, error: `${field} doit être un nombre valide` };
  }
  if (num < min || num > max) {
    return { ok: false, error: `${field} doit être compris entre ${min} et ${max}` };
  }
  return { ok: true, value: num };
}

/**
 * Masque une valeur sensible pour les réponses API.
 */
export const MASKED_SECRET = "********";

export function isMasked(value: string): boolean {
  return value === MASKED_SECRET;
}
