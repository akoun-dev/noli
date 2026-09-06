import { db, mapRow, mapRows } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { createInsurancePackageSchema } from "@/lib/validation";

export async function GET() {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const { data, error } = await db
      .from("insurance_packages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const packages = mapRows(data || []);

    const ids = packages.map((p) => (p as { id: string }).id);
    const linkCounts = new Map<string, number>();
    if (ids.length > 0) {
      const { data: linksData } = await db
        .from("package_coverages")
        .select("package_id")
        .in("package_id", ids);
      for (const l of linksData || []) {
        const key = String(l.package_id);
        linkCounts.set(key, (linkCounts.get(key) || 0) + 1);
      }
    }

    const result = packages.map((p) => ({
      ...p,
      _count: { coverageLinks: linkCounts.get(String((p as { id: string }).id)) || 0 },
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur insurance-packages GET:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des packages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }
    const parsed = createInsurancePackageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
        { status: 400 }
      );
    }
    const { name, description, basePrice, isActive } = parsed.data;

    const { data: pkg, error } = await db
      .from("insurance_packages")
      .insert({
        name,
        description: description || null,
        base_price: basePrice,
        is_active: isActive ?? true,
      })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json(mapRow(pkg), { status: 201 });
  } catch (error) {
    console.error("Erreur insurance-packages POST:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du package" },
      { status: 500 }
    );
  }
}
