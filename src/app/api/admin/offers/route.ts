import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { createOfferSchema } from "@/lib/validation";
import { requireAuth } from "@/lib/auth-guard";

function safeJsonParse(val: string | null | undefined, fallback: unknown = null) {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

export async function GET(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const insurerId = searchParams.get("insurerId") || "";
    const contractType = searchParams.get("contractType") || "";
    const active = searchParams.get("active");

    const where: Record<string, unknown> = {};

    if (search) {
      where.name = { contains: search };
    }
    if (insurerId) {
      where.insurerId = insurerId;
    }
    if (contractType) {
      where.contractType = contractType;
    }
    if (active !== null && active !== undefined && active !== "") {
      where.isActive = active === "true";
    }

    const offers = await db.insuranceOffer.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        insurer: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const offersParsed = offers.map((offer) => ({
      ...offer,
      features: safeJsonParse(offer.features, []),
    }));

    return NextResponse.json(offersParsed);
  } catch (error) {
    console.error("Erreur lors de la récupération des offres:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des offres" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
//    const guard = requireAdmin(null);
//    if (guard) return guard;

    const body = await request.json();
    const parsed = createOfferSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Données invalides";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { insurerId, coverageType } = parsed.data;
    const insurer = await db.insurer.findUnique({ where: { id: insurerId } });
    if (!insurer) {
      return NextResponse.json({ error: "Assureur introuvable" }, { status: 400 });
    }

    // Auto-populate features based on coverage type if empty
    let features = Array.isArray(body.features) && body.features.length > 0
      ? JSON.stringify(body.features)
      : "[]";
    if (features === "[]" && parsed.data.coverageType) {
      const defaultFeatures: Record<string, string[]> = {
        tiers: ["RC", "DR"],
        tiers_plus: ["RC", "DR", "Incendie", "Vol"],
        tous_risques: ["RC", "DR", "IC", "IPT", "Incendie", "Vol", "BDG", "TCM", "Assistance"],
      };
      const defaults = defaultFeatures[parsed.data.coverageType as string] || [];
      if (defaults.length > 0) {
        features = JSON.stringify(defaults);
      }
    }

    const offer = await db.insuranceOffer.create({
      data: {
        insurerId: parsed.data.insurerId,
        name: parsed.data.name,
        contractType: parsed.data.coverageType,
        description: parsed.data.description,
        priceMin: parsed.data.basePrice,
        coverageAmount: parsed.data.maxCoverage,
        deductible: parsed.data.deductible ?? 0,
        features,
        isActive: parsed.data.isActive ?? true,
      },
      include: {
        insurer: { select: { id: true, name: true, logoUrl: true } },
      },
    });

    const offerParsed = {
      ...offer,
      features: safeJsonParse(offer.features, []),
    };

    return NextResponse.json(offerParsed, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de l'offre:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'offre" },
      { status: 500 }
    );
  }
}
