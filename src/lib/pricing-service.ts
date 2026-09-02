// ──────────────────────────────────────────────────────────────
// NOLI Assurance — Pricing Service
// Implements the 4 calculation methods for insurance guarantees:
//   FREE, FIXED_AMOUNT, VARIABLE_BASED, MATRIX_BASED
// Server-side only — do not import on the client.
// ──────────────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────────

/** Données véhicule utilisées pour le calcul tarifaire */
export interface VehiclePricingData {
  fuelType: string;   // "essence" | "diesel" | "hybride" | "electrique"
  fiscalPower: string;// "1" to "14" (CV)
  seats: string;      // "3", "4", "5", "6", "7", "8", "+8"
  year: string;       // "2020" or "2020-06"
  newValue: string;   // Valeur à neuf (VN) en FCFA
  currentValue: string;// Valeur vénale / actuelle (VA) en FCFA
  usage: string;      // "personnel" | "professionnel" | "taxi_vtc" | "autre"
}

/** Résultat du calcul de prime d'une garantie */
export interface PricingResult {
  amount: number;
  method: string;
  breakdown: string;
}

/** Résultat du scoring d'une offre */
export interface ScoreResult {
  score: number;
  reasons: string[];
}

// ── Internal types for parsed metadata ───────────────────────

interface FranchiseConfig {
  type: "PERCENT" | "AMOUNT";
  value: number;
  minAmount?: number;
  maxAmount?: number;
}

interface FreeMetadata {
  method: "FREE";
}

interface FixedAmountMetadata {
  method: "FIXED_AMOUNT";
  fixedAmount: number;
  packPriceReduced?: number;
  capital?: number;
  minAmount?: number;
  maxAmount?: number;
  franchise?: FranchiseConfig;
  requiresGuarantee?: string;
}

interface VariableBasedMetadata {
  method: "VARIABLE_BASED";
  variableSource: "NEW_VALUE" | "VENAL_VALUE" | "FISCAL_POWER";
  ratePercent: number;
  conditionedByNewValue?: boolean;
  newValueThreshold?: number;
  rateBelowThresholdPercent?: number;
  rateAboveThresholdPercent?: number;
  minAmount?: number;
  maxAmount?: number;
  franchise?: FranchiseConfig;
  requiresGuarantee?: string;
}

interface MatrixFiscalPowerTariff {
  fiscalPowerMin?: number;
  fiscalPowerMax?: number;
  fuelType?: string;
  vehicleCategory?: string;
  prime: number;
}

interface MatrixFormula {
  name: string;
  label?: string;
  baseRate: number;
  ceiling?: number;
  usePlaces?: boolean;
  placesTariffs?: Array<{ places: number; prime: number; label: string }>;
}

interface MatrixCategoryTariff {
  category: string;
  valueMin?: number;
  valueMax?: number;
  franchise?: number;
  prime: number;
}

interface MatrixBasedMetadata {
  method: "MATRIX_BASED";
  dimension:
    | "FISCAL_POWER"
    | "FUEL_TYPE"
    | "VEHICLE_CATEGORY"
    | "SEATS"
    | "FORMULA"
    | "TIERCE_COMPLETE"
    | "TIERCE_COLLISION";
  tariffs?: MatrixFiscalPowerTariff[];
  formulas?: MatrixFormula[];
  categoryTariffs?: MatrixCategoryTariff[];
  minAmount?: number;
  maxAmount?: number;
  franchise?: FranchiseConfig;
  requiresGuarantee?: string;
}

type GuaranteeMetadata =
  | FreeMetadata
  | FixedAmountMetadata
  | VariableBasedMetadata
  | MatrixBasedMetadata
  | Record<string, unknown>;

/** Shape of a Coverage DB record (partial — only the fields we need) */
interface CoverageInput {
  calculationType: string;
  metadata: string;
  variableSource?: string | null;
  ratePercent?: number | null;
  conditionedByNewValue?: boolean | null;
  newValueThreshold?: number | null;
  rateBelowThreshold?: number | null;
  rateAboveThreshold?: number | null;
  fixedAmount?: number | null;
  packPriceReduced?: number | null;
  capital?: number | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  matrixDimension?: string | null;
  requiresGuarantee?: string | null;
  tariffRules?: Array<{
    vehicleCategory?: string | null;
    minFiscalPower?: number | null;
    maxFiscalPower?: number | null;
    minVehicleValue?: number | null;
    maxVehicleValue?: number | null;
    fuelType?: string | null;
    formulaName?: string | null;
    baseRate?: number | null;
    fixedAmount?: number | null;
    minAmount?: number | null;
    maxAmount?: number | null;
    conditions?: string;
  }>;
}

/** Shape of an InsuranceOffer DB record (partial — for scoring / eligibility) */
interface OfferInput {
  contractType?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  fiscalPowerMin?: number | null;
  fiscalPowerMax?: number | null;
  fuelTypes?: string | string[];  // JSON string[] ou tableau déjà parsé
  newValueMin?: number | null;
  newValueMax?: number | null;
  venalValueMin?: number | null;
  venalValueMax?: number | null;
  vehicleUsage?: string | string[]; // JSON string[] ou tableau déjà parsé
}

