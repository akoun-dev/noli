import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateGuaranteePremium,
  scoreOffer,
  isVehicleEligible,
  type VehiclePricingData,
} from "./pricing-service";

const vehicle: VehiclePricingData = {
  fuelType: "essence",
  fiscalPower: "6",
  seats: "4",
  year: "2020",
  newValue: "18 000 000",
  currentValue: "10 000 000",
  usage: "personnel",
};

/* ── calculateGuaranteePremium : FREE ── */
describe("calculateGuaranteePremium — FREE", () => {
  it("retourne une prime nulle", () => {
    const result = calculateGuaranteePremium(
      { calculationType: "FREE", metadata: "{}" },
      vehicle
    );
    expect(result).toEqual({
      amount: 0,
      method: "FREE",
      breakdown: "Garantie incluse sans surprime",
    });
  });
});

/* ── calculateGuaranteePremium : FIXED_AMOUNT ── */
describe("calculateGuaranteePremium — FIXED_AMOUNT", () => {
  const coverage = (metadata: string) => ({
    calculationType: "FIXED_AMOUNT",
    metadata,
  });

  it("applique le montant fixe", () => {
    const result = calculateGuaranteePremium(
      coverage(JSON.stringify({ method: "FIXED_AMOUNT", fixedAmount: 5000 })),
      vehicle
    );
    expect(result.amount).toBe(5000);
    expect(result.method).toBe("FIXED_AMOUNT");
  });

  it("utilise le prix réduit si inclus dans un pack", () => {
    const result = calculateGuaranteePremium(
      coverage(
        JSON.stringify({ method: "FIXED_AMOUNT", fixedAmount: 5000, packPriceReduced: 3000 })
      ),
      vehicle,
      { isInPackage: true }
    );
    expect(result.amount).toBe(3000);
  });

  it("garde le montant fixe hors pack", () => {
    const result = calculateGuaranteePremium(
      coverage(
        JSON.stringify({ method: "FIXED_AMOUNT", fixedAmount: 5000, packPriceReduced: 3000 })
      ),
      vehicle
    );
    expect(result.amount).toBe(5000);
  });

  it("applique les bornes min / max", () => {
    const result = calculateGuaranteePremium(
      coverage(
        JSON.stringify({ method: "FIXED_AMOUNT", fixedAmount: 5000, minAmount: 8000, maxAmount: 12000 })
      ),
      vehicle
    );
    expect(result.amount).toBe(8000);

    const result2 = calculateGuaranteePremium(
      coverage(
        JSON.stringify({ method: "FIXED_AMOUNT", fixedAmount: 15000, minAmount: 8000, maxAmount: 12000 })
      ),
      vehicle
    );
    expect(result2.amount).toBe(12000);
  });

  it("retourne 0 si la garantie requise n'est pas active", () => {
    const result = calculateGuaranteePremium(
      coverage(
        JSON.stringify({ method: "FIXED_AMOUNT", fixedAmount: 5000, requiresGuarantee: "VOL" })
      ),
      vehicle,
      { activeGuarantees: ["RC"] }
    );
    expect(result.amount).toBe(0);
    expect(result.breakdown).toContain("garantie requise");
  });

  it("calcule le montant si la garantie requise est active", () => {
    const result = calculateGuaranteePremium(
      coverage(
        JSON.stringify({ method: "FIXED_AMOUNT", fixedAmount: 5000, requiresGuarantee: "VOL" })
      ),
      vehicle,
      { activeGuarantees: ["RC", "VOL"] }
    );
    expect(result.amount).toBe(5000);
  });
});

