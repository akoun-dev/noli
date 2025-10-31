export type GuaranteeCategory = 'auto' | 'moto' | 'habitation' | 'sante' | 'voyage';

export type PricingType = 'fixed' | 'percent';

export interface GuaranteePricing {
  type: PricingType; // 'fixed' amount in FCFA or 'percent' of base price
  value: number; // e.g., 15000 for fixed or 10 for 10%
  minImpact?: number; // optional minimum added amount
  maxImpact?: number; // optional maximum added amount
}

export interface Guarantee {
  id: string;
  name: string;
  code: string;
  description?: string;
  category: GuaranteeCategory;
  pricing: GuaranteePricing;
  required?: boolean;
  status: 'active' | 'inactive';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PriceAdjustment {
  guaranteeId: string;
  label: string;
  type: PricingType;
  value: number;
  amount: number; // computed amount in FCFA
}

export interface PriceCalculation {
  base: number;
  adjustments: PriceAdjustment[];
  total: number;
}