// ── Helpers ──────────────────────────────────────────────────

/** Arrondit au multiple de 500 le plus proche */
function roundTo500(value: number): number {
  return Math.round(value / 500) * 500;
}

/** Parse JSON string safely, returns empty object on failure or empty/null input */
function safeParseJSON<T>(raw: string | null | undefined): T {
  if (!raw) return {} as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return {} as T;
  }
}

/** Parse a JSON string field that stores a string array (accepte aussi un tableau déjà parsé) */
function safeParseStringArray(raw: string | string[] | undefined | null): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Clamp a value between min and max (bounds are inclusive) */
function clamp(value: number, min?: number | null, max?: number | null): number {
  let result = value;
  if (min != null && !isNaN(min)) result = Math.max(result, min);
  if (max != null && !isNaN(max)) result = Math.min(result, max);
  return result;
}

/** Détermine la classe de valeur à neuf (VN) pour TCM / TCL */
function getVNRangeClass(newValue: number): string {
  if (newValue <= 12_000_000) return "A";
  if (newValue <= 25_000_000) return "B";
  if (newValue <= 40_000_000) return "C";
  if (newValue <= 90_000_000) return "D";
  if (newValue <= 110_000_000) return "E";
  return "F";
}

/** Parse a numeric string (strips spaces, handles commas) */
function parseFCFA(raw: string | undefined | null): number {
  if (!raw) return 0;
  return parseFloat(String(raw).replace(/[\s,]/g, "")) || 0;
}

// ── VN Range class boundaries for reference ─────────────────
const VN_RANGE_BOUNDS: Record<string, { min: number; max: number }> = {
  A: { min: 0, max: 12_000_000 },
  B: { min: 12_000_001, max: 25_000_000 },
  C: { min: 25_000_001, max: 40_000_000 },
  D: { min: 40_000_001, max: 90_000_000 },
  E: { min: 90_000_001, max: 110_000_000 },
  F: { min: 110_000_001, max: Infinity },
};

// ── 1. calculateGuaranteePremium ─────────────────────────────

export function calculateGuaranteePremium(
  coverage: CoverageInput,
  vehicleData: VehiclePricingData,
  options?: {
    isInPackage?: boolean;
    activeGuarantees?: string[];
  }
): PricingResult {
  const meta = safeParseJSON<GuaranteeMetadata>(coverage.metadata);

  // Normalize legacy metadata field names to match expected interface
  const m = meta as any;
  // MATRIX_BASED: matrixType → dimension
  if (m.matrixType && !m.dimension) m.dimension = m.matrixType;
  // VARIABLE_BASED: variable → variableSource
  if (m.variable && !m.variableSource) {
    const varMap: Record<string, string> = { VN: "NEW_VALUE", VA: "VENAL_VALUE", CV: "FISCAL_POWER", "REPLACEMENT_VALUE": "NEW_VALUE" };
    m.variableSource = varMap[m.variable] || m.variable;
  }
  // rate → ratePercent
  if (m.rate != null && m.ratePercent == null) m.ratePercent = m.rate;
  // conditional object → flat fields
  if (m.conditional && typeof m.conditional === "object") {
    if (!m.conditionedByNewValue) m.conditionedByNewValue = true;
    if (m.conditional.threshold != null && m.newValueThreshold == null) m.newValueThreshold = m.conditional.threshold;
    if (m.conditional.rateBelow != null && m.rateBelowThresholdPercent == null) m.rateBelowThresholdPercent = m.conditional.rateBelow;
    if (m.conditional.rateAbove != null && m.rateAboveThresholdPercent == null) m.rateAboveThresholdPercent = m.conditional.rateAbove;
  }
  // IC/IPT formulas: primeFixe → use as ceiling with baseRate=100 so amount=primeFixe
  if (m.formulas && Array.isArray(m.formulas)) {
    for (const f of m.formulas) {
      if (f.primeFixe != null && f.baseRate == null) {
        f.baseRate = 100;
        f.ceiling = f.primeFixe;
      }
      // Also normalize 'prime' field from UI (FormulaConfig) to baseRate/ceiling
      if (f.prime != null && f.baseRate == null) {
        f.baseRate = 100;
        f.ceiling = f.prime;
      }
    }
  }

  // Merge structured columns into metadata (structured columns override metadata JSON)
  if (coverage.variableSource) (meta as any).variableSource = coverage.variableSource;
  if (coverage.ratePercent != null) (meta as any).ratePercent = coverage.ratePercent;
  if (coverage.conditionedByNewValue) {
    (meta as any).conditionedByNewValue = true;
    if (coverage.newValueThreshold != null) (meta as any).newValueThreshold = coverage.newValueThreshold;
    if (coverage.rateBelowThreshold != null) (meta as any).rateBelowThresholdPercent = coverage.rateBelowThreshold;
    if (coverage.rateAboveThreshold != null) (meta as any).rateAboveThresholdPercent = coverage.rateAboveThreshold;
  }
  if (coverage.fixedAmount != null) (meta as any).fixedAmount = coverage.fixedAmount;
  if (coverage.packPriceReduced != null) (meta as any).packPriceReduced = coverage.packPriceReduced;
  if (coverage.capital != null) (meta as any).capital = coverage.capital;
  if (coverage.matrixDimension) (meta as any).dimension = coverage.matrixDimension;
  if (coverage.requiresGuarantee) (meta as any).requiresGuarantee = coverage.requiresGuarantee;

  switch (coverage.calculationType) {
    case "FREE":
      return calculateFree(meta);
    case "FIXED_AMOUNT":
      return calculateFixedAmount(meta as FixedAmountMetadata, options);
    case "VARIABLE_BASED":
      return calculateVariableBased(meta as VariableBasedMetadata, vehicleData);
    case "MATRIX_BASED":
      return calculateMatrixBased(
        meta as MatrixBasedMetadata,
        vehicleData,
        coverage.tariffRules
      );
    default:
      return {
        amount: 0,
        method: coverage.calculationType || "INCONNU",
        breakdown: `Méthode de calcul non reconnue : ${coverage.calculationType}`,
      };
  }
}

