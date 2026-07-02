import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

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

    /* ── REGISTER ── */
    if (action === "register") {
      if (!email || !name || !password) {
        return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
      }
      if (password.length < 6) {
        return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, { status: 400 });
      }

      const existing = await db.profile.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
      }

      // Split "Jean Dupont" into firstName/lastName
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

      return NextResponse.json({
        user: {
          id: profile.id,
          email: profile.email,
          name: [profile.firstName, profile.lastName].filter(Boolean).join(" "),
          role: profile.role,
          photoUrl: profile.photoUrl,
        },
      });
    }

    /* ── LOGIN ── */
    if (action === "login") {
      if (!email || !password) {
        return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
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

      return NextResponse.json({
        user: {
          id: profile.id,
          email: profile.email,
          name: [profile.firstName, profile.lastName].filter(Boolean).join(" "),
          role: profile.role,
          photoUrl: profile.photoUrl,
        },
      });
    }

    /* ── FORGOT PASSWORD ── */
    if (action === "forgot") {
      if (!email) {
        return NextResponse.json({ error: "L'email est requis" }, { status: 400 });
      }
      // In production, send a reset email. For now, always return success to avoid email enumeration.
      return NextResponse.json({ message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé." });
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Erreur d'authentification" }, { status: 500 });
  }
}