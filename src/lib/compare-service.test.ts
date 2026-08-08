import { describe, expect, it, vi, beforeEach } from "vitest";
import type { PersonalInfo, VehicleInfo, CoverageNeeds } from "@/types";

/* ── Données mockées (définies AVANT vi.mock grâce à vi.hoisted) ── */

const { mockDbData } = vi.hoisted(() => ({
  mockDbData: {
    insurance_offers: [] as Record<string, unknown>[],
    coverages: [] as Record<string, unknown>[],
    insurance_categories: { id: "auto-cat" },
    quotes: [],
    insurers: [{ id: "ins-1" }],
    insurer_accounts: [{ profileId: "prof-1" }],
  } as Record<string, unknown>,
}));

vi.mock("@/lib/db", () => {
  const chainable = (table: string) => {
    const chain: Record<string, unknown> = {
      then: (onFulfilled: (v: unknown) => unknown) =>
        Promise.resolve({ data: mockDbData[table] ?? [], error: null }).then(
          onFulfilled
        ),
    };
    for (const m of [
      "select",
      "eq",
      "order",
      "in",
      "ilike",
      "limit",
      "maybeSingle",
      "single",
      "insert",
    ]) {
      chain[m] = () => chain;
    }
    return chain;
  };
  return {
    db: { from: (table: string) => chainable(table) },
    mapRow: (r: unknown) => r ?? null,
    mapRows: (rs: unknown[]) => rs,
  };
});

vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn(),
}));

import { runComparison } from "./compare-service";
import { createNotification } from "@/lib/notifications";

/* ── Données de test ── */

const insurer = { id: "ins-1", name: "Assureur A", logoUrl: "logo.png" };

const offerEligible = {
  id: "offer-1",
  insurerId: "ins-1",
  insurer,
  name: "Tous Risques Auto",
  contractType: "all_risks",
  priceMin: 100000,
  priceMax: 200000,
  fiscalPowerMin: 1,
  fiscalPowerMax: 10,
  fuelTypes: '["essence"]',
  newValueMin: 1000000,
  newValueMax: 50000000,
  venalValueMin: null,
  venalValueMax: null,
  vehicleUsage: '["personnel"]',
  features: '["Bris de glace", "Assistance 24/7"]',
  deductible: 250000,
  coverageAmount: 50000000,
  description: "Couverture complète",
};

const offerIneligible = {
  id: "offer-2",
  insurerId: "ins-1",
  insurer,
  name: "Hors plage CV",
  contractType: "all_risks",
  priceMin: 50000,
  priceMax: 80000,
  fiscalPowerMin: 20,
  fiscalPowerMax: 30,
  fuelTypes: '["essence"]',
  newValueMin: null,
  newValueMax: null,
  venalValueMin: null,
  venalValueMax: null,
  vehicleUsage: '["personnel"]',
  features: "[]",
  deductible: 0,
  coverageAmount: 10000000,
  description: null,
};

const offerWrongContract = {
  id: "offer-3",
  insurerId: "ins-1",
  insurer,
  name: "Tiers Simple",
  contractType: "basic",
  priceMin: 30000,
  priceMax: 50000,
  fiscalPowerMin: null,
  fiscalPowerMax: null,
  fuelTypes: '["essence"]',
  newValueMin: null,
  newValueMax: null,
  venalValueMin: null,
  venalValueMax: null,
  vehicleUsage: '["personnel"]',
  features: "[]",
  deductible: 0,
  coverageAmount: 10000000,
  description: null,
};

const offerLowScore = {
  id: "offer-4",
  insurerId: "ins-1",
  insurer,
  name: "Sans garanties",
  contractType: "all_risks",
  priceMin: 1000,
  priceMax: 2000,
  fiscalPowerMin: 1,
  fiscalPowerMax: 10,
  fuelTypes: '["essence"]',
  newValueMin: 1000000,
  newValueMax: 50000000,
  venalValueMin: null,
  venalValueMax: null,
  vehicleUsage: '["personnel"]',
  features: "[]",
  deductible: 0,
  coverageAmount: 10000000,
  description: null,
};

const coverages = [
  {
    id: "cov-1",
    insurerId: "ins-1",
    name: "Assistance 24/7",
    code: "ASSISTANCE",
    type: "ASSISTANCE",
    calculationType: "FIXED_AMOUNT",
    metadata: JSON.stringify({ method: "FIXED_AMOUNT", fixedAmount: 5000 }),
    isMandatory: false,
    isActive: true,
    capital: null,
    maxAmount: null,
    description: "Assistance 24/7",
    category: { id: "cat-a", name: "Assistance", code: "ASSISTANCE" },
  },
  {
    id: "cov-2",
    insurerId: "ins-1",
    name: "Bris de glace",
    code: "BDG",
    type: "BRIS_GLACES",
    calculationType: "VARIABLE_BASED",
    metadata: JSON.stringify({
      method: "VARIABLE_BASED",
      variableSource: "NEW_VALUE",
      ratePercent: 0.35,
    }),
    isMandatory: false,
    isActive: true,
    capital: null,
    maxAmount: null,
    description: "Bris de glace",
    category: { id: "cat-b", name: "Bris de glace", code: "BRIS_GLACES" },
  },
  {
    id: "cov-3",
    insurerId: "ins-1",
    name: "Responsabilité Civile",
    code: "RC",
    type: "RC",
    calculationType: "FREE",
    metadata: "{}",
    isMandatory: true,
    isActive: true,
    capital: null,
    maxAmount: null,
    description: "RC",
    category: { id: "cat-c", name: "RC", code: "RC" },
  },
];