// ── FREE ──────────────────────────────────────────────────────

function calculateFree(_meta: GuaranteeMetadata): PricingResult {
  return {
    amount: 0,
    method: "FREE",
    breakdown: "Garantie incluse sans surprime",
  };
}

// ── FIXED_AMOUNT ──────────────────────────────────────────────

function calculateFixedAmount(
  meta: FixedAmountMetadata,
  options?: { isInPackage?: boolean; activeGuarantees?: string[] }
): PricingResult {
  // Vérifie si une garantie requise est active
  if (meta.requiresGuarantee) {
    const hasRequired =
      options?.activeGuarantees?.includes(meta.requiresGuarantee) ?? false;
    if (!hasRequired) {
      return {
        amount: 0,
        method: "FIXED_AMOUNT",
        breakdown: `Garantie non applicable — garantie requise « ${meta.requiresGuarantee} » non sélectionnée`,
      };
    }
  }

  // Détermine le montant de base
  let amount: number;
  if (options?.isInPackage && meta.packPriceReduced != null) {
    amount = meta.packPriceReduced;
  } else {
    amount = meta.fixedAmount ?? 0;
  }

  // Applique les bornes min / max
  amount = clamp(amount, meta.minAmount, meta.maxAmount);

  const details: string[] = [];
  if (options?.isInPackage && meta.packPriceReduced != null) {
    details.push(
      `Montant pack réduit : ${meta.packPriceReduced.toLocaleString("fr-FR")} FCFA`
    );
  } else {
    details.push(
      `Montant fixe : ${meta.fixedAmount?.toLocaleString("fr-FR") ?? "0"} FCFA`
    );
  }
  if (meta.capital != null) {
    details.push(`Capital : ${meta.capital.toLocaleString("fr-FR")} FCFA`);
  }
  if (meta.minAmount != null) {
    details.push(`Minimum : ${meta.minAmount.toLocaleString("fr-FR")} FCFA`);
  }
  if (meta.maxAmount != null) {
    details.push(`Plafond : ${meta.maxAmount.toLocaleString("fr-FR")} FCFA`);
  }

  return {
    amount,
    method: "FIXED_AMOUNT",
    breakdown: details.join(" — "),
  };
}

// ── VARIABLE_BASED ───────────────────────────────────────────

