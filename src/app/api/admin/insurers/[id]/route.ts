import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const insurer = await db.insurer.findUnique({
      where: { id },
      include: {
        offers: {
          orderBy: { createdAt: "desc" },
        },
        coverages: {
          include: { category: { select: { id: true, name: true, code: true } } },
          orderBy: { createdAt: "desc" },
        },
        accounts: {
          include: { profile: { select: { id: true, firstName: true, lastName: true, email: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!insurer) {
      return NextResponse.json(
        { error: "Assureur introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(insurer);
  } catch (error) {
    console.error("Erreur insurer GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement de l'assureur" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, name, logoUrl, contactEmail, phone, website, isActive } =
      body;

    const existing = await db.insurer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Assureur introuvable" },
        { status: 404 }
      );
    }

    if (code && code !== existing.code) {
      const codeTaken = await db.insurer.findUnique({ where: { code } });
      if (codeTaken) {
        return NextResponse.json(
          { error: "Un assureur avec ce code existe déjà" },
          { status: 400 }
        );
      }
    }

    const insurer = await db.insurer.update({
      where: { id },
      data: {
        ...(code !== undefined && { code }),
        ...(name !== undefined && { name }),
        ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
        ...(contactEmail !== undefined && { contactEmail: contactEmail || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(website !== undefined && { website: website || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    await db.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "Insurer",
        entityId: id,
        details: JSON.stringify({ code: insurer.code, name: insurer.name }),
        userName: "SYSTEM",
      },
    });

    return NextResponse.json(insurer);
  } catch (error) {
    console.error("Erreur insurer PUT:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'assureur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.insurer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Assureur introuvable" },
        { status: 404 }
      );
    }

    await db.insurer.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        action: "DELETE",
        entity: "Insurer",
        entityId: id,
        details: JSON.stringify({ code: existing.code, name: existing.name }),
        userName: "SYSTEM",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur insurer DELETE:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'assureur" },
      { status: 500 }
    );
  }
}