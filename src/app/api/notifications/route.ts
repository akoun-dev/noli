import { db, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { getSessionProfile } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  try {
    const sessionProfile = await getSessionProfile();
    if (!sessionProfile) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    let query = db
      .from("notifications")
      .select("*")
      .eq("user_id", sessionProfile.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query;
    if (error) throw error;

    const notifications = mapRows(data || []);

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
    const sessionProfile = await getSessionProfile();
    if (!sessionProfile) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const body = await request.json();
    const { type, title, message, link } = body;

    if (!title || !message) {
      return NextResponse.json(
        {
          error: "Les champs title et message sont obligatoires",
        },
        { status: 400 }
      );
    }

    // Une notification créée via l'API ne peut être destinée qu'au profil connecté.
    const notification = await createNotification({
      userId: sessionProfile.id,
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