import { db, mapRows } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const [counts, recentQuotes] = await Promise.all([
      Promise.all([
        db.from("insurers").select("id", { count: "exact", head: true }),
        db.from("insurers").select("id", { count: "exact", head: true }).eq("is_active", true),
        db.from("insurance_offers").select("id", { count: "exact", head: true }),
        db.from("insurance_offers").select("id", { count: "exact", head: true }).eq("is_active", true),
        db.from("coverages").select("id", { count: "exact", head: true }),
        db.from("coverages").select("id", { count: "exact", head: true }).eq("is_active", true),
        db.from("quotes").select("id", { count: "exact", head: true }),
        db.from("quotes").select("id", { count: "exact", head: true }).eq("status", "PENDING"),
        db.from("insurance_packages").select("id", { count: "exact", head: true }),
        db.from("profiles").select("id", { count: "exact", head: true }),
        db.from("coverage_categories").select("id", { count: "exact", head: true }),
        db.from("insurance_categories").select("id", { count: "exact", head: true }),
        db.from("coverage_tariff_rules").select("id", { count: "exact", head: true }),
      ]),
      db
        .from("quotes")
        .select(
          "id, reference, status, estimated_price, personal_data, created_at, offer:insurance_offers(name, insurer:insurers(name))"
        )
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const [totalInsurers, activeInsurers, totalOffers, activeOffers, totalCoverages, activeCoverages, totalQuotes, pendingQuotes, totalPackages, totalProfiles, totalCoverageCategories, totalInsuranceCategories, totalTariffRules] = counts.map((r) => r.count ?? 0);

    if (recentQuotes.error) throw recentQuotes.error;

    return NextResponse.json({
      totalInsurers,
      activeInsurers,
      totalOffers,
      activeOffers,
      totalCoverages,
      activeCoverages,
      totalQuotes,
      pendingQuotes,
      totalPackages,
      totalProfiles,
      totalCoverageCategories,
      totalInsuranceCategories,
      totalTariffRules,
      recentQuotes: mapRows(recentQuotes.data || []).map((q) => ({
        id: q.id,
        reference: q.reference,
        status: q.status,
        estimatedPrice: q.estimatedPrice,
        personalData: (() => {
          try {
            return JSON.parse(q.personalData || "null") ?? {};
          } catch {
            return q.personalData;
          }
        })(),
        createdAt: q.createdAt,
        offer: q.offer ? {
          name: q.offer.name,
          insurer: q.offer.insurer ? { name: q.offer.insurer.name } : undefined,
        } : undefined,
      })),
    });
  } catch (error) {
    console.error("Erreur stats:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des statistiques" },
      { status: 500 }
    );
  }
}
