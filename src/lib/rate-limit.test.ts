import { describe, it, expect, vi } from "vitest";
import type { NextRequest } from "next/server";
import { checkRateLimit, getClientIp } from "./rate-limit";

const OPTS = { maxAttempts: 3, windowMs: 60_000, lockoutMs: 30 * 60_000 };

// IP unique par test pour isoler l'état (buckets est un Map module-level).
describe("checkRateLimit", () => {
  it("autorise jusqu'à maxAttempts puis verrouille", () => {
    const ip = "ip-A";
    expect(checkRateLimit(ip, "act", OPTS).ok).toBe(true);
    expect(checkRateLimit(ip, "act", OPTS).ok).toBe(true);
    expect(checkRateLimit(ip, "act", OPTS).ok).toBe(true);
    const r = checkRateLimit(ip, "act", OPTS);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.locked).toBe(true);
      expect(r.retryAfterSec).toBeGreaterThan(0);
    }
  });

  it("isole les compteurs par IP", () => {
    expect(checkRateLimit("ip-B", "act", OPTS).ok).toBe(true);
    // Une autre IP démarre à zéro, non impactée par ip-B.
    expect(checkRateLimit("ip-C", "act", OPTS).ok).toBe(true);
  });

  it("réautorise après expiration du verrou/fenêtre", () => {
    vi.useFakeTimers();
    try {
      const ip = "ip-D";
      checkRateLimit(ip, "act", OPTS);
      checkRateLimit(ip, "act", OPTS);
      checkRateLimit(ip, "act", OPTS);
      expect(checkRateLimit(ip, "act", OPTS).ok).toBe(false); // verrouillé
      vi.advanceTimersByTime(OPTS.lockoutMs + 1_000);
      expect(checkRateLimit(ip, "act", OPTS).ok).toBe(true); // de nouveau autorisé
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("getClientIp", () => {
  const mkReq = (headers: Record<string, string>): NextRequest =>
    ({
      headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
    }) as unknown as NextRequest;

  it("prend la première IP de x-forwarded-for", () => {
    expect(getClientIp(mkReq({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
  });

  it("retombe sur x-real-ip", () => {
    expect(getClientIp(mkReq({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
  });

  it("retombe sur 'unknown' sans en-tête", () => {
    expect(getClientIp(mkReq({}))).toBe("unknown");
  });
});
