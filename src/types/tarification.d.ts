export interface Vehicle {
  id: string;
  categoryCode: string; // 401, 402, etc.
  energy: 'Essence' | 'Diesel' | 'Électrique' | 'Hybride';
  fiscalPower: number; // Puissance fiscale en CV
  nbPlaces: number;
  firstCirculationDate: Date;
  values: {
    venale: number; // Valeur vénale
    neuve: number; // Valeur neuve
  };
}

export interface TarifRC {
  id: string;
  category: string;
  energy: string;
  powerMin: number;
  powerMax: number;
  prime: number;
}

export interface TarifICIPT {
  id: string;
  type: 'IC' | 'IPT';
  formula: number; // 1, 2, 3
  nbPlaces: number;
  prime: number;
}

export interface TarifTCMTCL {
  id: string;
  category: string;
  guaranteeType: string;
  valueNeufMin: number;
  valueNeufMax: number;
  franchise: number;
  rate: number;
}

export interface TarifFixe {
  id: string;
  guaranteeName: string;
  prime: number;
  conditions?: string;
  packPriceReduced?: number;
}

export interface FireTheftConfig {
  enabled?: boolean;
  autoLinkTheft?: boolean;
  includeFireComponent?: boolean;
  includeBaseTheftComponent?: boolean;
  includeArmedTheftComponent?: boolean;
  fireRatePercent?: number;
  theftRateBelowThresholdPercent?: number;
  theftRateAboveThresholdPercent?: number;
  armedTheftRateBelowThresholdPercent?: number;
  armedTheftRateAboveThresholdPercent?: number;
  sumInsuredThreshold?: number;
}

export interface GlassRoofConfig {
  enabled?: boolean;
  ratePercent?: number;
}

export interface GlassStandardConfig {
  enabled?: boolean;
  ratePercent?: number;
}

export type TierceFranchiseOptionType = 'NONE' | 'FRANCHISE_250' | 'FRANCHISE_500';

export interface TierceFranchiseOption {
  type: TierceFranchiseOptionType;
  label: string;
  franchiseAmount?: number;
  ratePercent: number;
  deductionPercent?: number;
}

export interface TierceCapConfig {
  selectedOption: TierceFranchiseOptionType;
  options: TierceFranchiseOption[];
}

export interface ICFormulaConfig {
  formula: number;
  capitalDeces: number;
  capitalInvalidite: number;
  fraisMedicaux: number;
  prime: number;
  label: string;
}

export interface IPTPlacesTariff {
  places: number;
  prime: number;
  label: string;
}

export interface IPTFormulaConfig extends ICFormulaConfig {
  placesTariffs?: IPTPlacesTariff[];
}

export interface ICIPTConfig {
  defaultFormula?: number;
  formulas?: ICFormulaConfig[];
}

export interface IPTConfig {
  defaultFormula?: number;
  formulas?: IPTFormulaConfig[];
}

export interface GuaranteeParameters {
  fireTheftConfig?: FireTheftConfig;
  glassRoofConfig?: GlassRoofConfig;
  glassStandardConfig?: GlassStandardConfig;
  tierceCapConfig?: TierceCapConfig;
  icIptConfig?: ICIPTConfig;
  iptConfig?: IPTConfig;
  [key: string]: any;
}

export interface CalculationMethod {
  id: string;
  name: string;
  description: string;
  type: CalculationMethodType;
}

export type CalculationMethodType =
  | 'FIXED_AMOUNT'
  | 'FREE'
  | 'FIRE_THEFT'
  | 'THEFT_ARMED'
  | 'GLASS_ROOF'
  | 'GLASS_STANDARD'
  | 'TIERCE_COMPLETE_CAP'
  | 'TIERCE_COLLISION_CAP'
  | 'MTPL_TARIFF'
  | 'IC_IPT_FORMULA'
  | 'IPT_PLACES_FORMULA';

