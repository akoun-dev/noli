import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(first?: string, last?: string): string {
  if (last) return ((first?.[0] || "") + last[0]).toUpperCase();
  if (first) {
    const parts = first.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return first.slice(0, 2).toUpperCase();
  }
  return "?";
}

export function formatFCFA(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

/**
 * Parse un montant FCFA saisi sous forme de texte (ex: "18 000 000", "5,500").
 * Supprime les espaces et les virgules ; renvoie 0 si la valeur est vide/invalide.
 * À utiliser partout à la place de `Number(value)` sur newValue/currentValue,
 * sinon "18 000 000" → NaN.
 */
export function parseFCFA(raw: unknown): number {
  if (raw == null || raw === "") return 0;
  const n = parseFloat(String(raw).replace(/[\s,]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
