import { describe, it, expect } from "vitest";
import { selectMatchingQuoteIds } from "./quotes-reconcile";

const q = (id: number, email: unknown) => ({
  id,
  personal_data: JSON.stringify(email === undefined ? {} : { email }),
});

describe("selectMatchingQuoteIds (garde de sécurité)", () => {
  it("rattache uniquement l'email exact (insensible à la casse/espaces)", () => {
    const quotes = [
      q(1, "Jean@Example.com"),
      q(2, "  jean@example.com  "),
      q(3, "autre@example.com"),
    ];
    expect(selectMatchingQuoteIds(quotes, "jean@example.com")).toEqual([1, 2]);
  });

  it("ne rattache PAS un email différent (pas de correspondance partielle)", () => {
    const quotes = [q(1, "jeanne@example.com"), q(2, "jean@example.com.attacker.com")];
    expect(selectMatchingQuoteIds(quotes, "jean@example.com")).toEqual([]);
  });

  it("ignore un personal_data illisible ou sans email", () => {
    const quotes = [
      { id: 1, personal_data: "{pas du json" },
      { id: 2, personal_data: null },
      q(3, undefined),
      q(4, 42), // email non-string
    ];
    expect(selectMatchingQuoteIds(quotes, "jean@example.com")).toEqual([]);
  });

  it("renvoie [] pour un email cible vide", () => {
    expect(selectMatchingQuoteIds([q(1, "x@y.z")], "   ")).toEqual([]);
  });
});
