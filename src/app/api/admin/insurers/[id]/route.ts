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
      .from("insurers")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    const insurer = mapRow(data);

    if (!insurer) {
      return NextResponse.json(
        { error: "Assureur introuvable" },
        { status: 404 }
      );
    }

    const { data: offersData } = await db
      .from("insurance_offers")
      .select("*")
      .eq("insurer_id", id)
      .order("created_at", { ascending: false });
    const { data: coveragesData } = await db
      .from("coverages")
      .select("*, category:coverage_categories(id, name, code)")
      .eq("insurer_id", id)
      .order("created_at", { ascending: false });
    const { data: accountsData } = await db
      .from("insurer_accounts")
      .select("*, profile:profiles(id, firstName:first_name, lastName:last_name, email)")
      .eq("insurer_id", id)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      ...insurer,
      offers: mapRows(offersData || []),
      coverages: mapRows(coveragesData || []),
      accounts: mapRows(accountsData || []),
    });
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
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;
    const body = await request.json();
    const { code, name, logoUrl, contactEmail, phone, website, isActive } =
      body;

    const { data: existingData } = await db
      .from("insurers")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    const existing = mapRow(existingData);
    if (!existing) {
      return NextResponse.json(
        { error: "Assureur introuvable" },
        { status: 404 }
      );
    }

    if (code && code !== existing.code) {
      const { data: codeTaken } = await db
        .from("insurers")
        .select("id")
        .eq("code", code)
        .maybeSingle();
      if (codeTaken) {
        return NextResponse.json(
          { error: "Un assureur avec ce code existe déjà" },
          { status: 400 }
        );
      }
    }

    const { data: insurer, error } = await db
      .from("insurers")
      .update({
        ...(code !== undefined && { code }),
        ...(name !== undefined && { name }),
        ...(logoUrl !== undefined && { logo_url: logoUrl || null }),
        ...(contactEmail !== undefined && { contact_email: contactEmail || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(website !== undefined && { website: website || null }),
        ...(isActive !== undefined && { is_active: isActive }),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    await db.from("audit_logs").insert({
      action: "UPDATE",
      entity: "Insurer",
      entity_id: id,
      details: JSON.stringify({ code: insurer.code, name: insurer.name }),
      user_name: "SYSTEM",
    });

    return NextResponse.json(mapRow(insurer));
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
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params;

    const { data } = await db
      .from("insurers")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    const existing = mapRow(data);
    if (!existing) {
      return NextResponse.json(
        { error: "Assureur introuvable" },
        { status: 404 }
      );
    }

    await db.from("insurers").delete().eq("id", id);

    await db.from("audit_logs").insert({
      action: "DELETE",
      entity: "Insurer",
      entity_id: id,
      details: JSON.stringify({ code: existing.code, name: existing.name }),
      user_name: "SYSTEM",
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
