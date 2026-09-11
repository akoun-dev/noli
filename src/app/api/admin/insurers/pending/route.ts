import { db, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

/*
 * Validation des comptes assureurs auto-inscrits.
 *
 * Un assureur qui s'inscrit lui-même est créé INACTIF (voir registerAction) :
 * son profil (`profiles.is_active = false`) et, le cas échéant, sa compagnie
 * (`insurers.is_active = false`) attendent la validation d'un administrateur.
 * Cet écran liste ces comptes en attente et permet de les valider (activation)
 * ou de les rejeter (suppression du compte en attente).
 */

type PendingCompany = { id: number; name: string; code: string; isActive: boolean };
type PendingInsurer = {
  profileId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt: string;
  company: PendingCompany | null;
};

// ── GET : liste des assureurs en attente de validation ──────────────
export async function GET() {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    // 1) Profils assureurs inactifs (en attente).
    const { data: profilesData, error: profilesError } = await db
      .from("profiles")
      .select("id, email, first_name, last_name, phone, created_at")
      .eq("role", "INSURER")
      .eq("is_active", false)
      .order("created_at", { ascending: false });
    if (profilesError) throw profilesError;

    const profiles = mapRows(profilesData || []) as Array<{
      id: string; email: string; firstName: string | null;
      lastName: string | null; phone: string | null; createdAt: string;
    }>;

    if (profiles.length === 0) {
      return NextResponse.json({ data: [] as PendingInsurer[] });
    }

    // 2) Liaisons profil → compagnie pour ces profils.
    const profileIds = profiles.map((p) => p.id);
    const { data: linksData, error: linksError } = await db
      .from("insurer_accounts")
      .select("profile_id, insurer_id")
      .in("profile_id", profileIds);
    if (linksError) throw linksError;
    const links = mapRows(linksData || []) as Array<{ profileId: string; insurerId: number }>;

    // 3) Compagnies liées.
    const insurerIds = [...new Set(links.map((l) => l.insurerId))];
    const companyById = new Map<number, PendingCompany>();
    if (insurerIds.length > 0) {
      const { data: insurersData, error: insurersError } = await db
        .from("insurers")
        .select("id, name, code, is_active")
        .in("id", insurerIds);
      if (insurersError) throw insurersError;
      for (const c of mapRows(insurersData || []) as Array<{ id: number; name: string; code: string; isActive: boolean }>) {
        companyById.set(c.id, { id: c.id, name: c.name, code: c.code, isActive: c.isActive });
      }
    }
    const companyByProfile = new Map<string, PendingCompany>();
    for (const l of links) {
      const c = companyById.get(l.insurerId);
      if (c && !companyByProfile.has(l.profileId)) companyByProfile.set(l.profileId, c);
    }

    const result: PendingInsurer[] = profiles.map((p) => ({
      profileId: p.id,
      email: p.email,
      firstName: p.firstName,
      lastName: p.lastName,
      phone: p.phone,
      createdAt: p.createdAt,
      company: companyByProfile.get(p.id) ?? null,
    }));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("[admin/insurers/pending] GET:", error);
    return NextResponse.json({ error: "Impossible de charger les comptes en attente" }, { status: 500 });
  }
}

// ── POST : valider ou rejeter un compte assureur en attente ─────────
const actionSchema = z.object({
  profileId: z.string().uuid("Identifiant de profil invalide"),
  action: z.enum(["validate", "reject"]),
});

export async function POST(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const body = await request.json().catch(() => null);
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Requête invalide" },
        { status: 400 }
      );
    }
    const { profileId, action } = parsed.data;

    // Vérifie que la cible est bien un assureur en attente (profil inactif).
    const { data: profileData, error: profileError } = await db
      .from("profiles")
      .select("id, role, is_active, email")
      .eq("id", profileId)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profileData || profileData.role !== "INSURER") {
      return NextResponse.json({ error: "Compte assureur introuvable" }, { status: 404 });
    }
    if (profileData.is_active) {
      return NextResponse.json({ error: "Ce compte est déjà validé" }, { status: 409 });
    }

    // Compagnies liées à ce profil.
    const { data: linksData } = await db
      .from("insurer_accounts")
      .select("insurer_id")
      .eq("profile_id", profileId);
    const insurerIds = [...new Set((linksData || []).map((l: { insurer_id: number }) => l.insurer_id))];

    if (action === "validate") {
      // Active le profil…
      const { error: upProfileError } = await db
        .from("profiles")
        .update({ is_active: true })
        .eq("id", profileId);
      if (upProfileError) throw upProfileError;

      // …et sa (ses) compagnie(s).
      if (insurerIds.length > 0) {
        const { error: upInsurerError } = await db
          .from("insurers")
          .update({ is_active: true })
          .in("id", insurerIds);
        if (upInsurerError) throw upInsurerError;
      }

      logAudit({
        action: "VALIDATE_INSURER",
        entity: "Profile",
        entityId: profileId,
        details: { email: profileData.email, insurerIds },
      });
      return NextResponse.json({ data: { profileId, status: "validated" } });
    }

    // action === "reject" : suppression du compte en attente.
    // Supprime l'utilisateur Auth → cascade sur profiles et insurer_accounts.
    const { error: delUserError } = await db.auth.admin.deleteUser(profileId);
    if (delUserError) throw delUserError;

    // Nettoyage : supprime une compagnie créée pour lui si elle est inactive
    // et n'a plus aucun compte rattaché (évite les fiches orphelines).
    for (const insurerId of insurerIds) {
      const { data: remaining } = await db
        .from("insurer_accounts")
        .select("id")
        .eq("insurer_id", insurerId)
        .limit(1);
      if (remaining && remaining.length > 0) continue;
      const { data: comp } = await db
        .from("insurers")
        .select("is_active")
        .eq("id", insurerId)
        .maybeSingle();
      if (comp && comp.is_active === false) {
        await db.from("insurers").delete().eq("id", insurerId);
      }
    }

    logAudit({
      action: "REJECT_INSURER",
      entity: "Profile",
      entityId: profileId,
      details: { email: profileData.email, insurerIds },
    });
    return NextResponse.json({ data: { profileId, status: "rejected" } });
  } catch (error) {
    console.error("[admin/insurers/pending] POST:", error);
    return NextResponse.json({ error: "Action impossible" }, { status: 500 });
  }
}
