import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const existingInsurers = await db.insurer.count();
    if (existingInsurers > 0) {
      return NextResponse.json({
        message: "Base de données déjà initialisée",
        count: existingInsurers,
      });
    }

    // ── Assureurs ──────────────────────────────────────────────────
    const insurersData = [
      {
        name: "NSIA Assurances",
        description:
          "Leader de l'assurance en Afrique de l'Ouest depuis 1995. NSIA Assurances offre des solutions complètes et personnalisées.",
        phone: "+225 27 20 30 40 50",
        email: "contact@nsia.ci",
        website: "https://www.nsiabenin.com",
        rating: 4.5,
        isVerified: true,
      },
      {
        name: "AXA Côte d'Ivoire",
        description:
          "Filiale du groupe AXA, l'un des leaders mondiaux de l'assurance et de la gestion d'actifs.",
        phone: "+225 27 20 21 22 23",
        email: "contact@axa.ci",
        website: "https://www.axa.ci",
        rating: 4.7,
        isVerified: true,
      },
      {
        name: "Allianz Côte d'Ivoire",
        description:
          "Allianz est l'un des plus grands fournisseurs de services d'assurance et d'assistance au monde.",
        phone: "+225 27 20 31 32 33",
        email: "service@allianz.ci",
        website: "https://www.allianz.fr",
        rating: 4.6,
        isVerified: true,
      },
      {
        name: "SUNU Assurances",
        description:
          "Groupe africain d'assurance présent dans 12 pays. SUNU Assurances est reconnu pour sa proximité client.",
        phone: "+225 27 20 41 42 43",
        email: "info@sunu.ci",
        website: "https://www.sunu.com",
        rating: 4.2,
        isVerified: true,
      },
      {
        name: "CNART Assurances",
        description:
          "Compagnie nationale d'assurance et de réassurance des transports. Spécialiste des risques automobiles.",
        phone: "+225 27 20 51 52 53",
        email: "contact@cnart.ci",
        rating: 4.0,
        isVerified: true,
      },
      {
        name: "AGOU Assurances",
        description:
          "AGOU Assurances propose des solutions adaptées aux besoins des particuliers et entreprises ivoiriens.",
        phone: "+225 27 20 61 62 63",
        email: "contact@agou.ci",
        rating: 3.8,
        isVerified: true,
      },
    ];

    const createdInsurers: { id: string; name: string }[] = [];
    for (const data of insurersData) {
      const created = await db.insurer.create({ data });
      createdInsurers.push({ id: created.id, name: created.name });
    }

    // ── Offres ─────────────────────────────────────────────────────
    const offerTemplates = [
      {
        name: "Auto Essentiel",
        coverageType: "tiers",
        description:
          "Couverture responsabilité civile obligatoire avec assistance de base.",
        features: [
          "Responsabilité civile",
          "Assistance dépannage 0-50km",
          "Défense pénale",
          "Protection juridique",
        ],
      },
      {
        name: "Auto Confort",
        coverageType: "tiers_plus",
        description:
          "Couverture élargie incluant le vol, l'incendie et les bris de glace.",
        features: [
          "Responsabilité civile",
          "Vol et tentative de vol",
          "Incendie",
          "Bris de glace",
          "Assistance dépannage 0-100km",
          "Défense pénale",
          "Véhicule de courtoisie (3 jours)",
        ],
      },
      {
        name: "Auto Premium",
        coverageType: "tous_risques",
        description:
          "Protection complète incluant tous les dommages, catastrophes naturelles et options avancées.",
        features: [
          "Responsabilité civile",
          "Dommages tous accidents",
          "Vol et tentative de vol",
          "Incendie",
          "Bris de glace",
          "Catastrophes naturelles",
          "Assistance dépannage illimitée",
          "Véhicule de courtoisie (7 jours)",
          "Protection du conducteur",
          "Indemnisation valeur à neuf (1 an)",
        ],
      },
    ];

    const basePrices = {
      tiers: [15000, 18000, 16500, 14000, 13000, 15500],
      tiers_plus: [35000, 42000, 38000, 32000, 30000, 34000],
      tous_risques: [75000, 85000, 80000, 68000, 65000, 72000],
    };
    const deductibles = {
      tiers: [0, 0, 0, 0, 0, 0],
      tiers_plus: [50000, 75000, 60000, 50000, 40000, 55000],
      tous_risques: [50000, 100000, 75000, 50000, 50000, 60000],
    };

    const createdOffers: {
      id: string;
      insurerId: string;
      coverageType: string;
    }[] = [];

    for (let i = 0; i < createdInsurers.length; i++) {
      const insurer = createdInsurers[i];
      for (let j = 0; j < offerTemplates.length; j++) {
        const tpl = offerTemplates[j];
        const type = tpl.coverageType as "tiers" | "tiers_plus" | "tous_risques";
        const basePrice = basePrices[type][i];
        const deductible = deductibles[type][i];

        const offer = await db.offer.create({
          data: {
            insurerId: insurer.id,
            name: tpl.name,
            coverageType: type,
            description: tpl.description,
            basePrice,
            annualPrice: basePrice * 11,
            deductible,
            maxCoverage:
              type === "tous_risques"
                ? 50000000
                : type === "tiers_plus"
                  ? 10000000
                  : 0,
            features: JSON.stringify(tpl.features),
            conditions:
              type === "tous_risques"
                ? "Franchise applicable selon l'ancienneté du véhicule. Véhicule de moins de 5 ans requis pour l'indemnisation valeur à neuf."
                : type === "tiers_plus"
                  ? "Le vol doit être déclaré dans les 48h. Le bris de glace est limité à 2 sinistres par an."
                  : "Couverture conforme à l'article 1 de l'ordonnance n°59-27 du 6 janvier 1959.",
          },
        });
        createdOffers.push({
          id: offer.id,
          insurerId: insurer.id,
          coverageType: type,
        });
      }
    }

    // ── Catégories de garanties ──────────────────────────────────
    const categoriesData = [
      {
        name: "Obligatoire",
        slug: "obligatoire",
        description: "Garanties obligatoires (RC et garanties liées)",
        icon: "Shield",
        sortOrder: 1,
      },
      {
        name: "Garantie",
        slug: "garantie",
        description: "Garanties d'assurance standards",
        icon: "ShieldCheck",
        sortOrder: 2,
      },
      {
        name: "Assistance",
        slug: "assistance",
        description: "Services d'assistance",
        icon: "Phone",
        sortOrder: 3,
      },
      {
        name: "Protection",
        slug: "protection",
        description: "Protections individuelles (IC, IPT)",
        icon: "UserCheck",
        sortOrder: 4,
      },
      {
        name: "Pack Pickup",
        slug: "pack-pickup",
        description: "Packs spécifiques aux pick-up",
        icon: "Truck",
        sortOrder: 5,
      },
    ];

    const createdCategories: { id: string; slug: string }[] = [];
    for (const data of categoriesData) {
      const created = await db.guaranteeCategory.create({ data });
      createdCategories.push({ id: created.id, slug: created.slug });
    }

    const categoryBySlug = new Map(
      createdCategories.map((c) => [c.slug, c.id])
    );

    // Mapping from old category values to categoryId
    const categoryMap: Record<string, string> = {
      obligatoire: categoryBySlug.get("obligatoire")!,
      garantie: categoryBySlug.get("garantie")!,
      assistance: categoryBySlug.get("assistance")!,
      protection: categoryBySlug.get("protection")!,
      pack_pickup: categoryBySlug.get("pack-pickup")!,
    };

    // ── Garanties (21) ─────────────────────────────────────────────
    const guaranteesData = [
      {
        name: "Responsabilité Civile (RC)",
        slug: "responsabilite-civile",
        description:
          "Couverture des dommages causés aux tiers. Grille tarifaire par puissance fiscale et carburant.",
        icon: "Shield",
        categoryLabel: "obligatoire",
        calcMethod: "MATRIX_BASED",
        capital: JSON.stringify({
          corporel: "7 000 000 000 FCFA",
          materiel: "500 000 000 FCFA",
        }),
        sortOrder: 1,
      },
      {
        name: "Recours des tiers Incendie",
        slug: "recours-tiers-incendie",
        description: "Recours contre le responsable d'un incendie. Inclus dans la RC.",
        icon: "Flame",
        categoryLabel: "obligatoire",
        calcMethod: "FREE",
        sortOrder: 2,
      },
      {
        name: "Défense & Recours",
        slug: "defense-recours",
        description: "Prise en charge des frais de défense et recours.",
        icon: "Scale",
        categoryLabel: "assistance",
        calcMethod: "FIXED_AMOUNT",
        fixedPrice: 7950,
        capital: JSON.stringify({ capital: "1 000 000 FCFA" }),
        sortOrder: 3,
      },
      {
        name: "Assistance",
        slug: "assistance",
        description: "Assistance dépannage et remorquage.",
        icon: "Phone",
        categoryLabel: "assistance",
        calcMethod: "FIXED_AMOUNT",
        fixedPrice: 10000,
        sortOrder: 4,
      },
      {
        name: "Avance sur recours",
        slug: "avance-sur-recours",
        description: "Avance de fonds en attendant le recours.",
        icon: "Banknote",
        categoryLabel: "assistance",
        calcMethod: "FIXED_AMOUNT",
        fixedPrice: 15000,
        capital: JSON.stringify({ capital: "4 000 000 FCFA" }),
        sortOrder: 5,
      },
      {
        name: "Individuelle Conducteur (IC)",
        slug: "individuelle-conducteur",
        description:
          "Protection corporelle du conducteur. Calcul par formule (1, 2 ou 3).",
        icon: "User",
        categoryLabel: "protection",
        calcMethod: "MATRIX_BASED",
        capital: JSON.stringify({
          description: "Capital décès, invalidité et frais médicaux",
        }),
        sortOrder: 6,
      },
      {
        name: "Individuelle Passagers (IPT)",
        slug: "individuelle-passagers",
        description:
          "Protection des passagers du véhicule. Formule + nombre de places.",
        icon: "Users",
        categoryLabel: "protection",
        calcMethod: "MATRIX_BASED",
        capital: JSON.stringify({ description: "Selon la formule choisie" }),
        sortOrder: 7,
      },
      {
        name: "Incendie",
        slug: "incendie",
        description: "Couverture des dommages par incendie. Taux : 0,42 % de la Valeur Neuve.",
        icon: "FlameKindling",
        categoryLabel: "garantie",
        calcMethod: "VARIABLE_BASED",
        rate: 0.42,
        franchise: JSON.stringify({
          percent: 5,
          min: 65000,
          description: "5 % du sinistre, minimum 65 000 FCFA",
        }),
        sortOrder: 8,
      },
      {
        name: "Vol",
        slug: "vol",
        description:
          "Couverture en cas de vol ou tentative de vol. Taux variable selon la Valeur Neuve.",
        icon: "Eye",
        categoryLabel: "garantie",
        calcMethod: "VARIABLE_BASED",
        rateConditions: JSON.stringify([
          { condition: "VN ≤ 25 000 000 FCFA", rate: 1.1 },
          { condition: "VN > 25 000 000 FCFA", rate: 2.1 },
        ]),
        franchise: JSON.stringify({
          percent: 10,
          min: 255000,
          description: "10 % du sinistre, minimum 255 000 FCFA",
        }),
        sortOrder: 9,
      },
      {
        name: "Vol à mains armées",
        slug: "vol-mains-armees",
        description:
          "Couverture spécifique pour le vol avec violence. Taux variable selon la Valeur Neuve.",
        icon: "Siren",
        categoryLabel: "garantie",
        calcMethod: "VARIABLE_BASED",
        rateConditions: JSON.stringify([
          { condition: "VN ≤ 25 000 000 FCFA", rate: 1.6 },
          { condition: "VN > 25 000 000 FCFA", rate: 2.2 },
        ]),
        franchise: JSON.stringify({
          percent: 10,
          min: 255000,
          description: "10 % du sinistre, minimum 255 000 FCFA",
        }),
        sortOrder: 10,
      },
      {
        name: "Vol des accessoires",
        slug: "vol-accessoires",
        description: "Couverture du vol d'accessoires du véhicule.",
        icon: "Package",
        categoryLabel: "garantie",
        calcMethod: "FIXED_AMOUNT",
        fixedPrice: 15000,
        capital: JSON.stringify({ capital: "250 000 FCFA" }),
        franchise: JSON.stringify({
          percent: 0,
          min: 20000,
          description: "Franchise : 20 000 FCFA",
        }),
        sortOrder: 11,
      },
      {
        name: "Bris de glaces",
        slug: "bris-de-glaces",
        description:
          "Couverture des dommages aux vitres. Taux : 0,40 % de la valeur de remplacement.",
        icon: "GlassWater",
        categoryLabel: "garantie",
        calcMethod: "VARIABLE_BASED",
        rate: 0.4,
        franchise: JSON.stringify({ description: "Selon contrat" }),
        sortOrder: 12,
      },
      {
        name: "Extension Bris de glaces (toit ouvrant)",
        slug: "extension-bris-glaces-toit-ouvrant",
        description:
          "Extension de la garantie bris de glaces pour les toits ouvrants. Incompatible avec bris de glaces classique.",
        icon: "Square",
        categoryLabel: "garantie",
        calcMethod: "VARIABLE_BASED",
        rate: 0.42,
        franchise: JSON.stringify({
          description:
            "Incompatible avec Bris de glaces classique",
        }),
        sortOrder: 13,
      },
      {
        name: "Tierce Complète (TCM)",
        slug: "tierce-complete-tcm",
        description:
          "Indemnisation des dommages au véhicule en cas de tiers identifiable. Catégorie + tranche VN + franchise.",
        icon: "Car",
        categoryLabel: "garantie",
        calcMethod: "MATRIX_BASED",
        capital: JSON.stringify({ description: "Selon franchise choisie" }),
        sortOrder: 14,
      },
      {
        name: "Tierce Collision (TCL)",
        slug: "tierce-collision-tcl",
        description:
          "Indemnisation des dommages en cas de collision avec un tiers identifié. Catégorie + tranche VN + franchise.",
        icon: "CarFront",
        categoryLabel: "garantie",
        calcMethod: "MATRIX_BASED",
        capital: JSON.stringify({ description: "Selon franchise choisie" }),
        sortOrder: 15,
      },
      {
        name: "Tierce Complète plafonnée",
        slug: "tierce-complete-plafonnee",
        description:
          "TCM avec plafond d'indemnisation. Taux : 8 %, 7 % ou 6 % selon la franchise.",
        icon: "ShieldAlert",
        categoryLabel: "garantie",
        calcMethod: "VARIABLE_BASED",
        rateConditions: JSON.stringify([
          { condition: "Franchise 1M", rate: 8 },
          { condition: "Franchise 2M", rate: 7 },
          { condition: "Franchise 5M", rate: 6 },
        ]),
        capital: JSON.stringify({
          plafonds: "1 000 000 à 5 000 000 FCFA",
        }),
        sortOrder: 16,
      },
      {
        name: "Tierce Collision plafonnée",
        slug: "tierce-collision-plafonnee",
        description:
          "TCL avec plafond d'indemnisation. Taux : 8 %, 7 % ou 6 % selon la franchise.",
        icon: "AlertTriangle",
        categoryLabel: "garantie",
        calcMethod: "VARIABLE_BASED",
        rateConditions: JSON.stringify([
          { condition: "Franchise 1M", rate: 8 },
          { condition: "Franchise 2M", rate: 7 },
          { condition: "Franchise 5M", rate: 6 },
        ]),
        capital: JSON.stringify({
          plafonds: "1 000 000 à 5 000 000 FCFA",
        }),
        sortOrder: 17,
      },
      {
        name: "Pack Pickup Ivory",
        slug: "pack-pickup-ivory",
        description:
          "Pack gratuit réservé aux pick-up de 3 tonnes ou moins.",
        icon: "Truck",
        categoryLabel: "pack_pickup",
        calcMethod: "FREE",
        capital: JSON.stringify({
          description: "Réservé aux pick-up ≤ 3 tonnes",
        }),
        sortOrder: 18,
      },
      {
        name: "Pack Pickup Bronze",
        slug: "pack-pickup-bronze",
        description: "Pack assurance pick-up niveau Bronze.",
        icon: "Truck",
        categoryLabel: "pack_pickup",
        calcMethod: "FIXED_AMOUNT",
        fixedPrice: 48000,
        capital: JSON.stringify({
          description: "Selon composition du pack",
        }),
        sortOrder: 19,
      },
      {
        name: "Pack Pickup Silver",
        slug: "pack-pickup-silver",
        description: "Pack assurance pick-up niveau Silver.",
        icon: "Truck",
        categoryLabel: "pack_pickup",
        calcMethod: "FIXED_AMOUNT",
        fixedPrice: 65000,
        capital: JSON.stringify({
          description: "Selon composition du pack",
        }),
        sortOrder: 20,
      },
      {
        name: "Pack Pickup Gold",
        slug: "pack-pickup-gold",
        description: "Pack assurance pick-up niveau Gold.",
        icon: "Truck",
        categoryLabel: "pack_pickup",
        calcMethod: "FIXED_AMOUNT",
        fixedPrice: 85000,
        capital: JSON.stringify({
          description: "Selon composition du pack",
        }),
        sortOrder: 21,
      },
    ];

    const createdGuarantees: { id: string; name: string }[] = [];
    for (const data of guaranteesData) {
      const { categoryLabel, ...rest } = data;
      const g = await db.guarantee.create({
        data: {
          ...rest,
          categoryId: categoryMap[categoryLabel] || null,
          categoryLabel,
        },
      });
      createdGuarantees.push({ id: g.id, name: g.name });
    }

    // ── InsurerGuarantee links (all insurers → all guarantees) ─────
    for (const insurer of createdInsurers) {
      const links = createdGuarantees.map((g) => ({
        insurerId: insurer.id,
        guaranteeId: g.id,
        isEnabled: true,
      }));
      await db.insurerGuarantee.createMany({ data: links });
    }

    // ── OfferGuarantee links ───────────────────────────────────────
    const guaranteeBySlug = new Map(
      createdGuarantees.map((g) => [g.name, g.id])
    );

    // Guarantees for "tiers" (Auto Essentiel)
    const tiersGuarantees = [
      "Responsabilité Civile (RC)",
      "Recours des tiers Incendie",
      "Défense & Recours",
      "Assistance",
    ];

    // Guarantees for "tiers_plus" (Auto Confort) — extends tiers
    const tiersPlusGuarantees = [
      ...tiersGuarantees,
      "Incendie",
      "Vol",
      "Bris de glaces",
      "Individuelle Conducteur (IC)",
    ];

    // Guarantees for "tous_risques" (Auto Premium) — extends tiers_plus
    const tousRisquesGuarantees = [
      ...tiersPlusGuarantees,
      "Vol à mains armées",
      "Individuelle Passagers (IPT)",
      "Avance sur recours",
      "Vol des accessoires",
      "Tierce Complète (TCM)",
      "Tierce Collision (TCL)",
    ];

    for (const offer of createdOffers) {
      let names: string[];
      if (offer.coverageType === "tiers") names = tiersGuarantees;
      else if (offer.coverageType === "tiers_plus")
        names = tiersPlusGuarantees;
      else names = tousRisquesGuarantees;

      const links = names
        .map((name) => {
          const gId = guaranteeBySlug.get(name);
          return gId
            ? { offerId: offer.id, guaranteeId: gId, isIncluded: true }
            : null;
        })
        .filter(Boolean) as { offerId: string; guaranteeId: string; isIncluded: boolean }[];

      if (links.length > 0) {
        await db.offerGuarantee.createMany({ data: links });
      }
    }

    return NextResponse.json({
      message: "Base de données initialisée avec succès",
      categories: createdCategories.length,
      insurers: createdInsurers.length,
      offers: createdOffers.length,
      guarantees: createdGuarantees.length,
    });
  } catch (error) {
    console.error("Erreur lors de l'initialisation:", error);
    return NextResponse.json(
      { error: "Échec de l'initialisation" },
      { status: 500 }
    );
  }
}