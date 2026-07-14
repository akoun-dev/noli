import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { registerSchema, loginSchema, emailSchema } from "@/lib/validation";
import { createSession, destroySession } from "@/lib/auth-guard";

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, name, phone, password } = body;

    if (action === "register") {
      const parsed = registerSchema.safeParse({ email, name, password, phone });
      if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message || "Champs requis manquants";
        return NextResponse.json({ error: firstError }, { status: 400 });
      }

      const existing = await db.profile.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
      }

      const parts = name.trim().split(/\s+/);
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";

      const profile = await db.profile.create({
        data: {
          email,
          password: hashPassword(password),
          firstName,
          lastName,
          phone: phone || null,
          role: "USER",
        },
      });

      await createSession(profile.id);

      return NextResponse.json({
        user: {
          id: profile.id,
          email: profile.email,
          name: [profile.firstName, profile.lastName].filter(Boolean).join(" "),
          role: profile.role,
        },
      });
    }

    if (action === "login") {
      const parsed = loginSchema.safeParse({ email, password });
      if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message || "Email et mot de passe requis";
        return NextResponse.json({ error: firstError }, { status: 400 });
      }

      const profile = await db.profile.findUnique({ where: { email } });
      if (!profile || !profile.password) {
        return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
      }

      const valid = verifyPassword(password, profile.password);
      if (!valid) {
        return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
      }

      if (!profile.isActive) {
        return NextResponse.json({ error: "Compte désactivé. Contactez le support." }, { status: 403 });
      }

      await createSession(profile.id);

      return NextResponse.json({
        user: {
          id: profile.id,
          email: profile.email,
          name: [profile.firstName, profile.lastName].filter(Boolean).join(" "),
          role: profile.role,
        },
      });
    }

    if (action === "logout") {
      await destroySession();
      return NextResponse.json({ message: "Déconnecté" });
    }

    if (action === "forgot") {
      const parsed = emailSchema.safeParse(email);
      if (!parsed.success) {
        return NextResponse.json({ error: "Adresse email invalide" }, { status: 400 });
      }
      return NextResponse.json({ message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé." });
    }

    if (action === "me") {
      const { getSessionProfile } = await import("@/lib/auth-guard");
      const profile = await getSessionProfile();
      if (!profile) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
      }
      return NextResponse.json({
        user: {
          id: profile.id,
          email: profile.email,
          name: [profile.firstName, profile.lastName].filter(Boolean).join(" "),
          role: profile.role,
        },
      });
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Erreur d'authentification" }, { status: 500 });
  }
}
