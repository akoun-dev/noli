import { db, mapRows } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  const guard = await requireAuth(["INSURER"]); if (guard) return guard;
  try {
    const { data, error } = await db
      .from("coverage_categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    if (error) throw error;
    const categories = mapRows(data || []);

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Erreur insurer/coverage-categories GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des catégories" },
      { status: 500 }
    );
  }
}
