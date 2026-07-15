import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const categories = await db.coverageCategory.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        displayOrder: true,
      },
      orderBy: { displayOrder: "asc" },
    });

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