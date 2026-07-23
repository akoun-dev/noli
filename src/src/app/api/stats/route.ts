import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [insurers, offers, profiles] = await Promise.all([
      db.insurer.count(),
      db.insuranceOffer.count(),
      db.profile.count(),
    ]);

    return NextResponse.json({ insurers, offers, users: profiles });
  } catch (error) {
    console.error("Stats GET error:", error);
    return NextResponse.json({ error: "Erreur lors du chargement des statistiques" }, { status: 500 });
  }
}
