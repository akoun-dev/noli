import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const activeParam = searchParams.get("active");

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
      ];
    }
    if (activeParam !== null && activeParam !== "") {
      where.isActive = activeParam === "true";
    }

    const insurers = await db.insurer.findMany({
      where,
      include: {
        _count: { select: { offers: true, coverages: true, accounts: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(insurers);
  } catch (error) {
    console.error("Erreur insurers GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des assureurs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const body = await request.json();
    const { code, name, logoUrl, contactEmail, phone, website, isActive } =
      body;

    if (!name) {
      return NextResponse.json(
        { error: "Le nom est requis" },
        { status: 400 }
      );
    }

    // Auto-generate code from name (first word, uppercase)
    let genCode = code;
    if (!genCode) {
      genCode = name.split(/\s+/)[0].toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (!genCode) genCode = "INS";
      // Ensure uniqueness
      let suffix = 1;
      let unique = genCode;
      while (await db.insurer.findUnique({ where: { code: unique } })) {
        unique = `${genCode}${suffix++}`;
      }
      genCode = unique;
    } else {
      const existing = await db.insurer.findUnique({ where: { code: genCode } });
      if (existing) {
        return NextResponse.json(
          { error: "Un assureur avec ce code existe déjà" },
          { status: 400 }
        );
      }
    }

    const insurer = await db.insurer.create({
      data: {
        code: genCode,
        name,
        logoUrl: logoUrl || null,
        contactEmail: contactEmail || null,
        phone: phone || null,
        website: website || null,
        isActive: isActive ?? true,
      },
    });

    await db.auditLog.create({
      data: {
        action: "CREATE",
        entity: "Insurer",
        entityId: insurer.id,
        details: JSON.stringify({ code: insurer.code, name: insurer.name }),
        userName: "SYSTEM",
      },
    });

    return NextResponse.json(insurer, { status: 201 });
  } catch (error) {
    console.error("Erreur insurers POST:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'assureur" },
      { status: 500 }
    );
  }
}