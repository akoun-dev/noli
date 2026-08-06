import { db, mapRow } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile, getSupabaseServerClient } from "@/lib/auth-guard";

type ProfileRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  createdAt: string;
};

type ProfileUpdateRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
};

export async function GET(request: NextRequest) {
  try {
    const profile = await getSessionProfile();
    if (!profile) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    const userId = request.nextUrl.searchParams.get("userId");
    if (userId && userId !== profile.id && profile.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    const targetId = userId || profile.id;

    const { data, error } = await db
      .from("profiles")
      .select("id, email, first_name, last_name, phone, role, created_at")
      .eq("id", targetId)
      .maybeSingle();
    if (error) throw error;
    const row = mapRow<ProfileRow>(data);

    if (!row) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    return NextResponse.json({
      ...row,
      name: [row.firstName, row.lastName].filter(Boolean).join(" "),
    });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Erreur lors du chargement du profil" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionProfile = await getSessionProfile();
    if (!sessionProfile) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, firstName, lastName, phone, photoUrl, currentPassword, newPassword } = body;

    const targetId = userId || sessionProfile.id;
    if (targetId !== sessionProfile.id && sessionProfile.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { data, error } = await db
      .from("profiles")
      .select("id, email, first_name, last_name, phone, role, created_at, updated_at")
      .eq("id", targetId)
      .maybeSingle();
    if (error) throw error;
    const profile = mapRow<ProfileRow>(data);
    if (!profile) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    const updateData: Record<string, string | null> = {};

    if (firstName !== undefined) updateData.first_name = firstName || null;
    if (lastName !== undefined) updateData.last_name = lastName || null;
    if (phone !== undefined) updateData.phone = phone || null;

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Le mot de passe actuel est requis" }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "Le nouveau mot de passe doit contenir au moins 6 caractères" },
          { status: 400 }
        );
      }
      const supabase = await getSupabaseServerClient();
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: sessionProfile.email,
        password: currentPassword,
      });
      if (verifyError) {
        return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 401 });
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
    }

    const { data: updatedData, error: updateError } = await db
      .from("profiles")
      .update(updateData)
      .eq("id", profile.id)
      .select("id, email, first_name, last_name, phone, role")
      .single();
    if (updateError) throw updateError;
    const updated = mapRow<ProfileUpdateRow>(updatedData)!;

    return NextResponse.json({
      ...updated,
      name: [updated.firstName, updated.lastName].filter(Boolean).join(" "),
    });
  } catch (error) {
    console.error("Profile PUT error:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}
