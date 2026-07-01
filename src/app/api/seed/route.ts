import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Check if data already seeded
    const existingInsurers = await db.insurer.count();
    if (existingInsurers > 0) {
      return NextResponse.json({ message: "Already seeded", count: existingInsurers });
    }

    const insurers = [
      {
        name: "NSIA Assurances",
        logo: null,
        description: "Leader de l'assurance en Afrique de l'Ouest depuis 1995. NSIA Assurances offre des solutions complètes et personnalisées.",
        phone: "+225 27 20 30 40 50",
        email: "contact@nsia.ci",
        website: "https://www.nsiabenin.com",
        rating: 4.5,
        isVerified: true,
      },
      {
        name: "AXA Côte d'Ivoire",
        logo: null,
        description: "Filiale du groupe AXA, l'un des leaders mondiaux de l'assurance et de la gestion d'actifs.",
        phone: "+225 27 20 21 22 23",
        email: "contact@axa.ci",
        website: "https://www.axa.ci",
        rating: 4.7,
        isVerified: true,
      },
      {
        name: "Allianz Côte d'Ivoire",
        logo: null,
        description: "Allianz est l'un des plus grands fournisseurs de services d'assurance et d'assistance au monde.",
        phone: "+225 27 20 31 32 33",
        email: "service@allianz.ci",
        website: "https://www.allianz.fr",
        rating: 4.6,
        isVerified: true,
      },
      {
        name: "SUNU Assurances",
        logo: null,
        description: "Groupe africain d'assurance présent dans 12 pays. SUNU Assurances est reconnu pour sa proximité client.",
        phone: "+225 27 20 41 42 43",
        email: "info@sunu.ci",
        website: "https://www.sunu.com",
        rating: 4.2,
        isVerified: true,
      },
      {
        name: "CNART Assurances",
        logo: null,
        description: "Compagnie nationale d'assurance et de réassurance des transports. Spécialiste des risques automobiles.",
        phone: "+225 27 20 51 52 53",
        email: "contact@cnart.ci",
        website: null,
        rating: 4.0,
        isVerified: true,
      },
      {
        name: "AGOU Assurances",
        logo: null,
        description: "AGOU Assurances propose des solutions adaptées aux besoins des particuliers et entreprises ivoiriens.",
        phone: "+225 27 20 61 62 63",
        email: "contact@agou.ci",
        website: null,
        rating: 3.8,
        isVerified: true,
      },
    ];

    const createdInsurers = [];
    for (const insurer of insurers) {
      const created = await db.insurer.create({ data: insurer });
      createdInsurers.push(created);
    }

    // Create offers for each insurer
    const offerTemplates = [
      {
        name: "Auto Essentiel",
        coverageType: "tiers",
        description: "Couverture responsabilité civile obligatoire avec assistance de base.",
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
        description: "Couverture élargie incluant le vol, l'incendie et les bris de glace.",
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
        description: "Protection complète incluant tous les dommages, catastrophes naturelles et options avancées.",
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

    for (let i = 0; i < createdInsurers.length; i++) {
      const insurer = createdInsurers[i];
      for (let j = 0; j < offerTemplates.length; j++) {
        const template = offerTemplates[j];
        const type = template.coverageType;
        const basePrice = basePrices[type][i];
        const deductible = deductibles[type][i];

        await db.offer.create({
          data: {
            insurerId: insurer.id,
            name: template.name,
            coverageType: type,
            description: template.description,
            basePrice,
            annualPrice: basePrice * 11,
            deductible,
            maxCoverage: type === "tous_risques" ? 50000000 : type === "tiers_plus" ? 10000000 : 0,
            features: JSON.stringify(template.features),
            conditions: type === "tous_risques" 
              ? "Franchise applicable selon l'ancienneté du véhicule. Véhicule de moins de 5 ans requis pour l'indemnisation valeur à neuf." 
              : type === "tiers_plus"
              ? "Le vol doit être déclaré dans les 48h. Le bris de glace est limité à 2 sinistres par an."
              : "Couverture conforme à l'article 1 de l'ordonnance n°59-27 du 6 janvier 1959.",
          },
        });
      }
    }

    const totalOffers = createdInsurers.length * 3;
    return NextResponse.json({
      message: "Database seeded successfully",
      insurers: createdInsurers.length,
      offers: totalOffers,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}