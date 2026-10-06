/* Helpers purs : tarifs par défaut et affichage des prix */

import { VN_RANGES, FRANCHISE_LEVELS } from "./constants";
import type {
  Coverage,
  MatrixTariff,
  FormulaConfig,
  CategoryTariff,
} from "./types";

/* ── Grilles tarifaires Tierce par catégorie de véhicule ── */
// Les valeurs sont des TAUX en % (ex: 4.4 = 4.4% de la VN)
// Formule : Prime = VN × (taux / 100)

const TIERCE_RATES: Record<string, Record<string, Record<string, number>>> = {
  "401": {
    TIERCE_COMPLETE: {
      // VN class A (≤12M)
      A_0: 4.4, A_250000: 3.52, A_500000: 2.992, A_1000000: 2.695, A_2500000: 2.695,
      // VN class B (12M-25M)
      B_0: 4.785, B_250000: 3.828, B_500000: 3.256, B_1000000: 2.926, B_2500000: 2.926,
      // VN class C (25M-40M)
      C_0: 5.17, C_250000: 4.136, C_500000: 3.52, C_1000000: 3.168, C_2500000: 3.168,
      // VN class D (50M-90M) — sparse
      D_500000: 3.52,
      // VN class E (90M-110M) — sparse
      E_1000000: 3.168,
      // VN class F (>110M) — sparse
      F_2500000: 3.168,
    },
    TIERCE_COLLISION: {
      // ≤40M combined
      C_0: 4.311, C_250000: 3.651, C_500000: 2.232, C_1000000: 2.105, C_2500000: 1.035,
      D_500000: 2.232,
      E_1000000: 2.035,
      F_2500000: 1.035,
    },
  },
  "402": {
    TIERCE_COMPLETE: {
      A_0: 2.816, A_250000: 2.255, A_500000: 1.914, A_1000000: 1.727, A_2500000: 1.727,
      B_0: 3.069, B_250000: 2.453, B_500000: 2.09, B_1000000: 1.881, B_2500000: 1.881,
      C_0: 3.311, C_250000: 2.651, C_500000: 2.255, C_1000000: 2.035, C_2500000: 2.035,
      D_500000: 2.255,
      E_1000000: 2.035,
      F_2500000: 2.035,
    },
    TIERCE_COLLISION: {
      // Note: cat 402 DC a 50K au lieu de "Sans franchise" pour le 1er palier
      A_0: 2.716, A_50000: 2.716, A_250000: 2.235, A_500000: 1.914, A_1000000: 1.756, A_2500000: 1.72,
      B_0: 3.679, B_50000: 3.679, B_250000: 2.456, B_500000: 2.09, B_1000000: 1.881, B_2500000: 1.881,
      C_0: 3.911, C_50000: 3.911, C_250000: 2.7, C_500000: 2.35, C_1000000: 2.035, C_2500000: 2.1895,
      D_500000: 2.255,
      E_1000000: 2.035,
      F_2500000: 2.33,
    },
  },
};

// 412 shares the same rates as 401
TIERCE_RATES["412"] = {
  TIERCE_COMPLETE: { ...TIERCE_RATES["401"]["TIERCE_COMPLETE"] },
  TIERCE_COLLISION: { ...TIERCE_RATES["401"]["TIERCE_COLLISION"] },
};

/* Les catégories disponibles sont extraites dynamiquement de TIERCE_RATES */
export function getDefaultVehicleCategories(): string[] {
  return Object.keys(TIERCE_RATES).sort();
}

export function getDefaultFiscalPowerTariffs(): MatrixTariff[] {
  const now = Date.now();
  return [
    { key: `essence_1_4_${now}`, fuelType: "Essence", fiscalPowerMin: 1, fiscalPowerMax: 4, prime: 68675 },
    { key: `essence_5_7_${now}`, fuelType: "Essence", fiscalPowerMin: 5, fiscalPowerMax: 7, prime: 85000 },
    { key: `essence_8_10_${now}`, fuelType: "Essence", fiscalPowerMin: 8, fiscalPowerMax: 10, prime: 95000 },
    { key: `essence_11_${now}`, fuelType: "Essence", fiscalPowerMin: 11, fiscalPowerMax: 99, prime: 110000 },
    { key: `diesel_1_4_${now}`, fuelType: "Diesel", fiscalPowerMin: 1, fiscalPowerMax: 4, prime: 68675 },
    { key: `diesel_5_7_${now}`, fuelType: "Diesel", fiscalPowerMin: 5, fiscalPowerMax: 7, prime: 85000 },
    { key: `diesel_8_10_${now}`, fuelType: "Diesel", fiscalPowerMin: 8, fiscalPowerMax: 10, prime: 95000 },
    { key: `diesel_11_${now}`, fuelType: "Diesel", fiscalPowerMin: 11, fiscalPowerMax: 99, prime: 110000 },
  ];
}

