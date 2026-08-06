import { NextRequest, NextResponse } from "next/server";
import { db, mapRow, mapRows } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";

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
    const { data } = await db.from("roles").select("*").eq("name", def.name).maybeSingle();
    const existing = mapRow(data);
    if (!existing) {
      const { error } = await db.from("roles").insert({
        name: def.name,
        description: def.description,
        is_default: def.isDefault,
      });
      if (error) throw error;
    }
  }
}

/* ── GET ──────────────────────────────────────────────────────── */

export async function GET() {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    await ensureDefaults();
    const { data, error } = await db
      .from("roles")
      .select(
        "*, permissions:role_permissions(permission:permissions(id, code, name, category))"
      )
      .order("name", { ascending: true });
    if (error) throw error;

    const roles = mapRows(data || []);

    const result = roles.map((r) => ({
      id: r.id,
      name: r.name,
      label: ROLE_LABELS[r.name] || r.name,
      description: r.description || "",
      isDefault: r.isDefault,
      permissionCount: (r.permissions || []).length,
      permissions: (r.permissions || []).map((rp) => ({
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
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
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

    const { data: existingData } = await db.from("roles").select("id").eq("name", name.trim()).maybeSingle();
    const existing = mapRow(existingData);
    if (existing) {
      return NextResponse.json({ error: "Un rôle avec ce nom existe déjà" }, { status: 409 });
    }

    const { data: roleData, error } = await db
      .from("roles")
      .insert({
        name: name.trim(),
        description: description || null,
        is_default: false,
      })
      .select()
      .single();
    if (error) throw error;
    const role = mapRow(roleData);

    if (permissionIds && permissionIds.length > 0) {
      const { error: rpError } = await db
        .from("role_permissions")
        .insert(permissionIds.map((pid) => ({ role_id: role!.id, permission_id: pid })));
      if (rpError) throw rpError;
    }

    const { error: auditError } = await db.from("audit_logs").insert({
      action: "CREATE",
      entity: "Role",
      entity_id: role!.id,
      details: JSON.stringify({ name: role!.name, permissionCount: permissionIds?.length || 0 }),
      user_name: "SYSTEM",
    });
    if (auditError) throw auditError;

    return NextResponse.json(
      { id: role!.id, name: role!.name, description: role!.description },
      { status: 201 }
    );
  } catch (err) {
    console.error("[roles POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
