import { NextRequest, NextResponse } from "next/server";
import { db, mapRow, mapRows } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";

/* ── GET : Rôles personnalisés d'un profil ───────────────────── */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;
    const { data, error } = await db
      .from("profile_roles")
      .select(
        "role:roles(id, name, description, is_default, permissions:role_permissions(permission:permissions(id, code, name, category)))"
      )
      .eq("profile_id", id);
    if (error) throw error;

    const roles = mapRows(data || []).map((pr) => ({
      id: pr.role.id,
      name: pr.role.name,
      description: pr.role.description,
      isDefault: pr.role.isDefault,
      permissions: (pr.role.permissions || []).map((rp) => ({
        id: rp.permission.id,
        code: rp.permission.code,
        name: rp.permission.name,
        category: rp.permission.category,
      })),
    }));

    return NextResponse.json({ roles });
  } catch (err) {
    console.error("[profiles/[id]/roles GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── PUT : Assigner des rôles à un profil ────────────────────── */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;
    const body = await request.json();
    const { roleIds } = body as { roleIds: string[] };

    const { data: profileData } = await db
      .from("profiles")
      .select("id, email")
      .eq("id", id)
      .maybeSingle();
    const profile = mapRow(profileData);
    if (!profile) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    // Supprimer les anciennes affectations
    const { error: delError } = await db.from("profile_roles").delete().eq("profile_id", id);
    if (delError) throw delError;

    // Créer les nouvelles affectations
    if (roleIds && roleIds.length > 0) {
      const { error: insError } = await db
        .from("profile_roles")
        .insert(roleIds.map((roleId) => ({ profile_id: id, role_id: roleId })));
      if (insError) throw insError;
    }

    const { error: auditError } = await db.from("audit_logs").insert({
      action: "UPDATE",
      entity: "Profile",
      entity_id: id,
      details: JSON.stringify({ action: "assign_roles", roleIds }),
      user_name: "SYSTEM",
      user_email: profile.email,
    });
    if (auditError) throw auditError;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[profiles/[id]/roles PUT]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
