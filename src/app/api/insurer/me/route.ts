import { db, mapRow } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  try {
    const sessionProfile = await getSessionProfile();
    if (!sessionProfile) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    const isAdmin = sessionProfile.role === "ADMIN";
    if (sessionProfile.role !== "INSURER") {
      return NextResponse.json({ error: "Accès réservé aux assureurs" }, { status: 403 });
    }

    const userId = request.nextUrl.searchParams.get("userId");
    const profileId = userId || sessionProfile.id;
    if (profileId !== sessionProfile.id && !isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { data } = await db
      .from("insurer_accounts")
      .select("insurer:insurers(*)")
      .eq("profile_id", profileId)
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
