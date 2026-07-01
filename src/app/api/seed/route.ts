import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    if ((await db.insurer.count()) > 0) {
      return NextResponse.json({ message: "Déjà initialisé" });
    }

    // ── Insurance Categories ──────────────────────────────────
    const autoCat = await db.insuranceCategory.create({
      data: { name: "Assurance Auto", icon: "Car", description: "Assurance automobile tous risques" },
    });

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
      const created = await db.coverageCategory.create({ data: c });
      cats.push({ id: created.id, code: created.code });
    }
    const catMap = new Map(cats.map((c) => [c.code, c.id]));

    // ── Insurers ────────────────────────────────────────────────
    const insurerData = [
      { code: "GNA", name: "GNA Assurances", contactEmail: "contact@gna.ci", phone: "+225 27 20 30 40 50", website: "https://www.gna.ci", mult: 0.9 },
      { code: "NSIA", name: "NSIA Assurances", contactEmail: "contact@nsia.ci", phone: "+225 27 20 30 40 51", website: "https://www.nsiabenin.com", mult: 0.95 },
      { code: "NOLIA", name: "NOLIA Assurances", contactEmail: "contact@nolia.ci", phone: "+225 27 20 30 40 52", website: "https://www.nolia.ci", mult: 1.0 },
      { code: "SUNU", name: "SUNU Assurances", contactEmail: "info@sunu.ci", phone: "+225 27 20 41 42 43", website: "https://www.sunu.com", mult: 1.1 },
      { code: "SAHAM", name: "SAHAM Assurances", contactEmail: "contact@saham.ci", phone: "+225 27 20 51 52 53", website: "https://www.saham.com", mult: 1.15 },
    ];
    const insurers: { id: string; code: string; mult: number }[] = [];
    for (const i of insurerData) {
      const { mult: _, ...rest } = i;
      const created = await db.insurer.create({ data: rest });
      insurers.push({ id: created.id, code: created.code, mult: i.mult });
    }

    // ── Coverages (per insurer) ───────────────────────────────
    const coverageTemplates = [
      { code: "RC", type: "RC", name: "Responsabilité Civile", calcType: "MATRIX_BASED", catCode: "RESPONSABILITE_CIVILE", mandatory: true,
        meta: { matrixType: "FISCAL_POWER", capital: { corporel: "7 000 000 000 FCFA", materiel: "500 000 000 FCFA" } } },
      { code: "DR", type: "DR", name: "Défense & Recours", calcType: "FIXED_AMOUNT", catCode: "DEFENSE_RECOURS",
        meta: { fixedAmount: 7950, capital: "1 000 000 FCFA" } },
      { code: "IC_F1", type: "IC", name: "IC Formule 1", calcType: "MATRIX_BASED", catCode: "INDIVIDUELLE_CONDUCTEUR",
        meta: { matrixType: "FORMULA", formulas: [{ name: "Formule 1", capitalDeces: 1000000, capitalInvalidite: 2000000, fraisMedicaux: 100000, primeFixe: 5500 }] } },
      { code: "IC_F2", type: "IC", name: "IC Formule 2", calcType: "MATRIX_BASED", catCode: "INDIVIDUELLE_CONDUCTEUR",
        meta: { matrixType: "FORMULA", formulas: [{ name: "Formule 2", capitalDeces: 3000000, capitalInvalidite: 6000000, fraisMedicaux: 400000, primeFixe: 8400 }] } },
      { code: "IC_F3", type: "IC", name: "IC Formule 3", calcType: "MATRIX_BASED", catCode: "INDIVIDUELLE_CONDUCTEUR",
        meta: { matrixType: "FORMULA", formulas: [{ name: "Formule 3", capitalDeces: 5000000, capitalInvalidite: 10000000, fraisMedicaux: 500000, primeFixe: 15900 }] } },
      { code: "IPT", type: "IPT", name: "Individuelle Passagers", calcType: "MATRIX_BASED", catCode: "INDIVIDUELLE_PASSAGERS",
        meta: { matrixType: "FORMULA", useSeats: true, formulas: [
          { name: "Formule 1", capitalDeces: 1000000, capitalInvalidite: 2000000, fraisMedicaux: 100000, primeFixe: 5500 },
          { name: "Formule 2", capitalDeces: 3000000, capitalInvalidite: 6000000, fraisMedicaux: 400000, primeFixe: 8400 },
          { name: "Formule 3", capitalDeces: 5000000, capitalInvalidite: 10000000, fraisMedicaux: 500000, primeFixe: 15900 },
        ] } },
      { code: "INCENDIE", type: "INCENDIE", name: "Incendie", calcType: "VARIABLE_BASED", catCode: "INCENDIE",
        meta: { variable: "VN", rate: 0.42, franchise: { percent: 5, min: 65000, description: "5% du sinistre, minimum 65 000 FCFA" } } },
      { code: "VOL", type: "VOL", name: "Vol", calcType: "VARIABLE_BASED", catCode: "VOL",
        meta: { variable: "VN", conditional: { threshold: 25000000, rateBelow: 1.1, rateAbove: 2.1 }, franchise: { percent: 10, min: 255000, description: "10% du sinistre, minimum 255 000 FCFA" } } },
      { code: "VOL_ARME", type: "VOL_ARME", name: "Vol à mains armées", calcType: "VARIABLE_BASED", catCode: "VOL",
        meta: { variable: "VN", conditional: { threshold: 25000000, rateBelow: 1.6, rateAbove: 2.2 }, franchise: { percent: 10, min: 255000 } } },
      { code: "BDG", type: "BDG", name: "Bris de glaces", calcType: "VARIABLE_BASED", catCode: "BRIS_GLACES",
        meta: { variable: "REPLACEMENT_VALUE", rate: 0.4 } },
      { code: "EXT_BDG", type: "EXT_BDG", name: "Extension BDG toit ouvrant", calcType: "VARIABLE_BASED", catCode: "BRIS_GLACES",
        meta: { variable: "REPLACEMENT_VALUE", rate: 0.42, incompatibleWith: "BDG" } },
      { code: "TCM", type: "TCM", name: "Tierce Complète", calcType: "MATRIX_BASED", catCode: "TIERCE_COMPLETE",
        meta: { matrixType: "TIERCE_COMPLETE" } },
      { code: "TCL", type: "TCL", name: "Tierce Collision", calcType: "MATRIX_BASED", catCode: "TIERCE_COLLISION",
        meta: { matrixType: "TIERCE_COLLISION" } },
      { code: "ASSISTANCE", type: "ASSISTANCE", name: "Assistance", calcType: "FIXED_AMOUNT", catCode: "ASSISTANCE",
        meta: { fixedAmount: 10000 } },
      { code: "AVANCE_RECOURS", type: "AVANCE_RECOURS", name: "Avance sur recours", calcType: "FIXED_AMOUNT", catCode: "AVANCE_RECOURS",
        meta: { fixedAmount: 15000, capital: "4 000 000 FCFA" } },
      { code: "VOL_ACCESSOIRES", type: "VOL_ACCESSOIRES", name: "Vol des accessoires", calcType: "FIXED_AMOUNT", catCode: "ACCESSOIRES",
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
        await db.coverage.create({
          data: {
            code: covCode, type: tmpl.type, name: tmpl.name,
            description: `Garantie ${tmpl.name} — ${ins.name}`,
            calculationType: tmpl.calcType,
            categoryId: catMap.get(tmpl.catCode) || null,
            insurerId: ins.id, isMandatory: tmpl.mandatory,
            metadata: JSON.stringify(tmpl.meta),
            displayOrder: coverageTemplates.indexOf(tmpl) + 1,
          },
        });
      }

      // RC tariff rules
      const rcCoverage = await db.coverage.findFirst({ where: { code: `RC_${ins.code}` } });
      if (rcCoverage) {
        for (const fuel of ["ESSENCE", "DIESEL"]) {
          for (const cv of cvRanges) {
            const basePrice = rcPrices[cv.range as keyof typeof rcPrices];
            await db.coverageTariffRule.create({
              data: {
                coverageId: rcCoverage.id,
                fuelType: fuel, minFiscalPower: cv.min, maxFiscalPower: cv.max,
                fixedAmount: Math.round(basePrice * ins.mult),
              },
            });
          }
        }
      }
    }

    // ── Insurance Offers (3 per insurer) ────────────────────────
    const offerTemplates = [
      { name: "Économique", contractType: "basic", features: ["RC", "Défense & Recours", "Assistance"], deductible: 0, basePrice: 25000 },
      { name: "Équilibre", contractType: "third_party_plus", features: ["RC", "DR", "IC", "Incendie", "Vol", "Assistance"], deductible: 50000, basePrice: 65000 },
      { name: "Sérénité", contractType: "all_risks", features: ["RC", "DR", "IC", "IPT", "Incendie", "Vol", "BDG", "TCM", "Assistance"], deductible: 50000, basePrice: 120000 },
    ];

    for (const ins of insurers) {
      for (const tpl of offerTemplates) {
        const price = Math.round(tpl.basePrice * ins.mult);
        await db.insuranceOffer.create({
          data: {
            insurerId: ins.id, categoryId: autoCat.id, name: tpl.name,
            description: `Offre ${tpl.name} — ${ins.name}`,
            priceMin: Math.round(price * 0.9), priceMax: Math.round(price * 1.1),
            deductible: tpl.deductible,
            features: JSON.stringify(tpl.features),
            contractType: tpl.contractType,
          },
        });
      }
    }

    // ── Insurance Packages ─────────────────────────────────────
    await db.insurancePackage.createMany({
      data: [
        { name: "Pack Pickup Ivory", description: "Pack gratuit réservé aux pick-up ≤ 3 tonnes", basePrice: 0 },
        { name: "Pack Pickup Bronze", description: "Pack assurance pick-up niveau Bronze", basePrice: 48000 },
        { name: "Pack Pickup Silver", description: "Pack assurance pick-up niveau Silver", basePrice: 65000 },
        { name: "Pack Pickup Gold", description: "Pack assurance pick-up niveau Gold", basePrice: 85000 },
      ],
    });

    return NextResponse.json({
      message: "Base de données initialisée",
      insurers: insurers.length,
      coverageCategories: cats.length,
      insuranceCategories: 1,
      insuranceOffers: insurers.length * 3,
      insurancePackages: 4,
    });
  } catch (error) {
    console.error("Erreur seed:", error);
    return NextResponse.json({ error: "Échec de l'initialisation" }, { status: 500 });
  }
}