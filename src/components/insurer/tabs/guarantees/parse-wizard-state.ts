/* Reconstruction pure de l'état du wizard à partir d'une garantie existante */

import { getDefaultVehicleCategories } from "./defaults";
import type {
  Coverage,
  InsCatOption,
  CalculationType,
  Step1Data,
  MatrixTariff,
  FormulaConfig,
  CategoryTariff,
} from "./types";

export interface ParsedWizardState {
  step1: Step1Data;
  calcType: CalculationType;
  metadata: Record<string, unknown>;
  matrixDimension: string;
  matrixDefaultPrime: number;
  matrixTariffs: MatrixTariff[];
  matrixFormulas: FormulaConfig[];
  categoryTariffs: CategoryTariff[];
  tierceVehicleCategory: string;
  tierceCategories: string[];
}

export function parseWizardStateFromItem(
  item: Coverage,
  insuranceCategories: InsCatOption[]
): ParsedWizardState {
  const insCat = insuranceCategories.find((c) => c.name === item.type);
  const step1: Step1Data = {
    name: item.name,
    insuranceCategoryId: insCat?.id || "",
    categoryId: item.category?.id || "",
    description: item.description || "",
    isMandatory: item.isMandatory,
    isOptional: item.isOptional || false,
    conditions: item.conditions || "",
    displayOrder: String(item.displayOrder ?? 0),
  };

  let parsed: Record<string, unknown> = {};
  try {
    parsed =
      typeof item.metadata === "string"
        ? JSON.parse(item.metadata)
        : (item as unknown as Record<string, unknown>) || {};
  } catch {
    parsed = {};
  }

  // Restore matrix state
  const toNum = (v: unknown, fallback: number): number => {
    if (typeof v === "number" && !isNaN(v)) return v;
    if (typeof v === "string") { const n = Number(v); return isNaN(n) ? fallback : n; }
    return fallback;
  };

  // Restore vehicle category from data
  const firstCat = (parsed.categoryTariffs as CategoryTariff[])?.[0];
  // Reconstruit la liste des catégories depuis les données existantes + défauts
  const existingCats = new Set<string>();
  (parsed.categoryTariffs as CategoryTariff[])?.forEach(ct => { if (ct.vehicleCategory) existingCats.add(ct.vehicleCategory); });
  const allCats = [...new Set([...getDefaultVehicleCategories(), ...existingCats])].sort();

  return {
    step1,
    calcType: item.calculationType as CalculationType,
    metadata: parsed,
    matrixDimension: (parsed.dimension as string) || "FISCAL_POWER",
    matrixDefaultPrime: toNum(parsed.defaultPrime, 0),
    matrixTariffs: Array.isArray(parsed.tariffs) ? (parsed.tariffs as MatrixTariff[]) : [],
    matrixFormulas: Array.isArray(parsed.formulas) ? (parsed.formulas as FormulaConfig[]) : [],
    categoryTariffs: Array.isArray(parsed.categoryTariffs) ? (parsed.categoryTariffs as CategoryTariff[]) : [],
    tierceVehicleCategory: firstCat?.vehicleCategory || "401",
    tierceCategories: allCats,
  };
}
