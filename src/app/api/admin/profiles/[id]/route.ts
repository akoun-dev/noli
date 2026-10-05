import { db, mapRow } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getSessionProfile } from "@/lib/auth-guard";
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
    const existing = mapRow<{
      id: string;
      email: string | null;
      role: string;
      isActive: boolean;
    }>(existingData);
    if (!existing) {
      return NextResponse.json(
        { error: "Profil introuvable" },
        { status: 404 }
      );
    }

    // SEC-002 : identité de l'admin connecté (garde anti auto-suppression).
    // Le profil ciblé peut avoir un user_id différent de l'admin : la comparaison
    // se fait sur l'id du profil, qui est aussi l'id du compte auth Supabase.
    const admin = await getSessionProfile();
    if (!admin) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    // a) Un admin ne peut pas supprimer son propre compte.
    if (admin.id === existing.id) {
      return NextResponse.json(
        { error: "Action interdite : vous ne pouvez pas supprimer votre propre compte." },
        { status: 403 }
      );
    }

    // b) Un ADMIN actif ne peut pas être supprimé s'il est le dernier admin actif.
    if (existing.role === "ADMIN" && existing.isActive) {
      const { count: otherAdmins } = await db
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "ADMIN")
        .eq("is_active", true)
        .neq("id", id);
      if ((otherAdmins ?? 0) === 0) {
        return NextResponse.json(
          { error: "Impossible de supprimer le dernier administrateur actif." },
          { status: 409 }
        );
      }
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