export interface Guarantee {
  id: string;
  name: string;
  code: string;
  category: GuaranteeCategory;
  description: string;
  calculationMethod: CalculationMethodType;
  isOptional: boolean;
  isActive: boolean;
  conditions?: string;
  minValue?: number;
  maxValue?: number;
  rate?: number;
  fixedAmount?: number;
  franchiseOptions?: number[];
  parameters?: GuaranteeParameters;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export type GuaranteeCategory =
  | 'RESPONSABILITE_CIVILE'
  | 'DEFENSE_RECOURS'
  | 'INDIVIDUELLE_CONDUCTEUR'
  | 'INDIVIDUELLE_PASSAGERS'
  | 'INCENDIE'
  | 'VOL'
  | 'VOL_MAINS_ARMEES'
  | 'BRIS_GLACES'
  | 'TIERCE_COMPLETE'
  | 'TIERCE_COLLISION'
  | 'ASSISTANCE'
  | 'AVANCE_RECOURS'
  | 'ACCESSOIRES';

export interface InsurancePackage {
  id: string;
  name: string;
  code: string;
  description: string;
  guarantees: string[]; // Guarantee IDs
  basePrice: number;
  totalPrice: number;
  isPopular?: boolean;
  conditions?: string;
  vehicleTypeRestrictions?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface PricingCalculation {
  vehicle: Vehicle;
  guaranteeIds: string[];
  packageId?: string;
  calculationMethod?: 'PACK' | 'TAILOR_MADE';
  parameters?: {
    icIptFormula?: number;
    tierceFranchise?: number;
    [key: string]: any;
  };
}

export interface PricingResult {
  totalBasePrice: number;
  totalWithGuarantees: number;
  guaranteeBreakdown: GuaranteePricing[];
  package?: InsurancePackage;
  appliedTaxes?: {
    taxName: string;
    rate: number;
    amount: number;
  }[];
  calculationDate: Date;
}

export interface GuaranteePricing {
  guarantee: Guarantee;
  basePrice: number;
  calculatedPrice: number;
  pricingMethod: string;
  calculationDetails?: {
    [key: string]: any;
  };
}

export interface TarificationGrids {
  tarifRC: TarifRC[];
  tarifICIPT: TarifICIPT[];
  tarifTCMTCL: TarifTCMTCL[];
  tarifFixes: TarifFixe[];
}

export interface PricingRule {
  id: string;
  name: string;
  description: string;
  condition: string; // Expression de condition
  action: string; // Action à appliquer
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TarificationStats {
  totalGuarantees: number;
  activeGuarantees: number;
  totalPackages: number;
  activePackages: number;
  mostUsedGuarantees: {
    guaranteeId: string;
    guaranteeName: string;
    usageCount: number;
  }[];
  averagePackagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
}

// Configuration pour les grilles de tarification
export interface TarificationConfig {
  updateFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  lastUpdate: Date;
  nextUpdate: Date;
  autoUpdateEnabled: boolean;
  version: string;
  grids: {
    rcVersion: string;
    icIptVersion: string;
    tcmTclVersion: string;
    fixesVersion: string;
  };
}

// Types pour les formulaires admin
export interface GuaranteeFormData {
  name: string;
  code: string;
  category: GuaranteeCategory;
  description: string;
  calculationMethod: CalculationMethodType;
  isOptional: boolean;
  conditions?: string;
  minValue?: number;
  maxValue?: number;
  rate?: number;
  fixedAmount?: number;
  franchiseOptions?: number[];
  parameters?: GuaranteeParameters;
}

export interface PackageFormData {
  name: string;
  code: string;
  description: string;
  guaranteeIds: string[];
  basePrice: number;
  conditions?: string;
  vehicleTypeRestrictions?: string[];
  isPopular?: boolean;
}

export interface TarifRCFormData {
  category: string;
  energy: string;
  powerMin: number;
  powerMax: number;
  prime: number;
}

export interface TarifICIPTFormData {
  type: 'IC' | 'IPT';
  formula: number;
  nbPlaces: number;
  prime: number;
}

export interface TarifTCMTCLFormData {
  category: string;
  guaranteeType: string;
  valueNeufMin: number;
  valueNeufMax: number;
  franchise: number;
  rate: number;
}

export interface TarifFixeFormData {
  guaranteeName: string;
  prime: number;
  conditions?: string;
  packPriceReduced?: number;
}