const personal: PersonalInfo = {
  lastName: "Dupont",
  firstName: "Jean",
  email: "jean@example.com",
  phone: "+2250700000000",
};

const vehicle: VehicleInfo = {
  fuelType: "essence",
  fiscalPower: "6",
  seats: "4",
  year: "2020",
  newValue: "18 000 000",
  currentValue: "10 000 000",
  usage: "personnel",
};

const needs: CoverageNeeds = { contractType: "all_risks", contractDuration: 12 };

beforeEach(() => {
  vi.clearAllMocks();
  mockDbData.insurance_offers = [
    offerEligible,
    offerIneligible,
    offerWrongContract,
    offerLowScore,
  ];
  mockDbData.coverages = coverages;
});

describe("runComparison", () => {
  it("renvoie toutes les formules éligibles (le type choisi n'est pas un filtre strict)", async () => {
    const { results, total } = await runComparison(personal, vehicle, needs);

    // offer-2 exclue (plage CV), offer-3 (basic) désormais incluse
    expect(total).toBe(3);
    expect(results.map((r) => r.id)).toEqual(["offer-1", "offer-4", "offer-3"]);
  });

  it("calcule la prime, le score et les garanties de l'offre retenue", async () => {
    const { results } = await runComparison(personal, vehicle, needs);
    const top = results[0];

    // 5 000 (assistance) + 63 000 (bris de glace 0.35 % × 18M) = 68 000
    expect(top.annualPrice).toBe(68000);
    expect(top.monthlyPrice).toBe(Math.round(68000 / 12));
    expect(top.contractDuration).toBe(12);
    expect(top.coverageType).toBe("Tous Risques");
    expect(top.insurerName).toBe("Assureur A");
    expect(top.matchedGuarantees).toEqual(["BRIS_GLACES", "ASSISTANCE"]);
    expect(top.pricingBreakdown).toHaveLength(3);
    // Les restrictions carburant/usage sont appliquées (voir fix safeParseStringArray) :
    // 2 garanties × 25 + contrat 30 + BONUS type correspondant 30 + prix 20 + CV 15 + VN 10 + carburant 10 + usage 10
    expect(top.relevanceScore).toBe(175);
  });

  it("trie par score décroissant puis par prix croissant", async () => {
    const { results } = await runComparison(personal, vehicle, needs);

    expect(results[0].id).toBe("offer-1");
    expect(results[1].id).toBe("offer-4");
    expect(results[0].relevanceScore).toBeGreaterThan(results[1].relevanceScore!);
  });

  it("respecte la durée de contrat choisie", async () => {
    const { results } = await runComparison(personal, vehicle, {
      ...needs,
      contractDuration: 6,
    });
    expect(results[0].contractDuration).toBe(6);
    expect(results[0].monthlyPrice).toBe(Math.round(68000 / 6));
    expect(results[0].annualPrice).toBe(68000);
  });

  it("Option A : le prix (grossPremium) inclut les obligatoires et ne double-compte pas", async () => {
    // Offre avec un libellé « Assistance » en DOUBLE dans features, et une garantie
    // obligatoire « Vol » ABSENTE de features.
    mockDbData.insurance_offers = [
      { ...offerEligible, id: "offer-A", features: '["Assistance 24/7", "Assistance"]' },
    ];
    mockDbData.coverages = [
      {
        id: "cov-ass", insurerId: "ins-1", name: "Assistance 24/7", code: "ASSISTANCE",
        type: "ASSISTANCE", calculationType: "FIXED_AMOUNT",
        metadata: JSON.stringify({ method: "FIXED_AMOUNT", fixedAmount: 5000 }),
        isMandatory: false, isActive: true, capital: null, maxAmount: null,
        description: "Assistance 24/7",
        category: { id: "cat-a", name: "Assistance", code: "ASSISTANCE" },
      },
      {
        id: "cov-vol", insurerId: "ins-1", name: "Vol", code: "VOL",
        type: "VOL", calculationType: "FIXED_AMOUNT",
        metadata: JSON.stringify({ method: "FIXED_AMOUNT", fixedAmount: 10000 }),
        isMandatory: true, isActive: true, capital: null, maxAmount: null,
        description: "Vol",
        category: { id: "cat-v", name: "Vol", code: "VOL" },
      },
    ];

    const { results } = await runComparison(personal, vehicle, needs);
    const top = results.find((r) => r.id === "offer-A")!;

    // grossPremium = 5000 (Assistance retenue, comptée UNE fois malgré le doublon)
    //              + 10000 (Vol OBLIGATOIRE, pourtant absent de features) = 15000.
    // L'ancien calcul par features aurait donné 5000 (Vol oublié) ou 10000 (Assistance doublée).
    expect(top.annualPrice).toBe(15000);
    expect(top.monthlyPrice).toBe(Math.round(15000 / 12));
  });

  it("sauvegarde le devis et notifie quand userId est fourni", async () => {
    await runComparison(personal, vehicle, needs, "user-1");

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", type: "SUCCESS" })
    );
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "prof-1", type: "INFO" })
    );
  });

  it("ne sauvegarde pas le devis si userId est absent", async () => {
    await runComparison(personal, vehicle, needs);
    expect(createNotification).not.toHaveBeenCalled();
  });
});
