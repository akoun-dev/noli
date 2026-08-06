import { db, mapRow, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

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
    const search = searchParams.get("search") || "";

    let query = db
      .from("quotes")
      .select(
        "*, user:profiles(id, firstName:first_name, lastName:last_name, email, phone), offer:insurance_offers(id, name, insurer:insurers(id, name, code)), category:insurance_categories(id, name)"
      )
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw error;

    let quotes = mapRows(data || []);

    if (search) {
      const term = search.toLowerCase();
      quotes = quotes.filter((q) => {
        const user = q.user || {};
        const reference = (q.reference || "").toLowerCase();
        const firstName = (user.firstName || "").toLowerCase();
        const lastName = (user.lastName || "").toLowerCase();
        const email = (user.email || "").toLowerCase();
        return (
          reference.includes(term) ||
          firstName.includes(term) ||
          lastName.includes(term) ||
          email.includes(term)
        );
      });
    }

    const parsed = quotes.map((q) => ({
      ...q,
      vehicleData: parseJsonField(q.vehicleData, {}),
      personalData: parseJsonField(q.personalData, {}),
      coverageRequirements: parseJsonField(q.coverageRequirements, {}),
    }));

    return NextResponse.json(parsed);
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

    const { error: auditError } = await db.from("audit_logs").insert({
      action: "UPDATE",
      entity: "Quote",
      entity_id: id,
      details: JSON.stringify({ reference: existing.reference, changes }),
      user_name: "SYSTEM",
    });
    if (auditError) throw auditError;

    return NextResponse.json(quote);
  } catch (error) {
    console.error("Erreur quotes PUT:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du devis" },
      { status: 500 }
    );
  }
}
