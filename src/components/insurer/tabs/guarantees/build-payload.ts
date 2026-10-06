/* Construction pure des métadonnées et du payload d'une garantie */

import type {
  CalculationType,
  Step1Data,
  InsCatOption,
  MatrixTariff,
  FormulaConfig,
  CategoryTariff,
} from "./types";

interface MatrixState {
  matrixDimension: string;
  matrixDefaultPrime: number;
  matrixTariffs: MatrixTariff[];
  matrixFormulas: FormulaConfig[];
  categoryTariffs: CategoryTariff[];
}

interface BuildMetadataArgs extends MatrixState {
  calcType: CalculationType | "";
  metadata: Record<string, unknown>;
}

/* ── Metadata builder ── */
export function buildMetadata({
  calcType,
  metadata,
  matrixDimension,
  matrixDefaultPrime,
  matrixTariffs,
  matrixFormulas,
  categoryTariffs,
}: BuildMetadataArgs): Record<string, unknown> {
  if (calcType === "FREE") {
    return { method: "FREE" };
  }

  if (calcType === "FIXED_AMOUNT") {
    const m: Record<string, unknown> = {
      method: "FIXED_AMOUNT",
      fixedAmount: Number(metadata.fixedAmount) || 0,
    };
    if (metadata.packPriceReduced !== undefined && metadata.packPriceReduced !== "")
      m.packPriceReduced = Number(metadata.packPriceReduced);
    if (metadata.capital !== undefined && metadata.capital !== "")
      m.capital = Number(metadata.capital);
    if (metadata.minAmount !== undefined && metadata.minAmount !== "")
      m.minAmount = Number(metadata.minAmount);
    if (metadata.maxAmount !== undefined && metadata.maxAmount !== "")
      m.maxAmount = Number(metadata.maxAmount);
    if (metadata.franchiseEnabled) {
      m.franchise = {
        type: metadata.franchiseType || "PERCENT",
        value: Number(metadata.franchiseValue) || 0,
        minAmount: Number(metadata.franchiseMin) || 0,
        maxAmount: Number(metadata.franchiseMax) || 0,
      };
    }
    if (metadata.requiresGuarantee) m.requiresGuarantee = metadata.requiresGuarantee;
    return m;
  }

  if (calcType === "VARIABLE_BASED") {
    const m: Record<string, unknown> = {
      method: "VARIABLE_BASED",
      variableSource: metadata.variableSource || "NEW_VALUE",
      ratePercent: Number(metadata.ratePercent) || 0,
    };
    if (metadata.conditionedByNewValue) {
      m.conditionedByNewValue = true;
      m.newValueThreshold = Number(metadata.newValueThreshold) || 0;
      m.rateBelowThresholdPercent = Number(metadata.rateBelowThresholdPercent) || 0;
      m.rateAboveThresholdPercent = Number(metadata.rateAboveThresholdPercent) || 0;
    }
    if (metadata.minAmount !== undefined && metadata.minAmount !== "")
      m.minAmount = Number(metadata.minAmount);
    if (metadata.maxAmount !== undefined && metadata.maxAmount !== "")
      m.maxAmount = Number(metadata.maxAmount);
    if (metadata.franchiseEnabled) {
      m.franchise = {
        type: metadata.franchiseType || "PERCENT",
        value: Number(metadata.franchiseValue) || 0,
        minAmount: Number(metadata.franchiseMin) || 0,
        maxAmount: Number(metadata.franchiseMax) || 0,
      };
    }
    if (metadata.requiresGuarantee) m.requiresGuarantee = metadata.requiresGuarantee;
    return m;
  }

  if (calcType === "MATRIX_BASED") {
    const m: Record<string, unknown> = {
      method: "MATRIX_BASED",
      dimension: matrixDimension,
      defaultPrime: matrixDefaultPrime || 0,
    };
    if (matrixTariffs.length > 0) m.tariffs = matrixTariffs;
    if (matrixFormulas.length > 0) m.formulas = matrixFormulas;
    if (categoryTariffs.length > 0)
      m.categoryTariffs = categoryTariffs.map(ct => ({
        category: ct.category,
        valueMin: ct.valueMin,
        valueMax: ct.valueMax,
        franchise: ct.franchise,
        prime: ct.prime,
        vehicleCategory: ct.vehicleCategory,
      }));
    return m;
  }

  return {};
}

interface BuildPayloadArgs extends MatrixState {
  calcType: CalculationType | "";
  metadata: Record<string, unknown>;
  insurerId: string;
  step1: Step1Data;
  insuranceCategories: InsCatOption[];
}

/* ── Payload builder (envoyé à l'API coverages) ── */
export function buildCoveragePayload(args: BuildPayloadArgs): Record<string, unknown> {
  const { calcType, metadata, insurerId, step1, insuranceCategories, matrixDimension } = args;

  return {
    insurerId,
    categoryId: step1.categoryId || null,
    type: insuranceCategories.find((c) => c.id === step1.insuranceCategoryId)?.name || "",
    name: step1.name.trim(),
    description: step1.description.trim() || null,
    calculationType: calcType,
    isMandatory: step1.isMandatory,
    isOptional: step1.isOptional,
    conditions: step1.conditions || "{}",
    displayOrder: parseInt(step1.displayOrder, 10) || 0,
    metadata: buildMetadata(args),
    // Structured columns for direct querying
    variableSource: calcType === "VARIABLE_BASED" ? (metadata.variableSource as string) || "NEW_VALUE" : null,
    ratePercent: calcType === "VARIABLE_BASED" ? Number(metadata.ratePercent) || null : null,
    conditionedByNewValue: calcType === "VARIABLE_BASED" ? Boolean(metadata.conditionedByNewValue) : false,
    newValueThreshold: calcType === "VARIABLE_BASED" && metadata.conditionedByNewValue ? Number(metadata.newValueThreshold) || null : null,
    rateBelowThreshold: calcType === "VARIABLE_BASED" && metadata.conditionedByNewValue ? Number(metadata.rateBelowThresholdPercent) || null : null,
    rateAboveThreshold: calcType === "VARIABLE_BASED" && metadata.conditionedByNewValue ? Number(metadata.rateAboveThresholdPercent) || null : null,
    fixedAmount: calcType === "FIXED_AMOUNT" ? Number(metadata.fixedAmount) || null : null,
    matrixDimension: calcType === "MATRIX_BASED" ? matrixDimension : null,
    minAmount: metadata.minAmount !== undefined && metadata.minAmount !== "" ? Number(metadata.minAmount) : null,
    maxAmount: metadata.maxAmount !== undefined && metadata.maxAmount !== "" ? Number(metadata.maxAmount) : null,
    capital: metadata.capital !== undefined && metadata.capital !== "" ? Number(metadata.capital) : null,
    requiresGuarantee: (metadata.requiresGuarantee as string)?.trim() || null,
  };
}