function calculateVariableBased(
  meta: VariableBasedMetadata,
  vehicle: VehiclePricingData
): PricingResult {
  // Vérifie la garantie requise
  if (meta.requiresGuarantee) {
    // Si aucune liste de garanties actives fournie, on suppose applicable
    // (le contrôle de garantie requise nécessiterait le contexte complet)
  }

  // Récupère la valeur de la variable de référence
  let variableValue = 0;
  let variableLabel = "";

  switch (meta.variableSource) {
    case "NEW_VALUE":
      variableValue = parseFCFA(vehicle.newValue);
      variableLabel = `Valeur à neuf (VN)`;
      break;
    case "VENAL_VALUE":
      variableValue = parseFCFA(vehicle.currentValue);
      variableLabel = `Valeur vénale (VA)`;
      break;
    case "FISCAL_POWER":
      variableValue = parseFloat(vehicle.fiscalPower) || 0;
      variableLabel = `Puissance fiscale (CV)`;
      break;
    default:
      return {
        amount: 0,
        method: "VARIABLE_BASED",
        breakdown: `Source de variable non reconnue : ${meta.variableSource}`,
      };
  }

  // Détermine le taux applicable
  let ratePercent = meta.ratePercent ?? 0;
  let rateReason = `Taux : ${ratePercent}%`;

  if (meta.conditionedByNewValue) {
    const threshold = meta.newValueThreshold ?? 0;
    const nv = parseFCFA(vehicle.newValue);

    if (nv > 0 && nv <= threshold) {
      ratePercent = meta.rateBelowThresholdPercent ?? meta.ratePercent ?? 0;
      rateReason = `VN ≤ ${threshold.toLocaleString("fr-FR")} FCFA → taux réduit ${ratePercent}%`;
    } else {
      ratePercent = meta.rateAboveThresholdPercent ?? meta.ratePercent ?? 0;
      rateReason = `VN > ${threshold.toLocaleString("fr-FR")} FCFA → taux majoré ${ratePercent}%`;
    }
  }

  // Calcul : valeur × (taux / 100), arrondi au 500 le plus proche
  let amount = variableValue * (ratePercent / 100);
  amount = roundTo500(amount);

  // Applique les bornes min / max
  amount = clamp(amount, meta.minAmount, meta.maxAmount);

  const details: string[] = [
    `${variableLabel} : ${variableValue.toLocaleString("fr-FR")} FCFA`,
    rateReason,
    `Brut : ${(variableValue * (ratePercent / 100)).toLocaleString("fr-FR")} FCFA`,
    `Arrondi (×500) : ${amount.toLocaleString("fr-FR")} FCFA`,
  ];
  if (meta.minAmount != null) {
    details.push(`Minimum : ${meta.minAmount.toLocaleString("fr-FR")} FCFA`);
  }
  if (meta.maxAmount != null) {
    details.push(`Plafond : ${meta.maxAmount.toLocaleString("fr-FR")} FCFA`);
  }

  return {
    amount,
    method: "VARIABLE_BASED",
    breakdown: details.join(" — "),
  };
}

// ── MATRIX_BASED ─────────────────────────────────────────────

