import { describe, expect, it } from "vitest";
import {
  mapRawOffer,
  mapRawOffers,
  parseFeatures,
  type RawOffer,
} from "./insurer-offers-mapper";

const rawOffer: RawOffer = {
  id: "off-1",
  name: "Tous Risques Auto",
  description: "Couverture complète",
  category: { id: "cat-1", name: "Automobile", icon: "car" },
  priceMin: 45000,
  priceMax: 120000,
  deductible: 250000,
  contractType: "all_risks",
  isActive: true,
  features: ["Assistance 24/7", "Bris de glace"],
  _count: { quotes: 3 },
};

describe("mapRawOffer", () => {
  it("transforme une offre brute en forme d'affichage complète", () => {
    expect(mapRawOffer(rawOffer)).toEqual({
      id: "off-1",
      name: "Tous Risques Auto",
      description: "Couverture complète",
      category: "Automobile",
      priceMin: 45000,
      priceMax: 120000,
      deductible: 250000,
      contractType: "all_risks",
      isActive: true,
      status: "active",
      features: '["Assistance 24/7","Bris de glace"]',
      quoteCount: 3,
    });
  });

  it("convertit l'objet category en son nom, et null si absente", () => {
    expect(mapRawOffer({ ...rawOffer, category: null }).category).toBeNull();
    expect(
      mapRawOffer({ ...rawOffer, category: { id: "c2", name: "Voyage" } }).category
    ).toBe("Voyage");
  });

  it("dérive le statut active/inactive de isActive", () => {
    expect(mapRawOffer(rawOffer).status).toBe("active");
    expect(mapRawOffer({ ...rawOffer, isActive: false }).status).toBe("inactive");
  });

  it("sérialise les caractéristiques en chaîne JSON réutilisable", () => {
    const offer = mapRawOffer({ ...rawOffer, features: ["Bris de glace"] });
    expect(offer.features).toBe('["Bris de glace"]');
    // Propriété d'aller-retour : features brutes → chaîne → features parsées
    expect(parseFeatures(offer.features)).toEqual(["Bris de glace"]);
  });

  it("sérialise un tableau de caractéristiques vide en '[]'", () => {
    expect(mapRawOffer({ ...rawOffer, features: [] }).features).toBe("[]");
  });

  it("retourne null si features est absent à l'exécution", () => {
    const { features: _omit, ...withoutFeatures } = rawOffer;
    expect(mapRawOffer(withoutFeatures as RawOffer).features).toBeNull();
  });

  it("retourne 0 devis si _count est absent", () => {
    const { _count: _omit, ...withoutCount } = rawOffer;
    expect(mapRawOffer(withoutCount as RawOffer).quoteCount).toBe(0);
  });

  it("retourne 0 devis si _count.quotes est absent", () => {
    expect(mapRawOffer({ ...rawOffer, _count: {} }).quoteCount).toBe(0);
  });

  it("retourne 0 devis si _count.quotes vaut 0", () => {
    expect(mapRawOffer({ ...rawOffer, _count: { quotes: 0 } }).quoteCount).toBe(0);
  });

  it("préserve les valeurs nulles des champs prix et description", () => {
    const offer = mapRawOffer({
      ...rawOffer,
      description: null,
      priceMin: null,
      priceMax: null,
      deductible: null,
      contractType: null,
    });
    expect(offer.description).toBeNull();
    expect(offer.priceMin).toBeNull();
    expect(offer.priceMax).toBeNull();
    expect(offer.deductible).toBeNull();
    expect(offer.contractType).toBeNull();
  });
});

describe("mapRawOffers", () => {
  it("retourne un tableau vide pour une entrée vide", () => {
    expect(mapRawOffers([])).toEqual([]);
  });

  it("mappe chaque offre du tableau", () => {
    const offers = mapRawOffers([
      rawOffer,
      { ...rawOffer, id: "off-2", isActive: false },
    ]);
    expect(offers).toHaveLength(2);
    expect(offers[0].id).toBe("off-1");
    expect(offers[1].id).toBe("off-2");
    expect(offers[1].status).toBe("inactive");
  });
});

describe("parseFeatures", () => {
  it("parse une chaîne JSON valide en tableau", () => {
    expect(parseFeatures('["A", "B"]')).toEqual(["A", "B"]);
  });

  it("retourne [] pour null ou une chaîne vide", () => {
    expect(parseFeatures(null)).toEqual([]);
    expect(parseFeatures("")).toEqual([]);
  });

  it("retourne [] pour un JSON invalide", () => {
    expect(parseFeatures("pas du json")).toEqual([]);
  });

  it("retourne [] si le JSON parsé n'est pas un tableau", () => {
    expect(parseFeatures('{"a": 1}')).toEqual([]);
    expect(parseFeatures('"texte"')).toEqual([]);
  });

  it("retourne le tableau parsé tel quel s'il est non-string", () => {
    expect(parseFeatures("[1, 2]")).toEqual([1, 2]);
  });
});
