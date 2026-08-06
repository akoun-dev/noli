import { db, mapRow } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth-guard";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionProfile = await getSessionProfile();
    if (!sessionProfile) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const { id } = await params;

    const { data, error } = await db
      .from("notifications")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    const existing = mapRow(data);
    if (!existing) {
      return NextResponse.json(
        { error: "Notification introuvable" },
        { status: 404 }
      );
    }

    // Ownership : on ne peut modifier que ses propres notifications.
    if (existing.userId !== sessionProfile.id) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { isRead } = body;

    if (typeof isRead !== "boolean") {
      return NextResponse.json(
        { error: "Le champ isRead doit être un booléen" },
        { status: 400 }
      );
    }

    const { data: notificationData, error: updateError } = await db
      .from("notifications")
      .update({ is_read: isRead })
      .eq("id", id)
      .select("*")
      .single();
    if (updateError) throw updateError;
    const notification = mapRow(notificationData);

    return NextResponse.json(notification);
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la notification" },
      { status: 500 }
    );
  }
}
