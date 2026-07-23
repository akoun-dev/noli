import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const profiles = await db.profile.findMany({
      where,
      include: {
        _count: { select: { quotes: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(profiles);
  } catch (error) {
    console.error("Erreur profiles GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des profils" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const body = await request.json();
    const { id, firstName, lastName, phone, role, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: "L'identifiant du profil est requis" },
        { status: 400 }
      );
    }

    const existing = await db.profile.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Profil introuvable" },
        { status: 404 }
      );
    }

    const validRoles = ["USER", "INSURER", "ADMIN"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Rôle invalide. Valeurs autorisées : USER, INSURER, ADMIN" },
        { status: 400 }
      );
    }

    const profile = await db.profile.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName: firstName || null }),
        ...(lastName !== undefined && { lastName: lastName || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Erreur profiles PUT:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du profil" },
      { status: 500 }
    );
  }
}