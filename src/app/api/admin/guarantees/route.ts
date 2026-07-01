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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");

    const where: Record<string, unknown> = {};

    if (active !== null && active !== undefined && active !== "") {
      where.isActive = active === "true";
    }

    const guarantees = await db.guarantee.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(guarantees);
  } catch (error) {
    console.error("Error fetching guarantees:", error);
    return NextResponse.json(
      { error: "Failed to fetch guarantees" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const slug = body.slug || slugify(body.name);

    // Check for unique slug
    const existing = await db.guarantee.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A guarantee with this slug already exists" },
        { status: 400 }
      );
    }

    const guarantee = await db.guarantee.create({
      data: {
        name: body.name,
        slug,
        description: body.description,
        icon: body.icon,
        category: body.category ?? "garantie",
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(guarantee, { status: 201 });
  } catch (error) {
    console.error("Error creating guarantee:", error);
    return NextResponse.json(
      { error: "Failed to create guarantee" },
      { status: 500 }
    );
  }
}