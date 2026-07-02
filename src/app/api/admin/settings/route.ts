import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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

async function ensureDefaults() {
  for (const def of DEFAULTS) {
    const existing = await db.systemSetting.findUnique({ where: { key: def.key } });
    if (!existing) {
      await db.systemSetting.create({ data: def });
    }
  }
}

/* ── GET ──────────────────────────────────────────────────────── */

export async function GET() {
  try {
    await ensureDefaults();
    const all = await db.systemSetting.findMany({ orderBy: { category: "asc" } });

    const grouped: Record<string, { key: string; value: string; label: string; type: string }[]> = {};
    for (const s of all) {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push({
        key: s.key,
        value: s.value,
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
  try {
    const body = await req.json();
    const { key, value } = body as { key?: string; value?: string };

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Clé et valeur requis" }, { status: 400 });
    }

    await db.systemSetting.upsert({
      where: { key },
      update: { value },
      create: {
        key,
        value,
        category: "general",
        label: key,
        type: "text",
      },
    });

    await db.auditLog.create({
      data: {
        action: "SETTINGS_CHANGE",
        entity: "Settings",
        details: JSON.stringify({ key, value }),
        userName: "SYSTEM",
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[settings PUT]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}