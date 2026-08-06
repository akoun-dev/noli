/* ── Mapping des offres assureur : forme API (brute) → forme d'affichage ── */

/** Forme d'affichage utilisée par le tableau / la fiche détail de l'assureur. */
export interface Offer {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  priceMin: number | null;
  priceMax: number | null;
  deductible: number | null;
  contractType: string | null;
  isActive: boolean;
  status: string;
  features: string | null;
  quoteCount: number;
}

/** Forme brute renvoyée par l'API (category = objet, features = tableau déjà parsé). */
export interface RawOffer {
  id: string;
  name: string;
  description: string | null;
  category: { id: string; name: string; icon?: string | null } | null;
  priceMin: number | null;
  priceMax: number | null;
  deductible: number | null;
  contractType: string | null;
  isActive: boolean;
  features: string[];
  _count?: { quotes?: number };
}

export function mapRawOffer(o: RawOffer): Offer {
  return {
    id: o.id,
    name: o.name,
    description: o.description,
    category: o.category?.name ?? null,
    priceMin: o.priceMin,
    priceMax: o.priceMax,
    deductible: o.deductible,
    contractType: o.contractType,
    isActive: o.isActive,
    status: o.isActive ? "active" : "inactive",
    features: o.features ? JSON.stringify(o.features) : null,
    quoteCount: o._count?.quotes ?? 0,
  };
}

export function mapRawOffers(offers: RawOffer[]): Offer[] {
  return offers.map(mapRawOffer);
}

/** Décode la chaîne JSON des caractéristiques (inverse de la sérialisation du mapping). */
export function parseFeatures(features: string | null): string[] {
  if (!features) return [];
  try {
    const parsed = JSON.parse(features);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