/* ── calculateGuaranteePremium : VARIABLE_BASED ── */
describe("calculateGuaranteePremium — VARIABLE_BASED", () => {
  const coverage = (metadata: Record<string, unknown>) => ({
    calculationType: "VARIABLE_BASED",
    metadata: JSON.stringify({ method: "VARIABLE_BASED", ...metadata }),
  });

  it("calcule un pourcentage de la valeur à neuf, arrondi au 500", () => {
    // 18 000 000 × 1.23 % = 221 400 → arrondi 221 500
    const result = calculateGuaranteePremium(
      coverage({ variableSource: "NEW_VALUE", ratePercent: 1.23 }),
      vehicle
    );
    expect(result.amount).toBe(221500);
  });

  it("utilise la valeur vénale (VA)", () => {
    // 10 000 000 × 1 % = 100 000
    const result = calculateGuaranteePremium(
      coverage({ variableSource: "VENAL_VALUE", ratePercent: 1 }),
      vehicle
    );
    expect(result.amount).toBe(100000);
  });

  it("utilise la puissance fiscale (CV)", () => {
    // 6 CV × 25 000 % = 1 500
    const result = calculateGuaranteePremium(
      coverage({ variableSource: "FISCAL_POWER", ratePercent: 25000 }),
      vehicle
    );
    expect(result.amount).toBe(1500);
  });

  it("retourne 0 pour une source inconnue", () => {
    const result = calculateGuaranteePremium(
      coverage({ variableSource: "BOGUS", ratePercent: 1 }),
      vehicle
    );
    expect(result.amount).toBe(0);
    expect(result.breakdown).toContain("non reconnue");
  });

  it("applique le taux réduit sous le seuil VN", () => {
    // VN 18M ≤ 25M → taux 0.8 % → 144 000
    const result = calculateGuaranteePremium(
      coverage({
        variableSource: "NEW_VALUE",
        ratePercent: 1,
        conditionedByNewValue: true,
        newValueThreshold: 25000000,
        rateBelowThresholdPercent: 0.8,
        rateAboveThresholdPercent: 1.2,
      }),
      vehicle
    );
    expect(result.amount).toBe(144000);
  });

  it("applique le taux majoré au-dessus du seuil VN", () => {
    // VN 35M > 25M → taux 1.2 % → 420 000
    const result = calculateGuaranteePremium(
      coverage({
        variableSource: "NEW_VALUE",
        ratePercent: 1,
        conditionedByNewValue: true,
        newValueThreshold: 25000000,
        rateBelowThresholdPercent: 0.8,
        rateAboveThresholdPercent: 1.2,
      }),
      { ...vehicle, newValue: "35 000 000" }
    );
    expect(result.amount).toBe(420000);
  });

  it("applique les bornes min / max après arrondi", () => {
    const result = calculateGuaranteePremium(
      coverage({
        variableSource: "NEW_VALUE",
        ratePercent: 1,
        minAmount: 200000,
        maxAmount: 150000,
      }),
      vehicle
    );
    // Brut arrondi : 180 000 → clamp min 200 000, puis max 150 000 → 150 000
    expect(result.amount).toBe(150000);
  });
});

