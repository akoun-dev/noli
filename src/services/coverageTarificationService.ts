import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type {
  FireTheftConfig,
  CalculationMethodType,
  ICFormulaConfig,
  ICIPTConfig,
  IPTFormulaConfig,
  IPTConfig
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
  fixed_price?: number;
  available_formulas?: string[];
}

class CoverageTarificationService {
  private coverageMetadataCache = new Map<string, { metadata?: Record<string, any> }>();
  private readonly hasJwtAnonKey = isJwtToken(supabaseAnonKey);

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

  private async getCoverageDetailsWithMetadata(coverageId: string): Promise<{ metadata?: Record<string, any> } | null> {
    if (this.coverageMetadataCache.has(coverageId)) {
      return this.coverageMetadataCache.get(coverageId)!;
    }

    const buildEntry = (metadata: Record<string, any> | undefined) => {
      const entry = { metadata: metadata ?? undefined };
      this.coverageMetadataCache.set(coverageId, entry);
      return entry;
    };

    const fetchWithSupabase = async () => {
      const { data, error } = await supabase
        .from('coverages')
        .select('id, metadata')
        .eq('id', coverageId)
        .single();

      if (error) {
        throw error;
      }

      return buildEntry((data?.metadata as Record<string, any> | undefined) ?? undefined);
    };

    const fetchWithPublicClient = async () => {
      const { data, error } = await supabasePublicFetch
        .from<{ id: string; metadata?: Record<string, any> }>('coverages')
        .select('id, metadata')
        .eq('id', coverageId)
        .single();

      if (error || !data) {
        throw error || new Error('Coverage not found');
      }

      return buildEntry(data.metadata);
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

  private calculateMTPLTariffPremium(vehicleData: VehicleData, customTarifs?: Record<string, any>): number {
    const fiscalPower = this.parseNumber(vehicleData.fiscal_power) ?? 0;
    const energy = (vehicleData.fuel_type ?? '').toLowerCase();

    if (!fiscalPower || fiscalPower <= 0 || !energy) {
      return 0;
    }

    const defaultTarifs: Record<string, number> = {
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

    const mergedTarifs: Record<string, number> = { ...defaultTarifs };
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
    if (!key) {
      return 0;
    }

    const amount = mergedTarifs[key];
    return typeof amount === 'number' && amount > 0 ? amount : 0;
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
          { places: 5, prime: 30800, label: '5 places' },
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

    const defaultTariffs = defaultFormulas.find(f => f.formula === selectedFormula)?.placesTariffs ?? [];
    const rawPlacesTariffs =
      (formula as IPTFormulaConfig).placesTariffs && (formula as IPTFormulaConfig).placesTariffs!.length > 0
        ? (formula as IPTFormulaConfig).placesTariffs!
        : defaultTariffs;
    const placesTariffs = normalizePlacesTariffs(rawPlacesTariffs);

    if (!placesTariffs.length) {
      return 0;
    }

    const applicable =
      placesTariffs.find(tariff => seats <= tariff.places) ?? placesTariffs[placesTariffs.length - 1];
    return applicable?.prime ?? 0;
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

  private calculatePremiumFromMetadata(metadata: Record<string, any> | undefined, vehicleData: VehicleData): number {
    if (!metadata || typeof metadata !== 'object') {
      return 0;
    }

    const params = (metadata.parameters ?? {}) as Record<string, any>;
    const method = metadata.calculationMethod as CalculationMethodType | undefined;

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
      case 'FIRE_THEFT':
      case 'THEFT_ARMED':
        return params.fireTheftConfig ? this.calculateFireTheftPremium(params.fireTheftConfig, vehicleData) : 0;
      case 'GLASS_ROOF':
        return params.glassRoofConfig ? this.calculateGlassRoofPremium(params.glassRoofConfig, vehicleData) : 0;
      case 'GLASS_STANDARD':
        return params.glassStandardConfig
          ? this.calculateGlassStandardPremium(params.glassStandardConfig, vehicleData)
          : 0;
      case 'TIERCE_COMPLETE_CAP':
      case 'TIERCE_COLLISION_CAP':
        return params.tierceCapConfig ? this.calculateTierceCapPremium(params.tierceCapConfig, vehicleData) : 0;
      case 'MTPL_TARIFF':
        return this.calculateMTPLTariffPremium(vehicleData, params.mtplTariffConfig);
      case 'IC_IPT_FORMULA':
        return this.calculateICFormulaPremium(params.icIptConfig, vehicleData);
      case 'IPT_PLACES_FORMULA':
        return this.calculateIPTPlacesPremium(vehicleData, params.iptConfig);
      default: {
        const fallbackAmount =
          this.parseNumber(metadata.fixedAmount) ??
          this.parseNumber(metadata.rate) ??
          this.parseNumber(params.fixedAmount);
        return fallbackAmount ?? 0;
      }
    }
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
    let fallbackPremium = 0;
    let coverageDetails: { metadata?: Record<string, any> } | null = null;
    try {
      coverageDetails = await this.getCoverageDetailsWithMetadata(coverageId);
      fallbackPremium = this.calculatePremiumFromMetadata(coverageDetails?.metadata, vehicleData);
    } catch (metaError) {
      logger.warn('calculateCoveragePremium: unable to load coverage metadata', metaError);
    }

    try {
      const canCallRpc = await this.canInvokeProtectedRpc();
      if (!canCallRpc) {
        return fallbackPremium || 0;
      }

      const { data, error } = await (supabase.rpc as any)('calculate_coverage_premium', {
        p_coverage_id: coverageId,
        p_vehicle_data: vehicleData,
        p_quote_data: quoteData
      });

      if (error) throw error;
      if (typeof data === 'number' && data > 0) {
        return data;
      }
      return fallbackPremium || 0;
    } catch (error) {
      console.error('Error calculating coverage premium:', error);
      if (fallbackPremium > 0) {
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
