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
 * Couples min/max d'une offre d'assurance à contrôler.
 */
const OFFER_RANGE_PAIRS = [
  { min: "priceMin", max: "priceMax", label: "Le prix" },
  { min: "fiscalPowerMin", max: "fiscalPowerMax", label: "La puissance fiscale" },
  { min: "newValueMin", max: "newValueMax", label: "La valeur neuve" },
  { min: "venalValueMin", max: "venalValueMax", label: "La valeur vénale" },
] as const;

/**
 * Valide les bornes min/max d'une offre : chaque valeur présente doit être un
 * nombre fini positif (via parseNumberField) et `min ≤ max`. Les champs
 * absents/vides sont ignorés (compatible création ET mise à jour partielle).
 * Renvoie un message d'erreur français, ou `null` si tout est cohérent.
 */
export function validateOfferRanges(body: Record<string, unknown>): string | null {
  for (const { min, max, label } of OFFER_RANGE_PAIRS) {
    const minChk = parseNumberField(body[min], { field: `${label} (min)`, optional: true });
    if (!minChk.ok) return minChk.error;
    const maxChk = parseNumberField(body[max], { field: `${label} (max)`, optional: true });
    if (!maxChk.ok) return maxChk.error;
    if (minChk.value !== null && maxChk.value !== null && minChk.value > maxChk.value) {
      return `${label} : le minimum ne peut pas dépasser le maximum.`;
    }
  }
  return null;
}

/**
 * Masque une valeur sensible pour les réponses API.
 */
export const MASKED_SECRET = "********";

export function isMasked(value: string): boolean {
  return value === MASKED_SECRET;
}
