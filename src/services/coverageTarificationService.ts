import { supabase } from '@/lib/supabase';

// Types for the coverage-based tarification system
export type CoverageType =
  | 'RC'
  | 'RECOURS_TIERS_INCENDIE'
  | 'DEFENSE_RECOURS'
  | 'IPT'
  | 'AVANCE_RECOURS'
  | 'INCENDIE'
  | 'VOL'
  | 'VOL_MAINS_ARMEES'
  | 'VOL_ACCESSOIRES'
  | 'BRIS_GLACES'
  | 'BRIS_GLACES_TOITS'
  | 'TIERCE_COMPLETE'
  | 'TIERCE_COMPLETE_PLAFONNEE'
  | 'TIERCE_COLLISION'
  | 'TIERCE_COLLISION_PLAFONNEE'
  | 'ASSISTANCE_AUTO'
  | 'PACK_ASSISTANCE';

export type CalculationType =
  | 'FIXED_AMOUNT'
  | 'PERCENTAGE_SI'
  | 'PERCENTAGE_VN'
  | 'MTPL_TARIFF'
  | 'FORMULA_BASED'
  | 'FREE';

export interface Coverage {
  id: string;
  type: CoverageType;
  name: string;
  description: string;
  calculation_type: CalculationType;
  is_mandatory: boolean;
  is_active: boolean;
  display_order: number;
}

export interface CoverageTariffRule {
  id: string;
  coverage_id: string;
  vehicle_category?: string;
  min_vehicle_value?: number;
  max_vehicle_value?: number;
  min_fiscal_power?: number;
  max_fiscal_power?: number;
  fuel_type?: string;
  formula_name?: string;
  base_rate?: number;
  fixed_amount?: number;
  min_amount?: number;
  max_amount?: number;
  conditions: Record<string, any>;
  is_active: boolean;
}

export interface VehicleData {
  sum_insured?: number; // Capital assuré (SI)
  new_value?: number; // Valeur à neuf (VN)
  fiscal_power?: number;
  fuel_type?: string;
  category?: string; // 401, 402, etc.
  formula_name?: string;
}

export interface QuoteCoveragePremium {
  id: string;
  quote_id: string;
  coverage_id: string;
  tariff_rule_id?: string;
  calculation_parameters: Record<string, any>;
  premium_amount: number;
  is_included: boolean;
}

export interface CoverageOption {
  coverage_id: string;
  coverage_type: CoverageType;
  name: string;
  description: string;
  calculation_type: CalculationType;
  is_mandatory: boolean;
  estimated_min_premium?: number;
  estimated_max_premium?: number;
  available_formulas?: string[];
}

class CoverageTarificationService {
  // Get all available coverages for a vehicle category
  async getAvailableCoverages(vehicleCategory: string = '401'): Promise<CoverageOption[]> {
    try {
      const { data, error } = await supabase.rpc('get_available_coverages', {
        p_vehicle_category: vehicleCategory
      }) as { data: CoverageOption[] | null, error: any };

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching available coverages:', error);
      throw error;
    }
  }

