import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function GET() {
  try {
    const categories = await db.guaranteeCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { guarantees: true },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des catégories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Le nom est obligatoire" },
        { status: 400 }
      );
    }

    const slug = body.slug || slugify(body.name);

    const existing = await db.guaranteeCategory.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "Une catégorie avec ce slug existe déjà" },
        { status: 400 }
      );
    }

    const category = await db.guaranteeCategory.create({
      data: {
        name: body.name,
        slug,
        description: body.description ?? null,
        icon: body.icon ?? null,
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de la catégorie:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la catégorie" },
      { status: 500 }
    );
  }
}