import { describe, it, expect } from "vitest";
import { fmt } from "./generate-pdf";

/**
 * Régression : le montant du PDF s'affichait « 2¥075¥000 FCFA » parce que
 * Intl.NumberFormat("fr-FR") sépare les milliers par une espace fine insécable
 * (U+202F) absente des polices standard jsPDF. Le formatage PDF ne doit donc
 * contenir aucune espace insécable — uniquement des espaces ASCII.
 */
describe("generate-pdf › fmt", () => {
  it("n'utilise pas d'espace insécable (U+202F / U+00A0) comme séparateur", () => {
    const out = fmt(2075000);
    expect(out).not.toMatch(/[  ]/);
    expect(out).toBe("2 075 000 FCFA");
  });

  it("formate correctement les petits et grands montants", () => {
    expect(fmt(0)).toBe("0 FCFA");
    expect(fmt(126750, "")).toBe("126 750");
    expect(fmt(10563, " FCFA / mois")).toBe("10 563 FCFA / mois");
  });

  it("gère les valeurs nulles", () => {
    expect(fmt(null)).toBe("—");
    expect(fmt(undefined)).toBe("—");
  });
});