function calculateMatrixBased(
  meta: MatrixBasedMetadata,
  vehicle: VehiclePricingData,
  tariffRules?: CoverageInput["tariffRules"]
): PricingResult {
  const fp = parseInt(vehicle.fiscalPower) || 0;
  const fuelType = (vehicle.fuelType || "").toLowerCase().trim();
  const seatsRaw = (vehicle.seats || "").trim();
  const seatsNum = seatsRaw === "+8" ? 9 : parseInt(seatsRaw) || 5;
  const nv = parseFCFA(vehicle.newValue);

  let amount = 0;
  let breakdown = "";
  let source = "matrice";

  switch (meta.dimension) {
    // ── Puissance fiscale ──
    case "FISCAL_POWER": {
      const tariffs = meta.tariffs || [];
      // Essai avec fuelType, puis fallback sans fuelType
      let match = tariffs.find(
        (t) =>
          fp >= (t.fiscalPowerMin ?? -Infinity) &&
          fp <= (t.fiscalPowerMax ?? Infinity) &&
          (t.fuelType
            ? t.fuelType.toLowerCase() === fuelType
            : true)
      );
      if (!match) {
        match = tariffs.find(
          (t) =>
            fp >= (t.fiscalPowerMin ?? -Infinity) &&
            fp <= (t.fiscalPowerMax ?? Infinity)
        );
      }
      if (match) {
        amount = match.prime;
        breakdown = `CV ${fp} dans [${match.fiscalPowerMin ?? "?"}–${match.fiscalPowerMax ?? "?"}]${match.fuelType ? `, carburant ${match.fuelType}` : ""} → prime ${amount.toLocaleString("fr-FR")} FCFA`;
      } else if (tariffs.length === 0) {
        // Pas de tariffs dans la metadata → fallback vers les règles DB
        amount = findTariffRuleAmount(tariffRules, { fiscalPower: fp, fuelType }, meta);
        breakdown = amount > 0
          ? `Règle tarifaire DB (CV ${fp}, ${fuelType || "any"}) → ${amount.toLocaleString("fr-FR")} FCFA`
          : `Aucune tranche trouvée pour CV ${fp}, carburant ${fuelType || "any"}`;
      } else {
        // Des tariffs existent dans la metadata mais ne matchent pas
        console.warn(
          `[pricing] Tariffs metadata disponibles (${tariffs.length}) mais aucun match pour CV ${fp}, carburant "${fuelType}". ` +
          `Tranches : ${tariffs.map(t => `[${t.fiscalPowerMin ?? "?"}-${t.fiscalPowerMax ?? "?"}, ${t.fuelType ?? "any"}]`).join(", ")}`
        );
        amount = findTariffRuleAmount(tariffRules, { fiscalPower: fp, fuelType }, meta);
        breakdown = amount > 0
          ? `Règle tarifaire DB → ${amount.toLocaleString("fr-FR")} FCFA`
          : `Aucune tranche trouvée pour CV ${fp}`;
      }
      source = "PUISSANCE_FISCALE";
      break;
    }

    // ── Type de carburant ──
    case "FUEL_TYPE": {
      const tariffs = meta.tariffs || [];
      const match = tariffs.find((t) => {
        const tFuel = (t.fuelType || "").toLowerCase().trim();
        return tFuel === fuelType;
      });
      if (match) {
        amount = match.prime;
        breakdown = `Carburant « ${fuelType} » → prime ${amount.toLocaleString("fr-FR")} FCFA`;
      } else {
        breakdown = `Aucune tarification trouvée pour le carburant « ${fuelType} »`;
      }
      source = "TYPE_CARBURANT";
      break;
    }

    // ── Catégorie véhicule ──
    case "VEHICLE_CATEGORY": {
      const tariffs = meta.tariffs || [];
      // La catégorie est déduite de l'usage
      const category = mapUsageToVehicleCategory(vehicle.usage);
      const match = tariffs.find((t) => {
        const tCat = (t.vehicleCategory || "").toUpperCase().trim();
        return tCat === category;
      });
      if (match) {
        amount = match.prime;
        breakdown = `Catégorie véhicule « ${category} » → prime ${amount.toLocaleString("fr-FR")} FCFA`;
      } else {
        breakdown = `Aucune tarification trouvée pour la catégorie « ${category} »`;
      }
      source = "CATEGORIE_VEHICULE";
      break;
    }

    // ── Places assises ──
    case "SEATS": {
      const tariffs = meta.tariffs || [];
      const match = tariffs.find((t) => {
        const min = t.fiscalPowerMin ?? -Infinity; // réutilise fiscalPowerMin/Max pour les sièges
        const max = t.fiscalPowerMax ?? Infinity;
        return seatsNum >= min && seatsNum <= max;
      });
      if (match) {
        amount = match.prime;
        breakdown = `${seatsRaw} places (≥${match.fiscalPowerMin ?? "?"} et ≤${match.fiscalPowerMax ?? "?"}) → prime ${amount.toLocaleString("fr-FR")} FCFA`;
      } else {
        breakdown = `Aucune tarification trouvée pour ${seatsRaw} places`;
      }
      source = "PLACES";
      break;
    }

    // ── Formule (IC / IPT) ──
    case "FORMULA": {
      const formulas = meta.formulas || [];
      const tariffs = meta.tariffs || [];

      // 0) Cherche dans les formules avec usePlaces → prime par nombre de places
      const seatsNum = seatsRaw === "+8" ? 9 : (parseInt(seatsRaw) || 0);
      const formulaWithPlaces = formulas.find((f) => {
        if (!f.usePlaces || !Array.isArray(f.placesTariffs)) return false;
        return f.placesTariffs.some(
          (pt) => pt.places === seatsNum && pt.prime > 0
        );
      });
      if (formulaWithPlaces) {
        const pt = formulaWithPlaces.placesTariffs!.find(
          (t) => t.places === seatsNum
        );
        if (pt) {
          amount = pt.prime;
          breakdown = `Formule « ${formulaWithPlaces.label || formulaWithPlaces.name} » → ${seatsRaw} place(s) → prime ${amount.toLocaleString("fr-FR")} FCFA`;
          source = "FORMULE";
          break;
        }
      }

      // 1) Cherche dans tariffs par formulaName correspondant aux sièges
      const seatsLabel = seatsRaw === "+8" ? "+8" : seatsRaw;
      const tariffMatch = tariffs.find((t) => {
        // Cherche par formule correspondant aux places
        return (
          (t.fuelType === seatsLabel ||
            t.vehicleCategory === seatsLabel) &&
          t.prime
        );
      });

      if (tariffMatch) {
        amount = tariffMatch.prime;
        breakdown = `Formule sièges « ${seatsLabel} » → prime ${amount.toLocaleString("fr-FR")} FCFA`;
      } else {
        // 2) Cherche dans formulas par nom correspondant aux sièges
        const formulaMatch = formulas.find((f) =>
          f.name.toLowerCase().includes(seatsLabel)
        );
        if (formulaMatch) {
          // Calcule : baseRate % de la VN, plafonné au ceiling
          const gross = nv * (formulaMatch.baseRate / 100);
          amount = formulaMatch.ceiling
            ? Math.min(gross, formulaMatch.ceiling)
            : gross;
          amount = roundTo500(amount);
          breakdown = `Formule « ${formulaMatch.name} » : ${formulaMatch.baseRate}% × VN ${nv.toLocaleString("fr-FR")} = ${gross.toLocaleString("fr-FR")} FCFA${formulaMatch.ceiling ? ` (plafond ${formulaMatch.ceiling.toLocaleString("fr-FR")})` : ""} → ${amount.toLocaleString("fr-FR")} FCFA`;
        } else {
          // 3) Fallback : première formule disponible
          if (formulas.length > 0) {
            const fallback = formulas[0];
            const gross = nv * (fallback.baseRate / 100);
            amount = fallback.ceiling
              ? Math.min(gross, fallback.ceiling)
              : gross;
            amount = roundTo500(amount);
            breakdown = `Formule par défaut « ${fallback.name} » : ${fallback.baseRate}% × VN → ${amount.toLocaleString("fr-FR")} FCFA`;
          } else {
            breakdown = `Aucune formule trouvée pour ${seatsRaw} places`;
          }
        }
      }
      source = "FORMULE";
      break;
    }

    // ── Tierce Complète (TCM) ──
    case "TIERCE_COMPLETE": {
      const result = calculateTierceAmount(meta, vehicle, fp, nv, "TCM");
      amount = result.amount;
      breakdown = result.breakdown;
      source = "TIERCE_COMPLETE";
      break;
    }

    // ── Tierce Collision (TCL) ──
    case "TIERCE_COLLISION": {
      const result = calculateTierceAmount(meta, vehicle, fp, nv, "TCL");
      amount = result.amount;
      breakdown = result.breakdown;
      source = "TIERCE_COLLISION";
      break;
    }

    default:
      breakdown = `Dimension de matrice non reconnue : ${meta.dimension}`;
  }

  // Applique les bornes min / max depuis la metadata
  amount = clamp(amount, meta.minAmount, meta.maxAmount);

  return {
    amount: Math.max(0, amount),
    method: `MATRIX_BASED (${source})`,
    breakdown,
  };
}

