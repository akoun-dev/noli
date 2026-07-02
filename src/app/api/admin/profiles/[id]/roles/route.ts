import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/* ── GET : Rôles personnalisés d'un profil ───────────────────── */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profileRoles = await db.profileRole.findMany({
      where: { profileId: id },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });

    const roles = profileRoles.map((pr) => ({
      id: pr.role.id,
      name: pr.role.name,
      description: pr.role.description,
      isDefault: pr.role.isDefault,
      permissions: pr.role.permissions.map((rp) => ({
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
    const { id } = await params;
    const body = await request.json();
    const { roleIds } = body as { roleIds: string[] };

    const profile = await db.profile.findUnique({ where: { id } });
    if (!profile) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    // Supprimer les anciennes affectations
    await db.profileRole.deleteMany({ where: { profileId: id } });

    // Créer les nouvelles affectations
    if (roleIds && roleIds.length > 0) {
      await db.profileRole.createMany({
        data: roleIds.map((roleId) => ({ profileId: id, roleId })),
      });
    }

    await db.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "Profile",
        entityId: id,
        details: JSON.stringify({ action: "assign_roles", roleIds }),
        userName: "SYSTEM",
        userEmail: profile.email,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[profiles/[id]/roles PUT]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}