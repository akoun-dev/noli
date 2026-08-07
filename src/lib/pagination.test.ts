import { describe, expect, it } from "vitest";
import {
  getPagination,
  hasPaginationParams,
  paginationHeaders,
} from "./pagination";

describe("getPagination", () => {
  it("retourne les valeurs par défaut (page=1, limit=50)", () => {
    expect(getPagination(new URLSearchParams())).toEqual({
      page: 1,
      limit: 50,
      offset: 0,
    });
  });

  it("parse page et limit", () => {
    expect(getPagination(new URLSearchParams("page=3&limit=25"))).toEqual({
      page: 3,
      limit: 25,
      offset: 50,
    });
  });

  it("borne la limite à 200", () => {
    expect(getPagination(new URLSearchParams("limit=9999")).limit).toBe(200);
  });

  it("ignore les valeurs invalides et retombe sur les défauts", () => {
    expect(getPagination(new URLSearchParams("page=-2&limit=abc"))).toEqual({
      page: 1,
      limit: 50,
      offset: 0,
    });
  });
});

describe("hasPaginationParams", () => {
  it("retourne false sans paramètre de pagination", () => {
    expect(hasPaginationParams(new URLSearchParams())).toBe(false);
    expect(hasPaginationParams(new URLSearchParams("search=x"))).toBe(false);
  });

  it("retourne true avec page ou limit", () => {
    expect(hasPaginationParams(new URLSearchParams("page=2"))).toBe(true);
    expect(hasPaginationParams(new URLSearchParams("limit=10"))).toBe(true);
  });
});

describe("paginationHeaders", () => {
  it("calcule les en-têtes standards", () => {
    expect(paginationHeaders(120, 3, 50)).toEqual({
      "X-Total-Count": "120",
      "X-Page": "3",
      "X-Limit": "50",
      "X-Page-Count": "3",
    });
  });

  it("retourne au moins une page même sans résultat", () => {
    expect(paginationHeaders(0, 1, 50)["X-Page-Count"]).toBe("1");
  });
});
