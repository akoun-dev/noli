import { db, mapRow, mapRows } from "@/lib/db";
import { NextResponse } from "next/server";
import { COVERAGE_CODE_MAP } from "@/lib/constants";
import { requireAuth } from "@/lib/auth-guard";

export async function POST() {
  try {
    const guard = await requireAuth(["ADMIN"]);
    if (guard) return guard;

    const { count: insurerCount } = await db
      .from("insurers")
      .select("id", { count: "exact", head: true });
    if ((insurerCount || 0) > 0) {
      // Ensure coverage categories exist
      const catData = [
        { code: "RESPONSABILITE_CIVILE", name: "Responsabilité Civile", displayOrder: 1 },
        { code: "DEFENSE_RECOURS", name: "Défense et Recours", displayOrder: 2 },
        { code: "INDIVIDUELLE_CONDUCTEUR", name: "Individuelle Conducteur", displayOrder: 3 },
        { code: "INDIVIDUELLE_PASSAGERS", name: "Individuelle Passagers", displayOrder: 4 },
        { code: "INCENDIE", name: "Incendie", displayOrder: 5 },
        { code: "VOL", name: "Vol", displayOrder: 6 },
        { code: "BRIS_GLACES", name: "Bris de Glaces", displayOrder: 7 },
        { code: "TIERCE_COMPLETE", name: "Tierce Complète", displayOrder: 8 },
        { code: "TIERCE_COLLISION", name: "Tierce Collision", displayOrder: 9 },
        { code: "ASSISTANCE", name: "Assistance", displayOrder: 10 },
        { code: "AVANCE_RECOURS", name: "Avance sur Recours", displayOrder: 11 },
        { code: "ACCESSOIRES", name: "Accessoires", displayOrder: 12 },
      ];
      for (const c of catData) {
        await db.from("coverage_categories").upsert(
          { code: c.code, name: c.name, display_order: c.displayOrder, is_active: true },
          { onConflict: "code" }
        );
      }

      // Update coverage names: replace abbreviations with full names
      const nameFixes: Record<string, string> = {
        "IC Formule 1": "Individuelle Conducteur Formule 1",
        "IC Formule 2": "Individuelle Conducteur Formule 2",
        "IC Formule 3": "Individuelle Conducteur Formule 3",
        "Extension BDG toit ouvrant": "Extension Bris de Glaces toit ouvrant",
      };
      for (const [oldName, newName] of Object.entries(nameFixes)) {
        await db.from("coverages").update({ name: newName }).eq("name", oldName);
      }
      // Update offer features: resolve codes to names
      const { data: allOffersData } = await db.from("insurance_offers").select("id, features");
      const allOffers = mapRows<{ id: string; features: string | null }>(allOffersData || []);
      for (const o of allOffers) {
        const features: string[] = JSON.parse(o.features || "[]");
        const resolved = features.map((f: string) => COVERAGE_CODE_MAP[f] || nameFixes[f] || f);
        if (JSON.stringify(resolved) !== o.features) {
          await db.from("insurance_offers").update({ features: JSON.stringify(resolved) }).eq("id", o.id);
        }
      }
      return NextResponse.json({ message: "Déjà initialisé — noms mis à jour" });
    }

    // ── Insurance Categories ──────────────────────────────────
    const { data: autoCatData, error: autoCatError } = await db
      .from("insurance_categories")
      .insert({ name: "Assurance Auto", icon: "Car", description: "Assurance automobile tous risques" })
      .select()
      .single();
    if (autoCatError) throw autoCatError;
    const autoCat = mapRow<{ id: string }>(autoCatData)!;

    // ── Coverage Categories ────────────────────────────────────
    const catData = [
      { code: "RESPONSABILITE_CIVILE", name: "Responsabilité Civile", displayOrder: 1 },
      { code: "DEFENSE_RECOURS", name: "Défense et Recours", displayOrder: 2 },
      { code: "INDIVIDUELLE_CONDUCTEUR", name: "Individuelle Conducteur", displayOrder: 3 },
      { code: "INDIVIDUELLE_PASSAGERS", name: "Individuelle Passagers", displayOrder: 4 },
      { code: "INCENDIE", name: "Incendie", displayOrder: 5 },
      { code: "VOL", name: "Vol", displayOrder: 6 },
      { code: "BRIS_GLACES", name: "Bris de Glaces", displayOrder: 7 },
      { code: "TIERCE_COMPLETE", name: "Tierce Complète", displayOrder: 8 },
      { code: "TIERCE_COLLISION", name: "Tierce Collision", displayOrder: 9 },
      { code: "ASSISTANCE", name: "Assistance", displayOrder: 10 },
      { code: "AVANCE_RECOURS", name: "Avance sur Recours", displayOrder: 11 },
      { code: "ACCESSOIRES", name: "Accessoires", displayOrder: 12 },
    ];
    const cats: { id: string; code: string }[] = [];
    for (const c of catData) {
      const { data, error } = await db
        .from("coverage_categories")
        .insert({ code: c.code, name: c.name, display_order: c.displayOrder })
        .select()
        .single();
      if (error) throw error;
      const created = mapRow<{ id: string; code: string }>(data)!;
      cats.push({ id: created.id, code: created.code });
    }
    const catMap = new Map(cats.map((c) => [c.code, c.id]));

    // ── Insurers ────────────────────────────────────────────────
    const pricing: Record<string, [number, number, number]> = {
      GNA:   [18000,   48000,   88000],
      NOLIA: [21000,   55000,   100000],
      NSIA:  [25000,   65000,   120000],
      SUNU:  [28000,   72000,   135000],
      SAHAM: [32000,   82000,   155000],
    };

    const insurerData = [
      { code: "GNA", name: "GNA Assurances", contactEmail: "contact@gna.ci", phone: "+225 27 20 30 40 50", website: "https://www.gna.ci" },
      { code: "NSIA", name: "NSIA Assurances", contactEmail: "contact@nsia.ci", phone: "+225 27 20 30 40 51", website: "https://www.nsiabenin.com" },
      { code: "NOLIA", name: "NOLIA Assurances", contactEmail: "contact@nolia.ci", phone: "+225 27 20 30 40 52", website: "https://www.nolia.ci" },
      { code: "SUNU", name: "SUNU Assurances", contactEmail: "info@sunu.ci", phone: "+225 27 20 41 42 43", website: "https://www.sunu.com" },
      { code: "SAHAM", name: "SAHAM Assurances", contactEmail: "contact@saham.ci", phone: "+225 27 20 51 52 53", website: "https://www.saham.com" },
    ];
    const insurers: { id: string; code: string; name: string; mult: number }[] = [];
    for (const i of insurerData) {
      const { data, error } = await db
        .from("insurers")
        .insert({ code: i.code, name: i.name, contact_email: i.contactEmail, phone: i.phone, website: i.website })
        .select()
        .single();
      if (error) throw error;
      const created = mapRow<{ id: string; code: string; name: string }>(data)!;
      const p = pricing[i.code];
      insurers.push({ id: created.id, code: created.code, name: created.name, mult: p ? p[0] / 25000 : 1 });
    }

    // ── Coverages (per insurer) ───────────────────────────────
    const coverageTemplates = [
      { code: "RC", type: "RC", name: "Responsabilité Civile", calcType: "MATRIX_BASED", catCode: "RESPONSABILITE_CIVILE", mandatory: true,
        matrixDim: "FISCAL_POWER",
        meta: { dimension: "FISCAL_POWER", capital: { corporel: "7 000 000 000 FCFA", materiel: "500 000 000 FCFA" } } },
      { code: "DR", type: "DR", name: "Défense & Recours", calcType: "FIXED_AMOUNT", catCode: "DEFENSE_RECOURS",
        fixedAmt: 7950,
        meta: { fixedAmount: 7950, capital: "1 000 000 FCFA" } },
      { code: "IC_F1", type: "IC", name: "Individuelle Conducteur Formule 1", calcType: "MATRIX_BASED", catCode: "INDIVIDUELLE_CONDUCTEUR",
        matrixDim: "FORMULA",
        meta: { dimension: "FORMULA", formulas: [{ name: "Formule 1", capitalDeces: 1000000, capitalInvalidite: 2000000, fraisMedicaux: 100000, primeFixe: 5500, baseRate: 100, ceiling: 5500 }] } },
      { code: "IC_F2", type: "IC", name: "Individuelle Conducteur Formule 2", calcType: "MATRIX_BASED", catCode: "INDIVIDUELLE_CONDUCTEUR",
        matrixDim: "FORMULA",
        meta: { dimension: "FORMULA", formulas: [{ name: "Formule 2", capitalDeces: 3000000, capitalInvalidite: 6000000, fraisMedicaux: 400000, primeFixe: 8400, baseRate: 100, ceiling: 8400 }] } },
      { code: "IC_F3", type: "IC", name: "Individuelle Conducteur Formule 3", calcType: "MATRIX_BASED", catCode: "INDIVIDUELLE_CONDUCTEUR",
        matrixDim: "FORMULA",
        meta: { dimension: "FORMULA", formulas: [{ name: "Formule 3", capitalDeces: 5000000, capitalInvalidite: 10000000, fraisMedicaux: 500000, primeFixe: 15900, baseRate: 100, ceiling: 15900 }] } },
      { code: "IPT", type: "IPT", name: "Individuelle Passagers", calcType: "MATRIX_BASED", catCode: "INDIVIDUELLE_PASSAGERS",
        matrixDim: "FORMULA",
        meta: { dimension: "FORMULA", useSeats: true, formulas: [
          { name: "Formule 1", capitalDeces: 1000000, capitalInvalidite: 2000000, fraisMedicaux: 100000, primeFixe: 5500, baseRate: 100, ceiling: 5500 },
          { name: "Formule 2", capitalDeces: 3000000, capitalInvalidite: 6000000, fraisMedicaux: 400000, primeFixe: 8400, baseRate: 100, ceiling: 8400 },
          { name: "Formule 3", capitalDeces: 5000000, capitalInvalidite: 10000000, fraisMedicaux: 500000, primeFixe: 15900, baseRate: 100, ceiling: 15900 },
        ] } },
      { code: "INCENDIE", type: "INCENDIE", name: "Incendie", calcType: "VARIABLE_BASED", catCode: "INCENDIE",
        varSrc: "NEW_VALUE", ratePct: 0.42,
        meta: { variableSource: "NEW_VALUE", ratePercent: 0.42, franchise: { percent: 5, min: 65000, description: "5% du sinistre, minimum 65 000 FCFA" } } },
      { code: "VOL", type: "VOL", name: "Vol", calcType: "VARIABLE_BASED", catCode: "VOL",
        varSrc: "NEW_VALUE",
        condByNV: true, nvThreshold: 25000000, rateBelow: 1.1, rateAbove: 2.1,
        meta: { variableSource: "NEW_VALUE", conditionedByNewValue: true, newValueThreshold: 25000000, rateBelowThresholdPercent: 1.1, rateAboveThresholdPercent: 2.1, franchise: { percent: 10, min: 255000, description: "10% du sinistre, minimum 255 000 FCFA" } } },
      { code: "VOL_ARME", type: "VOL_ARME", name: "Vol à mains armées", calcType: "VARIABLE_BASED", catCode: "VOL",
        varSrc: "NEW_VALUE",
        condByNV: true, nvThreshold: 25000000, rateBelow: 1.6, rateAbove: 2.2,
        meta: { variableSource: "NEW_VALUE", conditionedByNewValue: true, newValueThreshold: 25000000, rateBelowThresholdPercent: 1.6, rateAboveThresholdPercent: 2.2, franchise: { percent: 10, min: 255000 } } },
      { code: "BDG", type: "BDG", name: "Bris de glaces", calcType: "VARIABLE_BASED", catCode: "BRIS_GLACES",
        varSrc: "NEW_VALUE", ratePct: 0.4,
        meta: { variableSource: "NEW_VALUE", ratePercent: 0.4 } },
      { code: "EXT_BDG", type: "EXT_BDG", name: "Extension Bris de Glaces toit ouvrant", calcType: "VARIABLE_BASED", catCode: "BRIS_GLACES",
        varSrc: "NEW_VALUE", ratePct: 0.42,
        meta: { variableSource: "NEW_VALUE", ratePercent: 0.42, incompatibleWith: "BDG" } },
      { code: "TCM", type: "TCM", name: "Tierce Complète", calcType: "MATRIX_BASED", catCode: "TIERCE_COMPLETE",
        matrixDim: "TIERCE_COMPLETE",
        meta: { dimension: "TIERCE_COMPLETE" } },
      { code: "TCL", type: "TCL", name: "Tierce Collision", calcType: "MATRIX_BASED", catCode: "TIERCE_COLLISION",
        matrixDim: "TIERCE_COLLISION",
        meta: { dimension: "TIERCE_COLLISION" } },
      { code: "ASSISTANCE", type: "ASSISTANCE", name: "Assistance", calcType: "FIXED_AMOUNT", catCode: "ASSISTANCE",
        fixedAmt: 10000,
        meta: { fixedAmount: 10000 } },
      { code: "AVANCE_RECOURS", type: "AVANCE_RECOURS", name: "Avance sur recours", calcType: "FIXED_AMOUNT", catCode: "AVANCE_RECOURS",
        fixedAmt: 15000,
        meta: { fixedAmount: 15000, capital: "4 000 000 FCFA" } },
      { code: "VOL_ACCESSOIRES", type: "VOL_ACCESSOIRES", name: "Vol des accessoires", calcType: "FIXED_AMOUNT", catCode: "ACCESSOIRES",
        fixedAmt: 15000,
        meta: { fixedAmount: 15000, capital: "250 000 FCFA", franchise: 20000 } },
      { code: "RTI", type: "RTI", name: "Recours tiers Incendie", calcType: "FREE", catCode: "RESPONSABILITE_CIVILE",
        meta: {} },
    ];

    const rcPrices = { "1-2 CV": 68675, "3-4 CV": 75000, "5-7 CV": 85000, "8-10 CV": 95000, "11+ CV": 110000 };
    const cvRanges = [
      { range: "1-2 CV", min: 1, max: 2 }, { range: "3-4 CV", min: 3, max: 4 },
      { range: "5-7 CV", min: 5, max: 7 }, { range: "8-10 CV", min: 8, max: 10 },
      { range: "11+ CV", min: 11, max: 99 },
    ];

    for (const ins of insurers) {
      for (const tmpl of coverageTemplates) {
        const covCode = `${tmpl.code}_${ins.code}`;
        const { error } = await db.from("coverages").insert({
          code: covCode, type: tmpl.type, name: tmpl.name,
          description: `Garantie ${tmpl.name} — ${ins.name}`,
          calculation_type: tmpl.calcType,
          category_id: catMap.get(tmpl.catCode) || null,
          insurer_id: ins.id, is_mandatory: tmpl.mandatory,
          metadata: JSON.stringify(tmpl.meta),
          display_order: coverageTemplates.indexOf(tmpl) + 1,
          variable_source: (tmpl as any).varSrc || null,
          rate_percent: (tmpl as any).ratePct ?? null,
          conditioned_by_new_value: (tmpl as any).condByNV || false,
          new_value_threshold: (tmpl as any).nvThreshold ?? null,
          rate_below_threshold: (tmpl as any).rateBelow ?? null,
          rate_above_threshold: (tmpl as any).rateAbove ?? null,
          fixed_amount: (tmpl as any).fixedAmt ?? null,
          matrix_dimension: (tmpl as any).matrixDim || null,
        });
        if (error) throw error;
      }

      // RC tariff rules
      const { data: rcData } = await db
        .from("coverages")
        .select("id")
        .eq("code", `RC_${ins.code}`)
        .maybeSingle();
      const rcCoverage = mapRow<{ id: string }>(rcData);
      if (rcCoverage) {
        for (const fuel of ["ESSENCE", "DIESEL"]) {
          for (const cv of cvRanges) {
            const basePrice = rcPrices[cv.range as keyof typeof rcPrices];
            const { error } = await db.from("coverage_tariff_rules").insert({
              coverage_id: rcCoverage.id,
              fuel_type: fuel, min_fiscal_power: cv.min, max_fiscal_power: cv.max,
              fixed_amount: Math.round(basePrice * ins.mult),
            });
            if (error) throw error;
          }
        }
      }
    }

    // ── Insurance Offers (3 per insurer) ────────────────────────
    const contractTypes = ["basic", "third_party_plus", "all_risks"];
    const margins: Record<string, number> = { basic: 0.15, third_party_plus: 0.18, all_risks: 0.20 };

    for (const ins of insurers) {
      const basePrices = pricing[ins.code] || [25000, 65000, 120000];
      const names = ["Économique", "Équilibre", "Sérénité"];
      const featureSets = [
        ["Responsabilité Civile", "Défense et Recours", "Assistance"],
        ["Responsabilité Civile", "Défense et Recours", "Individuelle Conducteur", "Incendie", "Vol", "Assistance"],
        ["Responsabilité Civile", "Défense et Recours", "Individuelle Conducteur", "Individuelle Passagers", "Incendie", "Vol", "Bris de Glaces", "Tierce Complète", "Assistance"],
      ];
      const deductibles = [0, 50000, 50000];

      for (let i = 0; i < names.length; i++) {
        const minPrice = basePrices[i];
        const margin = margins[contractTypes[i]];
        const maxPrice = Math.round(minPrice * (1 + margin));
        const { error } = await db.from("insurance_offers").insert({
          insurer_id: ins.id, category_id: autoCat.id, name: names[i],
          description: `Offre ${names[i]} — ${ins.name}`,
          price_min: minPrice, price_max: maxPrice,
          deductible: deductibles[i],
          features: JSON.stringify(featureSets[i]),
          contract_type: contractTypes[i],
        });
        if (error) throw error;
      }
    }

    // ── Insurance Packages ─────────────────────────────────────
    const { error: packagesError } = await db.from("insurance_packages").insert([
      { name: "Pack Pickup Ivory", description: "Pack gratuit réservé aux pick-up ≤ 3 tonnes", base_price: 0 },
      { name: "Pack Pickup Bronze", description: "Pack assurance pick-up niveau Bronze", base_price: 48000 },
      { name: "Pack Pickup Silver", description: "Pack assurance pick-up niveau Silver", base_price: 65000 },
      { name: "Pack Pickup Gold", description: "Pack assurance pick-up niveau Gold", base_price: 85000 },
    ]);
    if (packagesError) throw packagesError;

    return NextResponse.json({
      message: "Base de données initialisée",
      insurers: insurers.length,
      coverageCategories: cats.length,
      insuranceCategories: 1,
      insuranceOffers: insurers.length * 3,
      insurancePackages: 4,
      profiles: 0,
    });
  } catch (error) {
    console.error("Erreur seed:", error);
    return NextResponse.json({ error: "Échec de l'initialisation" }, { status: 500 });
  }
}
