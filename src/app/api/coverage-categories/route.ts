import { db, mapRows } from "@/lib/db";
import { NextResponse } from "next/server";

type CoverageCategoryRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  displayOrder: number;
};

export async function GET() {
  try {
    const { data, error } = await db
      .from("coverage_categories")
      .select("id, code, name, description, displayOrder:display_order")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    if (error) throw error;
    const categories = mapRows<CoverageCategoryRow>(data || []);

    // Return categories with an ID that can be used as frontend selection key (use code)
    return NextResponse.json(
      categories.map((c) => ({
        id: c.code,
        code: c.code,
        name: c.name,
        description: c.description,
        displayOrder: c.displayOrder,
      }))
    );
  } catch (error) {
    console.error("Coverage categories fetch error:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des catégories" },
      { status: 500 }
    );
  }
}
