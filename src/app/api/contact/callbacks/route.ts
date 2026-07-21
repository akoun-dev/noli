import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get("userId");
    const status = searchParams.get("status") || "all";

    if (!userId) {
      return NextResponse.json(
        { error: "L'identifiant utilisateur est requis" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = {
      userId,
      type: "CALLBACK",
    };

    if (status !== "all") {
      if (status === "read") where.isRead = true;
      if (status === "unread") where.isRead = false;
    }

    const callbacks = await db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const formatted = callbacks.map((c) => {
      let callbackData: Record<string, unknown> = {};
      try {
        if (c.link) callbackData = JSON.parse(c.link);
      } catch {
        callbackData = {};
      }

      return {
        id: c.id,
        title: c.title,
        message: c.message,
        isRead: c.isRead,
        createdAt: c.createdAt.toISOString(),
        phone: callbackData.phone || null,
        preferredTime: callbackData.preferredTime || null,
        clientName: callbackData.clientName || null,
        clientFirstName: callbackData.clientFirstName || null,
        clientLastName: callbackData.clientLastName || null,
        clientEmail: callbackData.clientEmail || null,
        insurerName: callbackData.insurerName || null,
        insurerId: callbackData.insurerId || null,
      };
    });

    return NextResponse.json({
      callbacks: formatted,
      total: formatted.length,
    });
  } catch (error) {
    console.error("Erreur chargement demandes de rappel:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des demandes de rappel" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isRead } = body;

    if (!id) {
      return NextResponse.json(
        { error: "L'identifiant de la notification est requis" },
        { status: 400 }
      );
    }

    const updated = await db.notification.update({
      where: { id },
      data: { isRead: isRead ?? true },
    });

    return NextResponse.json({ success: true, notification: updated });
  } catch (error) {
    console.error("Erreur mise à jour demande de rappel:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
