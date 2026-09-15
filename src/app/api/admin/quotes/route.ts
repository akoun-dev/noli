import { db, mapRow, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";
import { sanitizePostgrestSearch } from "@/lib/security";
import {
  getPagination,
  hasPaginationParams,
  paginationHeaders,
} from "@/lib/pagination";

function parseJsonField<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

export async function GET(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const offerId = searchParams.get("offerId");
    const search = searchParams.get("search") || "";
    const paginate = hasPaginationParams(searchParams);
    const { page, limit, offset } = getPagination(searchParams);

    let query = db
      .from("quotes")
      .select(
        "*, user:profiles(id, firstName:first_name, lastName:last_name, email, phone), offer:insurance_offers(id, name, insurer:insurers(id, name, code)), category:insurance_categories(id, name)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    // Filtre par offre (utilisé notamment par le détail d'une offre côté admin
    // pour compter/lister uniquement les devis liés à cette offre).
    if (offerId) {
      query = query.eq("offer_id", offerId);
    }

    // Recherche poussée en SQL : PostgREST ne permet pas de filtrer sur une
    // ressource embarquée dans or() (PGRST100). On résout donc d'abord les
    // profils correspondants, puis on filtre sur user_id.in() + reference
    // (colonnes racine, seules compatibles avec or()). La pagination se fait
    // ainsi entièrement côté base avec count exact.
    if (search) {
      const safeSearch = sanitizePostgrestSearch(search);
      // Plafond sur la liste d'IDs pour rester sous la limite de longueur
      // d'URL du proxy Supabase (~8 Ko) ; une recherche admin réaliste matche
      // rarement plus de quelques profils.
      const { data: matchingProfiles } = await db
        .from("profiles")
        .select("id")
        .or(
          `first_name.ilike.%${safeSearch}%,last_name.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%`
        )
        .limit(200);
      const profileIds = (matchingProfiles || []).map((p) => p.id);

      const conditions = [`reference.ilike.%${safeSearch}%`];
      if (profileIds.length > 0) {
        conditions.push(`user_id.in.(${profileIds.join(",")})`);
      }
      query = query.or(conditions.join(","));
    }

    if (paginate) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const quotes = mapRows(data || []);
    const total = count ?? quotes.length;

    const parsed = quotes.map((q) => ({
      ...q,
      vehicleData: parseJsonField(q.vehicleData, {}),
      personalData: parseJsonField(q.personalData, {}),
      coverageRequirements: parseJsonField(q.coverageRequirements, {}),
    }));

    return NextResponse.json(parsed, {
      headers: paginationHeaders(total, page, limit),
    });
  } catch (error) {
    console.error("Erreur quotes GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des devis" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const body = await request.json();
    const { id, status, finalPrice, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: "L'identifiant du devis est requis" },
        { status: 400 }
      );
    }

    const { data: existingData } = await db
      .from("quotes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    const existing = mapRow(existingData);
    if (!existing) {
      return NextResponse.json(
        { error: "Devis introuvable" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const changes: Record<string, unknown> = {};

    if (status !== undefined) {
      const validStatuses = ["DRAFT", "PENDING", "APPROVED", "REJECTED"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: "Statut invalide. Valeurs autorisées : DRAFT, PENDING, APPROVED, REJECTED" },
          { status: 400 }
        );
      }
      updateData.status = status;
      if (status !== existing.status) changes.status = { from: existing.status, to: status };
    }

    if (finalPrice !== undefined) {
      updateData.final_price = finalPrice ?? null;
      changes.finalPrice = finalPrice;
    }

    if (notes !== undefined) {
      updateData.notes = notes || null;
      changes.notes = notes ? "(modifié)" : "(supprimé)";
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Aucune donnée à mettre à jour" },
        { status: 400 }
      );
    }

    const { data: quoteData, error } = await db
      .from("quotes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    const quote = mapRow(quoteData);

    // ── Contrat : créé automatiquement à l'approbation, comme dans l'espace
    // assureur. Sans cela, un devis approuvé PAR L'ADMIN n'ouvrait aucun
    // contrat côté client. L'assureur est déduit de l'offre du devis.
    // Condition volontairement basée sur « pas de contrat existant » (et non sur
    // la transition de statut) : cela rattrape aussi les devis DÉJÀ approuvés
    // qui n'avaient pas de contrat. Idempotent grâce au contrôle ci-dessous.
    if (updateData.status === "APPROVED" && quote.userId) {
      const { data: existingContract } = await db
        .from("contracts")
        .select("id")
        .eq("quote_id", id)
        .maybeSingle();

      if (!existingContract) {
        let insurerId: number | null = null;
        if (quote.offerId) {
          const { data: offerRow } = await db
            .from("insurance_offers")
            .select("insurer_id")
            .eq("id", quote.offerId)
            .maybeSingle();
          insurerId = (offerRow as { insurer_id?: number } | null)?.insurer_id ?? null;
        }

        if (insurerId) {
          const contractRef = `NOLI-CON-${Date.now().toString(36).toUpperCase()}${Math.random()
            .toString(36)
            .slice(2, 6)
            .toUpperCase()}`;
          const startDate = new Date();
          const endDate = new Date(startDate);
          endDate.setFullYear(endDate.getFullYear() + 1);

          const { error: contractError } = await db.from("contracts").insert({
            reference: contractRef,
            quote_id: id,
            profile_id: quote.userId,
            insurer_id: insurerId,
            offer_id: quote.offerId ?? null,
            status: "ACTIVE",
            start_date: startDate.toISOString().split("T")[0],
            end_date: endDate.toISOString().split("T")[0],
            premium: quote.finalPrice ?? quote.estimatedPrice ?? null,
          });
          if (contractError) {
            console.error("Erreur création contrat (admin):", contractError);
          }
        } else {
          console.warn(
            `[admin/quotes] Devis ${id} approuvé sans offre/assureur associés → contrat non créé.`
          );
        }
      }
    }

    await logAudit({
      action: "UPDATE",
      entity: "Quote",
      entityId: id,
      details: { reference: existing.reference, changes },
    });

    return NextResponse.json(quote);
  } catch (error) {
    console.error("Erreur quotes PUT:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du devis" },
      { status: 500 }
    );
  }
}
