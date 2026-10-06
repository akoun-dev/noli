/* Types partagés par le wizard de garanties assureur */

export interface CoverageCategory {
  id: string;
  name: string;
  code: string;
}

export interface InsCatOption {
  id: string;
  name: string;
}

export interface Coverage {
  id: string;
  code: string;
  type: string;
  name: string;
  description: string | null;
  calculationType: string;
  isMandatory: boolean;
  isOptional: boolean;
  conditions: string;
  isActive: boolean;
  displayOrder: number;
  metadata: string;
  variableSource: string | null;
  ratePercent: number | null;
  conditionedByNewValue: boolean;
  newValueThreshold: number | null;
  rateBelowThreshold: number | null;
  rateAboveThreshold: number | null;
  fixedAmount: number | null;
  minAmount: number | null;
  maxAmount: number | null;
  capital: number | null;
  matrixDimension: string | null;
  requiresGuarantee: string | null;
  category: { id: string; name: string; code: string } | null;
}

export type CalculationType =
  | "FREE"
  | "FIXED_AMOUNT"
  | "VARIABLE_BASED"
  | "MATRIX_BASED";

export interface Step1Data {
  name: string;
  insuranceCategoryId: string;
  categoryId: string;
  description: string;
  isMandatory: boolean;
  isOptional: boolean;
  conditions: string;
  displayOrder: string;
}

/* Sous-types matrice (alignés avec l'admin) */
export interface MatrixTariff {
  key: string;
  fuelType: "Essence" | "Diesel";
  fiscalPowerMin: number;
  fiscalPowerMax: number;
  prime: number;
  vehicleCategory?: string;
}

export interface PlacesTariff {
  places: number;
  prime: number;
  label: string;
}

export interface FormulaConfig {
  formula: number;
  label: string;
  capitalDeces: number;
  capitalInvalidite: number;
  fraisMedicaux: number;
  prime: number;
  usePlaces: boolean;
  placesTariffs?: PlacesTariff[];
}

export interface CategoryTariff {
  key: string;
  category: string;
  guaranteeType: "TIERCE_COMPLETE" | "TIERCE_COLLISION";
  valueMin: number;
  valueMax: number;
  valueLabel: string;
  franchise: number;
  franchiseLabel: string;
  prime: number; // Taux en % (ex: 4.4 pour 4.4%)
  vehicleCategory?: string; // "401" | "402" | "412"
}
