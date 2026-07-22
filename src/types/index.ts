export type AppView =
  | "landing"
  | "offers"
  | "compare"
  | "results"
  | "about"
  | "contact"
  | "faq"
  | "mentions-legales"
  | "admin"
  | "user-dashboard"
  | "insurer-dashboard"
  | "login"
  | "register"
  | "forgot";

export type AuthModal = "none" | "login" | "register" | "forgot";

export interface PersonalInfo {
  lastName: string;
  firstName: string;
  email: string;
  phone: string;
  whatsappOptIn: boolean;
}

export interface VehicleInfo {
  fuelType: string;
  fiscalPower: string;
  seats: string;
  year: string;
  newValue: string;
  currentValue: string;
  usage: string;
  effectiveDate: string;
}

export interface CoverageNeeds {
  contractType: string; // "basic" | "third_party_plus" | "all_risks"
  contractDuration: number; // 1, 3, 6, 9, or 12 months
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
  contractDuration: number;
  deductible: number;
  maxCoverage: number;
  features: string[];
  conditions: string | null;
  matchedGuarantees?: string[];
  guaranteeDescriptions?: Record<string, string>;
  relevanceScore?: number;
  matchReasons?: string[];
  pricingBreakdown?: PricingBreakdown[];
}

export interface PricingBreakdown {
  guaranteeName: string;
  guaranteeCode: string;
  categoryCode?: string;
  categoryName?: string;
  amount: number;
  coverageCapital?: number;
  method: string;
  breakdown: string;
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