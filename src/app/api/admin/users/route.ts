import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { quotes: true } } },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Erreur utilisateurs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "L'ID est obligatoire" }, { status: 400 });
    }
    const existing = await db.user.findUnique({ where: { id: body.id } });
    if (!existing) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const user = await db.user.update({
      where: { id: body.id },
      data: updateData,
      include: { _count: { select: { quotes: true } } },
    });
    return NextResponse.json(user);
  } catch (error) {
    console.error("Erreur mise à jour utilisateur:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}