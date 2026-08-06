import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [{ count: insurers }, { count: offers }, { count: profiles }] = await Promise.all([
      db.from("insurers").select("id", { count: "exact", head: true }),
      db.from("insurance_offers").select("id", { count: "exact", head: true }),
      db.from("profiles").select("id", { count: "exact", head: true }),
    ]);

    return NextResponse.json({ insurers, offers, users: profiles });
  } catch (error) {
    console.error("Stats GET error:", error);
    return NextResponse.json({ error: "Erreur lors du chargement des statistiques" }, { status: 500 });
  }
}
