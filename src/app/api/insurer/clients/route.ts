import { db, mapRows } from "@/lib/db";
import { NextResponse } from "next/server";
import { getInsurerAccount, getSessionProfile, requireAuth } from "@/lib/auth-guard";

/**
 * Portefeuille client de l'assureur connecté : clients ENREGISTRÉS ayant soumis
 * au moins un devis sur l'une de ses offres. Agrégation (nb de devis, dernière
 * activité) faite en JS ; le nombre de contrats vient de la table `contracts`.
 */
export async function GET() {
  try {
    const guard = await requireAuth(["INSURER"]);
    if (guard) return guard;

    const profile = await getSessionProfile();
    if (!profile) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    const account = await getInsurerAccount(profile.id);
    if (!account) {
      return NextResponse.json(
        { error: "Aucun compte assureur trouvé pour cet utilisateur" },
        { status: 404 }
      );
    }

    // Devis (clients enregistrés uniquement) sur les offres de l'assureur.
    const { data: quoteRows, error: qErr } = await db
      .from("quotes")
      .select(
        "user_id, created_at, " +
          "client:profiles(firstName:first_name, lastName:last_name, email, phone, registeredAt:created_at), " +
          "offer:insurance_offers!inner(insurer_id)"
      )
      .eq("offer.insurer_id", account.insurerId)
      .not("user_id", "is", null)
      .order("created_at", { ascending: false });
    if (qErr) throw qErr;

    // Nombre de contrats par client pour cet assureur.
    const { data: contractRows, error: cErr } = await db
      .from("contracts")
      .select("profile_id")
      .eq("insurer_id", account.insurerId);
    if (cErr) throw cErr;

    const contractsByClient = new Map<string, number>();
    for (const row of (contractRows || []) as { profile_id: string }[]) {
      if (!row.profile_id) continue;
      contractsByClient.set(row.profile_id, (contractsByClient.get(row.profile_id) || 0) + 1);
    }

    const rows = mapRows(quoteRows as unknown as Record<string, unknown>[] | null);
    const clients = new Map<string, Record<string, unknown>>();
    for (const q of rows) {
      const id = q.userId as string | undefined;
      if (!id) continue;
      const client = (q.client || {}) as Record<string, unknown>;
      const existing = clients.get(id);
      if (existing) {
        existing.quotesCount = (existing.quotesCount as number) + 1;
        if (new Date(q.createdAt as string) > new Date(existing.lastQuoteAt as string)) {
          existing.lastQuoteAt = q.createdAt;
        }
      } else {
        clients.set(id, {
          id,
          firstName: client.firstName ?? null,
          lastName: client.lastName ?? null,
          email: client.email ?? null,
          phone: client.phone ?? null,
          registeredAt: client.registeredAt ?? null,
          quotesCount: 1,
          contractsCount: contractsByClient.get(id) || 0,
          lastQuoteAt: q.createdAt,
        });
      }
    }

    return NextResponse.json({ clients: Array.from(clients.values()) });
  } catch (error) {
    console.error("Erreur insurer/clients GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des clients" },
      { status: 500 }
    );
  }
}
