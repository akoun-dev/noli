import { db, mapRow } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile, getSupabaseServerClient } from "@/lib/auth-guard";
import { validatePasswordPolicy } from "@/lib/password-policy";

type ProfileRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
};

type ProfileUpdateRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
};

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

    const { data, error } = await db
      .from("profiles")
      .select("id, email, first_name, last_name, phone, role, is_active, created_at")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    const profile = mapRow<ProfileRow>(data);

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

    const { data, error } = await db
      .from("profiles")
      .select("id, email, first_name, last_name, phone, role, is_active, created_at, updated_at")
      .eq("id", targetId)
      .maybeSingle();
    if (error) throw error;
    const profile = mapRow<ProfileRow>(data);
    if (!profile) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      first_name: firstName ?? profile.firstName,
      last_name: lastName ?? profile.lastName,
      phone: phone ?? profile.phone,
    };

    // Changement de mot de passe : les deux champs sont requis et la
    // complexité est validée selon la politique configurée (B-01).
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Le mot de passe actuel est requis" },
          { status: 400 }
        );
      }
      const policy = await validatePasswordPolicy(newPassword);
      if (!policy.ok) {
        return NextResponse.json({ error: policy.message }, { status: 400 });
      }
      const supabase = await getSupabaseServerClient();
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: sessionProfile.email,
        password: currentPassword,
      });
      if (verifyError) {
        return NextResponse.json(
          { error: "Mot de passe actuel incorrect" },
          { status: 401 }
        );
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
    }

    const { data: updatedData, error: updateError } = await db
      .from("profiles")
      .update(updateData)
      .eq("id", targetId)
      .select("id, email, first_name, last_name, phone, role, is_active")
      .single();
    if (updateError) throw updateError;
    const updated = mapRow<ProfileUpdateRow>(updatedData)!;

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
