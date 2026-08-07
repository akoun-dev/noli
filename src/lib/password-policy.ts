import { db } from "@/lib/db";

/**
 * Applique les règles de complexité de mot de passe configurées dans
 * system_settings (onglet Sécurité) : longueur min, majuscules, minuscules,
 * chiffres, caractères spéciaux.
 *
 * Les réglages sont lus avec un cache court (60 s) pour éviter un SELECT
 * par requête d'inscription.
 */

interface SecurityPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecial: boolean;
}

const DEFAULT_POLICY: SecurityPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: false,
};

let cache: { at: number; policy: SecurityPolicy } | null = null;

async function getPolicy(): Promise<SecurityPolicy> {
  const now = Date.now();
  if (cache && now - cache.at < 60_000) return cache.policy;

  const policy: SecurityPolicy = { ...DEFAULT_POLICY };
  try {
    const { data } = await db
      .from("system_settings")
      .select("key, value")
      .in("key", [
        "password_min_length",
        "password_require_uppercase",
        "password_require_lowercase",
        "password_require_numbers",
        "password_require_special",
      ]);
    for (const row of data || []) {
      const value = String(row.value);
      switch (row.key) {
        case "password_min_length": {
          const n = Number(value);
          if (Number.isFinite(n) && n >= 6) policy.minLength = n;
          break;
        }
        case "password_require_uppercase":
          policy.requireUppercase = value === "true";
          break;
        case "password_require_lowercase":
          policy.requireLowercase = value === "true";
          break;
        case "password_require_numbers":
          policy.requireNumbers = value === "true";
          break;
        case "password_require_special":
          policy.requireSpecial = value === "true";
          break;
      }
    }
  } catch {
    // Table indisponible (env sans seed) → politique par défaut.
  }

  cache = { at: now, policy };
  return policy;
}

export type PasswordPolicyResult =
  | { ok: true }
  | { ok: false; message: string };

export async function validatePasswordPolicy(password: string): Promise<PasswordPolicyResult> {
  const policy = await getPolicy();

  if (password.length < policy.minLength) {
    return {
      ok: false,
      message: `Le mot de passe doit contenir au moins ${policy.minLength} caractères`,
    };
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    return { ok: false, message: "Le mot de passe doit contenir au moins une majuscule" };
  }
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    return { ok: false, message: "Le mot de passe doit contenir au moins une minuscule" };
  }
  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    return { ok: false, message: "Le mot de passe doit contenir au moins un chiffre" };
  }
  if (policy.requireSpecial && !/[^A-Za-z0-9]/.test(password)) {
    return { ok: false, message: "Le mot de passe doit contenir au moins un caractère spécial" };
  }

  return { ok: true };
}
