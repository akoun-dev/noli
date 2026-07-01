import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const guarantee = await db.guarantee.findUnique({
      where: { id },
    });

    if (!guarantee) {
      return NextResponse.json(
        { error: "Guarantee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(guarantee);
  } catch (error) {
    console.error("Error fetching guarantee:", error);
    return NextResponse.json(
      { error: "Failed to fetch guarantee" },
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

    const existing = await db.guarantee.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Guarantee not found" },
        { status: 404 }
      );
    }

    const guarantee = await db.guarantee.update({
      where: { id },
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        icon: body.icon,
        category: body.category,
        sortOrder: body.sortOrder,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(guarantee);
  } catch (error) {
    console.error("Error updating guarantee:", error);
    return NextResponse.json(
      { error: "Failed to update guarantee" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.guarantee.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Guarantee not found" },
        { status: 404 }
      );
    }

    await db.guarantee.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Guarantee deleted successfully" });
  } catch (error) {
    console.error("Error deleting guarantee:", error);
    return NextResponse.json(
      { error: "Failed to delete guarantee" },
      { status: 500 }
    );
  }
}