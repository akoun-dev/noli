import { db, mapRow, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { updateUserSchema } from "@/lib/validation";
import { requireAuth, getSessionProfile } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";
import {
  getPagination,
  hasPaginationParams,
  paginationHeaders,
} from "@/lib/pagination";

export async function GET(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const { searchParams } = request.nextUrl;
    const paginate = hasPaginationParams(searchParams);
    const { page, limit, offset } = getPagination(searchParams);

    let query = db
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (paginate) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const total = count ?? (data || []).length;
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
    return NextResponse.json(users, {
      headers: paginationHeaders(total, page, limit),
    });
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
      .select("id, role, is_active")
      .eq("id", parsed.data.id)
      .maybeSingle();
    const existing = mapRow<{ id: string; role: string; isActive: boolean }>(existingData);
    if (!existing) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // SEC-002 : identité de l'admin connecté (garde anti auto-modification).
    const admin = await getSessionProfile();
    if (!admin) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const willDeactivate = parsed.data.isActive === false;
    const willDemote = parsed.data.role !== undefined && parsed.data.role !== "ADMIN";

    // a) Un admin ne peut pas désactiver son propre compte ni rétrograder son propre rôle.
    if (admin.id === existing.id && (willDeactivate || willDemote)) {
      return NextResponse.json(
        { error: "Action interdite : vous ne pouvez pas désactiver votre propre compte ni modifier votre propre rôle." },
        { status: 403 }
      );
    }

    // b) Un ADMIN actif ne peut pas être désactivé/rétrogradé s'il est le dernier admin actif.
    if (existing.role === "ADMIN" && existing.isActive && (willDeactivate || willDemote)) {
      const { count: otherAdmins } = await db
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "ADMIN")
        .eq("is_active", true)
        .neq("id", parsed.data.id);
      if ((otherAdmins ?? 0) === 0) {
        return NextResponse.json(
          { error: "Impossible de désactiver ou de rétrograder le dernier administrateur actif." },
          { status: 409 }
        );
      }
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

    // M-03 : toute modification utilisateur (rôle, désactivation...) doit être tracée.
    await logAudit({
      action: "UPDATE",
      entity: "User",
      entityId: parsed.data.id,
      details: updateData,
    });

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
