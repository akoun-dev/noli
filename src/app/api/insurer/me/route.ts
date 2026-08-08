import { db, mapRow } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth-guard";

export async function GET(_request: NextRequest) {
  try {
    const sessionProfile = await getSessionProfile();
    if (!sessionProfile) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    if (sessionProfile.role !== "INSURER") {
      return NextResponse.json({ error: "Accès réservé aux assureurs" }, { status: 403 });
    }

    // L'identité vient TOUJOURS de la session : un assureur ne peut consulter
    // que son propre compte (pas de paramètre ?userId côté client).
    const { data } = await db
      .from("insurer_accounts")
      .select("insurer:insurers(*)")
      .eq("profile_id", sessionProfile.id)
      .maybeSingle();
    const account = mapRow(data);

    if (!account) {
      return NextResponse.json(
        { error: "Aucun compte assureur trouvé pour cet utilisateur" },
        { status: 404 }
      );
    }

    const { insurer } = account;

    return NextResponse.json({
      id: insurer.id,
      code: insurer.code,
      name: insurer.name,
      logoUrl: insurer.logoUrl,
      contactEmail: insurer.contactEmail,
      phone: insurer.phone,
      website: insurer.website,
      isActive: insurer.isActive,
    });
  } catch (error) {
    console.error("Erreur insurer/me:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement du profil assureur" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionProfile = await getSessionProfile();
    if (!sessionProfile) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    if (sessionProfile.role !== "INSURER") {
      return NextResponse.json({ error: "Accès réservé aux assureurs" }, { status: 403 });
    }

    const body = await request.json();
    const { name, contactEmail, phone } = body;

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      return NextResponse.json(
        { error: "Le nom de l'entreprise est invalide" },
        { status: 400 }
      );
    }

    const { data: accountData } = await db
      .from("insurer_accounts")
      .select("insurer_id")
      .eq("profile_id", sessionProfile.id)
      .maybeSingle();
    const account = mapRow<{ insurerId: number }>(accountData);

    if (!account) {
      return NextResponse.json(
        { error: "Aucun compte assureur trouvé pour cet utilisateur" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (contactEmail !== undefined) updateData.contact_email = contactEmail.trim();
    if (phone !== undefined) updateData.phone = phone.trim();

    const { data, error } = await db
      .from("insurers")
      .update(updateData)
      .eq("id", account.insurerId)
      .select("id, code, name, logo_url, contact_email, phone, website, is_active")
      .single();
    if (error) throw error;

    const insurer = mapRow(data);
    if (!insurer) {
      return NextResponse.json({ error: "Assureur introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      id: insurer.id,
      code: insurer.code,
      name: insurer.name,
      logoUrl: insurer.logoUrl,
      contactEmail: insurer.contactEmail,
      phone: insurer.phone,
      website: insurer.website,
      isActive: insurer.isActive,
    });
  } catch (error) {
    console.error("Erreur insurer/me PUT:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du profil assureur" },
      { status: 500 }
    );
  }
}
