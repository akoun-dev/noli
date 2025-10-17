/**
 * Types spécifiques pour l'assurance et les offres
 */

export interface ParsedOffer {
  name: string;
  type: string;
  price: number;
  coverage: string;
  description: string;
  deductible?: number;
  maxCoverage?: number;
  duration?: number;
  features?: string;
  conditions?: string;
}

export interface CSVRowData {
  [key: string]: string | undefined;
}

export interface InsuranceOfferFormData {
  name: string;
  type: 'Tiers Simple' | 'Tiers +' | 'Tous Risques';
  price: number;
  coverage: string;
  description: string;
  deductible?: number;
  maxCoverage?: number;
  duration?: number;
  features?: string;
  conditions?: string;
}