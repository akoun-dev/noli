import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  const guard = await requireAuth(["INSURER"]); if (guard) return guard;
  try {
    const categories = await db.coverageCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Erreur insurer/coverage-categories GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des catégories" },
      { status: 500 }
    );
  }
}
