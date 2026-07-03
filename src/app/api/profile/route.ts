import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Identifiant utilisateur requis" }, { status: 400 });
    }
    const profile = await db.profile.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        photoUrl: true,
        role: true,
        createdAt: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    return NextResponse.json({
      ...profile,
      name: [profile.firstName, profile.lastName].filter(Boolean).join(" "),
    });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Erreur lors du chargement du profil" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, firstName, lastName, phone, photoUrl, currentPassword, newPassword } = body;

    if (!userId) {
      return NextResponse.json({ error: "Identifiant utilisateur requis" }, { status: 400 });
    }

    const profile = await db.profile.findUnique({ where: { id: userId } });
    if (!profile) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    const updateData: Record<string, string | null> = {};

    if (firstName !== undefined) updateData.firstName = firstName || null;
    if (lastName !== undefined) updateData.lastName = lastName || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl || null;

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Le mot de passe actuel est requis" }, { status: 400 });
      }
      const valid = bcrypt.compareSync(currentPassword, profile.password);
      if (!valid) {
        return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 401 });
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
      where: { id: profile.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        photoUrl: true,
        role: true,
      },
    });

    return NextResponse.json({
      ...updated,
      name: [updated.firstName, updated.lastName].filter(Boolean).join(" "),
    });
  } catch (error) {
    console.error("Profile PUT error:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}