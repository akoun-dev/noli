import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  sanitizePostgrestSearch,
  parseNumberField,
  isMasked,
  MASKED_SECRET,
} from "./security";

describe("escapeHtml", () => {
  it("échappe les caractères HTML dangereux", () => {
    expect(escapeHtml(`<script>alert("x")&'`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&amp;&#39;"
    );
  });

  it("renvoie une chaîne vide pour null/undefined", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });

  it("convertit les valeurs non-string", () => {
    expect(escapeHtml(42)).toBe("42");
  });
});

describe("sanitizePostgrestSearch", () => {
  it("échappe les caractères réservés du filtre PostgREST", () => {
    expect(sanitizePostgrestSearch("a%b,c(d)e*f")).toBe("a\\%b\\,c\\(d\\)e\\*f");
  });

  it("laisse un texte normal intact", () => {
    expect(sanitizePostgrestSearch("Jean Dupont")).toBe("Jean Dupont");
  });
});

describe("parseNumberField", () => {
  it("accepte un nombre valide dans les bornes", () => {
    expect(parseNumberField(50, { field: "Prix" })).toEqual({ ok: true, value: 50 });
  });

  it("coerce une chaîne numérique", () => {
    expect(parseNumberField("123", { field: "Prix" })).toEqual({ ok: true, value: 123 });
  });

  it("rejette un champ requis vide", () => {
    expect(parseNumberField("", { field: "Prix" })).toEqual({
      ok: false,
      error: "Prix est requis",
    });
  });

  it("accepte vide si optionnel → null", () => {
    expect(parseNumberField("", { field: "Prix", optional: true })).toEqual({
      ok: true,
      value: null,
    });
  });

  it("rejette NaN et Infinity", () => {
    expect(parseNumberField("abc", { field: "Prix" }).ok).toBe(false);
    expect(parseNumberField(Infinity, { field: "Prix" }).ok).toBe(false);
  });

  it("rejette les tableaux et booléens", () => {
    expect(parseNumberField([1], { field: "Prix" }).ok).toBe(false);
    expect(parseNumberField(true, { field: "Prix" }).ok).toBe(false);
  });

  it("rejette hors des bornes min/max", () => {
    expect(parseNumberField(-1, { field: "Prix", min: 0 }).ok).toBe(false);
    expect(parseNumberField(1000, { field: "Prix", max: 100 }).ok).toBe(false);
  });
});

describe("isMasked", () => {
  it("reconnaît le secret masqué", () => {
    expect(isMasked(MASKED_SECRET)).toBe(true);
    expect(isMasked("vraie-valeur")).toBe(false);
  });
});
