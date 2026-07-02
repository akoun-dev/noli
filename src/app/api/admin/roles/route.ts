import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/* ── Default roles (seeded if missing) ────────────────────────── */

const DEFAULT_ROLES = [
  {
    name: "ADMIN",
    description: "Administrateur système – accès complet",
    isDefault: true,
  },
  {
    name: "INSURER",
    description: "Gestionnaire assureur – offres, garanties, devis",
    isDefault: true,
  },
  {
    name: "USER",
    description: "Utilisateur standard – consultation et demandes de devis",
    isDefault: true,
  },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Super Admin",
  INSURER: "Gestionnaire Assureur",
  USER: "Utilisateur",
};

async function ensureDefaults() {
  for (const def of DEFAULT_ROLES) {
    const existing = await db.role.findUnique({ where: { name: def.name } });
    if (!existing) {
      await db.role.create({ data: def });
    }
  }
}

/* ── GET ──────────────────────────────────────────────────────── */

export async function GET() {
  try {
    await ensureDefaults();
    const roles = await db.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const result = roles.map((r) => ({
      id: r.id,
      name: r.name,
      label: ROLE_LABELS[r.name] || r.name,
      description: r.description || "",
      isDefault: r.isDefault,
      permissionCount: r.permissions.length,
      permissions: r.permissions.map((rp) => ({
        id: rp.permission.id,
        code: rp.permission.code,
        name: rp.permission.name,
        category: rp.permission.category,
      })),
    }));

    return NextResponse.json({ roles: result });
  } catch (err) {
    console.error("[roles GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── POST : Créer un rôle avec permissions ───────────────────── */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, permissionIds } = body as {
      name: string;
      description?: string;
      permissionIds?: string[];
    };

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nom du rôle requis" }, { status: 400 });
    }

    const existing = await db.role.findUnique({ where: { name: name.trim() } });
    if (existing) {
      return NextResponse.json({ error: "Un rôle avec ce nom existe déjà" }, { status: 409 });
    }

    const role = await db.role.create({
      data: {
        name: name.trim(),
        description: description || null,
        isDefault: false,
      },
    });

    if (permissionIds && permissionIds.length > 0) {
      await db.rolePermission.createMany({
        data: permissionIds.map((pid) => ({ roleId: role.id, permissionId: pid })),
      });
    }

    await db.auditLog.create({
      data: {
        action: "CREATE",
        entity: "Role",
        entityId: role.id,
        details: JSON.stringify({ name: role.name, permissionCount: permissionIds?.length || 0 }),
        userName: "SYSTEM",
      },
    });

    return NextResponse.json(
      { id: role.id, name: role.name, description: role.description },
      { status: 201 }
    );
  } catch (err) {
    console.error("[roles POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}