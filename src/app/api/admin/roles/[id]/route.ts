import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/* ── GET : Rôle unique avec permissions ──────────────────────── */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const role = await db.role.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } },
        profiles: true,
      },
    });

    if (!role) {
      return NextResponse.json({ error: "Rôle non trouvé" }, { status: 404 });
    }

    return NextResponse.json({
      id: role.id,
      name: role.name,
      description: role.description,
      isDefault: role.isDefault,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        code: rp.permission.code,
        name: rp.permission.name,
        category: rp.permission.category,
      })),
      profileCount: role.profiles.length,
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
    const { id } = await params;
    const body = await request.json();
    const { name, description, permissionIds } = body as {
      name?: string;
      description?: string;
      permissionIds?: string[];
    };

    const existing = await db.role.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Rôle non trouvé" }, { status: 404 });
    }

    // Mise à jour des champs
    await db.role.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      },
    });

    // Synchronisation des permissions
    if (permissionIds) {
      await db.rolePermission.deleteMany({ where: { roleId: id } });
      if (permissionIds.length > 0) {
        await db.rolePermission.createMany({
          data: permissionIds.map((pid) => ({ roleId: id, permissionId: pid })),
        });
      }
    }

    await db.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "Role",
        entityId: id,
        details: JSON.stringify({ name, description, permissionCount: permissionIds?.length }),
        userName: "SYSTEM",
      },
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
    const { id } = await params;
    const role = await db.role.findUnique({ where: { id } });

    if (!role) {
      return NextResponse.json({ error: "Rôle non trouvé" }, { status: 404 });
    }

    if (role.isDefault) {
      return NextResponse.json(
        { error: "Impossible de supprimer un rôle par défaut" },
        { status: 400 }
      );
    }

    await db.role.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        action: "DELETE",
        entity: "Role",
        entityId: id,
        details: JSON.stringify({ roleName: role.name }),
        userName: "SYSTEM",
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[roles/[id] DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}