export type AppView =
  | "landing"
  | "compare"
  | "results"
  | "dashboard";

export type AuthModal = "none" | "login" | "register" | "forgot";

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  licenseDate: string;
  hasClaims: boolean;
  claimsCount: number;
  usage: "personnel" | "professionnel";
  annualMileage: string;
}

export interface VehicleInfo {
  vehicleType: string;
  brand: string;
  model: string;
  year: string;
  fiscalPower: string;
  registration: string;
  newValue: string;
  currentValue: string;
  isImported: boolean;
}

export interface CoverageNeeds {
  coverageType: "tiers" | "tiers_plus" | "tous_risques";
  options: string[];
  monthlyBudget: string;
  deductibleLevel: "low" | "medium" | "high";
}

export interface ComparisonResult {
  personalInfo: PersonalInfo;
  vehicleInfo: VehicleInfo;
  coverageNeeds: CoverageNeeds;
}

export interface InsurerOffer {
  id: string;
  insurerId: string;
  insurerName: string;
  insurerLogo: string | null;
  insurerRating: number;
  name: string;
  coverageType: string;
  description: string | null;
  monthlyPrice: number;
  annualPrice: number;
  deductible: number;
  maxCoverage: number;
  features: string[];
  conditions: string | null;
}

export interface QuoteRecord {
  id: string;
  reference: string;
  status: "pending" | "in_progress" | "approved" | "rejected";
  personalInfo: PersonalInfo;
  vehicleInfo: VehicleInfo;
  coverageNeeds: CoverageNeeds;
  proposedPrice: number;
  finalPrice: number | null;
  insurerName: string;
  offerName: string;
  createdAt: string;
}

export type SortOption = "price_asc" | "price_desc" | "rating_desc" | "name_asc";