import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { sendQuoteConfirmation } from "@/lib/email";

function parseJsonField<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { personalInfo, vehicleInfo, coverageNeeds, offer } = body;

    if (!personalInfo?.email || !offer?.insurerName) {
      return NextResponse.json(
        { error: "Données incomplètes pour créer le devis" },
        { status: 400 }
      );
    }

    // Générer une référence unique
    const ref = `NOLI-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Créer le devis en DB (anonyme — pas de userId)
    const quote = await db.quote.create({
      data: {
        reference: ref,
        status: "PENDING",
        estimatedPrice: Math.round(offer.monthlyPrice || offer.annualPrice / 12 || 0),
        personalData: JSON.stringify(personalInfo),
        vehicleData: JSON.stringify(vehicleInfo || {}),
        coverageRequirements: JSON.stringify(coverageNeeds || {}),
        notes: `Demande pour ${offer.insurerName} — ${offer.name || ""}`.trim(),
      },
    });

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
      const insurerProfiles = await db.insurerAccount.findMany({
        where: { insurerId: offer.insurerId },
        select: { profileId: true },
      });

      for (const ip of insurerProfiles) {
        try {
          await db.notification.create({
            data: {
              userId: ip.profileId,
              type: "INFO",
              title: "Nouvelle demande de devis",
              message: `Devis ${ref} reçu pour ${offer.insurerName} — ${personalInfo.firstName || ""} ${personalInfo.lastName || ""}`.trim(),
            },
          });
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
        createdAt: quote.createdAt.toISOString(),
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
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));

    if (!userId) {
      return NextResponse.json(
        { error: "Le paramètre userId est requis" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { userId };

    if (status) {
      where.status = status;
    }

    if (search) {
      (where as Record<string, unknown>).OR = [
        { reference: { contains: search } },
        { offer: { name: { contains: search } } },
      ];
    }

    const [quotes, total] = await Promise.all([
      db.quote.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          offer: {
            include: {
              insurer: { select: { name: true, logoUrl: true } },
            },
          },
          category: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.quote.count({ where }),
    ]);

    const formatted = quotes.map((q) => ({
      id: q.id,
      reference: q.reference,
      status: q.status,
      estimatedPrice: q.estimatedPrice,
      finalPrice: q.finalPrice,
      notes: q.notes,
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
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