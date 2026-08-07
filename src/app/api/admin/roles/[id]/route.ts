import { NextRequest, NextResponse } from "next/server";
import { db, mapRow } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";

/* ── GET : Rôle unique avec permissions ──────────────────────── */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;
    const { data, error } = await db
      .from("roles")
      .select(
        "*, permissions:role_permissions(permission:permissions(id, code, name, category)), profile_roles(profile_id)"
      )
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    const role = mapRow(data);

    if (!role) {
      return NextResponse.json({ error: "Rôle non trouvé" }, { status: 404 });
    }

    return NextResponse.json({
      id: role.id,
      name: role.name,
      description: role.description,
      isDefault: role.isDefault,
      permissions: ((role.permissions as any[]) || []).map((rp) => ({
        id: rp.permission.id,
        code: rp.permission.code,
        name: rp.permission.name,
        category: rp.permission.category,
      })),
      profileCount: ((role.profileRoles as any[]) || []).length,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    });
  } catch (err) {
    console.error("[roles/[id] GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── PUT : Mettre à jour rôle + permissions ──────────────────── */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;
    const body = await request.json();
    const { name, description, permissionIds } = body as {
      name?: string;
      description?: string;
      permissionIds?: string[];
    };

    const { data: existingData } = await db.from("roles").select("id").eq("id", id).maybeSingle();
    const existing = mapRow(existingData);
    if (!existing) {
      return NextResponse.json({ error: "Rôle non trouvé" }, { status: 404 });
    }

    // Mise à jour des champs
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    const { error: updError } = await db.from("roles").update(updateData).eq("id", id);
    if (updError) throw updError;

    // Synchronisation des permissions
    if (permissionIds) {
      const { error: delError } = await db.from("role_permissions").delete().eq("role_id", id);
      if (delError) throw delError;
      if (permissionIds.length > 0) {
        const { error: insError } = await db
          .from("role_permissions")
          .insert(permissionIds.map((pid) => ({ role_id: id, permission_id: pid })));
        if (insError) throw insError;
      }
    }

    await logAudit({
      action: "UPDATE",
      entity: "Role",
      entityId: id,
      details: { name, description, permissionCount: permissionIds?.length },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[roles/[id] PUT]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── DELETE : Supprimer un rôle ──────────────────────────────── */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;
    const { data } = await db.from("roles").select("*").eq("id", id).maybeSingle();
    const role = mapRow(data);

    if (!role) {
      return NextResponse.json({ error: "Rôle non trouvé" }, { status: 404 });
    }

    if (role.isDefault) {
      return NextResponse.json(
        { error: "Impossible de supprimer un rôle par défaut" },
        { status: 400 }
      );
    }

    const { error } = await db.from("roles").delete().eq("id", id);
    if (error) throw error;

    await logAudit({
      action: "DELETE",
      entity: "Role",
      entityId: id,
      details: { roleName: role.name },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[roles/[id] DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
