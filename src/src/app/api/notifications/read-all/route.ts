import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "L'identifiant utilisateur est requis" },
        { status: 400 }
      );
    }

    const result = await db.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors du marquage des notifications comme lues" },
      { status: 500 }
    );
  }
}