/** Calcul pour TCM / TCL à partir des categoryTariffs */
function calculateTierceAmount(
  meta: MatrixBasedMetadata,
  vehicle: VehiclePricingData,
  fp: number,
  nv: number,
  code: string
): { amount: number; breakdown: string } {
  const catTariffs = meta.categoryTariffs || [];
  if (catTariffs.length > 0) {
    const vnClass = getVNRangeClass(nv);
    const vnBounds = VN_RANGE_BOUNDS[vnClass];
    const vehicleCategory = mapUsageToVehicleCategory(vehicle.usage);

    let franchise = 0;
    if (meta.franchise) {
      franchise = meta.franchise.type === "AMOUNT"
        ? meta.franchise.value
        : 0;
    }

    const rate = findTierceRate(catTariffs, vnClass, franchise, vehicleCategory, nv);

    if (rate != null) {
      const grossPremium = nv * (rate / 100);
      const amount = roundTo500(grossPremium);

      const breakdown = [
        `${code} — Catégorie ${vehicleCategory}`,
        `Classe VN ${vnClass} (${vnBounds.min.toLocaleString("fr-FR")} – ${vnBounds.max === Infinity ? "∞" : vnBounds.max.toLocaleString("fr-FR")} FCFA)`,
        `Taux : ${rate}%`,
        `Brut : ${grossPremium.toLocaleString("fr-FR")} FCFA`,
        `Arrondi (×500) : ${amount.toLocaleString("fr-FR")} FCFA`,
      ].join(" — ");

      return { amount, breakdown };
    }
  }

  if (nv <= 0) {
    return {
      amount: 0,
      breakdown: `${code} — VN non renseignée, tarification impossible`,
    };
  }

  const defaultRates: Record<string, number> = {
    TIERCE_COMPLETE: 4.4,
    TIERCE_COLLISION: 2.8,
  };
  const ratePercent = defaultRates[code] || defaultRates[meta.dimension] || 3.0;
  const grossPremium = nv * (ratePercent / 100);
  const amount = roundTo500(grossPremium);
  const vnClass = getVNRangeClass(nv);
  const vnBounds = VN_RANGE_BOUNDS[vnClass];

  return {
    amount,
    breakdown: [
      `${code} — Taux par défaut`,
      `Classe VN ${vnClass} (${vnBounds.min.toLocaleString("fr-FR")} – ${vnBounds.max === Infinity ? "∞" : vnBounds.max.toLocaleString("fr-FR")} FCFA)`,
      `Taux : ${ratePercent}% (par défaut)`,
      `VN : ${nv.toLocaleString("fr-FR")} FCFA`,
      `Arrondi (×500) : ${amount.toLocaleString("fr-FR")} FCFA`,
    ].join(" — "),
  };
}

/** Cherche un montant dans les règles de tarification DB (fallback) */
function findTariffRuleAmount(
  rules: CoverageInput["tariffRules"] | undefined,
  params: { fiscalPower: number; fuelType: string },
  meta: MatrixBasedMetadata
): number {
  if (!rules || rules.length === 0) {
    console.warn(
      `[pricing] Aucune règle tarifaire DB disponible (CV ${params.fiscalPower}, carburant ${params.fuelType})`
    );
    return 0;
  }

  const match = rules.find((r) => {
    const fpOk =
      params.fiscalPower >= (r.minFiscalPower ?? -Infinity) &&
      params.fiscalPower <= (r.maxFiscalPower ?? Infinity);
    const fuelOk =
      !r.fuelType ||
      r.fuelType.toLowerCase() === params.fuelType.toLowerCase() ||
      r.fuelType === "";
    return fpOk && fuelOk;
  });

  if (!match) {
    console.warn(
      `[pricing] Aucune règle tarifaire ne correspond pour CV ${params.fiscalPower}, carburant "${params.fuelType}". ` +
      `Règles disponibles : ${rules.map(r => `[${r.minFiscalPower ?? "?"}-${r.maxFiscalPower ?? "?"}, ${r.fuelType ?? "any"}, ${r.fixedAmount ?? "?"}]`).join(", ")}`
    );
    return 0;
  }

  if (match.fixedAmount != null) return match.fixedAmount;
  if (match.baseRate != null) {
    const ref = 10_000_000;
    return roundTo500(ref * (match.baseRate / 100));
  }

  return 0;
}

