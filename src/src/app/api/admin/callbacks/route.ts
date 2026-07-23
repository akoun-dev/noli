import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]);
  if (guard) return guard;
  try {
    const profile = await (await import("@/lib/auth-guard")).getSessionProfile();
    if (!profile) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") || "all";

    const where: Record<string, unknown> = {
      userId: profile.id,
      type: "CALLBACK",
    };

    if (status === "read") where.isRead = true;
    if (status === "unread") where.isRead = false;

    const callbacks = await db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const formatted = callbacks.map((c) => {
      let data: Record<string, unknown> = {};
      try {
        if (c.link) data = JSON.parse(c.link);
      } catch {
        data = {};
      }

      return {
        id: c.id,
        title: c.title,
        message: c.message,
        isRead: c.isRead,
        createdAt: c.createdAt.toISOString(),
        phone: data.phone || null,
        preferredTime: data.preferredTime || null,
        clientName: data.clientName || null,
        clientFirstName: data.clientFirstName || null,
        clientLastName: data.clientLastName || null,
        clientEmail: data.clientEmail || null,
        insurerName: data.insurerName || null,
        insurerId: data.insurerId || null,
      };
    });

    return NextResponse.json({ callbacks: formatted, total: formatted.length });
  } catch (error) {
    console.error("Erreur admin callbacks GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des rappels" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]);
  if (guard) return guard;
  try {
    const body = await request.json();
    const { id, isRead } = body;

    if (!id) {
      return NextResponse.json(
        { error: "L'identifiant est requis" },
        { status: 400 }
      );
    }

    await db.notification.update({
      where: { id },
      data: { isRead: isRead ?? true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur admin callbacks PATCH:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