/* ── calculateGuaranteePremium : MATRIX_BASED ── */
describe("calculateGuaranteePremium — MATRIX_BASED", () => {
  type TariffRule = {
    minFiscalPower?: number | null;
    maxFiscalPower?: number | null;
    baseRate?: number | null;
    fixedAmount?: number | null;
    fuelType?: string | null;
  };

  const coverage = (metadata: Record<string, unknown>, tariffRules?: TariffRule[]) => ({
    calculationType: "MATRIX_BASED",
    metadata: JSON.stringify({ method: "MATRIX_BASED", ...metadata }),
    ...(tariffRules ? { tariffRules } : {}),
  });

  describe("dimension FISCAL_POWER", () => {
    const tariffs = [
      { fiscalPowerMin: 1, fiscalPowerMax: 4, fuelType: "essence", prime: 68675 },
      { fiscalPowerMin: 5, fiscalPowerMax: 7, fuelType: "essence", prime: 85000 },
      { fiscalPowerMin: 1, fiscalPowerMax: 99, prime: 90000 },
    ];

    it("matche sur la tranche de CV et le carburant", () => {
      const result = calculateGuaranteePremium(
        coverage({ dimension: "FISCAL_POWER", tariffs }),
        vehicle // CV 6, essence
      );
      expect(result.amount).toBe(85000);
    });

    it("retombe sur une tranche sans carburant si le carburant ne matche pas", () => {
      const result = calculateGuaranteePremium(
        coverage({ dimension: "FISCAL_POWER", tariffs }),
        { ...vehicle, fuelType: "diesel" }
      );
      expect(result.amount).toBe(90000);
    });

    it("utilise les règles tarifaires DB si aucun tarif ne matche", () => {
      const result = calculateGuaranteePremium(
        coverage(
          { dimension: "FISCAL_POWER", tariffs: [{ fiscalPowerMin: 20, fiscalPowerMax: 30, prime: 50000 }] },
          [{ minFiscalPower: 1, maxFiscalPower: 9, fixedAmount: 123000 }]
        ),
        vehicle
      );
      expect(result.amount).toBe(123000);
      expect(result.breakdown).toContain("Règle tarifaire DB");
    });

    it("calcule les règles DB basées sur un taux", () => {
      // Référence fixe : 10 000 000 × 1.5 % = 150 000
      const result = calculateGuaranteePremium(
        coverage(
          { dimension: "FISCAL_POWER", tariffs: [] },
          [{ minFiscalPower: 1, maxFiscalPower: 9, baseRate: 1.5 }]
        ),
        vehicle
      );
      expect(result.amount).toBe(150000);
    });
  });

  describe("dimension FUEL_TYPE", () => {
    it("matche sur le type de carburant", () => {
      const result = calculateGuaranteePremium(
        coverage({
          dimension: "FUEL_TYPE",
          tariffs: [{ fuelType: "essence", prime: 25000 }, { fuelType: "diesel", prime: 30000 }],
        }),
        vehicle
      );
      expect(result.amount).toBe(25000);
    });

    it("retourne 0 si aucun tarif ne matche", () => {
      const result = calculateGuaranteePremium(
        coverage({ dimension: "FUEL_TYPE", tariffs: [{ fuelType: "diesel", prime: 30000 }] }),
        vehicle
      );
      expect(result.amount).toBe(0);
      expect(result.breakdown).toContain("Aucune tarification");
    });
  });

  describe("dimension SEATS", () => {
    it("matche sur le nombre de places", () => {
      const result = calculateGuaranteePremium(
        coverage({
          dimension: "SEATS",
          tariffs: [
            { fiscalPowerMin: 3, fiscalPowerMax: 4, prime: 12000 },
            { fiscalPowerMin: 5, fiscalPowerMax: 7, prime: 18000 },
          ],
        }),
        vehicle // 4 places
      );
      expect(result.amount).toBe(12000);
    });
  });

  describe("dimension FORMULA", () => {
    it("applique baseRate × VN plafonné au ceiling", () => {
      // 18 000 000 × 1 % = 180 000 → plafond 100 000
      const result = calculateGuaranteePremium(
        coverage({
          dimension: "FORMULA",
          formulas: [{ name: "IC-1", baseRate: 1, ceiling: 100000 }],
        }),
        vehicle
      );
      expect(result.amount).toBe(100000);
    });

    it("sans plafond, applique baseRate × VN arrondi au 500", () => {
      // 18 000 000 × 2 % = 360 000
      const result = calculateGuaranteePremium(
        coverage({
          dimension: "FORMULA",
          formulas: [{ name: "IC-2", baseRate: 2 }],
        }),
        vehicle
      );
      expect(result.amount).toBe(360000);
    });

    it("utilise la prime par places si usePlaces", () => {
      const result = calculateGuaranteePremium(
        coverage({
          dimension: "FORMULA",
          formulas: [
            {
              name: "IC-IPT",
              baseRate: 1,
              usePlaces: true,
              placesTariffs: [
                { places: 3, prime: 7000, label: "3 places" },
                { places: 4, prime: 8500, label: "4 places" },
              ],
            },
          ],
        }),
        vehicle // 4 places
      );
      expect(result.amount).toBe(8500);
    });
  });

  describe("dimension TIERCE_COMPLETE / TIERCE_COLLISION", () => {
    it("calcule le taux × VN depuis la grille de catégories", () => {
      // VN 5M → classe A, taux 4.4 % → 220 000
      const result = calculateGuaranteePremium(
        coverage({
          dimension: "TIERCE_COMPLETE",
          categoryTariffs: [
            { category: "A", valueMin: 0, valueMax: 12000000, franchise: 0, prime: 4.4 },
            { category: "B", valueMin: 12000001, valueMax: 25000000, franchise: 0, prime: 4.785 },
          ],
        }),
        { ...vehicle, newValue: "5 000 000" }
      );
      expect(result.amount).toBe(220000);
      expect(result.breakdown).toContain("TCM");
    });

    it("utilise le taux par défaut si aucune grille", () => {
      // TCM défaut 4.4 % × 5M = 220 000
      const result = calculateGuaranteePremium(
        coverage({ dimension: "TIERCE_COMPLETE" }),
        { ...vehicle, newValue: "5 000 000" }
      );
      expect(result.amount).toBe(220000);
      expect(result.breakdown).toContain("Taux par défaut");
    });

    it("retourne 0 si la VN n'est pas renseignée", () => {
      const result = calculateGuaranteePremium(
        coverage({ dimension: "TIERCE_COLLISION" }),
        { ...vehicle, newValue: "" }
      );
      expect(result.amount).toBe(0);
      expect(result.breakdown).toContain("VN non renseignée");
    });
  });
});

/* ── calculateGuaranteePremium : méthode inconnue ── */
describe("calculateGuaranteePremium — méthode inconnue", () => {
  it("retourne 0 avec la méthode inconnue", () => {
    const result = calculateGuaranteePremium(
      { calculationType: "WEIRD", metadata: "{}" },
      vehicle
    );
    expect(result.amount).toBe(0);
    expect(result.method).toBe("WEIRD");
    expect(result.breakdown).toContain("non reconnue");
  });
});