/** Mappe l'usage du véhicule vers une catégorie d'assurance (Côte d'Ivoire) */
function mapUsageToVehicleCategory(usage: string): string {
  const mapping: Record<string, string> = {
    personnel: "401",      // Véhicule Particulier (VP)
    professionnel: "401",  // VP usage pro
    taxi_vtc: "402",       // Véhicule de Transport (VT)
    autre: "401",
  };
  return mapping[usage] || "401";
}

/**
 * Trouve le taux applicable dans la grille Tierce pour une combinaison
 * VN class + franchise + catégorie véhicule.
 * Les taux sont stockés en % (ex: 4.4 = 4.4% de la VN).
 */
function findTierceRate(
  catTariffs: MatrixCategoryTariff[],
  vnClass: string,
  franchise: number,
  vehicleCategory: string,
  nv: number
): number | null {
  // 1) Match exact par catégorie + classe VN + franchise
  let match = catTariffs.find((t) => {
    const tCat = (t.category || "").toUpperCase().trim();
    const tVC = (t as any).vehicleCategory as string | undefined;
    const catMatch = !tVC || tVC === vehicleCategory;
    return catMatch && tCat === vnClass && t.franchise === franchise;
  });
  if (match?.prime != null) return match.prime;

  // 2) Match par catégorie + classe VN (première franchise dispo)
  match = catTariffs.find((t) => {
    const tCat = (t.category || "").toUpperCase().trim();
    const tVC = (t as any).vehicleCategory as string | undefined;
    const catMatch = !tVC || tVC === vehicleCategory;
    return catMatch && tCat === vnClass;
  });
  if (match?.prime != null) return match.prime;

  // 3) Match par valeur (valueMin/valueMax) + catégorie — uniquement si des
  //    bornes sont définies sur l'entrée. Sans cette garde, on renvoyait la
  //    première entrée de la catégorie, qui peut correspondre à une autre
  //    classe de VN (taux classe F appliqué à un véhicule classe A).
  match = catTariffs.find((t) => {
    if (t.valueMin == null && t.valueMax == null) return false;
    const tVC = (t as any).vehicleCategory as string | undefined;
    const catMatch = !tVC || tVC === vehicleCategory;
    return (
      catMatch &&
      nv >= (t.valueMin ?? -Infinity) &&
      nv <= (t.valueMax ?? Infinity)
    );
  });
  if (match?.prime != null) return match.prime;

  return null;
}

// ── 2. scoreOffer ────────────────────────────────────────────

