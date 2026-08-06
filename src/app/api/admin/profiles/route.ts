import { db, mapRow, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";

    let query = db
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    const profiles = mapRows(data || []);

    const profilesWithCount = await Promise.all(
      profiles.map(async (p) => {
        const { count } = await db
          .from("quotes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", p.id);
        return { ...p, _count: { quotes: count ?? 0 } };
      })
    );

    return NextResponse.json(profilesWithCount);
  } catch (error) {
    console.error("Erreur profiles GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des profils" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const body = await request.json();
    const { id, firstName, lastName, phone, role, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: "L'identifiant du profil est requis" },
        { status: 400 }
      );
    }

    const { data: existingData } = await db
      .from("profiles")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (!existingData) {
      return NextResponse.json(
        { error: "Profil introuvable" },
        { status: 404 }
      );
    }

    const validRoles = ["USER", "INSURER", "ADMIN"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Rôle invalide. Valeurs autorisées : USER, INSURER, ADMIN" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (firstName !== undefined) updateData.first_name = firstName || null;
    if (lastName !== undefined) updateData.last_name = lastName || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data: profileData, error } = await db
      .from("profiles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    const profile = mapRow(profileData);

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Erreur profiles PUT:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du profil" },
      { status: 500 }
    );
  }
}
