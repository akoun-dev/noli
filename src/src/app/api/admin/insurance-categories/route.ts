import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const categories = await db.insuranceCategory.findMany({
      include: {
        _count: { select: { offers: true, quotes: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Erreur insurance-categories GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des catégories d'assurance" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const body = await request.json();
    const { name, description, icon, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Le nom est requis" },
        { status: 400 }
      );
    }

    const category = await db.insuranceCategory.create({
      data: {
        name,
        description: description || null,
        icon: icon || null,
        isActive: isActive ?? true,
      },
    });

    await db.auditLog.create({
      data: { action: "CREATE", entity: "InsuranceCategory", entityId: category.id, details: JSON.stringify({ name: category.name }), userName: "SYSTEM" },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Erreur insurance-categories POST:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la catégorie" },
      { status: 500 }
    );
  }
}