  // Calculate premium for a specific coverage
  async calculateCoveragePremium(
    coverageId: string,
    vehicleData: VehicleData,
    quoteData: Record<string, any> = {}
  ): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('calculate_coverage_premium', {
        p_coverage_id: coverageId,
        p_vehicle_data: vehicleData,
        p_quote_data: quoteData
      }) as { data: number | null, error: any };

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error calculating coverage premium:', error);
      throw error;
    }
  }

  // Add coverage to quote
  async addCoverageToQuote(
    quoteId: string,
    coverageId: string,
    calculationParameters: Record<string, any> = {},
    isIncluded: boolean = false
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('add_coverage_to_quote', {
        p_quote_id: quoteId,
        p_coverage_id: coverageId,
        p_calculation_parameters: calculationParameters,
        p_is_included: isIncluded
      }) as { data: string, error: any };

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding coverage to quote:', error);
      throw error;
    }
  }

  // Update quote coverage premiums
  async updateQuoteCoveragePremiums(quoteId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_quote_coverage_premiums', {
        p_quote_id: quoteId
      }) as { error: any };

      if (error) throw error;
    } catch (error) {
      console.error('Error updating quote coverage premiums:', error);
      throw error;
    }
  }

  // Calculate total premium for a quote
  async calculateQuoteTotalPremium(quoteId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('calculate_quote_total_premium', {
        p_quote_id: quoteId
      }) as { data: number | null, error: any };

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error calculating quote total premium:', error);
      throw error;
    }
  }

  // Get quote coverage premiums
  async getQuoteCoveragePremiums(quoteId: string): Promise<QuoteCoveragePremium[]> {
    try {
      const { data, error } = await supabase
        .from('quote_coverage_premiums')
        .select(`
          *,
          coverage:coverages(
            id,
            type,
            name,
            description,
            calculation_type,
            is_mandatory
          )
        `)
        .eq('quote_id', quoteId)
        .order('is_included', { ascending: false })
        .order('premium_amount', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching quote coverage premiums:', error);
      throw error;
    }
  }

  // Update coverage inclusion status
  async updateCoverageInclusion(
    premiumId: string,
    isIncluded: boolean,
    calculationParameters?: Record<string, any>
  ): Promise<void> {
    try {
      // Construction manuelle de la requête SQL pour éviter les problèmes de typage
      const updateData: any = {
        is_included: isIncluded,
        updated_at: new Date().toISOString()
      };

      if (calculationParameters) {
        updateData.calculation_parameters = calculationParameters;
      }

      // Utilisation de l'API brute de Supabase
      const supabaseClient = supabase as any;
      const { error } = await supabaseClient
        .from('quote_coverage_premiums')
        .update(updateData)
        .eq('id', premiumId);

      if (error) throw error;

      // Recalculate premium if parameters changed
      if (calculationParameters) {
        const premium = await supabase
          .from('quote_coverage_premiums')
          .select('quote_id')
          .eq('id', premiumId)
          .single() as { data: { quote_id: string } | null, error: any };

        if (premium.data) {
          await this.updateQuoteCoveragePremiums(premium.data.quote_id);
        }
      }
    } catch (error) {
      console.error('Error updating coverage inclusion:', error);
      throw error;
    }
  }

  // Remove coverage from quote
  async removeCoverageFromQuote(premiumId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('quote_coverage_premiums')
        .delete()
        .eq('id', premiumId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing coverage from quote:', error);
      throw error;
    }
  }

  // Get coverage details
  async getCoverage(coverageId: string): Promise<Coverage | null> {
    try {
      const { data, error } = await supabase
        .from('coverages')
        .select('*')
        .eq('id', coverageId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching coverage:', error);
      throw error;
    }
  }

  // Get available formulas for a coverage
  async getCoverageFormulas(coverageId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('coverage_tariff_rules')
        .select('formula_name')
        .eq('coverage_id', coverageId)
        .eq('is_active', true)
        .not('formula_name', 'is', null);

      if (error) throw error;
      
      const formulas = (data as any[])?.map(rule => rule.formula_name).filter((formula): formula is string => Boolean(formula)) || [];
      return [...new Set(formulas)];
    } catch (error) {
      console.error('Error fetching coverage formulas:', error);
      throw error;
    }
  }

  // Helper method to calculate comprehensive quote premium
  async calculateComprehensivePremium(
    quoteId: string,
    vehicleData: VehicleData,
    selectedCoverages: Array<{
      coverageId: string;
      isIncluded: boolean;
      formulaName?: string;
      customParameters?: Record<string, any>;
    }>
  ): Promise<{
    totalPremium: number;
    coveragePremiums: QuoteCoveragePremium[];
    breakdown: Record<string, number>;
  }> {
    try {
      // First, ensure all coverages are added to the quote
      for (const coverage of selectedCoverages) {
        const calculationParameters = {
          ...vehicleData,
          ...(coverage.formulaName && { formula_name: coverage.formulaName }),
          ...(coverage.customParameters || {})
        };

        await this.addCoverageToQuote(
          quoteId,
          coverage.coverageId,
          calculationParameters,
          coverage.isIncluded
        );
      }

      // Update all premiums
      await this.updateQuoteCoveragePremiums(quoteId);

      // Get the updated premiums
      const coveragePremiums = await this.getQuoteCoveragePremiums(quoteId);

      // Calculate totals and breakdown
      const totalPremium = coveragePremiums
        .filter(cp => cp.is_included)
        .reduce((sum, cp) => sum + cp.premium_amount, 0);

      const breakdown: Record<string, number> = {};
      coveragePremiums
        .filter(cp => cp.is_included)
        .forEach(cp => {
          breakdown[cp.coverage_id] = cp.premium_amount;
        });

      return {
        totalPremium,
        coveragePremiums,
        breakdown
      };
    } catch (error) {
      console.error('Error calculating comprehensive premium:', error);
      throw error;
    }
  }

  // Validate vehicle data for premium calculation
  validateVehicleData(vehicleData: VehicleData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields for most calculations
    if (!vehicleData.fiscal_power || vehicleData.fiscal_power < 1) {
      errors.push('Puissance fiscale requise');
    }

    if (!vehicleData.fuel_type) {
      warnings.push('Type de carburant non spécifié, utilise: "essence" par défaut');
    }

    if (!vehicleData.category) {
      warnings.push('Catégorie de véhicule non spécifiée, utilise: "401" par défaut');
    }

    // Value-specific validations
    const coveragesNeedingSI = ['INCENDIE', 'VOL', 'VOL_MAINS_ARMEES'];
    const coveragesNeedingVN = ['BRIS_GLACES', 'BRIS_GLACES_TOITS', 'TIERCE_COMPLETE', 'TIERCE_COLLISION'];

    if (!vehicleData.sum_insured || vehicleData.sum_insured <= 0) {
      warnings.push('Valeur du véhicule (SI) non spécifiée, requise pour: Incendie, Vol');
    }

    if (!vehicleData.new_value || vehicleData.new_value <= 0) {
      warnings.push('Valeur à neuf (VN) non spécifiée, requise pour: Bris de glaces, Tierce');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export const coverageTarificationService = new CoverageTarificationService();
export default coverageTarificationService;