import { describe, it, expect } from "vitest";
import { parseFCFA, formatFCFA } from "@/lib/utils";

describe("parseFCFA", () => {
  it("parse un montant avec des espaces (format utilisateur)", () => {
    expect(parseFCFA("18 000 000")).toBe(18_000_000);
  });

  it("parse un montant avec des virgules", () => {
    expect(parseFCFA("5,500")).toBe(5500);
  });

  it("parse un nombre directement", () => {
    expect(parseFCFA(12_500)).toBe(12_500);
  });

  it("renvoie 0 pour une valeur vide ou invalide (au lieu de NaN)", () => {
    expect(parseFCFA("")).toBe(0);
    expect(parseFCFA(null)).toBe(0);
    expect(parseFCFA(undefined)).toBe(0);
    expect(parseFCFA("abc")).toBe(0);
  });

  it("ne propage jamais NaN (le bug Number('18 000 000'))", () => {
    const result = parseFCFA("18 000 000");
    expect(Number.isNaN(result)).toBe(false);
  });
});

describe("formatFCFA", () => {
  it("formate un montant avec séparateurs de milliers", () => {
    // Intl.NumberFormat("fr-FR") utilise une espace fine insécable (U+202F) ;
    // on normalise pour le test.
    const result = formatFCFA(18_000_000);
    expect(result.replace(/\s/g, "")).toBe("18000000FCFA");
  });

  it("renvoie un tiret pour null/undefined", () => {
    expect(formatFCFA(null)).toBe("—");
    expect(formatFCFA(undefined)).toBe("—");
  });
});
