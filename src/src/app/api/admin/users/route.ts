import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { updateUserSchema } from "@/lib/validation";
import { requireAuth } from "@/lib/auth-guard";

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { quotes: true } },
} as const;

export async function GET() {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const profiles = await db.profile.findMany({
      select: userSelect,
      orderBy: { createdAt: "desc" },
    });
    const users = profiles.map((p) => ({
      id: p.id,
      email: p.email,
      name: [p.firstName, p.lastName].filter(Boolean).join(" "),
      phone: p.phone,
      role: p.role,
      isActive: p.isActive,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      _count: p._count,
    }));
    return NextResponse.json(users);
  } catch (error) {
    console.error("Erreur utilisateurs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const body = await request.json();

    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Données invalides";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const existing = await db.profile.findUnique({
      where: { id: parsed.data.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) {
      const parts = parsed.data.name.trim().split(/\s+/);
      updateData.firstName = parts[0] || "";
      updateData.lastName = parts.slice(1).join(" ") || "";
    }
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
    if (parsed.data.role !== undefined) updateData.role = parsed.data.role;
    if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;

    const profile = await db.profile.update({
      where: { id: parsed.data.id },
      data: updateData,
      select: userSelect,
    });

    const user = {
      id: profile.id,
      email: profile.email,
      name: [profile.firstName, profile.lastName].filter(Boolean).join(" "),
      phone: profile.phone,
      role: profile.role,
      isActive: profile.isActive,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      _count: profile._count,
    };
    return NextResponse.json(user);
  } catch (error) {
    console.error("Erreur mise à jour utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
