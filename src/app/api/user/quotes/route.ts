import { db, mapRow, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { sendQuoteConfirmation } from "@/lib/email";
import { getSessionProfile } from "@/lib/auth-guard";
import { sanitizePostgrestSearch } from "@/lib/security";
import { getClientIp, checkQuoteCreateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { emailSchema } from "@/lib/validation";

function parseJsonField<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

type QuoteRow = {
  id: string;
  reference: string;
  status: string;
  estimatedPrice: number | null;
  finalPrice: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  vehicleData: string;
  personalData: string;
  offer: {
    name: string | null;
    description: string | null;
    insurer: { name: string | null; logoUrl: string | null } | null;
  } | null;
  category: { name: string | null } | null;
};

export async function POST(request: NextRequest) {
  try {
    // Création de devis publique (écriture BDD + envoi email) : rate limit par IP.
    const limited = rateLimitResponse(checkQuoteCreateLimit(getClientIp(request)));
    if (limited) return limited;

    const body = await request.json();
    const { personalInfo, vehicleInfo, coverageNeeds, offer } = body;

    if (!personalInfo?.email || !offer?.insurerName) {
      return NextResponse.json(
        { error: "Données incomplètes pour créer le devis" },
        { status: 400 }
      );
    }

    // Valider l'email avant tout envoi : empêche le relayage de spam / email
    // bombing vers des adresses arbitraires via le champ personalInfo.email.
    const emailCheck = emailSchema.safeParse(personalInfo.email);
    if (!emailCheck.success) {
      return NextResponse.json({ error: "Adresse email invalide" }, { status: 400 });
    }

    // Générer une référence unique
    const ref = `NOLI-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Look up the offer by insurerId and name to link it
    let offerId: string | null = null;
    if (offer.insurerId && offer.name) {
      const { data, error } = await db
        .from("insurance_offers")
        .select("id")
        .eq("insurer_id", offer.insurerId)
        .eq("name", offer.name)
        .maybeSingle();
      if (error) throw error;
      const foundOffer = mapRow<{ id: string }>(data);
      offerId = foundOffer?.id || null;
    }

    // Créer le devis en DB (anonyme si non connecté ; lié à la session sinon)
    const sessionProfile = await getSessionProfile();
    const { data, error } = await db
      .from("quotes")
      .insert({
        reference: ref,
        status: "PENDING",
        user_id: sessionProfile?.id || null,
        offer_id: offerId,
        estimated_price: Math.round(offer.monthlyPrice || offer.annualPrice / 12 || 0),
        personal_data: JSON.stringify(personalInfo),
        vehicle_data: JSON.stringify(vehicleInfo || {}),
        coverage_requirements: JSON.stringify(coverageNeeds || {}),
        notes: `Demande pour ${offer.insurerName} — ${offer.name || ""}`.trim(),
      })
      .select()
      .single();
    if (error) throw error;
    const quote = mapRow<{ id: string; status: string; estimatedPrice: number; createdAt: string }>(data)!;

    // Envoi d'email (non bloquant)
    if (process.env.RESEND_API_KEY) {
      sendQuoteConfirmation({
        to: personalInfo.email,
        reference: ref,
        insurerName: offer.insurerName,
        offerName: offer.name || offer.coverageType,
        estimatedPrice: Math.round(offer.monthlyPrice || offer.annualPrice / 12 || 0),
        contactPhone: personalInfo.phone,
        contractType: offer.coverageType,
      }).catch(err => console.error("[email] Erreur asynchrone:", err));
    }

    // Notifier les assureurs concernés (si userId présent)
    if (offer.insurerId) {
      const { data: insurerProfilesData } = await db
        .from("insurer_accounts")
        .select("profileId:profile_id")
        .eq("insurer_id", offer.insurerId);
      const insurerProfiles = mapRows<{ profileId: string }>(insurerProfilesData || []);

      for (const ip of insurerProfiles) {
        try {
          const { error: notifError } = await db.from("notifications").insert({
            user_id: ip.profileId,
            type: "INFO",
            title: "Nouvelle demande de devis",
            message: `Devis ${ref} reçu pour ${offer.insurerName} — ${personalInfo.firstName || ""} ${personalInfo.lastName || ""}`.trim(),
          });
          if (notifError) throw notifError;
        } catch (notifErr) {
          console.error("[quote] Erreur notification:", notifErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      quote: {
        id: quote.id,
        reference: ref,
        status: quote.status,
        estimatedPrice: quote.estimatedPrice,
        createdAt: quote.createdAt,
      },
    });
  } catch (error) {
    console.error("Erreur création devis:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du devis" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionProfile = await getSessionProfile();
    if (!sessionProfile) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));

    let quotesQuery = db
      .from("quotes")
      .select(
        "*, user:profiles(id, firstName:first_name, lastName:last_name, email), category:insurance_categories(id, name), offer:insurance_offers(id, name, description, insurer:insurers(name, logoUrl:logo_url))"
      )
      .eq("user_id", sessionProfile.id)
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    let countQuery = db
      .from("quotes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", sessionProfile.id);

    if (status) {
      quotesQuery = quotesQuery.eq("status", status);
      countQuery = countQuery.eq("status", status);
    }

    if (search) {
      const s = sanitizePostgrestSearch(search);
      quotesQuery = quotesQuery.or(`reference.ilike.%${s}%,offer.name.ilike.%${s}%`);
      countQuery = countQuery.or(`reference.ilike.%${s}%,offer.name.ilike.%${s}%`);
    }

    const [{ data, error }, { count }] = await Promise.all([quotesQuery, countQuery]);
    if (error) throw error;
    const quotes = mapRows<QuoteRow>(data || []);
    const total = count ?? 0;

    const formatted = quotes.map((q) => ({
      id: q.id,
      reference: q.reference,
      status: q.status,
      estimatedPrice: q.estimatedPrice,
      finalPrice: q.finalPrice,
      notes: q.notes,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
      offerName: q.offer?.name || null,
      offerDescription: q.offer?.description || null,
      categoryName: q.category?.name || null,
      vehicleData: parseJsonField(q.vehicleData, {}),
      personalData: parseJsonField(q.personalData, {}),
      insurerName: q.offer?.insurer?.name || null,
      insurerLogo: q.offer?.insurer?.logoUrl || null,
    }));

    return NextResponse.json({ quotes: formatted, total, page, limit });
  } catch (error) {
    console.error("Erreur user/quotes:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des devis" },
      { status: 500 }
    );
  }
}
