import { db, mapRow } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile, requireAuth } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAuth(["INSURER"]);
    if (guard) return guard;

    const profile = await getSessionProfile();
    if (!profile) return NextResponse.json({ error: "Authentification requise" }, { status: 401 });

    const { data } = await db
      .from("insurer_accounts")
      .select("insurer:insurers(id, code, name, logoUrl:logo_url, is_active)")
      .eq("profile_id", profile.id)
      .maybeSingle();
    const account = mapRow(data);

    if (!account) {
      return NextResponse.json(
        { error: "Aucun compte assureur trouvé pour cet utilisateur" },
        { status: 404 }
      );
    }

    return NextResponse.json(account.insurer);
  } catch (error) {
    console.error("Erreur insurer/account GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement du compte assureur" },
      { status: 500 }
    );
  }
}