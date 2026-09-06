import { NextRequest, NextResponse } from "next/server";
import { db, mapRow, mapRows } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";
import { MASKED_SECRET, isMasked } from "@/lib/security";
import { updateSettingSchema } from "@/lib/validation";

/* ── Default settings (seeded if missing) ─────────────────────── */

const DEFAULTS: {
  key: string;
  value: string;
  category: string;
  label: string;
  type: string;
}[] = [
  // General
  { key: "site_name", value: "NOLI Assurance", category: "general", label: "Nom du site", type: "text" },
  { key: "site_email", value: "contact@noli.ci", category: "general", label: "Email du site", type: "text" },
  { key: "maintenance_mode", value: "false", category: "general", label: "Mode maintenance", type: "boolean" },

  // Email
  { key: "smtp_enabled", value: "false", category: "email", label: "Activer SMTP", type: "boolean" },
  { key: "smtp_host", value: "", category: "email", label: "Hôte SMTP", type: "text" },
  { key: "smtp_port", value: "587", category: "email", label: "Port SMTP", type: "number" },
  { key: "smtp_user", value: "", category: "email", label: "Utilisateur SMTP", type: "text" },
  { key: "smtp_password", value: "", category: "email", label: "Mot de passe SMTP", type: "password" },
  { key: "smtp_from", value: "noreply@noli.ci", category: "email", label: "Email expéditeur", type: "text" },
  { key: "smtp_encryption", value: "tls", category: "email", label: "Chiffrement", type: "text" },

  // Security
  { key: "password_min_length", value: "8", category: "security", label: "Longueur min mot de passe", type: "number" },
  { key: "password_require_uppercase", value: "true", category: "security", label: "Requérir majuscules", type: "boolean" },
  { key: "password_require_lowercase", value: "true", category: "security", label: "Requérir minuscules", type: "boolean" },
  { key: "password_require_numbers", value: "true", category: "security", label: "Requérir chiffres", type: "boolean" },
  { key: "password_require_special", value: "false", category: "security", label: "Requérir caractères spéciaux", type: "boolean" },
  { key: "max_login_attempts", value: "5", category: "security", label: "Tentatives max", type: "number" },
  { key: "lockout_duration", value: "30", category: "security", label: "Durée verrouillage (min)", type: "number" },
  { key: "session_expiry_minutes", value: "60", category: "security", label: "Expiration session (min)", type: "number" },

  // Notification
  { key: "channel_email", value: "true", category: "notification", label: "Canal Email", type: "boolean" },
  { key: "channel_sms", value: "false", category: "notification", label: "Canal SMS", type: "boolean" },
  { key: "channel_push", value: "false", category: "notification", label: "Canal Push", type: "boolean" },
  { key: "event_new_quote", value: "true", category: "notification", label: "Nouveau devis", type: "boolean" },
  { key: "event_user_signup", value: "true", category: "notification", label: "Inscription utilisateur", type: "boolean" },
  { key: "event_quote_status", value: "true", category: "notification", label: "Changement statut devis", type: "boolean" },
  { key: "event_system_alert", value: "true", category: "notification", label: "Alertes système", type: "boolean" },

  // Appearance
  { key: "theme", value: "system", category: "appearance", label: "Thème", type: "text" },
  { key: "language", value: "fr", category: "appearance", label: "Langue", type: "text" },
  { key: "date_format", value: "dd/MM/yyyy", category: "appearance", label: "Format de date", type: "text" },
  { key: "timezone", value: "Africa/Abidjan", category: "appearance", label: "Fuseau horaire", type: "text" },
];

// Clés dont la valeur ne doit JAMAIS être renvoyée en clair à l'API.
// Le front reçoit un placeholder masqué ; le PUT ignore ce placeholder
// afin de ne pas écraser le secret existant.
const SENSITIVE_KEYS = new Set(["smtp_password"]);

async function ensureDefaults() {
  for (const def of DEFAULTS) {
    const { data } = await db.from("system_settings").select("*").eq("key", def.key).maybeSingle();
    const existing = mapRow(data);
    if (!existing) {
      const { error } = await db.from("system_settings").insert({ ...def });
      if (error) throw error;
    }
  }
}

function maskSensitiveValue(key: string, value: string): string {
  if (SENSITIVE_KEYS.has(key) && value) return MASKED_SECRET;
  return value;
}

/* ── GET ──────────────────────────────────────────────────────── */

export async function GET() {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    await ensureDefaults();
    const { data, error } = await db
      .from("system_settings")
      .select("*")
      .order("category", { ascending: true });
    if (error) throw error;
    const all = mapRows<{ key: string; value: string; label: string; type: string; category: string }>(data || []);

    const grouped: Record<string, { key: string; value: string; label: string; type: string }[]> = {};
    for (const s of all) {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push({
        key: s.key,
        value: maskSensitiveValue(s.key, s.value),
        label: s.label,
        type: s.type,
      });
    }

    return NextResponse.json({ settings: grouped });
  } catch (err) {
    console.error("[settings GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── PUT ──────────────────────────────────────────────────────── */

export async function PUT(req: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }
    const parsed = updateSettingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
        { status: 400 }
      );
    }
    const { key, value } = parsed.data;

    // Ne pas écraser un secret avec le placeholder masqué renvoyé par le GET.
    if (SENSITIVE_KEYS.has(key) && isMasked(value)) {
      return NextResponse.json({ success: true, unchanged: true });
    }

    const { data: existing } = await db.from("system_settings").select("id").eq("key", key).maybeSingle();
    if (existing) {
      const { error } = await db.from("system_settings").update({ value }).eq("key", key);
      if (error) throw error;
    } else {
      const { error } = await db.from("system_settings").insert({
        key,
        value,
        category: "general",
        label: key,
        type: SENSITIVE_KEYS.has(key) ? "password" : "text",
      });
      if (error) throw error;
    }

    // Ne jamais journaliser la valeur d'un secret.
    await logAudit({
      action: "SETTINGS_CHANGE",
      entity: "Settings",
      details: SENSITIVE_KEYS.has(key) ? { key, changed: true } : { key, value },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[settings PUT]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