export function getDefaultFormulas(): FormulaConfig[] {
  return [
    { formula: 1, label: "Formule 1", capitalDeces: 1_000_000, capitalInvalidite: 2_000_000, fraisMedicaux: 100_000, prime: 5_500, usePlaces: false },
    { formula: 2, label: "Formule 2", capitalDeces: 3_000_000, capitalInvalidite: 6_000_000, fraisMedicaux: 400_000, prime: 8_400, usePlaces: false },
    { formula: 3, label: "Formule 3", capitalDeces: 5_000_000, capitalInvalidite: 10_000_000, fraisMedicaux: 500_000, prime: 15_900, usePlaces: false },
  ];
}

export function getDefaultCategoryTariffs(
  type: "TIERCE_COMPLETE" | "TIERCE_COLLISION",
  vehicleCategory?: string
): CategoryTariff[] {
  const now = Date.now();
  const tariffs: CategoryTariff[] = [];
  const cat = vehicleCategory || "401";
  const rates = TIERCE_RATES[cat]?.[type];
  if (!rates) return tariffs;

  for (const range of VN_RANGES) {
    for (const fl of FRANCHISE_LEVELS) {
      const key = `${range.key}_${fl.value}`;
      if (rates[key] != null) {
        tariffs.push({
          key: `${type.toLowerCase()}_${cat}_${range.key}_${fl.value}_${now}`,
          category: range.key,
          guaranteeType: type,
          valueMin: range.min,
          valueMax: range.max,
          valueLabel: range.label,
          franchise: fl.value,
          franchiseLabel: fl.label,
          prime: rates[key],
          vehicleCategory: cat,
        });
      }
    }
  }
  return tariffs;
}

/* ── Price display helpers ── */
const fmtPrice = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

export function displayCoveragePrice(cov: Coverage): string {
  if (cov.calculationType === "FREE") return "Gratuit";
  if (cov.calculationType === "FIXED_AMOUNT") {
    if (cov.fixedAmount != null) return fmtPrice(cov.fixedAmount);
    try {
      const meta = typeof cov.metadata === "string" ? JSON.parse(cov.metadata) : (cov.metadata || {});
      if ((meta as Record<string, unknown>).fixedAmount) return fmtPrice(Number((meta as Record<string, unknown>).fixedAmount));
    } catch { /* ignore */ }
    return "—";
  }
  if (cov.calculationType === "VARIABLE_BASED") {
    if (cov.conditionedByNewValue && cov.rateBelowThreshold != null && cov.rateAboveThreshold != null)
      return `${cov.rateBelowThreshold}% / ${cov.rateAboveThreshold}%`;
    if (cov.ratePercent != null) return `${cov.ratePercent} %`;
    try {
      const meta = typeof cov.metadata === "string" ? JSON.parse(cov.metadata) : (cov.metadata || {});
      const m = meta as Record<string, unknown>;
      if (m.conditionedByNewValue && m.rateBelowThresholdPercent && m.rateAboveThresholdPercent)
        return `${m.rateBelowThresholdPercent}% / ${m.rateAboveThresholdPercent}%`;
      if (m.ratePercent) return `${m.ratePercent} %`;
    } catch { /* ignore */ }
    return "—";
  }
  if (cov.calculationType === "MATRIX_BASED") {
    const dim = cov.matrixDimension || "";
    const labels: Record<string, string> = {
      FISCAL_POWER: "Grille PF",
      FORMULA: "Grille formules",
      VEHICLE_CATEGORY: "Grille catégories",
      TIERCE_COMPLETE: "Grille TC",
      TIERCE_COLLISION: "Grille TCol",
    };
    return labels[dim] || "Matrice";
  }
  return "—";
}
