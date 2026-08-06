import { db, mapRow, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;

    const { data, error } = await db
      .from("insurance_packages")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    const pkg = mapRow(data);

    if (!pkg) {
      return NextResponse.json(
        { error: "Package introuvable" },
        { status: 404 }
      );
    }

    const { data: linksData } = await db
      .from("package_coverages")
      .select("*, coverage:coverages(id, name, code, type)")
      .eq("package_id", id)
      .order("created_at", { ascending: true });

    return NextResponse.json({
      ...pkg,
      coverageLinks: mapRows(linksData || []),
    });
  } catch (error) {
    console.error("Erreur insurance-package GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement du package" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;
    const body = await request.json();
    const { name, description, basePrice, isActive } = body;

    const { data: existing } = await db
      .from("insurance_packages")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json(
        { error: "Package introuvable" },
        { status: 404 }
      );
    }

    const { data: pkg, error } = await db
      .from("insurance_packages")
      .update({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(basePrice !== undefined && { base_price: basePrice }),
        ...(isActive !== undefined && { is_active: isActive }),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json(mapRow(pkg));
  } catch (error) {
    console.error("Erreur insurance-package PUT:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du package" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;

    const { data: existing } = await db
      .from("insurance_packages")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json(
        { error: "Package introuvable" },
        { status: 404 }
      );
    }

    await db.from("insurance_packages").delete().eq("id", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur insurance-package DELETE:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du package" },
      { status: 500 }
    );
  }
}
