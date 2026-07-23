import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSessionProfile } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  try {
    const sessionProfile = await getSessionProfile();
    if (!sessionProfile) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || sessionProfile.id;
    if (userId !== sessionProfile.id && sessionProfile.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const profile = await db.profile.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        ...profile,
        name: [profile.firstName, profile.lastName].filter(Boolean).join(" "),
      },
    });
  } catch (error) {
    console.error("User profile GET error:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement du profil" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionProfile = await getSessionProfile();
    if (!sessionProfile) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, firstName, lastName, phone, currentPassword, newPassword } = body;

    const targetId = userId || sessionProfile.id;
    if (targetId !== sessionProfile.id && sessionProfile.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const profile = await db.profile.findUnique({ where: { id: targetId } });
    if (!profile) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      firstName: firstName ?? profile.firstName,
      lastName: lastName ?? profile.lastName,
      phone: phone ?? profile.phone,
    };

    if (currentPassword && newPassword) {
      const valid = bcrypt.compareSync(currentPassword, profile.password);
      if (!valid) {
        return NextResponse.json(
          { error: "Mot de passe actuel incorrect" },
          { status: 400 }
        );
      }
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "Le nouveau mot de passe doit contenir au moins 6 caractères" },
          { status: 400 }
        );
      }
      updateData.password = bcrypt.hashSync(newPassword, 10);
    }

    const updated = await db.profile.update({
      where: { id: targetId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      profile: {
        ...updated,
        name: [updated.firstName, updated.lastName].filter(Boolean).join(" "),
      },
    });
  } catch (error) {
    console.error("User profile PUT error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
