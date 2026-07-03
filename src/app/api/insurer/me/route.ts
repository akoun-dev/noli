import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Le paramètre userId est requis" },
        { status: 400 }
      );
    }

    const account = await db.insurerAccount.findFirst({
      where: { profileId: userId },
      include: { insurer: true },
    });

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