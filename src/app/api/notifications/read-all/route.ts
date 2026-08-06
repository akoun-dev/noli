import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth-guard";

export async function PUT(request: NextRequest) {
  try {
    const sessionProfile = await getSessionProfile();
    if (!sessionProfile) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const { data, error } = await db
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", sessionProfile.id)
      .eq("is_read", false)
      .select();
    if (error) throw error;

    return NextResponse.json({
      success: true,
      updatedCount: data?.length || 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors du marquage des notifications comme lues" },
      { status: 500 }
    );
  }
}
