import { db, mapRow, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth-guard";

type CallbackRow = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const sessionProfile = await getSessionProfile();
    if (!sessionProfile) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") || "all";

    let query = db
      .from("notifications")
      .select("*")
      .eq("user_id", sessionProfile.id)
      .eq("type", "CALLBACK")
      .order("created_at", { ascending: false })
      .limit(100);

    if (status !== "all") {
      if (status === "read") query = query.eq("is_read", true);
      if (status === "unread") query = query.eq("is_read", false);
    }

    const { data, error } = await query;
    if (error) throw error;
    const callbacks = mapRows<CallbackRow>(data || []);

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
        createdAt: c.createdAt,
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
    const sessionProfile = await getSessionProfile();
    if (!sessionProfile) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const body = await request.json();
    const { id, isRead } = body;

    if (!id) {
      return NextResponse.json(
        { error: "L'identifiant de la notification est requis" },
        { status: 400 }
      );
    }

    const { data: existingData } = await db
      .from("notifications")
      .select("id, user_id")
      .eq("id", id)
      .maybeSingle();
    const existing = mapRow<{ id: string; userId: string }>(existingData);
    if (!existing) {
      return NextResponse.json(
        { error: "Notification introuvable" },
        { status: 404 }
      );
    }

    // Ownership : on ne modifie que ses propres notifications
    if (existing.userId !== sessionProfile.id) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    const { data, error } = await db
      .from("notifications")
      .update({ is_read: isRead ?? true })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    const updated = mapRow(data);

    return NextResponse.json({ success: true, notification: updated });
  } catch (error) {
    console.error("Erreur mise à jour demande de rappel:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
