import { db, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth-guard";

/** Assureurs avec lesquels le client a interagi (au moins un devis) → seuls
 *  ceux-là sont "notables". Renvoie la liste d'ids distincts. */
async function reviewableInsurerIds(profileId: string): Promise<number[]> {
  const { data, error } = await db
    .from("quotes")
    .select("offer:insurance_offers!inner(insurer_id)")
    .eq("user_id", profileId);
  if (error || !data) return [];
  const ids = new Set<number>();
  for (const row of data as unknown as { offer?: { insurer_id?: number } }[]) {
    const id = row.offer?.insurer_id;
    if (typeof id === "number") ids.add(id);
  }
  return Array.from(ids);
}

export async function GET() {
  try {
    const profile = await getSessionProfile();
    if (!profile) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const { data: reviewData, error } = await db
      .from("reviews")
      .select("id, insurer_id, rating, comment, created_at, updated_at, insurer:insurers(id, name, logo_url)")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const reviews = mapRows(reviewData as unknown as Record<string, unknown>[] | null);

    // Assureurs notables non encore notés.
    const ids = await reviewableInsurerIds(profile.id);
    const reviewedIds = new Set(reviews.map((r) => r.insurerId as number));
    const pendingIds = ids.filter((id) => !reviewedIds.has(id));

    let reviewableInsurers: Record<string, unknown>[] = [];
    if (pendingIds.length > 0) {
      const { data: insurerData } = await db
        .from("insurers")
        .select("id, name, logo_url")
        .in("id", pendingIds);
      reviewableInsurers = mapRows(insurerData as unknown as Record<string, unknown>[] | null);
    }

    return NextResponse.json({ reviews, reviewableInsurers });
  } catch (error) {
    console.error("Erreur reviews GET:", error);
    return NextResponse.json({ error: "Erreur lors du chargement des avis" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const profile = await getSessionProfile();
    if (!profile) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const body = await request.json();
    const insurerId = Number(body.insurerId);
    const rating = Number(body.rating);
    const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 1000) : null;

    if (!Number.isInteger(insurerId) || insurerId <= 0) {
      return NextResponse.json({ error: "Assureur invalide" }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "La note doit être comprise entre 1 et 5" }, { status: 400 });
    }

    // Autorisation : on ne peut noter qu'un assureur avec lequel on a interagi.
    const allowed = await reviewableInsurerIds(profile.id);
    if (!allowed.includes(insurerId)) {
      return NextResponse.json(
        { error: "Vous ne pouvez noter qu'un assureur pour lequel vous avez demandé un devis." },
        { status: 403 }
      );
    }

    const { error } = await db.from("reviews").upsert(
      {
        profile_id: profile.id,
        insurer_id: insurerId,
        rating,
        comment: comment || null,
      },
      { onConflict: "profile_id,insurer_id" }
    );
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erreur reviews POST:", error);
    return NextResponse.json({ error: "Erreur lors de l'enregistrement de l'avis" }, { status: 500 });
  }
}
