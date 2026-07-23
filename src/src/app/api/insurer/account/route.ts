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
      include: {
        insurer: {
          select: {
            id: true,
            code: true,
            name: true,
            logoUrl: true,
            isActive: true,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Aucun compte assureur trouvé pour cet utilisateur" },
        { status: 404 }
      );
    }

    return NextResponse.json(account.insurer);
  } catch (error) {
    console.error("Erreur insurer/account GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement du compte assureur" },
      { status: 500 }
    );
  }
}