import { db, mapRow, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const activeParam = searchParams.get("active");

    let query = db
      .from("insurers")
      .select("*")
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
    }
    if (activeParam !== null && activeParam !== "") {
      query = query.eq("is_active", activeParam === "true");
    }

    const { data, error } = await query;
    if (error) throw error;
    const insurers = mapRows(data || []);

    const ids = insurers.map((i) => (i as { id: string }).id);
    const offersCounts = new Map<string, number>();
    const coveragesCounts = new Map<string, number>();
    const accountsCounts = new Map<string, number>();
    if (ids.length > 0) {
      const { data: offersData } = await db
        .from("insurance_offers")
        .select("insurer_id")
        .in("insurer_id", ids);
      for (const o of offersData || []) {
        const key = String(o.insurer_id);
        offersCounts.set(key, (offersCounts.get(key) || 0) + 1);
      }
      const { data: coveragesData } = await db
        .from("coverages")
        .select("insurer_id")
        .in("insurer_id", ids);
      for (const c of coveragesData || []) {
        const key = String(c.insurer_id);
        coveragesCounts.set(key, (coveragesCounts.get(key) || 0) + 1);
      }
      const { data: accountsData } = await db
        .from("insurer_accounts")
        .select("insurer_id")
        .in("insurer_id", ids);
      for (const a of accountsData || []) {
        const key = String(a.insurer_id);
        accountsCounts.set(key, (accountsCounts.get(key) || 0) + 1);
      }
    }

    const result = insurers.map((i) => ({
      ...i,
      _count: {
        offers: offersCounts.get(String((i as { id: string }).id)) || 0,
        coverages: coveragesCounts.get(String((i as { id: string }).id)) || 0,
        accounts: accountsCounts.get(String((i as { id: string }).id)) || 0,
      },
    }));

    return NextResponse.json(result);
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
      while (true) {
        const { data: dup } = await db
          .from("insurers")
          .select("id")
          .eq("code", unique)
          .maybeSingle();
        if (!dup) break;
        unique = `${genCode}${suffix++}`;
      }
      genCode = unique;
    } else {
      const { data: existing } = await db
        .from("insurers")
        .select("id")
        .eq("code", genCode)
        .maybeSingle();
      if (existing) {
        return NextResponse.json(
          { error: "Un assureur avec ce code existe déjà" },
          { status: 400 }
        );
      }
    }

    const { data: insurer, error } = await db
      .from("insurers")
      .insert({
        code: genCode,
        name,
        logo_url: logoUrl || null,
        contact_email: contactEmail || null,
        phone: phone || null,
        website: website || null,
        is_active: isActive ?? true,
      })
      .select()
      .single();
    if (error) throw error;

    await db.from("audit_logs").insert({
      action: "CREATE",
      entity: "Insurer",
      entity_id: insurer.id,
      details: JSON.stringify({ code: insurer.code, name: insurer.name }),
      user_name: "SYSTEM",
    });

    return NextResponse.json(mapRow(insurer), { status: 201 });
  } catch (error) {
    console.error("Erreur insurers POST:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'assureur" },
      { status: 500 }
    );
  }
}