/* ── scoreOffer ── */
describe("scoreOffer", () => {
  it("calcule le score cumulé d'une offre bien alignée", () => {
    const result = scoreOffer(
      {
        contractType: "all_risks",
        priceMin: 100000,
        priceMax: 200000,
        fiscalPowerMin: 1,
        fiscalPowerMax: 10,
        fuelTypes: '["essence","diesel"]',
        newValueMin: 5000000,
        newValueMax: 50000000,
        vehicleUsage: '["personnel"]',
      },
      { ...vehicle, newValue: "10 000 000" },
      ["RC", "IC"]
    );
    // 2 garanties × 25 + contrat 30 + prix 20 + CV 15 + carburant 10 + VN 10 + usage 10 = 145
    expect(result.score).toBe(145);
    expect(result.reasons.length).toBe(7);
  });

  it("accorde +5 si l'offre n'a pas de restriction carburant / usage", () => {
    const result = scoreOffer(
      { contractType: "basic", priceMin: 100000, priceMax: 200000 },
      { ...vehicle, newValue: "10 000 000" },
      []
    );
    // contrat 15 + prix 20 + carburant 5 + usage 5 = 45
    expect(result.score).toBe(45);
    expect(result.reasons.some((r) => r.includes("tous carburants"))).toBe(true);
    expect(result.reasons.some((r) => r.includes("tous usages"))).toBe(true);
  });

  it("attribue 5 pts si le prix est hors plage attendue", () => {
    const result = scoreOffer(
      { contractType: "basic", priceMin: 10, priceMax: 10 },
      { ...vehicle, newValue: "10 000 000" },
      []
    );
    // contrat 15 + prix hors plage 5 + carburant 5 + usage 5 = 30
    expect(result.score).toBe(30);
  });

  it("ignore le score de la puissance fiscale si la plage n'est pas définie", () => {
    const result = scoreOffer({ contractType: "basic" }, vehicle, []);
    // contrat 15 + carburant 5 + usage 5 = 25 (pas de prix, pas de CV, pas de VN)
    expect(result.score).toBe(25);
  });
});

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

/* ── isVehicleEligible ── */
describe("isVehicleEligible", () => {
  it("accepte un véhicule sans contrainte", () => {
    expect(isVehicleEligible({}, vehicle)).toBe(true);
  });

  it("refuse hors plage de puissance fiscale", () => {
    expect(isVehicleEligible({ fiscalPowerMin: 7 }, vehicle)).toBe(false);
    expect(isVehicleEligible({ fiscalPowerMax: 5 }, vehicle)).toBe(false);
    expect(isVehicleEligible({ fiscalPowerMin: 1, fiscalPowerMax: 10 }, vehicle)).toBe(true);
  });

  it("refuse un carburant non accepté", () => {
    expect(isVehicleEligible({ fuelTypes: '["diesel"]' }, vehicle)).toBe(false);
    expect(isVehicleEligible({ fuelTypes: '["essence","hybride"]' }, vehicle)).toBe(true);
  });

  it("accepte un tableau de carburants déjà parsé", () => {
    expect(isVehicleEligible({ fuelTypes: ["essence", "hybride"] }, vehicle)).toBe(true);
    expect(isVehicleEligible({ fuelTypes: ["diesel"] }, vehicle)).toBe(false);
  });

  it("accepte un tableau d'usages déjà parsé", () => {
    expect(isVehicleEligible({ vehicleUsage: ["personnel"] }, vehicle)).toBe(true);
    expect(isVehicleEligible({ vehicleUsage: ["taxi_vtc"] }, vehicle)).toBe(false);
  });

  it("refuse une valeur à neuf hors plage", () => {
    expect(isVehicleEligible({ newValueMax: 5000000 }, vehicle)).toBe(false);
    expect(isVehicleEligible({ newValueMin: 1000000, newValueMax: 50000000 }, vehicle)).toBe(true);
  });

  it("refuse une valeur vénale hors plage", () => {
    expect(isVehicleEligible({ venalValueMax: 1000000 }, vehicle)).toBe(false);
    expect(isVehicleEligible({ venalValueMin: 5000000 }, vehicle)).toBe(true);
  });

  it("refuse un usage non accepté", () => {
    expect(isVehicleEligible({ vehicleUsage: '["professionnel"]' }, vehicle)).toBe(false);
    expect(isVehicleEligible({ vehicleUsage: '["personnel","taxi_vtc"]' }, vehicle)).toBe(true);
  });
});
