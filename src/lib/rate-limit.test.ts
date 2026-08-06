import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkRateLimit, getClientIp } from "./rate-limit";

describe("checkRateLimit", () => {
  it("autorise les requêtes tant que la limite n'est pas atteinte", () => {
    const key = `test:${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      const result = checkRateLimit(key, 3, 60);
      expect(result.allowed).toBe(true);
    }
  });

  it("bloque au-delà de la limite dans la même fenêtre", () => {
    const key = `test:${Math.random()}`;
    checkRateLimit(key, 2, 60);
    checkRateLimit(key, 2, 60);
    const result = checkRateLimit(key, 2, 60);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("réinitialise le compteur après expiration de la fenêtre", () => {
    vi.useFakeTimers();
    const key = `test:${Math.random()}`;
    checkRateLimit(key, 1, 1); // fenêtre de 1s, limite de 1
    expect(checkRateLimit(key, 1, 1).allowed).toBe(false);
    vi.advanceTimersByTime(1100);
    expect(checkRateLimit(key, 1, 1).allowed).toBe(true);
    vi.useRealTimers();
  });

  it("isole les compteurs par clé", () => {
    const keyA = `test:a:${Math.random()}`;
    const keyB = `test:b:${Math.random()}`;
    checkRateLimit(keyA, 1, 60);
    expect(checkRateLimit(keyA, 1, 60).allowed).toBe(false);
    expect(checkRateLimit(keyB, 1, 60).allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("privilégie x-real-ip", () => {
    const req = new Request("https://example.com", {
      headers: { "x-real-ip": "1.2.3.4", "x-forwarded-for": "5.6.7.8" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("retombe sur x-forwarded-for (premier segment)", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "5.6.7.8, 9.9.9.9" },
    });
    expect(getClientIp(req)).toBe("5.6.7.8");
  });

  it("retourne 'unknown' sans en-tête", () => {
    const req = new Request("https://example.com");
    expect(getClientIp(req)).toBe("unknown");
  });
});
