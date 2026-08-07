import type { NextRequest } from "next/server";

/**
 * Rate limiting en mémoire (fenêtre glissante), par IP + action.
 *
 * Conçu pour le déploiement actuel (PM2 mono-instance, processus unique).
 * En multi-instance ou serverless, il faudra le remplacer par un stockage
 * partagé (Redis / Upstash) — voir .env.example.
 */

interface Bucket {
  count: number;
  windowStart: number;
  lockedUntil: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Nombre max de tentatives par fenêtre. */
  maxAttempts: number;
  /** Durée de la fenêtre en ms. */
  windowMs: number;
  /** Durée de verrouillage en ms après dépassement. */
  lockoutMs: number;
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number; locked: boolean };

function bucketKey(ip: string, action: string): string {
  return `${ip}|${action}`;
}

/** Nettoie périodiquement les buckets expirés pour borner la mémoire. */
function prune(): void {
  const now = Date.now();
  if (buckets.size < 10_000) return;
  for (const [k, b] of buckets) {
    if (now - b.windowStart > 60 * 60_000 && b.lockedUntil < now) {
      buckets.delete(k);
    }
  }
}

export function checkRateLimit(
  ip: string,
  action: string,
  { maxAttempts, windowMs, lockoutMs }: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const key = bucketKey(ip, action);
  prune();

  let bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart >= windowMs) {
    bucket = { count: 0, windowStart: now, lockedUntil: 0 };
    buckets.set(key, bucket);
  }

  if (bucket.lockedUntil > now) {
    return {
      ok: false,
      locked: true,
      retryAfterSec: Math.ceil((bucket.lockedUntil - now) / 1000),
    };
  }

  bucket.count += 1;
  if (bucket.count > maxAttempts) {
    bucket.lockedUntil = now + lockoutMs;
    return {
      ok: false,
      locked: true,
      retryAfterSec: Math.ceil(lockoutMs / 1000),
    };
  }

  return { ok: true };
}

/** Extrait l'IP du client depuis les en-têtes proxy, avec repli sûr. */
export function getClientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

/* ── Politiques dédiées à l'authentification ─────────────────────── */

const LOGIN_LIMIT: RateLimitOptions = {
  maxAttempts: 5, // tentatives / fenêtre
  windowMs: 60_000,
  lockoutMs: 30 * 60_000, // verrouillage 30 min (aligné sur lockout_duration)
};

const REGISTER_LIMIT: RateLimitOptions = {
  maxAttempts: 5, // inscriptions / 10 min
  windowMs: 10 * 60_000,
  lockoutMs: 60 * 60_000,
};

const FORGOT_LIMIT: RateLimitOptions = {
  maxAttempts: 3, // demandes / 10 min (anti-spam email)
  windowMs: 10 * 60_000,
  lockoutMs: 60 * 60_000,
};

/** Rate limit sur le login : clé = IP + email pour bloquer le brute-force ciblé. */
export function checkLoginRateLimit(ip: string, email: string): RateLimitResult {
  return checkRateLimit(ip, `login:${email}`, LOGIN_LIMIT);
}

export function checkRegisterRateLimit(ip: string): RateLimitResult {
  return checkRateLimit(ip, "register", REGISTER_LIMIT);
}

export function checkForgotRateLimit(ip: string, email: string): RateLimitResult {
  return checkRateLimit(ip, `forgot:${email}`, FORGOT_LIMIT);
}
