import { db, mapRows } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  const guard = await requireAuth(["INSURER"]); if (guard) return guard;
  try {
    const { data, error } = await db
      .from("insurance_categories")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const categories = mapRows(data || []);

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Erreur insurer/insurance-categories GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des catégories" },
      { status: 500 }
    );
  }
}
