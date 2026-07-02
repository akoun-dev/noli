import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/* ── Permissions par défaut ──────────────────────────────────── */
const DEFAULT_PERMISSIONS = [
  // Paramètres
  { code: "settings.view", name: "Voir les paramètres", category: "settings" },
  { code: "settings.edit", name: "Modifier les paramètres", category: "settings" },
  // Utilisateurs
  { code: "users.view", name: "Voir les utilisateurs", category: "users" },
  { code: "users.create", name: "Créer un utilisateur", category: "users" },
  { code: "users.edit", name: "Modifier un utilisateur", category: "users" },
  { code: "users.delete", name: "Supprimer un utilisateur", category: "users" },
  { code: "users.activate", name: "Activer/désactiver un utilisateur", category: "users" },
  // Offres
  { code: "offers.view", name: "Voir les offres", category: "offers" },
  { code: "offers.create", name: "Créer une offre", category: "offers" },
  { code: "offers.edit", name: "Modifier une offre", category: "offers" },
  { code: "offers.delete", name: "Supprimer une offre", category: "offers" },
  // Devis
  { code: "quotes.view", name: "Voir les devis", category: "quotes" },
  { code: "quotes.create", name: "Créer un devis", category: "quotes" },
  { code: "quotes.edit", name: "Modifier un devis", category: "quotes" },
  { code: "quotes.delete", name: "Supprimer un devis", category: "quotes" },
  { code: "quotes.approve", name: "Approuver/rejeter un devis", category: "quotes" },
  // Assureurs
  { code: "insurers.view", name: "Voir les assureurs", category: "insurers" },
  { code: "insurers.create", name: "Créer un assureur", category: "insurers" },
  { code: "insurers.edit", name: "Modifier un assureur", category: "insurers" },
  { code: "insurers.delete", name: "Supprimer un assureur", category: "insurers" },
  // Garanties
  { code: "coverages.view", name: "Voir les garanties", category: "coverages" },
  { code: "coverages.create", name: "Créer une garantie", category: "coverages" },
  { code: "coverages.edit", name: "Modifier une garantie", category: "coverages" },
  { code: "coverages.delete", name: "Supprimer une garantie", category: "coverages" },
  // Sauvegardes
  { code: "backups.view", name: "Voir les sauvegardes", category: "backups" },
  { code: "backups.create", name: "Créer une sauvegarde", category: "backups" },
  { code: "backups.restore", name: "Restaurer une sauvegarde", category: "backups" },
  { code: "backups.delete", name: "Supprimer une sauvegarde", category: "backups" },
  // Audit
  { code: "audit.view", name: "Voir les journaux d'audit", category: "audit" },
  { code: "audit.export", name: "Exporter les journaux", category: "audit" },
  // Rôles
  { code: "roles.view", name: "Voir les rôles", category: "roles" },
  { code: "roles.create", name: "Créer un rôle", category: "roles" },
  { code: "roles.edit", name: "Modifier un rôle", category: "roles" },
  { code: "roles.delete", name: "Supprimer un rôle", category: "roles" },
];

/* ── Attribution par défaut des rôles ─────────────────────────── */
const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: DEFAULT_PERMISSIONS.map((p) => p.code),
  INSURER: [
    "users.view", "offers.view", "offers.create", "offers.edit",
    "quotes.view", "quotes.create", "quotes.edit", "coverages.view",
  ],
  USER: [
    "offers.view", "quotes.view", "quotes.create",
  ],
};

async function ensureDefaults() {
  const count = await db.permission.count();
  if (count === 0) {
    // Créer les permissions
    for (const p of DEFAULT_PERMISSIONS) {
      await db.permission.create({ data: p });
    }

    // Créer les rôles s'ils n'existent pas
    for (const [roleName, permCodes] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      const role = await db.role.findUnique({ where: { name: roleName } });
      if (!role) continue;

      for (const code of permCodes) {
        const perm = await db.permission.findUnique({ where: { code } });
        if (perm) {
          await db.rolePermission.create({
            data: { roleId: role.id, permissionId: perm.id },
          });
        }
      }
    }
  }
}

/* ── GET ──────────────────────────────────────────────────────── */
export async function GET() {
  try {
    await ensureDefaults();
    const all = await db.permission.findMany({ orderBy: [{ category: "asc" }, { code: "asc" }] });

    const grouped: Record<string, { id: string; code: string; name: string; category: string }[]> = {};
    for (const p of all) {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push({
        id: p.id,
        code: p.code,
        name: p.name,
        category: p.category,
      });
    }

    return NextResponse.json({ permissions: grouped });
  } catch (err) {
    console.error("[permissions GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}