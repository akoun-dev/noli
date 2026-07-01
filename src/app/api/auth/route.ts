import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, name, phone, password } = body;

    if (action === "register") {
      if (!email || !name || !password) {
        return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
      }
      const existing = await db.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
      }
      const user = await db.user.create({
        data: {
          email,
          name,
          phone: phone || null,
          password: password, // In production, this would be hashed with bcrypt
          role: "USER",
        },
      });
      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    }

    if (action === "login") {
      if (!email || !password) {
        return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
      }
      const user = await db.user.findUnique({ where: { email } });
      if (!user || user.password !== password) {
        return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
      }
      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Erreur d'authentification" }, { status: 500 });
  }
}