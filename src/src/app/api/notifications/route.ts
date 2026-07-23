import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get("userId");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    if (!userId) {
      return NextResponse.json(
        { error: "L'identifiant utilisateur est requis" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors du chargement des notifications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, title, message, link } = body;

    if (!userId || !title || !message) {
      return NextResponse.json(
        {
          error:
            "Les champs userId, title et message sont obligatoires",
        },
        { status: 400 }
      );
    }

    const notification = await createNotification({
      userId,
      type,
      title,
      message,
      link,
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la création de la notification" },
      { status: 500 }
    );
  }
}