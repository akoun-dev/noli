import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type {
  FireTheftConfig,
  CalculationMethodType,
  ICFormulaConfig,
  ICIPTConfig,
  IPTFormulaConfig,
  IPTConfig,
  MTPLTariffConfig
} from '@/types/tarification';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Client public pour les requêtes sans authentification
const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Essayer avec le client supabase-public.ts qui utilise fetch natif
import { supabasePublic as supabasePublicFetch } from '@/lib/supabase-public';

const isJwtToken = (token?: string | null): boolean =>
  typeof token === 'string' && token.split('.').length >= 3;

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
  seats?: number;
  passenger_seats?: number;
  nb_places?: number;
}

export interface QuoteCoverage {
  id: string;
  quote_id: string;
  coverage_id: string;
  tariff_rule_id?: string | null;
  calculation_parameters: Record<string, any>;
  premium_amount: number;
  is_included: boolean;
  is_mandatory: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: string | null;
}

export interface MatrixBasedFormula {
  formula: number;
  label: string;
  capitalDeces: number;
  capitalInvalidite: number;
  fraisMedicaux: number;
  prime: number;
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
  fixed_price?: number;
  available_formulas?: string[];
  matrixBasedFormulas?: MatrixBasedFormula[];
  calculationMethod?: string;
}

interface VariableBasedFallbackConfig {
  variableSource: 'VENAL_VALUE' | 'NEW_VALUE' | 'FISCAL_POWER';
  ratePercent?: number;
  rateBelowThresholdPercent?: number;
  rateAboveThresholdPercent?: number;
  newValueThreshold?: number;
  conditionedByNewValue?: boolean;
  minAmount?: number;
  maxAmount?: number;
}

const VARIABLE_BASED_FALLBACK_CONFIG: Record<string, VariableBasedFallbackConfig> = {
  GAR_6651C5C1: {
    variableSource: 'VENAL_VALUE',
    ratePercent: 0.42,
  },
  GAR_670DF3E6: {
    variableSource: 'VENAL_VALUE',
    ratePercent: 0.42,
  },
  GAR_FDE90A48: {
    variableSource: 'VENAL_VALUE',
    conditionedByNewValue: true,
    newValueThreshold: 25_000_000,
    rateBelowThresholdPercent: 1.6,
    rateAboveThresholdPercent: 2.2,
  },
  GAR_40D4F9A5: {
    variableSource: 'VENAL_VALUE',
    conditionedByNewValue: true,
    newValueThreshold: 25_000_000,
    ratePercent: 0,
    rateBelowThresholdPercent: 1.1,
    rateAboveThresholdPercent: 2.1,
  },
  GAR_9A400D6A: {
    variableSource: 'NEW_VALUE',
    ratePercent: 0.4,
  },
  GAR_EA43E7EB: {
    variableSource: 'NEW_VALUE',
    ratePercent: 0.42,
  },
};
class CoverageTarificationService {
  private coverageMetadataCache = new Map<string, { metadata?: Record<string, any>; type?: string }>();
  private readonly hasJwtAnonKey = isJwtToken(supabaseAnonKey);
  private coverageTariffRulesCache = new Map<string, CoverageTariffRule[]>();

  // Méthode pour vider le cache des métadonnées de couverture
  clearCoverageCache(): void {
    this.coverageMetadataCache.clear();
  }

