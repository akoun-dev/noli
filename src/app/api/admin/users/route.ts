import { db, mapRow, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { updateUserSchema } from "@/lib/validation";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const { data, error } = await db
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const profiles = mapRows(data || []);

    const users = await Promise.all(
      profiles.map(async (p) => {
        const { count } = await db
          .from("quotes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", p.id);
        return {
          id: p.id,
          email: p.email,
          name: [p.firstName, p.lastName].filter(Boolean).join(" "),
          phone: p.phone,
          role: p.role,
          isActive: p.isActive,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          _count: { quotes: count ?? 0 },
        };
      })
    );
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

    const { data: existingData } = await db
      .from("profiles")
      .select("id")
      .eq("id", parsed.data.id)
      .maybeSingle();
    if (!existingData) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) {
      const parts = parsed.data.name.trim().split(/\s+/);
      updateData.first_name = parts[0] || "";
      updateData.last_name = parts.slice(1).join(" ") || "";
    }
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
    if (parsed.data.role !== undefined) updateData.role = parsed.data.role;
    if (parsed.data.isActive !== undefined) updateData.is_active = parsed.data.isActive;

    const { data: profileData, error } = await db
      .from("profiles")
      .update(updateData)
      .eq("id", parsed.data.id)
      .select()
      .single();
    if (error) throw error;

    const profile = mapRow(profileData);
    const { count } = await db
      .from("quotes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", parsed.data.id);

    const user = {
      id: profile?.id,
      email: profile?.email,
      name: [profile?.firstName, profile?.lastName].filter(Boolean).join(" "),
      phone: profile?.phone,
      role: profile?.role,
      isActive: profile?.isActive,
      createdAt: profile?.createdAt,
      updatedAt: profile?.updatedAt,
      _count: { quotes: count ?? 0 },
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
