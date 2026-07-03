import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get("userId");
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search") || "";

    if (!userId) {
      return NextResponse.json(
        { error: "Le paramètre userId est requis" },
        { status: 400 }
      );
    }

    const account = await db.insurerAccount.findFirst({
      where: { profileId: userId },
      select: { insurerId: true },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Aucun compte assureur trouvé pour cet utilisateur" },
        { status: 404 }
      );
    }

    const where: Record<string, unknown> = { insurerId: account.insurerId };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { type: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const coverages = await db.coverage.findMany({
      where,
      include: {
        category: { select: { name: true } },
      },
      orderBy: { displayOrder: "asc" },
    });

    const formatted = coverages.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      type: c.type,
      description: c.description,
      isMandatory: c.isMandatory,
      isActive: c.isActive,
      displayOrder: c.displayOrder,
      category: c.category ? { name: c.category.name } : null,
    }));

    return NextResponse.json({ coverages: formatted });
  } catch (error) {
    console.error("Erreur insurer/coverages:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des garanties" },
      { status: 500 }
    );
  }
}