  private async canInvokeProtectedRpc(): Promise<boolean> {
    if (this.hasJwtAnonKey) {
      return true;
    }

    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      return isJwtToken(accessToken);
    } catch (error) {
      logger.warn('coverageTarificationService: unable to fetch auth session', error);
      return false;
    }
  }

  private parseNumber(value: any): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private parseBoolean(value: any): boolean | null {
    if (value === true || value === 'true' || value === '1' || value === 1) {
      return true;
    }
    if (
      value === false ||
      value === 'false' ||
      value === '0' ||
      value === 0 ||
      value === undefined ||
      value === null
    ) {
      return false;
    }
    return null;
  }

  private extractMatrixBasedFormulas(metadata: Record<string, any> | undefined): { formulas: MatrixBasedFormula[]; calculationMethod?: string } {
    if (!metadata || typeof metadata !== 'object') {
      return { formulas: [] };
    }

    const params = (metadata.parameters ?? {}) as Record<string, any>;
    const matrixBased = params.matrixBased ?? metadata;

    if (!matrixBased || typeof matrixBased !== 'object') {
      return { formulas: [], calculationMethod: metadata.calculationMethod as string | undefined };
    }

    const dimension = matrixBased.dimension as string;
    if (dimension !== 'FORMULA') {
      return { formulas: [], calculationMethod: metadata.calculationMethod as string | undefined };
    }

    const formulasRaw = matrixBased.formulas ?? matrixBased.formulas;
    if (!Array.isArray(formulasRaw) || formulasRaw.length === 0) {
      return { formulas: [], calculationMethod: metadata.calculationMethod as string | undefined };
    }

    const formulas: MatrixBasedFormula[] = formulasRaw
      .map((f: any) => {
        const formulaNum = this.parseNumber(f.formula);
        if (formulaNum === null) return null;

        return {
          formula: formulaNum,
          label: f.label || `Formule ${formulaNum}`,
          capitalDeces: this.parseNumber(f.capitalDeces) ?? 0,
          capitalInvalidite: this.parseNumber(f.capitalInvalidite) ?? 0,
          fraisMedicaux: this.parseNumber(f.fraisMedicaux) ?? 0,
          prime: this.parseNumber(f.prime) ?? 0,
        };
      })
      .filter((f): f is MatrixBasedFormula => f !== null)
      .sort((a, b) => a.formula - b.formula);

    return { formulas, calculationMethod: metadata.calculationMethod as string | undefined };
  }

  private async getCoverageDetailsWithMetadata(coverageId: string): Promise<{ metadata?: Record<string, any>; type?: string } | null> {
    if (this.coverageMetadataCache.has(coverageId)) {
      return this.coverageMetadataCache.get(coverageId)!;
    }

    const buildEntry = (metadata: Record<string, any> | undefined, calculationType?: string | null, coverageType?: string | null) => {
      const normalized = metadata ? { ...metadata } : {};
      // Priorité: calculation_type de la base de données > metadata.calculationMethod
      if (calculationType) {
        normalized.calculationMethod = calculationType;
      }
      const entry = {
        metadata: Object.keys(normalized).length > 0 ? normalized : undefined,
        type: coverageType
      };
      this.coverageMetadataCache.set(coverageId, entry);
      return entry;
    };

    const fetchWithSupabase = async () => {
      const { data, error } = await supabase
        .from('coverages')
        .select('id, type, metadata, calculation_type')
        .eq('id', coverageId)
        .single();

      if (error) {
        throw error;
      }

      return buildEntry(
        (data?.metadata as Record<string, any> | undefined) ?? undefined,
        (data as any)?.calculation_type,
        (data as any)?.type
      );
    };

    const fetchWithPublicClient = async () => {
      const { data, error } = await supabasePublicFetch
        .from<{ id: string; type?: string; metadata?: Record<string, any>; calculation_type?: string | null }>('coverages')
        .select('id, type, metadata, calculation_type')
        .eq('id', coverageId)
        .single();

      if (error || !data) {
        throw error || new Error('Coverage not found');
      }

      return buildEntry(data.metadata, data.calculation_type ?? null, data.type ?? null);
    };

    const canUseAuthClient = await this.canInvokeProtectedRpc();

    if (canUseAuthClient) {
      try {
        return await fetchWithSupabase();
      } catch (error) {
        logger.warn('getCoverageDetailsWithMetadata: unable to fetch via auth client', error);
      }
    }

    try {
      return await fetchWithPublicClient();
    } catch (fallbackError) {
      logger.warn('getCoverageDetailsWithMetadata: unable to fetch via public client', fallbackError);
      return null;
    }
  }

  private calculateFireTheftPremium(config: FireTheftConfig, vehicleData: VehicleData): number {
    const venal =
      this.parseNumber(vehicleData.sum_insured) ??
      this.parseNumber((vehicleData as any).vehicle_value) ??
      this.parseNumber(vehicleData.new_value) ??
      0;

    if (!venal || venal <= 0) {
      return 0;
    }

    const threshold = this.parseNumber(config.sumInsuredThreshold) ?? 25_000_000;
    const fireRate = (this.parseNumber(config.fireRatePercent) ?? 0) / 100;
    const theftRateLow = (this.parseNumber(config.theftRateBelowThresholdPercent) ?? 0) / 100;
    const theftRateHigh = (this.parseNumber(config.theftRateAboveThresholdPercent) ?? 0) / 100;
    const armedRateLow = (this.parseNumber(config.armedTheftRateBelowThresholdPercent) ?? 0) / 100;
    const armedRateHigh = (this.parseNumber(config.armedTheftRateAboveThresholdPercent) ?? 0) / 100;
    const includeFire = config.includeFireComponent !== false;
    const includeBase = config.includeBaseTheftComponent !== false;
    const includeArmed = !!config.includeArmedTheftComponent;

    const baseRate = venal <= threshold ? theftRateLow : theftRateHigh;
    const armedRate = venal <= threshold ? armedRateLow : armedRateHigh;

    let totalRate = 0;
    if (includeFire && fireRate > 0) totalRate += fireRate;
    if (includeBase && baseRate > 0) totalRate += baseRate;
    if (includeArmed && armedRate > 0) totalRate += armedRate;

    const premium = venal * totalRate;
    return premium > 0 ? premium : 0;
  }

  private calculateGlassRoofPremium(config: { ratePercent?: number }, vehicleData: VehicleData): number {
    const newValue =
      this.parseNumber(vehicleData.new_value) ??
      this.parseNumber(vehicleData.sum_insured) ??
      this.parseNumber((vehicleData as any).vehicle_value) ??
      0;

    if (!newValue || newValue <= 0) {
      return 0;
    }

    const rate = (this.parseNumber(config.ratePercent) ?? 0) / 100;
    if (rate <= 0) return 0;
    return newValue * rate;
  }

  private calculateGlassStandardPremium(config: { ratePercent?: number }, vehicleData: VehicleData): number {
    const newValue =
      this.parseNumber(vehicleData.new_value) ??
      this.parseNumber(vehicleData.sum_insured) ??
      this.parseNumber((vehicleData as any).vehicle_value) ??
      0;

    if (!newValue || newValue <= 0) {
      return 0;
    }

    const rate = (this.parseNumber(config.ratePercent) ?? 0) / 100;
    if (rate <= 0) return 0;
    return newValue * rate;
  }

  private calculateTierceCapPremium(config: any, vehicleData: VehicleData): number {
    const newValue =
      this.parseNumber(vehicleData.new_value) ??
      this.parseNumber(vehicleData.sum_insured) ??
      this.parseNumber((vehicleData as any).vehicle_value) ??
      0;

    if (!newValue || newValue <= 0 || !config) {
      return 0;
    }

    const options = Array.isArray(config.options) ? config.options : [];
    const selected =
      options.find((opt: any) => opt.type === config.selectedOption) ||
      options.find((opt: any) => opt.type === 'NONE');
    if (!selected) return 0;

    const rate = (this.parseNumber(selected.ratePercent) ?? 0) / 100;
    const deduction = (this.parseNumber(selected.deductionPercent) ?? 0) / 100;
    const amount = newValue * rate * (1 - deduction);
    return amount > 0 ? amount : 0;
  }

  private calculateMTPLTariffPremium(vehicleData: VehicleData, customTarifs?: MTPLTariffConfig): number {
    console.log('🔥 [calculateMTPLTariffPremium] === START ===', {
      vehicleData,
      hasCustomTarifs: !!customTarifs,
    })

    const fiscalPower = this.parseNumber(vehicleData.fiscal_power) ?? 0;
    const energy = (vehicleData.fuel_type ?? '').toLowerCase();

    console.log('🔥 [calculateMTPLTariffPremium] Parsed values:', {
      fiscalPower,
      energy,
    })

    if (!fiscalPower || fiscalPower <= 0 || !energy) {
      console.warn('⚠️ [calculateMTPLTariffPremium] Missing required data, returning 0')
      return 0;
    }

    const defaultTarifs: MTPLTariffConfig = {
      essence_1_2: 68675,
      essence_3_6: 87885,
      essence_7_9: 102345,
      essence_10_11: 124693,
      essence_12_plus: 137058,
      diesel_1: 68675,
      diesel_2_4: 87885,
      diesel_5_6: 102345,
      diesel_7_8: 124693,
      diesel_9_plus: 137058,
    };

    const mergedTarifs: MTPLTariffConfig = { ...defaultTarifs };
    if (customTarifs && typeof customTarifs === 'object') {
      for (const [key, value] of Object.entries(customTarifs)) {
        const parsed = this.parseNumber(value);
        if (parsed !== null) {
          mergedTarifs[key] = parsed;
        }
      }
    }

    const determineKey = (): string => {
      if (energy.includes('essence')) {
        if (fiscalPower >= 1 && fiscalPower <= 2) return 'essence_1_2';
        if (fiscalPower >= 3 && fiscalPower <= 6) return 'essence_3_6';
        if (fiscalPower >= 7 && fiscalPower <= 9) return 'essence_7_9';
        if (fiscalPower >= 10 && fiscalPower <= 11) return 'essence_10_11';
        if (fiscalPower >= 12) return 'essence_12_plus';
      }

      if (energy.includes('diesel')) {
        if (fiscalPower === 1) return 'diesel_1';
        if (fiscalPower >= 2 && fiscalPower <= 4) return 'diesel_2_4';
        if (fiscalPower >= 5 && fiscalPower <= 6) return 'diesel_5_6';
        if (fiscalPower >= 7 && fiscalPower <= 8) return 'diesel_7_8';
        if (fiscalPower >= 9) return 'diesel_9_plus';
      }

      return '';
    };

    const key = determineKey();

    console.log('🔥 [calculateMTPLTariffPremium] Determined tariff key:', key, {
      fiscalPower,
      energy,
      customTarifs,
      mergedTarifs,
    })

    if (!key) {
      console.warn('⚠️ [calculateMTPLTariffPremium] Could not determine tariff key, returning 0')
      return 0;
    }

    const amount = mergedTarifs[key];
    const result = typeof amount === 'number' && amount > 0 ? amount : 0;

    console.log('🔥 [calculateMTPLTariffPremium] Final calculation result:', {
      key,
      amount,
      result,
    })

    return result;
  }

  private calculateICFormulaPremium(config?: ICIPTConfig, vehicleData?: VehicleData): number {
    const defaultFormulas: ICFormulaConfig[] = [
      {
        formula: 1,
        capitalDeces: 1000000,
        capitalInvalidite: 2000000,
        fraisMedicaux: 100000,
        prime: 5500,
        label: 'Formule 1',
      },
      {
        formula: 2,
        capitalDeces: 3000000,
        capitalInvalidite: 6000000,
        fraisMedicaux: 400000,
        prime: 8400,
        label: 'Formule 2',
      },
      {
        formula: 3,
        capitalDeces: 5000000,
        capitalInvalidite: 10000000,
        fraisMedicaux: 500000,
        prime: 15900,
        label: 'Formule 3',
      },
    ];

    const resolvedConfig: ICIPTConfig = config ?? { defaultFormula: 1, formulas: defaultFormulas };
    const formulas =
      resolvedConfig.formulas && resolvedConfig.formulas.length > 0 ? resolvedConfig.formulas : defaultFormulas;

    const selectedFormula = this.parseFormulaSelection(
      vehicleData?.formula_name,
      resolvedConfig.defaultFormula ?? 1
    );
    const formula = formulas.find(f => f.formula === selectedFormula) ?? formulas[0];
    return formula?.prime ?? 0;
  }

  private calculateIPTPlacesPremium(vehicleData: VehicleData, config?: IPTConfig): number {
    console.log('[calculateIPTPlacesPremium] === START ===', {
      vehicleData,
      hasConfig: !!config,
      configDefaultFormula: config?.defaultFormula,
      configFormulasCount: config?.formulas?.length
    });

    const defaultFormulas: IPTFormulaConfig[] = [
      {
        formula: 1,
        capitalDeces: 1000000,
        capitalInvalidite: 2000000,
        fraisMedicaux: 100000,
        prime: 0,
        label: 'Formule 1',
        placesTariffs: [
          { places: 3, prime: 8400, label: '3 places' },
          { places: 4, prime: 10200, label: '4 places' },
          { places: 5, prime: 16000, label: '5 places' },
          { places: 6, prime: 17800, label: '6 places' },
          { places: 7, prime: 19600, label: '7 places' },
          { places: 8, prime: 25400, label: '8 places' },
        ],
      },
      {
        formula: 2,
        capitalDeces: 3000000,
        capitalInvalidite: 6000000,
        fraisMedicaux: 400000,
        prime: 0,
        label: 'Formule 2',
        placesTariffs: [
          { places: 3, prime: 10000, label: '3 places' },
          { places: 4, prime: 11000, label: '4 places' },
          { places: 5, prime: 17000, label: '5 places' },
          { places: 6, prime: 18000, label: '6 places' },
          { places: 7, prime: 27000, label: '7 places' },
          { places: 8, prime: 32000, label: '8 places' },
        ],
      },
      {
        formula: 3,
        capitalDeces: 5000000,
        capitalInvalidite: 10000000,
        fraisMedicaux: 500000,
        prime: 0,
        label: 'Formule 3',
        placesTariffs: [
          { places: 3, prime: 18000, label: '3 places' },
          { places: 4, prime: 16000, label: '4 places' },
          { places: 5, prime: 30600, label: '5 places' },
          { places: 6, prime: 32000, label: '6 places' },
          { places: 7, prime: 33000, label: '7 places' },
          { places: 8, prime: 35000, label: '8 places' },
        ],
      },
    ];

    const resolvedConfig: IPTConfig = config ?? { defaultFormula: 1, formulas: defaultFormulas };
    const formulas =
      resolvedConfig.formulas && resolvedConfig.formulas.length > 0 ? resolvedConfig.formulas : defaultFormulas;

    const normalizeFormulaNumber = (value: any, fallback: number) => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string') {
        const match = value.match(/\d+/);
        if (match) {
          const parsed = parseInt(match[0], 10);
          if (Number.isFinite(parsed)) {
            return parsed;
          }
        }
      }
      return fallback;
    };

    const parseTariffNumber = (value: any) => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string') {
        const cleaned = value.replace(/[^\d.-]/g, '');
        const parsed = parseFloat(cleaned);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    };

    const normalizePlacesTariffs = (tariffs: any[]) =>
      tariffs
        .map((tariff) => ({
          ...tariff,
          places: parseTariffNumber(tariff?.places),
          prime: parseTariffNumber(tariff?.prime),
        }))
        .filter((tariff) => tariff.places > 0 && tariff.prime >= 0)
        .sort((a, b) => a.places - b.places);

    const selectedFormula = this.parseFormulaSelection(
      vehicleData.formula_name,
      resolvedConfig.defaultFormula ?? 1
    );
    const normalizedFormulas = formulas.map((formula) => ({
      ...formula,
      formula: normalizeFormulaNumber((formula as any).formula, selectedFormula),
      placesTariffs: Array.isArray((formula as any).placesTariffs) ? (formula as any).placesTariffs : [],
    }));

    const formula = normalizedFormulas.find(f => f.formula === selectedFormula) ?? normalizedFormulas[0];
    if (!formula) {
      return 0;
    }

    const seats =
      this.parseNumber(vehicleData.seats) ??
      this.parseNumber(vehicleData.passenger_seats) ??
      this.parseNumber(vehicleData.nb_places) ??
      5;

    console.log('[calculateIPTPlacesPremium] Vehicle seats extraction:', {
      vehicleData_seats: vehicleData.seats,
      vehicleData_passenger_seats: vehicleData.passenger_seats,
      vehicleData_nb_places: vehicleData.nb_places,
      finalSeats: seats
    });

    const defaultTariffs = defaultFormulas.find(f => f.formula === selectedFormula)?.placesTariffs ?? [];
    const rawPlacesTariffs =
      (formula as IPTFormulaConfig).placesTariffs && (formula as IPTFormulaConfig).placesTariffs!.length > 0
        ? (formula as IPTFormulaConfig).placesTariffs!
        : defaultTariffs;
    const placesTariffs = normalizePlacesTariffs(rawPlacesTariffs);

    console.log('[calculateIPTPlacesPremium] Places tariffs:', {
      placesTariffs,
      count: placesTariffs.length
    });

    if (!placesTariffs.length) {
      console.log('[calculateIPTPlacesPremium] No placesTariffs found, returning 0');
      return 0;
    }

    const maxPlaces = placesTariffs[placesTariffs.length - 1]?.places ?? 0;
    if (maxPlaces > 0 && seats > maxPlaces) {
      console.log('[calculateIPTPlacesPremium] Vehicle seats above max supported:', { seats, maxPlaces });
      return 0;
    }

    const applicable =
      placesTariffs.find(tariff => seats <= tariff.places) ?? placesTariffs[placesTariffs.length - 1];

    console.log('[calculateIPTPlacesPremium] Final tariff lookup:', {
      vehicleSeats: seats,
      applicable,
      finalPrime: applicable?.prime
    });

    const result = applicable?.prime ?? 0;
    console.log('[calculateIPTPlacesPremium] === END ===', { result });
    return result;
  }

  private parseFormulaSelection(formulaName?: string | number | null, defaultFormula = 1): number {
    if (typeof formulaName === 'number' && Number.isFinite(formulaName)) {
      return formulaName;
    }

    if (typeof formulaName === 'string' && formulaName.trim().length > 0) {
      const raw = formulaName.trim();
      const numeric = /^-?\d+$/.test(raw)
        ? parseInt(raw, 10)
        : (() => {
            const match = raw.match(/\d+/);
            if (match) {
              return parseInt(match[0], 10);
            }
            return parseInt(raw.replace('formula_', ''), 10);
          })();
      if (!Number.isNaN(numeric)) {
        return numeric;
      }
    }

    return defaultFormula;
  }

  private calculateVariableBasedPremium(variableBasedConfig: any, vehicleData: VehicleData): number {
    if (!variableBasedConfig) return 0;

    const config = (variableBasedConfig as Record<string, any>);
    const variableSource = config.variableSource as string;

    // Déterminer la valeur de la variable source
    let variableValue = 0;

    switch (variableSource) {
      case 'VENAL_VALUE':
        variableValue = this.parseNumber(vehicleData.sum_insured) ?? 0;
        break;
      case 'NEW_VALUE':
        variableValue = this.parseNumber(vehicleData.new_value) ?? 0;
        break;
      case 'FISCAL_POWER':
        variableValue = this.parseNumber(vehicleData.fiscal_power) ?? 0;
        break;
    }

    if (variableValue <= 0) {
      return 0;
    }

    // Gestion du seuil (conditionné par la valeur neuve)
    let ratePercent = this.parseNumber(config.ratePercent);

    // Pour Vol et Vol à mains armées: les taux sont des pourcentages (1.1%, 2.1%, etc.)
    // TOUS les garanties VARIABLE_BASED utilisent des pourcentages (1.1%, 0.42%, etc.)
    // Division par 100 est TOUJOURS appliquée
    const isPercentageRate = this.parseBoolean(config.conditionedByNewValue) === true;

    if (isPercentageRate) {
      const threshold = this.parseNumber(config.newValueThreshold) ?? 25_000_000;
      const sumInsured = this.parseNumber(vehicleData.sum_insured) ?? vehicleData.new_value ?? 0;

      // SI <= 25M : rateBelow (1.1% pour Vol, 1.6% pour Vol à mains armées)
      // SI > 25M : rateAbove (2.1% pour Vol, 2.2% pour Vol à mains armées)
      // Pour Incendie: utilise aussi le taux conditionné (même si false) pour division par 100
      const belowRate = this.parseNumber(config.rateBelowThresholdPercent);
      const aboveRate = this.parseNumber(config.rateAboveThresholdPercent);

      if (sumInsured <= threshold) {
        ratePercent = belowRate ?? ratePercent;
      } else {
        ratePercent = aboveRate ?? ratePercent;
      }
    }

    // Calculer le montant - TOUJOURS division par 100
    let amount = 0;
    const resolvedRatePercent = this.parseNumber(ratePercent);
    if (resolvedRatePercent && resolvedRatePercent > 0) {
      amount = variableValue * (resolvedRatePercent / 100);
    }

    // Appliquer les min/max
    const minAmount = this.parseNumber(config.minAmount);
    const maxAmount = this.parseNumber(config.maxAmount);

    if (typeof minAmount === 'number' && amount < minAmount) {
      amount = minAmount;
    }
    if (typeof maxAmount === 'number' && amount > maxAmount) {
      amount = maxAmount;
    }

    return amount > 0 ? amount : 0;
  }

  private getVariableBasedFallbackConfig(coverageCode?: string, coverageId?: string): VariableBasedFallbackConfig | undefined {
    const normalizedCode = coverageCode?.toUpperCase?.()
    if (normalizedCode && VARIABLE_BASED_FALLBACK_CONFIG[normalizedCode]) {
      return VARIABLE_BASED_FALLBACK_CONFIG[normalizedCode]
    }
    if (coverageId && VARIABLE_BASED_FALLBACK_CONFIG[coverageId.toUpperCase()]) {
      return VARIABLE_BASED_FALLBACK_CONFIG[coverageId.toUpperCase()]
    }
    return undefined
  }

  private resolveVariableBasedConfig(
    metadata: Record<string, any> | undefined,
    coverageId?: string,
    coverageCode?: string
  ): Record<string, any> | undefined {
    const params = (metadata?.parameters ?? {}) as Record<string, any>
    if (params.variableBased) {
      return params.variableBased
    }
    if (metadata?.variableBased) {
      return metadata.variableBased
    }

    const fallback = this.getVariableBasedFallbackConfig(coverageCode, coverageId)
    if (fallback) {
      console.log('[coverageTarificationService] Using fallback variable config for', {
        coverageId,
        coverageCode,
        config: fallback,
      })
      return fallback
    }

    return undefined
  }

  private calculateMatrixBasedPremium(matrixBasedConfig: any, vehicleData: VehicleData): number {
    if (!matrixBasedConfig) return 0;

    const config = (matrixBasedConfig as Record<string, any>);
    const dimension = config.dimension as string;
    const tariffs = config.tariffs as any[];

    console.log('[calculateMatrixBasedPremium] Config:', {
      dimension,
      hasTariffs: Array.isArray(tariffs),
      tariffsCount: tariffs?.length,
      hasFormulas: Array.isArray(config.formulas),
      formulasCount: config.formulas?.length,
      configKeys: Object.keys(config),
      vehicleData: {
        formula_name: vehicleData.formula_name,
        fiscal_power: vehicleData.fiscal_power,
        fuel_type: vehicleData.fuel_type,
        category: vehicleData.category
      }
    });

    // Extraire les valeurs du véhicule
    const fiscalPower = this.parseNumber(vehicleData.fiscal_power) ?? 0;
    const fuelType = (vehicleData.fuel_type ?? '').toLowerCase();
    const categoryCode = vehicleData.category ?? '401';
    const seats = this.parseNumber(vehicleData.seats) ?? this.parseNumber(vehicleData.passenger_seats) ?? this.parseNumber(vehicleData.nb_places) ?? 5;
    const formula = this.parseFormulaSelection(vehicleData.formula_name, 1);

    console.log('[calculateMatrixBasedPremium] Extracted values:', { fiscalPower, fuelType, categoryCode, seats, formula });

    // Rechercher le tarif applicable selon la dimension
    let matchedPrime: number | null = null;

    switch (dimension) {
      case 'FISCAL_POWER':
        if (!Array.isArray(tariffs) || tariffs.length === 0) {
          matchedPrime = this.parseNumber(config.defaultPrime) ?? null;
          break;
        }
        matchedPrime = tariffs.find((tariff: any) => {
          const min = this.parseNumber(tariff.fiscalPowerMin) ?? 0;
          const max = this.parseNumber(tariff.fiscalPowerMax) ?? 999;
          const powerMatches = fiscalPower >= min && fiscalPower <= max;
          // Vérifier aussi le type de carburant si présent dans le tarif
          const tariffFuel = tariff.fuelType?.toLowerCase() ?? '';
          const fuelMatches = !tariffFuel || tariffFuel === fuelType;
          return powerMatches && fuelMatches;
        })?.prime ?? null;
        break;

      case 'FUEL_TYPE':
        if (!Array.isArray(tariffs) || tariffs.length === 0) {
          matchedPrime = this.parseNumber(config.defaultPrime) ?? null;
          break;
        }
        matchedPrime = tariffs.find((tariff: any) => {
          const tariffFuel = tariff.fuelType?.toLowerCase() ?? '';
          return tariffFuel === fuelType;
        })?.prime ?? null;
        break;

      case 'VEHICLE_CATEGORY':
        if (!Array.isArray(tariffs) || tariffs.length === 0) {
          matchedPrime = this.parseNumber(config.defaultPrime) ?? null;
          break;
        }
        matchedPrime = tariffs.find((tariff: any) => {
          return tariff.vehicleCategory === categoryCode;
        })?.prime ?? null;
        break;

      case 'SEATS':
        if (!Array.isArray(tariffs) || tariffs.length === 0) {
          matchedPrime = this.parseNumber(config.defaultPrime) ?? null;
          break;
        }
        matchedPrime = tariffs.find((tariff: any) => {
          const tariffSeats = this.parseNumber(tariff.seats);
          return tariffSeats === seats;
        })?.prime ?? null;
        break;

      case 'FISCAL_POWER_FUEL':
        // Pour les tarifs RC : combine puissance fiscale et type de carburant
        console.log('[calculateMatrixBasedPremium] === FISCAL_POWER_FUEL CASE START ===', {
          fiscalPower,
          fuelType,
        });
        if (!Array.isArray(tariffs) || tariffs.length === 0) {
          matchedPrime = this.parseNumber(config.defaultPrime) ?? null;
          break;
        }
        matchedPrime = tariffs.find((tariff: any) => {
          const min = this.parseNumber(tariff.fiscalPowerMin) ?? 0;
          const max = this.parseNumber(tariff.fiscalPowerMax) ?? 999;
          const tariffFuel = tariff.fuelType?.toLowerCase() ?? '';
          const powerMatches = fiscalPower >= min && fiscalPower <= max;
          const fuelMatches = tariffFuel === fuelType;
          console.log('[calculateMatrixBasedPremium] Checking FISCAL_POWER_FUEL:', {
            tariffMin: min,
            tariffMax: max,
            tariffFuel,
            powerMatches,
            fuelMatches,
            bothMatch: powerMatches && fuelMatches,
          });
          return powerMatches && fuelMatches;
        })?.prime ?? null;
        console.log('[calculateMatrixBasedPremium] FISCAL_POWER_FUEL result:', matchedPrime);
        break;

      case 'FORMULA':
        console.log('[calculateMatrixBasedPremium] === FORMULA CASE START ===', {
          formula,
          seats,
          hasConfigFormulas: !!config.formulas,
          formulasCount: config.formulas?.length,
          hasConfigTariffs: !!config.tariffs,
          hasDefaultPrime: !!config.defaultPrime
        });
        // For FORMULA dimension, formulas are in config.formulas array
        const formulas = config.formulas as any[];
        console.log('[calculateMatrixBasedPremium] formulas array:', formulas);
        if (Array.isArray(formulas) && formulas.length > 0) {
          const matchedFormula = formulas.find((f: any) => {
            const formulaNum = this.parseNumber(f.formula);
            console.log('[calculateMatrixBasedPremium] Checking formula:', { formulaNum, target: formula, match: formulaNum === formula });
            return formulaNum === formula;
          });
          console.log('[calculateMatrixBasedPremium] matchedFormula:', matchedFormula);
          if (matchedFormula) {
            // VÉRIFIER si on doit utiliser placesTariffs au lieu de prime directe
            const hasPlacesTariffs = matchedFormula.placesTariffs && Array.isArray(matchedFormula.placesTariffs) && matchedFormula.placesTariffs.length > 0;
            const usePlaces = matchedFormula.usePlaces === true;
            console.log('[calculateMatrixBasedPremium] Formula check:', {
              hasPlacesTariffs,
              usePlaces,
              placesTariffsCount: matchedFormula.placesTariffs?.length
            });

            if (hasPlacesTariffs && usePlaces) {
              // Utiliser placesTariffs pour trouver le tarif selon le nombre de places
              const placesTariffs = matchedFormula.placesTariffs;
              const applicableTariff = placesTariffs.find((pt: any) => pt.places >= seats) || placesTariffs[placesTariffs.length - 1];
              matchedPrime = this.parseNumber(applicableTariff?.prime ?? 0);
              console.log('[calculateMatrixBasedPremium] Using placesTariffs lookup:', {
                seats,
                placesTariffs,
                applicableTariff,
                finalPrime: matchedPrime
              });
            } else {
              // Utiliser la prime directe de la formule
              matchedPrime = this.parseNumber(matchedFormula.prime);
              console.log('[calculateMatrixBasedPremium] Using direct formula prime:', matchedPrime);
            }
          }
        }
        // Fallback to tariffs array if not found in formulas
        if (matchedPrime === null && Array.isArray(tariffs) && tariffs.length > 0) {
          console.log('[calculateMatrixBasedPremium] Checking tariffs array as fallback');
          matchedPrime = tariffs.find((tariff: any) => {
            const tariffFormula = this.parseNumber(tariff.formula);
            return tariffFormula === formula;
          })?.prime ?? null;
          console.log('[calculateMatrixBasedPremium] Result from tariffs:', matchedPrime);
        }
        // If still no match, try defaultPrime
        if (matchedPrime === null) {
          matchedPrime = this.parseNumber(config.defaultPrime) ?? null;
          console.log('[calculateMatrixBasedPremium] Using defaultPrime:', matchedPrime);
        }
        console.log('[calculateMatrixBasedPremium] === FORMULA CASE END ===', {
          matchedPrime
        });
        break;
    }

    const result = matchedPrime ?? 0;
    console.log('[calculateMatrixBasedPremium] Final result:', result);
    return result;
  }

  private calculatePremiumFromMetadata(
    metadata: Record<string, any> | undefined,
    vehicleData: VehicleData,
    coverageType?: CoverageType,
    coverageId?: string,
    coverageCode?: string
  ): number {
    console.log('🔥 [calculatePremiumFromMetadata] === START ===', {
      coverageType,
      calculationMethod: metadata?.calculationMethod,
      hasMetadata: !!metadata,
      hasParameters: !!metadata?.parameters,
      hasMtplTariffConfig: !!metadata?.parameters?.mtplTariffConfig,
      fuelTypeFromVehicle: vehicleData.fuel_type,
      fiscalPowerFromVehicle: vehicleData.fiscal_power,
    });

    if (!metadata || typeof metadata !== 'object') {
      console.log('[calculatePremiumFromMetadata] No valid metadata, returning 0');
      return 0;
    }

    const params = (metadata.parameters ?? {}) as Record<string, any>;
    const method = metadata.calculationMethod as CalculationMethodType | undefined;

    console.log('[calculatePremiumFromMetadata] Determining calculation method:', {
      method,
      hasIptConfig: !!params.iptConfig,
      hasIcIptConfig: !!params.icIptConfig,
      hasMatrixBased: !!params.matrixBased
    });

    switch (method) {
      case 'FIXED_AMOUNT': {
        const amount =
          this.parseNumber(metadata.fixedAmount) ??
          this.parseNumber(metadata.rate) ??
          this.parseNumber(params.fixedAmount);
        return amount ?? 0;
      }
      case 'FREE':
        return 0;
      case 'VARIABLE_BASED': {
        const variableConfig = this.resolveVariableBasedConfig(metadata, coverageId, coverageCode)
        return this.calculateVariableBasedPremium(variableConfig ?? params.variableBased ?? metadata, vehicleData);
      }
      case 'MATRIX_BASED':
        return this.calculateMatrixBasedPremium(params.matrixBased ?? metadata, vehicleData);
      default: {
        const fallbackAmount =
          this.parseNumber(metadata.fixedAmount) ??
          this.parseNumber(metadata.rate) ??
          this.parseNumber(params.fixedAmount);
        return fallbackAmount ?? 0;
      }
    }
  }

  private async getCoverageTariffRulesForCoverage(coverageId: string): Promise<CoverageTariffRule[]> {
    if (this.coverageTariffRulesCache.has(coverageId)) {
      return this.coverageTariffRulesCache.get(coverageId)!
    }

    try {
      const { data, error } = await supabasePublicFetch
        .from<CoverageTariffRule>('coverage_tariff_rules')
        .select('*')
        .eq('coverage_id', coverageId)
        .eq('is_active', true)

      if (error) {
        console.warn('getCoverageTariffRules: unable to fetch rules via public client, falling back to auth client', {
          coverageId,
          error: error.message,
        })
        const { data: authData, error: authError } = await supabase
          .from<CoverageTariffRule>('coverage_tariff_rules')
          .select('*')
          .eq('coverage_id', coverageId)
          .eq('is_active', true)

        if (authError) {
          console.error('getCoverageTariffRules: auth client also failed', { coverageId, authError })
          this.coverageTariffRulesCache.set(coverageId, [])
          return []
        }
        this.coverageTariffRulesCache.set(coverageId, authData || [])
        return authData || []
      }

      this.coverageTariffRulesCache.set(coverageId, data || [])
      return data || []
    } catch (error) {
      console.error('getCoverageTariffRules: unexpected error', { coverageId, error })
      this.coverageTariffRulesCache.set(coverageId, [])
      return []
    }
  }

  private matchesVariableTariffRule(rule: CoverageTariffRule, vehicleData: VehicleData): boolean {
    const category = vehicleData.category
    if (rule.vehicle_category && rule.vehicle_category !== category) {
      return false
    }

    const fuelType = (vehicleData.fuel_type ?? '').toLowerCase()
    if (rule.fuel_type && rule.fuel_type.toLowerCase() !== fuelType) {
      return false
    }

    const fiscalPower = this.parseNumber(vehicleData.fiscal_power) ?? 0
    if (rule.min_fiscal_power && fiscalPower < rule.min_fiscal_power) {
      return false
    }
    if (rule.max_fiscal_power && fiscalPower > rule.max_fiscal_power) {
      return false
    }

    const vehicleValue = this.parseNumber(vehicleData.sum_insured ?? vehicleData.new_value) ?? 0
    if (rule.min_vehicle_value && vehicleValue < rule.min_vehicle_value) {
      return false
    }
    if (rule.max_vehicle_value && vehicleValue > rule.max_vehicle_value) {
      return false
    }

    return true
  }

  private getVehicleValueForSource(vehicleData: VehicleData, source?: string): number {
    if (!source) {
      return this.parseNumber(vehicleData.sum_insured) ?? this.parseNumber(vehicleData.new_value) ?? 0
    }
    switch (source.toUpperCase()) {
      case 'VENAL_VALUE':
        return this.parseNumber(vehicleData.sum_insured) ?? 0
      case 'NEW_VALUE':
        return this.parseNumber(vehicleData.new_value) ?? 0
      case 'FISCAL_POWER':
        return this.parseNumber(vehicleData.fiscal_power) ?? 0
      default:
        return this.parseNumber(vehicleData.sum_insured) ?? this.parseNumber(vehicleData.new_value) ?? 0
    }
  }

  private calculatePremiumFromVariableRule(rule: CoverageTariffRule, vehicleData: VehicleData): number {
    if (typeof rule.fixed_amount === 'number' && rule.fixed_amount > 0) {
      return rule.fixed_amount
    }

    const conditions = (rule.conditions || {}) as Record<string, any>
    const variableSource = (conditions.variableSource as string) || (conditions.variable_source as string)
    const variableValue = this.getVehicleValueForSource(vehicleData, variableSource || undefined)

    if (variableValue <= 0) {
      return 0
    }

    let ratePercent = this.parseNumber(conditions.ratePercent ?? conditions.rate_percent) ?? this.parseNumber(rule.base_rate)
    const rateBelow = this.parseNumber(conditions.rateBelowThresholdPercent ?? conditions.rate_below_threshold_percent)
    const rateAbove = this.parseNumber(conditions.rateAboveThresholdPercent ?? conditions.rate_above_threshold_percent)
    const isConditioned = this.parseBoolean(conditions.conditionedByNewValue ?? conditions.conditioned_by_new_value) === true

    if (isConditioned) {
      const threshold = this.parseNumber(conditions.newValueThreshold ?? conditions.new_value_threshold) ?? 25_000_000
      if (variableValue <= threshold && rateBelow) {
        ratePercent = rateBelow
      } else if (variableValue > threshold && rateAbove) {
        ratePercent = rateAbove
      }
    }

    if (!ratePercent || ratePercent <= 0) {
      return 0
    }

    let amount = variableValue * (ratePercent / 100)

    const minAmount = this.parseNumber(rule.min_amount ?? conditions.minAmount ?? conditions.min_amount)
    if (minAmount && amount < minAmount) {
      amount = minAmount
    }
    const maxAmount = this.parseNumber(rule.max_amount ?? conditions.maxAmount ?? conditions.max_amount)
    if (maxAmount && amount > maxAmount) {
      amount = maxAmount
    }

    return amount > 0 ? amount : 0
  }

  private async calculateVariablePremiumFromTariffRules(
    coverageId: string,
    vehicleData: VehicleData
  ): Promise<number> {
    const rules = await this.getCoverageTariffRulesForCoverage(coverageId)
    if (!rules.length) {
      return 0
    }

    const applicable =
      rules.find((rule) => this.matchesVariableTariffRule(rule, vehicleData)) ||
      rules[0]
    if (!applicable) {
      return 0
    }

    return this.calculatePremiumFromVariableRule(applicable, vehicleData)
  }

  // Get available coverages from DB (preferred: direct table), with RPC fallback
  async getAvailableCoverages(params: {
    category?: string
    vehicle_value?: number | null
    fiscal_power?: number | null
    fuel_type?: string | null
  }): Promise<CoverageOption[]> {
    const category = params.category || '401'
    const value = params.vehicle_value ?? null
    const power = params.fiscal_power ?? null
    const fuel = params.fuel_type ?? null

    console.log('🔍 getAvailableCoverages called with params:', { category, value, power, fuel })
    console.log('🔍 Supabase URL:', supabaseUrl)

    // Vider le cache quand on charge les couvertures pour forcer un rechargement depuis la base
    this.clearCoverageCache();

    const isJwt = (token: string | undefined | null) =>
      typeof token === 'string' && token.split('.').length >= 3

    const parseAmount = (value: any): number | undefined => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value
      }
      if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = parseFloat(value)
        return Number.isFinite(parsed) ? parsed : undefined
      }
      return undefined
    }

    try {
      console.log('🔍 Step 1: Trying direct fetch to avoid JWT issues...')
      // 1) Use direct fetch to avoid JWT issues completely
      const headers: Record<string, string> = {
        apikey: supabaseAnonKey,
        'Content-Type': 'application/json',
      }

      if (isJwt(supabaseAnonKey)) {
        headers.Authorization = `Bearer ${supabaseAnonKey}`
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/coverages?select=id,type,name,description,calculation_type,is_mandatory,is_active,display_order,metadata,coverage_tariff_rules:coverage_tariff_rules(formula_name,fixed_amount,min_amount,max_amount,base_rate)&is_active=eq.true&order=display_order`, {
        headers,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const coveragesData = await response.json()
      console.log('🔍 Direct fetch result:', { dataLength: coveragesData?.length, data: coveragesData })

      if (Array.isArray(coveragesData) && coveragesData.length > 0) {
        console.log('🔍 Step 1 SUCCESS: Got', coveragesData.length, 'coverages from direct fetch')
        const rows = coveragesData
        return rows.map((r: any) => {
          const rules = Array.isArray(r.coverage_tariff_rules) ? r.coverage_tariff_rules : []
          const formulas = Array.from(
            new Set(
              rules
                .map((rr: any) => rr?.formula_name)
                .filter((x: any): x is string => typeof x === 'string' && x.length > 0)
            )
          )
          const fixeds = rules
            .map((rr: any) => parseAmount(rr?.fixed_amount))
            .filter((n): n is number => typeof n === 'number')
          const mins = rules
            .map((rr: any) => parseAmount(rr?.min_amount))
            .filter((n): n is number => typeof n === 'number')
          const maxs = rules
            .map((rr: any) => parseAmount(rr?.max_amount))
            .filter((n): n is number => typeof n === 'number')

          const estMin = fixeds.length ? Math.min(...fixeds) : mins.length ? Math.min(...mins) : undefined
          const estMax = fixeds.length ? Math.max(...fixeds) : maxs.length ? Math.max(...maxs) : undefined

          let fixedPrice = fixeds.length === 1 ? fixeds[0] : undefined
          if (!fixedPrice && r.metadata) {
            const metaFixed = parseAmount(r.metadata.fixedAmount || r.metadata.fixed_price)
            if (typeof metaFixed === 'number') {
              fixedPrice = metaFixed
            }
          }

          const { formulas: matrixBasedFormulas, calculationMethod } = this.extractMatrixBasedFormulas(r.metadata)

          return {
            coverage_id: r.id,
            coverage_type: r.type as CoverageType,
            name: r.name,
            description: r.description,
            calculation_type: r.calculation_type as CalculationType,
            is_mandatory: !!r.is_mandatory,
            estimated_min_premium: estMin,
            estimated_max_premium: estMax,
            fixed_price: fixedPrice,
            available_formulas: formulas,
            matrixBasedFormulas,
            calculationMethod,
          } as CoverageOption
        })
      }

      console.log('🔍 Step 1 FAILED: Direct query failed or returned no data')
      console.log('🔍 Step 2: Trying direct table query with auth client...')

      // 1b) Try direct table query with auth client (for authenticated sessions)
      const { data, error } = await (supabase
        .from('coverages')
        .select(
          'id, type, name, description, calculation_type, is_mandatory, is_active, display_order, metadata, coverage_tariff_rules:coverage_tariff_rules(formula_name, fixed_amount, min_amount, max_amount, base_rate)'
        )
        .eq('is_active', true)
        .order('display_order', { ascending: true }) as any)

      console.log('🔍 Auth client query result:', { error, dataLength: data?.length, data })

      if (error) throw error

      const rows = (data || []) as any[]
      if (rows.length > 0) {
        console.log('🔍 Step 2 SUCCESS: Got', rows.length, 'coverages from auth client')
        return rows.map((r) => {
          const rules = Array.isArray(r.coverage_tariff_rules) ? r.coverage_tariff_rules : []
          const formulas = Array.from(
            new Set(
              rules
                .map((rr: any) => rr?.formula_name)
                .filter((x: any): x is string => typeof x === 'string' && x.length > 0)
            )
          )
          const fixeds = rules
            .map((rr: any) => parseAmount(rr?.fixed_amount))
            .filter((n): n is number => typeof n === 'number')
          const mins = rules
            .map((rr: any) => parseAmount(rr?.min_amount))
            .filter((n): n is number => typeof n === 'number')
          const maxs = rules
            .map((rr: any) => parseAmount(rr?.max_amount))
            .filter((n): n is number => typeof n === 'number')

          const estMin = fixeds.length ? Math.min(...fixeds) : mins.length ? Math.min(...mins) : undefined
          const estMax = fixeds.length ? Math.max(...fixeds) : maxs.length ? Math.max(...maxs) : undefined
          let fixedPrice = fixeds.length === 1 ? fixeds[0] : undefined
          if (!fixedPrice && r.metadata) {
            const metaFixed = parseAmount(r.metadata.fixedAmount || r.metadata.fixed_price)
            if (typeof metaFixed === 'number') {
              fixedPrice = metaFixed
            }
          }

          const { formulas: matrixBasedFormulas, calculationMethod } = this.extractMatrixBasedFormulas(r.metadata)

          return {
            coverage_id: r.id,
            coverage_type: r.type as CoverageType,
            name: r.name,
            description: r.description,
            calculation_type: r.calculation_type as CalculationType,
            is_mandatory: !!r.is_mandatory,
            estimated_min_premium: estMin,
            estimated_max_premium: estMax,
            fixed_price: fixedPrice,
            available_formulas: formulas,
            matrixBasedFormulas,
            calculationMethod,
          } as CoverageOption
        })
      }
    } catch (e1) {
      // ignore and continue
      // Continue to RPC fallback
    }

    try {
      // Prefer extended signature (category + vehicle details)
      const { data, error } = await (supabase.rpc as any)('get_available_coverages', {
        p_vehicle_category: category,
        p_vehicle_value: value,
        p_fiscal_power: power,
        p_fuel_type: fuel,
      })

      if (error) throw error

      const rows = (data || []) as any[]
      return rows.map((r) => {
        // Handle both variants: fields may be (coverage_id, coverage_type, available_formulas)
        // or (id, type, available_formulas as json)
        const coverage_id: string = r.coverage_id ?? r.id
        const coverage_type: CoverageType = (r.coverage_type ?? r.type) as CoverageType
        const available_formulas: string[] = Array.isArray(r.available_formulas)
          ? (r.available_formulas as string[]).filter(Boolean)
          : typeof r.available_formulas === 'object' && r.available_formulas !== null
          ? Array.from(new Set(Object.values(r.available_formulas as any).filter(Boolean))) as string[]
          : []

        const minEst = typeof r.estimated_min_premium === 'number' ? Number(r.estimated_min_premium) : undefined
        const maxEst = typeof r.estimated_max_premium === 'number' ? Number(r.estimated_max_premium) : undefined
        const premiumAmount = typeof r.premium_amount === 'number' ? Number(r.premium_amount) : undefined

        return {
          coverage_id,
          coverage_type,
          name: r.name,
          description: r.description,
          calculation_type: r.calculation_type,
          is_mandatory: !!r.is_mandatory,
          estimated_min_premium: minEst ?? premiumAmount,
          estimated_max_premium: maxEst ?? premiumAmount,
          available_formulas,
        } as CoverageOption
      })
    } catch (errExt) {
      // Fallback to legacy signature (category only)
      try {
        const { data, error } = await (supabase.rpc as any)('get_available_coverages', {
          p_vehicle_category: category,
        })
        if (error) throw error
        const rows = (data || []) as any[]
        return rows.map((r) => ({
          coverage_id: r.coverage_id ?? r.id,
          coverage_type: (r.coverage_type ?? r.type) as CoverageType,
          name: r.name,
          description: r.description,
          calculation_type: r.calculation_type,
          is_mandatory: !!r.is_mandatory,
          estimated_min_premium: typeof r.estimated_min_premium === 'number' ? Number(r.estimated_min_premium) : undefined,
          estimated_max_premium: typeof r.estimated_max_premium === 'number' ? Number(r.estimated_max_premium) : undefined,
          available_formulas: Array.isArray(r.available_formulas) ? (r.available_formulas as string[]) : [],
        }))
      } catch (error) {
        logger.error('Error fetching available coverages via RPC, trying direct fetch:', error)

        // Final fallback: use direct REST API fetch with retry logic
        const maxRetries = 3
        let retryCount = 0
        
        while (retryCount < maxRetries) {
          try {
            const { data: session } = await supabase.auth.getSession()
            const headers: Record<string, string> = {
              'apikey': supabaseAnonKey,
              'Content-Type': 'application/json'
            }

            if (session?.session?.access_token) {
              headers['Authorization'] = `Bearer ${session.session.access_token}`
            }

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

            const response = await fetch(
              `${supabaseUrl}/rest/v1/rpc/get_available_coverages`,
              {
                method: 'POST',
                headers,
                body: JSON.stringify({}),
                signal: controller.signal
              }
            )

            clearTimeout(timeoutId)

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()
            logger.api('getAvailableCoverages: direct fetch fallback succeeded', { count: data.length })

            return data.map((r: any) => ({
              coverage_id: r.coverage_id ?? r.id,
              coverage_type: (r.coverage_type ?? r.type) as CoverageType,
              name: r.name,
              description: r.description,
              calculation_type: r.calculation_type,
              is_mandatory: !!r.is_mandatory,
              estimated_min_premium: typeof r.estimated_min_premium === 'number' ? Number(r.estimated_min_premium) : undefined,
              estimated_max_premium: typeof r.estimated_max_premium === 'number' ? Number(r.estimated_max_premium) : undefined,
              available_formulas: Array.isArray(r.available_formulas) ? (r.available_formulas as string[]) : [],
            }))
          } catch (fetchError) {
            logger.error(`getAvailableCoverages: Fetch attempt ${retryCount + 1} failed:`, fetchError)
            
            if (retryCount === maxRetries - 1) {
              // Return empty array as last resort to prevent complete failure
              logger.error('getAvailableCoverages: All methods failed, returning empty array')
              return []
            }
            
            retryCount++
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
          }
        }
      }
    }
  }

  // Calculate premium for a specific coverage
  async calculateCoveragePremium(
    coverageId: string,
    vehicleData: VehicleData,
    quoteData: Record<string, any> = {}
  ): Promise<number> {
    console.log('🔥 [calculateCoveragePremium] === START ===', {
      coverageId,
      vehicleData,
      fuelType: vehicleData.fuel_type,
      fiscalPower: vehicleData.fiscal_power,
    })

    // Vider le cache pour s'assurer d'avoir les données à jour
    this.clearCoverageCache();

    let fallbackPremium = 0;
    let coverageDetails: { metadata?: Record<string, any> } | null = null;
    let calculationMethod: CalculationMethodType | undefined;
    try {
      coverageDetails = await this.getCoverageDetailsWithMetadata(coverageId);
      calculationMethod = coverageDetails?.metadata?.calculationMethod as CalculationMethodType | undefined;
      fallbackPremium = this.calculatePremiumFromMetadata(
        coverageDetails?.metadata,
        vehicleData,
        coverageDetails?.type as CoverageType,
        coverageId,
        (coverageDetails?.metadata?.code as string | undefined) ?? undefined
      );

      // Debug logging for fallback calculation
      console.log('🔥 [calculateCoveragePremium] Coverage calculation result:', {
        coverageId,
        coverageType: coverageDetails?.type,
        calculationMethod,
        hasMtplTariffConfig: !!coverageDetails?.metadata?.parameters?.mtplTariffConfig,
        mtplTariffConfig: coverageDetails?.metadata?.parameters?.mtplTariffConfig,
        fallbackPremium,
        vehicleFuelType: vehicleData.fuel_type,
        vehicleFiscalPower: vehicleData.fiscal_power,
      });
    } catch (metaError) {
      logger.warn('calculateCoveragePremium: unable to load coverage metadata', metaError);
      console.error('❌ [calculateCoveragePremium] Metadata error:', metaError);
    }

    try {
      // If we have a valid premium from metadata, use it directly without calling RPC
      // This avoids RPC calls for all metadata-based calculations
      if (fallbackPremium > 0) {
        console.log('✅ [calculateCoveragePremium] Using metadata fallback:', {
          coverageId,
          calculationMethod,
          premium: fallbackPremium,
        });
        return fallbackPremium;
      }

      if (calculationMethod === 'VARIABLE_BASED') {
        const rulePremium = await this.calculateVariablePremiumFromTariffRules(coverageId, vehicleData)
        if (rulePremium > 0) {
          console.log('✅ [calculateCoveragePremium] Using tariff rule fallback:', {
            coverageId,
            premium: rulePremium,
          })
          return rulePremium
        }
      }

      // For metadata-based methods that return 0 (like missing formula), don't call RPC
      const isMetadataBasedMethod =
        calculationMethod === 'MATRIX_BASED' ||
        calculationMethod === 'VARIABLE_BASED'

      if (isMetadataBasedMethod) {
        console.log('⚠️ [calculateCoveragePremium] Metadata-based method with 0 premium, returning 0', {
          coverageId,
          calculationMethod,
        });
        return 0;
      }

      const canCallRpc = await this.canInvokeProtectedRpc();
      if (!canCallRpc) {
        console.log('⚠️ [calculateCoveragePremium] Cannot call RPC, using fallback:', fallbackPremium);
        return fallbackPremium || 0;
      }

      console.log('🔥 [calculateCoveragePremium] Calling RPC with:', {
        coverageId,
        vehicleData,
        quoteData,
        fuelType: vehicleData.fuel_type,
        fiscalPower: vehicleData.fiscal_power,
      });

      const { data, error } = await (supabase.rpc as any)('calculate_coverage_premium', {
        p_coverage_id: coverageId,
        p_vehicle_data: vehicleData,
        p_quote_data: quoteData
      });

      if (error) {
        console.error('❌ [calculateCoveragePremium] RPC error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          fuelTypeSent: vehicleData.fuel_type,
        });
        throw error;
      }

      console.log('✅ [calculateCoveragePremium] RPC result:', {
        coverageId,
        data,
        dataType: typeof data,
        fallbackPremium,
      });

      if (typeof data === 'number' && data > 0) {
        return data;
      }
      return fallbackPremium || 0;
    } catch (error) {
      console.error('❌ [calculateCoveragePremium] Error:', error);
      if (fallbackPremium > 0) {
        console.log('🔄 [calculateCoveragePremium] Falling back to metadata premium:', fallbackPremium);
        return fallbackPremium;
      }
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
      const { data, error } = await (supabase.rpc as any)('add_coverage_to_quote', {
        p_quote_id: quoteId,
        p_coverage_id: coverageId,
        p_calculation_parameters: calculationParameters,
        p_is_included: isIncluded
      });

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
      const { error } = await (supabase.rpc as any)('update_quote_coverage_premiums', {
        p_quote_id: quoteId
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating quote coverage premiums:', error);
      throw error;
    }
  }

  // Calculate total premium for a quote
  async calculateQuoteTotalPremium(quoteId: string): Promise<number> {
    try {
      const { data, error } = await (supabase.rpc as any)('calculate_quote_total_premium', {
        p_quote_id: quoteId
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error calculating quote total premium:', error);
      throw error;
    }
  }

  // Get quote coverage premiums
  async getQuoteCoveragePremiums(quoteId: string): Promise<QuoteCoverage[]> {
    try {
      const { data, error } = await supabase
        .from('quote_coverages')
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
        .from('quote_coverages')
        .update(updateData)
        .eq('id', premiumId);

      if (error) throw error;

      // Recalculate premium if parameters changed
      if (calculationParameters) {
        const premium = await supabase
          .from('quote_coverages')
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
        .from('quote_coverages')
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
      // Use main Supabase client
      const res = await supabase
        .from('coverage_tariff_rules')
        .select('formula_name')
        .eq('coverage_id', coverageId)
        .eq('is_active', true)

      if (res.error) throw res.error

      const rows = (res.data || []) as any[]
      const formulas = rows
        .map((r) => r?.formula_name)
        .filter((f): f is string => typeof f === 'string' && f.length > 0)
      return Array.from(new Set(formulas))
    } catch (error) {
      console.error('Error fetching coverage formulas:', error)
      return []
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
    coveragePremiums: QuoteCoverage[];
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