export function scoreOffer(
  offer: OfferInput,
  vehicleData: VehiclePricingData,
  matchedGuarantees: string[],
  preferredContractType?: string | null
): ScoreResult {
  let score = 0;
  const reasons: string[] = [];

  // +25 pts par garantie correspondante
  const guaranteePoints = matchedGuarantees.length * 25;
  if (guaranteePoints > 0) {
    score += guaranteePoints;
    reasons.push(
      `+${guaranteePoints} pts — ${matchedGuarantees.length} garantie(s) correspondante(s)`
    );
  }

  // +15 à +30 pts si le type de contrat est défini
  const contractType = offer.contractType;
  if (contractType) {
    const contractPoints: Record<string, number> = {
      basic: 15,
      third_party_plus: 20,
      all_risks: 30,
    };
    const pts = contractPoints[contractType] ?? 15;
    score += pts;
    const labels: Record<string, string> = {
      basic: "Tiers",
      third_party_plus: "Tiers+",
      all_risks: "Tous Risques",
    };
    reasons.push(
      `+${pts} pts — type de contrat « ${labels[contractType] || contractType} »`
    );

    // Bonus si le type de l'offre correspond au besoin exprimé par l'utilisateur
    if (preferredContractType && contractType === preferredContractType) {
      score += 30;
      reasons.push(
        `+30 pts — type de contrat « ${labels[contractType] || contractType} » correspondant à votre besoin`
      );
    }
  }

  // +5 à +20 pts si le prix de l'offre est dans une plage raisonnable
  if (offer.priceMin != null && offer.priceMax != null) {
    const nv = parseFCFA(vehicleData.newValue);
    // Plage de prix attendue : ~0.5% à 3% de la VN
    const expectedMin = nv * 0.005;
    const expectedMax = nv * 0.03;
    const priceRange = [offer.priceMin, offer.priceMax];
    const midPrice = (priceRange[0] + priceRange[1]) / 2;

    if (midPrice >= expectedMin && midPrice <= expectedMax) {
      score += 20;
      reasons.push(
        `+20 pts — plage de prix cohérente avec la valeur du véhicule`
      );
    } else if (midPrice >= expectedMin * 0.5 && midPrice <= expectedMax * 1.5) {
      score += 10;
      reasons.push(`+10 pts — plage de prix approximativement cohérente`);
    } else {
      score += 5;
      reasons.push(`+5 pts — plage de prix définie`);
    }
  } else if (offer.priceMin != null) {
    score += 5;
    reasons.push(`+5 pts — prix minimum défini`);
  }

  // +15 pts si la puissance fiscale est dans la plage de l'offre
  const fp = parseInt(vehicleData.fiscalPower) || 0;
  if (offer.fiscalPowerMin != null || offer.fiscalPowerMax != null) {
    const fpMin = offer.fiscalPowerMin ?? -Infinity;
    const fpMax = offer.fiscalPowerMax ?? Infinity;
    if (fp >= fpMin && fp <= fpMax) {
      score += 15;
      reasons.push(
        `+15 pts — puissance fiscale ${fp} CV dans la plage [${offer.fiscalPowerMin ?? "?"}–${offer.fiscalPowerMax ?? "?"}]`
      );
    }
  }

  // +10 pts si le type de carburant est dans la liste de l'offre
  const offerFuelTypes = safeParseStringArray(offer.fuelTypes);
  if (offerFuelTypes.length > 0) {
    const vehicleFuel = (vehicleData.fuelType || "").toLowerCase().trim();
    if (offerFuelTypes.some((ft) => ft.toLowerCase() === vehicleFuel)) {
      score += 10;
      reasons.push(
        `+10 pts — carburant « ${vehicleData.fuelType} » accepté par l'offre`
      );
    }
  } else {
    // Si l'offre n'a pas de restriction carburant, c'est un avantage
    score += 5;
    reasons.push(`+5 pts — tous carburants acceptés`);
  }

  // +10 pts si la valeur à neuf est dans la plage de l'offre
  const nv = parseFCFA(vehicleData.newValue);
  if (offer.newValueMin != null || offer.newValueMax != null) {
    const nvMin = offer.newValueMin ?? -Infinity;
    const nvMax = offer.newValueMax ?? Infinity;
    if (nv >= nvMin && nv <= nvMax) {
      score += 10;
      reasons.push(
        `+10 pts — valeur à neuf dans la plage de l'offre`
      );
    }
  }

  // +10 pts si l'usage du véhicule est accepté par l'offre
  const offerUsages = safeParseStringArray(offer.vehicleUsage);
  if (offerUsages.length > 0) {
    const vehicleUsage = (vehicleData.usage || "").toLowerCase().trim();
    if (offerUsages.some((u) => u.toLowerCase() === vehicleUsage)) {
      score += 10;
      reasons.push(
        `+10 pts — usage « ${vehicleData.usage} » accepté par l'offre`
      );
    }
  } else {
    score += 5;
    reasons.push(`+5 pts — tous usages acceptés`);
  }

  return { score, reasons };
}

// ── 4. isVehicleEligible ─────────────────────────────────────

export function isVehicleEligible(
  offer: OfferInput,
  vehicleData: VehiclePricingData
): boolean {
  const fp = parseInt(vehicleData.fiscalPower) || 0;
  const nv = parseFCFA(vehicleData.newValue);
  const va = parseFCFA(vehicleData.currentValue);
  const fuel = (vehicleData.fuelType || "").toLowerCase().trim();
  const usage = (vehicleData.usage || "").toLowerCase().trim();

  // Puissance fiscale
  if (offer.fiscalPowerMin != null && fp < offer.fiscalPowerMin) return false;
  if (offer.fiscalPowerMax != null && fp > offer.fiscalPowerMax) return false;

  // Type de carburant (liste vide = tous acceptés)
  const fuelTypes = safeParseStringArray(offer.fuelTypes);
  if (fuelTypes.length > 0) {
    const fuelMatch = fuelTypes.some((ft) => ft.toLowerCase() === fuel);
    if (!fuelMatch) return false;
  }

  // Valeur à neuf
  if (offer.newValueMin != null && nv < offer.newValueMin) return false;
  if (offer.newValueMax != null && nv > offer.newValueMax) return false;

  // Valeur vénale
  if (offer.venalValueMin != null && va < offer.venalValueMin) return false;
  if (offer.venalValueMax != null && va > offer.venalValueMax) return false;

  // Usage du véhicule (liste vide = tous acceptés)
  const usages = safeParseStringArray(offer.vehicleUsage);
  if (usages.length > 0) {
    const usageMatch = usages.some((u) => u.toLowerCase() === usage);
    if (!usageMatch) return false;
  }

  return true;
}