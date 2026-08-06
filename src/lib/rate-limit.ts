// Limiteur de débit simple, en mémoire de processus.
//
// Adapté au mode de déploiement actuel de NOLI : une seule instance PM2
// (exec_mode: "fork", instances: 1 — voir ecosystem.config.js), donc pas
// besoin d'un store partagé (Redis/Upstash) pour l'instant.
//
// ⚠️ Si le déploiement passe un jour en plusieurs instances (cluster,
// plusieurs conteneurs), remplacer ce module par un limiteur adossé à un
// store partagé (ex. Upstash Redis) — chaque instance aurait sinon son
// propre compteur, ce qui multiplierait la limite réelle par le nombre
// d'instances.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Purge périodique pour éviter une fuite mémoire sur les clés expirées.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Vérifie et incrémente le compteur pour `key` (ex. "auth:login:<ip>").
 * @param key identifiant unique du bucket (action + IP, typiquement)
 * @param limit nombre de requêtes autorisées par fenêtre
 * @param windowSeconds durée de la fenêtre glissante (secondes)
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    retryAfterSeconds: 0,
  };
}

/** Extrait une IP client raisonnable depuis les en-têtes de proxy (Caddy transmet X-Real-IP / X-Forwarded-For). */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return "unknown";
}
