import { db, mapRow } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAuth(["ADMIN"]);
  if (guard) return guard;

  const { id } = await params;

  try {
    const { data: existingData } = await db
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    const existing = mapRow(existingData);
    if (!existing) {
      return NextResponse.json(
        { error: "Profil introuvable" },
        { status: 404 }
      );
    }

    await db.from("profiles").delete().eq("id", id);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceKey) {
      const supabaseAdmin = createClient(supabaseUrl, serviceKey);
      await supabaseAdmin.auth.admin.deleteUser(id);
    }

    await logAudit({
      action: "DELETE",
      entity: "Profile",
      entityId: id,
      details: { email: existing.email, role: existing.role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur profile DELETE:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du profil" },
      { status: 500 }
    );
  }
}
