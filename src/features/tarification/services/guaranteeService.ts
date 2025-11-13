import {
  Guarantee,
  GuaranteeCategory,
  InsurancePackage,
  TarifRC,
  TarifICIPT,
  TarifTCMTCL,
  TarifFixe,
  TarificationGrids,
  GuaranteeFormData,
  PackageFormData,
  TarificationStats,
  CalculationMethodType
} from '@/types/tarification';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// Grilles de tarification initiales basées sur le document pour la Responsabilité Civile (JAUNE)
const initialTarifRC: TarifRC[] = [
  // Moteur Essence
  { id: 'rc-essence-1', category: '401', energy: 'Essence', powerMin: 1, powerMax: 2, prime: 68675 },
  { id: 'rc-essence-2', category: '401', energy: 'Essence', powerMin: 3, powerMax: 6, prime: 87885 },
  { id: 'rc-essence-3', category: '401', energy: 'Essence', powerMin: 7, powerMax: 9, prime: 102345 },
  { id: 'rc-essence-4', category: '401', energy: 'Essence', powerMin: 10, powerMax: 11, prime: 124693 },
  { id: 'rc-essence-5', category: '401', energy: 'Essence', powerMin: 12, powerMax: 999, prime: 137058 },
  // Moteur Diesel
  { id: 'rc-diesel-1', category: '401', energy: 'Diesel', powerMin: 1, powerMax: 1, prime: 68675 },
  { id: 'rc-diesel-2', category: '401', energy: 'Diesel', powerMin: 2, powerMax: 4, prime: 87885 },
  { id: 'rc-diesel-3', category: '401', energy: 'Diesel', powerMin: 5, powerMax: 6, prime: 102345 },
  { id: 'rc-diesel-4', category: '401', energy: 'Diesel', powerMin: 7, powerMax: 8, prime: 124693 },
  { id: 'rc-diesel-5', category: '401', energy: 'Diesel', powerMin: 9, powerMax: 999, prime: 137058 },
];

const initialTarifICIPT: TarifICIPT[] = [
  { id: 'ic-1', type: 'IC', formula: 1, nbPlaces: 0, prime: 5500 },
  { id: 'ic-2', type: 'IC', formula: 2, nbPlaces: 0, prime: 8400 },
  { id: 'ic-3', type: 'IC', formula: 3, nbPlaces: 0, prime: 15900 },
  { id: 'ipt-1', type: 'IPT', formula: 1, nbPlaces: 3, prime: 8400 },
  { id: 'ipt-2', type: 'IPT', formula: 1, nbPlaces: 4, prime: 10200 },
  { id: 'ipt-3', type: 'IPT', formula: 2, nbPlaces: 3, prime: 10000 },
  { id: 'ipt-4', type: 'IPT', formula: 2, nbPlaces: 4, prime: 12000 },
];

const initialTarifTCMTCL: TarifTCMTCL[] = [
  { id: 'tcm-1', category: '401', guaranteeType: 'Tierce Complete', valueNeufMin: 0, valueNeufMax: 12000000, franchise: 0, rate: 4.40 },
  { id: 'tcm-2', category: '401', guaranteeType: 'Tierce Complete', valueNeufMin: 0, valueNeufMax: 12000000, franchise: 250000, rate: 3.52 },
  { id: 'tcm-3', category: '401', guaranteeType: 'Tierce Complete', valueNeufMin: 12000001, valueNeufMax: 25000000, franchise: 250000, rate: 3.828 },
  { id: 'tcm-4', category: '401', guaranteeType: 'Tierce Collision', valueNeufMin: 0, valueNeufMax: 40000000, franchise: 50000, rate: 4.311 },
  { id: 'tcm-5', category: '402', guaranteeType: 'Tierce Complete', valueNeufMin: 0, valueNeufMax: 12000000, franchise: 250000, rate: 2.255 },
];

const initialTarifFixes: TarifFixe[] = [
  { id: 'fix-1', guaranteeName: 'Defense et Recours', prime: 7950, conditions: '*', packPriceReduced: 4240 },
  { id: 'fix-2', guaranteeName: 'Avance sur recours', prime: 15000, conditions: '*', packPriceReduced: 15000 },
  { id: 'fix-3', guaranteeName: 'Vol des accessoires', prime: 15000, conditions: '*', packPriceReduced: 15000 },
  { id: 'fix-4', guaranteeName: 'Assistance Bronze', prime: 48000, conditions: 'Uniquement pickups', packPriceReduced: undefined },
  { id: 'fix-5', guaranteeName: 'Assistance Silver', prime: 65000, conditions: 'Uniquement pickups', packPriceReduced: undefined },
  { id: 'fix-6', guaranteeName: 'Individuelle Conducteur Formule 1', prime: 5500, conditions: '*' },
  { id: 'fix-7', guaranteeName: 'Individuelle Conducteur Formule 2', prime: 8400, conditions: '*' },
  { id: 'fix-8', guaranteeName: 'Individuelle Conducteur Formule 3', prime: 15900, conditions: '*' },
];

// Garanties initiales basées sur le document
const initialGuarantees: Guarantee[] = [
  {
    id: 'guar-1',
    name: 'Responsabilité Civile',
    code: 'RC',
    category: 'RESPONSABILITE_CIVILE',
    description: 'Couverture des dommages causés à autrui',
    calculationMethod: 'MTPL_TARIFF',
    isOptional: false,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'guar-2',
    name: 'Défense et Recours',
    code: 'DR',
    category: 'DEFENSE_RECOURS',
    description: 'Prise en charge des frais de justice et honoraires d\'avocat',
    calculationMethod: 'FIXED_AMOUNT',
    isOptional: true,
    isActive: true,
    rate: 7950,
    parameters: { packPriceReduced: 4240 },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'guar-3',
    name: 'Individuelle Conducteur',
    code: 'IC',
    category: 'INDIVIDUELLE_CONDUCTEUR',
    description: 'Protection du conducteur en cas d\'accident',
    calculationMethod: 'IC_IPT_FORMULA',
    isOptional: true,
    isActive: true,
    conditions: 'Choix de formule (1, 2 ou 3)',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'guar-4',
    name: 'Individuelle Passagers',
    code: 'IPT',
    category: 'INDIVIDUELLE_PASSAGERS',
    description: 'Protection des passagers en cas d\'accident',
    calculationMethod: 'IC_IPT_FORMULA',
    isOptional: true,
    isActive: true,
    conditions: 'Choix de formule (1 ou 2)',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'guar-5',
    name: 'Incendie',
    code: 'INC',
    category: 'INCENDIE',
    description: 'Dommages par incendie ou explosion',
    calculationMethod: 'RATE_ON_SI',
    isOptional: true,
    isActive: true,
    rate: 0.8,
    minValue: 50000,
    maxValue: 500000,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'guar-6',
    name: 'Vol',
    code: 'VOL',
    category: 'VOL',
    description: 'Vol ou tentative de vol du véhicule',
    calculationMethod: 'CONDITIONAL_RATE',
    isOptional: true,
    isActive: true,
    parameters: {
      condition: 'venale <= 25000000',
      rateIfTrue: 1.1,
      rateIfFalse: 2.1
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'guar-7',
    name: 'Vol à mains armées',
    code: 'VMA',
    category: 'VOL_MAINS_ARMEES',
    description: 'Vol avec violence ou intimidation',
    calculationMethod: 'RATE_ON_SI',
    isOptional: true,
    isActive: true,
    rate: 0.3,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'guar-8',
    name: 'Bris de glaces',
    code: 'BDG',
    category: 'BRIS_GLACES',
    description: 'Réparation ou remplacement des glaces endommagées',
    calculationMethod: 'RATE_ON_NEW_VALUE',
    isOptional: true,
    isActive: true,
    rate: 0.35,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'guar-9',
    name: 'Tierce Complète',
    code: 'TDC',
    category: 'TIERCE_COMPLETE',
    description: 'Indemnisation en cas de sinistre avec tiers identifié ou non',
    calculationMethod: 'TCM_TCL_MATRIX',
    isOptional: true,
    isActive: true,
    franchiseOptions: [0, 250000, 500000],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'guar-10',
    name: 'Tierce Collision',
    code: 'TCL',
    category: 'TIERCE_COLLISION',
    description: 'Indemnisation en cas de collision avec un tiers identifié',
    calculationMethod: 'TCM_TCL_MATRIX',
    isOptional: true,
    isActive: true,
    franchiseOptions: [50000],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'guar-11',
    name: 'Assistance',
    code: 'ASSIST',
    category: 'ASSISTANCE',
    description: 'Assistance routière 24/7',
    calculationMethod: 'FIXED_AMOUNT',
    isOptional: true,
    isActive: true,
    rate: 48000,
    conditions: 'Uniquement pickups',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'guar-12',
    name: 'Avance sur recours',
    code: 'ASR',
    category: 'AVANCE_RECOURS',
    description: 'Avance de fonds en attente du recours contre le tiers responsable',
    calculationMethod: 'FIXED_AMOUNT',
    isOptional: true,
    isActive: true,
    rate: 15000,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  }
];

// Packages initiaux
const initialPackages: InsurancePackage[] = [
  {
    id: 'pack-1',
    name: 'Plan Essentiel',
    code: 'ESSENTIEL',
    description: 'Couverture de base avec garanties essentielles',
    guarantees: ['guar-1', 'guar-2'],
    basePrice: 80000,
    totalPrice: 85000,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'pack-2',
    name: 'Plan Évolution',
    code: 'EVOLUTION',
    description: 'Couverture complète équilibrée',
    guarantees: ['guar-1', 'guar-2', 'guar-3', 'guar-4', 'guar-5', 'guar-8'],
    basePrice: 150000,
    totalPrice: 180000,
    isPopular: true,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'pack-3',
    name: 'Plan Premium',
    code: 'PREMIUM',
    description: 'Couverture tous risques premium',
    guarantees: ['guar-1', 'guar-2', 'guar-3', 'guar-4', 'guar-5', 'guar-6', 'guar-7', 'guar-8', 'guar-9', 'guar-12'],
    basePrice: 250000,
    totalPrice: 320000,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'pack-4',
    name: 'Plan Pick-up Pro',
    code: 'PICKUP_PRO',
    description: 'Package spécialisé pour véhicules utilitaires',
    guarantees: ['guar-1', 'guar-2', 'guar-3', 'guar-5', 'guar-9', 'guar-11', 'guar-12'],
    basePrice: 200000,
    totalPrice: 240000,
    vehicleTypeRestrictions: ['Pickup', 'Utilitaire'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  }
];

type CoverageRow = {
  id: string
  code: string | null
  type: string | null
  name: string
  description: string | null
  calculation_type: string
  is_mandatory: boolean
  is_active: boolean
  display_order?: number | null
  metadata: Record<string, any> | null
  created_by: string | null
  created_at: string
  updated_at: string
};

const DEFAULT_CATEGORY: GuaranteeCategory = 'RESPONSABILITE_CIVILE';

const CATEGORY_TO_COVERAGE_TYPE: Record<GuaranteeCategory, string> = {
  RESPONSABILITE_CIVILE: 'RC',
  DEFENSE_RECOURS: 'DEFENSE_RECOURS',
  INDIVIDUELLE_CONDUCTEUR: 'INDIVIDUELLE_CONDUCTEUR',
  INDIVIDUELLE_PASSAGERS: 'INDIVIDUELLE_PASSAGERS',
  INCENDIE: 'INCENDIE',
  VOL: 'VOL',
  VOL_MAINS_ARMEES: 'VOL_MAINS_ARMEES',
  BRIS_GLACES: 'BRIS_GLACES',
  TIERCE_COMPLETE: 'TIERCE_COMPLETE',
  TIERCE_COLLISION: 'TIERCE_COLLISION',
  ASSISTANCE: 'ASSISTANCE',
  AVANCE_RECOURS: 'AVANCE_RECOURS',
  ACCESSOIRES: 'ACCESSOIRES',
};

const GUARANTEE_CATEGORIES = new Set<GuaranteeCategory>(
  Object.keys(CATEGORY_TO_COVERAGE_TYPE) as GuaranteeCategory[]
);

const isGuaranteeCategory = (value: unknown): value is GuaranteeCategory =>
  typeof value === 'string' && GUARANTEE_CATEGORIES.has(value as GuaranteeCategory);

class GuaranteeService {
  private storageKey = 'noli_guarantees';
  private packagesStorageKey = 'noli_packages';
  private gridsStorageKey = 'noli_tarification_grids';
  private useMockData: boolean;

  constructor() {
    this.useMockData = (import.meta as any).env?.VITE_MOCK_DATA === 'true';
    this.initializeData();
  }

  private initializeData() {
    // En mode non-demo, on s'assure de ne pas injecter de données locales
    if (!this.useMockData) {
      try {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.packagesStorageKey);
        localStorage.removeItem(this.gridsStorageKey);
      } catch (_) {}
      return;
    }

    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify(initialGuarantees));
    }
    if (!localStorage.getItem(this.packagesStorageKey)) {
      localStorage.setItem(this.packagesStorageKey, JSON.stringify(initialPackages));
    }
    if (!localStorage.getItem(this.gridsStorageKey)) {
      const grids: TarificationGrids = {
        tarifRC: initialTarifRC,
        tarifICIPT: initialTarifICIPT,
        tarifTCMTCL: initialTarifTCMTCL,
        tarifFixes: initialTarifFixes
      };
      localStorage.setItem(this.gridsStorageKey, JSON.stringify(grids));
    }
  }

  private sanitizeNumber(value: unknown): number | undefined {
    if (value === undefined || value === null) return undefined;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }

  private normalizeCode(value?: string | null): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed.toUpperCase().replace(/[^A-Z0-9_]/g, '').slice(0, 32);
  }

  private mapCategoryToCoverageType(category?: GuaranteeCategory): string {
    if (category && CATEGORY_TO_COVERAGE_TYPE[category]) {
      return CATEGORY_TO_COVERAGE_TYPE[category];
    }
    return CATEGORY_TO_COVERAGE_TYPE[DEFAULT_CATEGORY];
  }

  private mapTarifRcRow(row: any): TarifRC {
    return {
      id: row.id,
      category: row.category,
      energy: row.energy,
      powerMin: typeof row.power_min === 'number' ? row.power_min : row.powerMin,
      powerMax: typeof row.power_max === 'number' ? row.power_max : row.powerMax,
      prime: typeof row.prime === 'number' ? row.prime : Number(row.prime ?? 0)
    };
  }

  private buildMetadataFromForm(
    input: Partial<GuaranteeFormData>,
    base: Record<string, any> = {}
  ): Record<string, any> {
    const metadata = { ...base };
    if (input.category !== undefined) metadata.category = input.category;
    if (input.conditions !== undefined) metadata.conditions = input.conditions;
    if (input.minValue !== undefined) metadata.minValue = this.sanitizeNumber(input.minValue) ?? null;
    if (input.maxValue !== undefined) metadata.maxValue = this.sanitizeNumber(input.maxValue) ?? null;
    if (input.rate !== undefined) metadata.rate = this.sanitizeNumber(input.rate) ?? null;
    if (input.fixedAmount !== undefined) metadata.fixedAmount = this.sanitizeNumber(input.fixedAmount) ?? null;
    if (input.franchiseOptions !== undefined) {
      metadata.franchiseOptions = Array.isArray(input.franchiseOptions)
        ? input.franchiseOptions
            .map(value => this.sanitizeNumber(value))
            .filter((value): value is number => value !== undefined)
        : input.franchiseOptions;
    }
    if (input.parameters !== undefined) metadata.parameters = input.parameters;
    if (input.calculationMethod !== undefined) metadata.calculationMethod = input.calculationMethod;
    if (input.code !== undefined) {
      const normalized = this.normalizeCode(input.code);
      metadata.code = normalized ?? input.code;
    }
    if (input.name !== undefined) metadata.name = input.name;
    if (input.description !== undefined) metadata.description = input.description;
    if (input.isOptional !== undefined) metadata.isOptional = input.isOptional;
    return metadata;
  }

  private mapCoverageRow(row: CoverageRow): Guarantee {
    const metadata = (row.metadata || {}) as Record<string, any>;
    const categoryFromMeta = metadata.category;
    const categoryFromRow = row.type;
    const category: GuaranteeCategory =
      isGuaranteeCategory(categoryFromMeta)
        ? categoryFromMeta
        : isGuaranteeCategory(categoryFromRow)
        ? (categoryFromRow as GuaranteeCategory)
        : DEFAULT_CATEGORY;
    const calculationMethod =
      (metadata.calculationMethod as CalculationMethodType | undefined) ||
      (row.calculation_type as CalculationMethodType);
    const franchiseOptionsRaw = metadata.franchiseOptions;
    const franchiseOptions = Array.isArray(franchiseOptionsRaw)
      ? franchiseOptionsRaw
          .map((value: any) => Number(value))
          .filter((value) => Number.isFinite(value))
      : undefined;
    const parameters = metadata.parameters && typeof metadata.parameters === 'object' ? metadata.parameters : undefined;
    const minValue = this.sanitizeNumber(metadata.minValue);
    const maxValue = this.sanitizeNumber(metadata.maxValue);
    const rate = this.sanitizeNumber(metadata.rate);
    const fixedAmount = this.sanitizeNumber(metadata.fixedAmount);

    // Récupérer le fixed_amount depuis les règles de tarification si disponible
    const tariffRules = (row as any).coverage_tariff_rules || [];
    const fixedAmountFromRules = tariffRules.length > 0
      ? this.sanitizeNumber(tariffRules.find((rule: any) => rule.fixed_amount != null)?.fixed_amount)
      : undefined;

    const guarantee: Guarantee = {
      id: row.id,
      name: row.name,
      code:
        this.normalizeCode(row.code) ||
        (metadata.code && String(metadata.code)) ||
        this.normalizeCode(row.name) ||
        row.id,
      category,
      description: row.description ?? (metadata.description as string | undefined) ?? '',
      calculationMethod,
      isOptional: !row.is_mandatory,
      isActive: row.is_active,
      conditions: metadata.conditions ?? undefined,
      minValue,
      maxValue,
      rate,
      fixedAmount: fixedAmountFromRules || fixedAmount || metadata.fixedAmount || undefined,
      franchiseOptions,
      parameters,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
      createdBy: metadata.createdBy ?? row.created_by ?? 'system',
    };

    return guarantee;
  }

  private async getCurrentUserId(): Promise<string | null> {
    try {
      const { data } = await supabase.auth.getUser();
      return data.user?.id ?? null;
    } catch (error) {
      logger.warn('GuaranteeService.getCurrentUserId: unable to retrieve user', error);
      return null;
    }
  }

  private async upsertFixedAmountRule(
    coverageId: string,
    amount: number | null | undefined,
    parameters?: Record<string, any>
  ): Promise<void> {
    if (amount === undefined) {
      return;
    }

    try {
      const { data: existing, error: fetchError } = await supabase
        .from('coverage_tariff_rules')
        .select('id')
        .eq('coverage_id', coverageId)
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        logger.error('GuaranteeService.upsertFixedAmountRule: fetch error', fetchError);
        throw fetchError;
      }

      if (amount === null) {
        if (existing?.id) {
          const { error: deleteError } = await supabase
            .from('coverage_tariff_rules')
            .delete()
            .eq('id', existing.id);

          if (deleteError) {
            logger.error('GuaranteeService.upsertFixedAmountRule: delete error', deleteError);
            throw deleteError;
          }
        }
        return;
      }

      const payload = {
        fixed_amount: amount,
        conditions: parameters ?? {},
        is_active: true,
      };

      if (existing?.id) {
        const { error: updateError } = await supabase
          .from('coverage_tariff_rules')
          .update(payload)
          .eq('id', existing.id);

        if (updateError) {
          logger.error('GuaranteeService.upsertFixedAmountRule: update error', updateError);
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from('coverage_tariff_rules')
          .insert({
            coverage_id: coverageId,
            ...payload,
          });

        if (insertError) {
          logger.error('GuaranteeService.upsertFixedAmountRule: insert error', insertError);
          throw insertError;
        }
      }
    } catch (error) {
      logger.error('GuaranteeService.upsertFixedAmountRule: unexpected error', error);
      throw error instanceof Error ? error : new Error("Impossible d'enregistrer le tarif fixe");
    }
  }

  private async fetchCoverageRow(id: string): Promise<CoverageRow | null> {
    const { data, error } = await supabase
      .from('coverages')
      .select('id, code, type, name, description, calculation_type, is_mandatory, is_active, metadata, created_by, created_at, updated_at, display_order, coverage_tariff_rules:coverage_tariff_rules(fixed_amount, conditions)')
      .eq('id', id)
      .single();

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data as CoverageRow;
  }

  // Gestion des garanties
  async getGuarantees(): Promise<Guarantee[]> {
    if (this.useMockData) {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    }

    try {
      const { data, error } = await supabase
        .from('coverages')
        .select(
          'id, code, type, name, description, calculation_type, is_mandatory, is_active, metadata, created_by, created_at, updated_at, display_order, coverage_tariff_rules:coverage_tariff_rules(fixed_amount, conditions)'
        )
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('GuaranteeService.getGuarantees: Supabase error', error);
        throw error;
      }

      return (data || []).map((row) => this.mapCoverageRow(row as CoverageRow));
    } catch (error) {
      logger.error('GuaranteeService.getGuarantees: unexpected error', error);
      throw error instanceof Error ? error : new Error('Impossible de charger les garanties');
    }
  }

  async getGuarantee(id: string): Promise<Guarantee | null> {
    if (this.useMockData) {
      const guarantees = await this.getGuarantees();
      return guarantees.find(g => g.id === id) || null;
    }

    try {
      const row = await this.fetchCoverageRow(id);
      return row ? this.mapCoverageRow(row) : null;
    } catch (error) {
      logger.error('GuaranteeService.getGuarantee: Supabase error', error);
      throw error instanceof Error ? error : new Error('Impossible de récupérer la garantie');
    }
  }

  async getGuaranteesByCategory(category: GuaranteeCategory): Promise<Guarantee[]> {
    if (this.useMockData) {
      const guarantees = await this.getGuarantees();
      return guarantees.filter(g => g.category === category && g.isActive);
    }

    const guarantees = await this.getGuarantees();
    return guarantees.filter((g) => g.category === category && g.isActive);
  }

  async createGuarantee(data: GuaranteeFormData): Promise<Guarantee> {
    if (this.useMockData) {
      const guarantees = await this.getGuarantees();
      const newGuarantee: Guarantee = {
        ...data,
        category: data.category || DEFAULT_CATEGORY,
        id: Math.random().toString(36).substr(2, 9),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'current-user'
      };

      guarantees.push(newGuarantee);
      localStorage.setItem(this.storageKey, JSON.stringify(guarantees));
      return newGuarantee;
    }

    const normalizedCode =
      this.normalizeCode(data.code) ||
      this.normalizeCode(data.name) ||
      null;
    const userId = await this.getCurrentUserId();
    const metadata = this.buildMetadataFromForm(data, {
      createdBy: userId ?? 'system',
    });
    const fallbackCode =
      this.normalizeCode(`${data.name}-${Date.now()}`) ??
      `GAR_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const finalCode = normalizedCode ?? fallbackCode;
    metadata.code = finalCode;
    metadata.category = data.category || DEFAULT_CATEGORY;
    metadata.isOptional = data.isOptional;

    const payload: {
      code: string;
      type: string;
      name: string;
      description: string | null;
      calculation_type: string;
      is_mandatory: boolean;
      is_active: boolean;
      metadata: Record<string, any>;
      display_order?: number;
      created_by?: string;
    } = {
      code: finalCode,
      type: this.mapCategoryToCoverageType(data.category),
      name: data.name,
      description: data.description ?? null,
      calculation_type: data.calculationMethod,
      is_mandatory: !data.isOptional,
      is_active: true,
      metadata,
      display_order: Math.floor(Date.now() / 1000),
    };

    if (userId) {
      payload.created_by = userId;
    }

    try {
      const { data: inserted, error } = await supabase
        .from('coverages')
        .insert(payload)
        .select(
          'id, code, type, name, description, calculation_type, is_mandatory, is_active, metadata, created_by, created_at, updated_at, display_order'
        )
        .single();

      if (error) {
        logger.error('GuaranteeService.createGuarantee: Supabase error', error);
        throw error;
      }

      const coverage = this.mapCoverageRow(inserted as CoverageRow);
      const sanitizedFixedAmount = this.sanitizeNumber(data.fixedAmount);

      if (data.calculationMethod === 'FIXED_AMOUNT') {
        await this.upsertFixedAmountRule(
          coverage.id,
          sanitizedFixedAmount ?? null,
          (metadata.parameters as Record<string, any>) ?? {}
        );
      }

      return coverage;
    } catch (error) {
      logger.error('GuaranteeService.createGuarantee: unexpected error', error);
      throw error instanceof Error ? error : new Error('Impossible de créer la garantie');
    }
  }

  async updateGuarantee(id: string, data: Partial<GuaranteeFormData>): Promise<Guarantee> {
    if (this.useMockData) {
      const guarantees = await this.getGuarantees();
      const index = guarantees.findIndex(g => g.id === id);
      if (index === -1) {
        throw new Error('Garantie non trouvée');
      }

      guarantees[index] = {
        ...guarantees[index],
        ...data,
        updatedAt: new Date()
      };

      localStorage.setItem(this.storageKey, JSON.stringify(guarantees));
      return guarantees[index];
    }

    try {
      const row = await this.fetchCoverageRow(id);
      if (!row) {
        throw new Error('Garantie non trouvée');
      }

      const updatePayload: Record<string, any> = {};
      if (data.name !== undefined) updatePayload.name = data.name;
      if (data.description !== undefined) updatePayload.description = data.description ?? null;
      if (data.calculationMethod !== undefined) updatePayload.calculation_type = data.calculationMethod;
      if (data.isOptional !== undefined) updatePayload.is_mandatory = !data.isOptional;
      if (data.code !== undefined) {
        const normalized = this.normalizeCode(data.code);
        updatePayload.code = normalized ?? row.code;
      }
      if (data.category !== undefined) {
        updatePayload.type = this.mapCategoryToCoverageType(data.category);
      }

      const mergedMetadata = this.buildMetadataFromForm(data, (row.metadata as Record<string, any>) || {});
      updatePayload.metadata = mergedMetadata;

      const { error } = await supabase.from('coverages').update(updatePayload).eq('id', id);
      if (error) {
        logger.error('GuaranteeService.updateGuarantee: Supabase error', error);
        throw error;
      }

      const sanitizedInstruction =
        data.fixedAmount !== undefined ? this.sanitizeNumber(data.fixedAmount) ?? null : undefined;
      const shouldRemoveFixedRule =
        data.calculationMethod !== undefined && data.calculationMethod !== 'FIXED_AMOUNT';

      if (sanitizedInstruction !== undefined) {
        await this.upsertFixedAmountRule(id, sanitizedInstruction, mergedMetadata.parameters as Record<string, any> | undefined);
      } else if (shouldRemoveFixedRule) {
        await this.upsertFixedAmountRule(id, null);
      }

      const refreshed = await this.fetchCoverageRow(id);
      if (!refreshed) {
        throw new Error('Garantie introuvable après mise à jour');
      }
      return this.mapCoverageRow(refreshed);
    } catch (error) {
      logger.error('GuaranteeService.updateGuarantee: unexpected error', error);
      throw error instanceof Error ? error : new Error('Impossible de mettre à jour la garantie');
    }
  }
  async deleteGuarantee(id: string): Promise<void> {
    if (this.useMockData) {
      const guarantees = await this.getGuarantees();
      const index = guarantees.findIndex(g => g.id === id);
      if (index === -1) {
        throw new Error('Garantie non trouvée');
      }

      guarantees.splice(index, 1);
      localStorage.setItem(this.storageKey, JSON.stringify(guarantees));
      return;
    }

    try {
      const { error } = await supabase.from('coverages').delete().eq('id', id);
      if (error) {
        logger.error('GuaranteeService.deleteGuarantee: Supabase error', error);
        throw error;
      }
    } catch (error) {
      logger.error('GuaranteeService.deleteGuarantee: unexpected error', error);
      throw error instanceof Error ? error : new Error('Impossible de supprimer la garantie');
    }
  }

  async toggleGuarantee(id: string): Promise<Guarantee> {
    if (this.useMockData) {
      const guarantee = await this.getGuarantee(id);
      if (!guarantee) {
        throw new Error('Garantie non trouvée');
      }

      return this.updateGuarantee(id, { isActive: !guarantee.isActive });
    }

    const guarantee = await this.getGuarantee(id);
    if (!guarantee) {
      throw new Error('Garantie non trouvée');
    }

    try {
      const { error } = await supabase
        .from('coverages')
        .update({ is_active: !guarantee.isActive })
        .eq('id', id);

      if (error) {
        logger.error('GuaranteeService.toggleGuarantee: Supabase error', error);
        throw error;
      }

      const refreshed = await this.fetchCoverageRow(id);
      return refreshed ? this.mapCoverageRow(refreshed) : { ...guarantee, isActive: !guarantee.isActive };
    } catch (error) {
      logger.error('GuaranteeService.toggleGuarantee: unexpected error', error);
      throw error instanceof Error ? error : new Error('Impossible de modifier le statut de la garantie');
    }
  }

  // Gestion des packages
  async getPackages(): Promise<InsurancePackage[]> {
    const data = localStorage.getItem(this.packagesStorageKey);
    return data ? JSON.parse(data) : [];
  }

  async getPackage(id: string): Promise<InsurancePackage | null> {
    const packages = await this.getPackages();
    return packages.find(p => p.id === id) || null;
  }

  async createPackage(data: PackageFormData): Promise<InsurancePackage> {
    const packages = await this.getPackages();
    const newPackage: InsurancePackage = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      totalPrice: data.basePrice,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user'
    };

    packages.push(newPackage);
    localStorage.setItem(this.packagesStorageKey, JSON.stringify(packages));
    return newPackage;
  }

  async updatePackage(id: string, data: Partial<PackageFormData>): Promise<InsurancePackage> {
    const packages = await this.getPackages();
    const index = packages.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Package non trouvé');
    }

    packages[index] = {
      ...packages[index],
      ...data,
      updatedAt: new Date()
    };

    localStorage.setItem(this.packagesStorageKey, JSON.stringify(packages));
    return packages[index];
  }

  async deletePackage(id: string): Promise<void> {
    const packages = await this.getPackages();
    const index = packages.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Package non trouvé');
    }

    packages.splice(index, 1);
    localStorage.setItem(this.packagesStorageKey, JSON.stringify(packages));
  }

  async togglePackage(id: string): Promise<InsurancePackage> {
    const pkg = await this.getPackage(id);
    if (!pkg) {
      throw new Error('Package non trouvé');
    }

    return this.updatePackage(id, { isActive: !pkg.isActive });
  }

  // Gestion des grilles de tarification
  async getTarificationGrids(): Promise<TarificationGrids> {
    const data = localStorage.getItem(this.gridsStorageKey);
    return data ? JSON.parse(data) : {
      tarifRC: [],
      tarifICIPT: [],
      tarifTCMTCL: [],
      tarifFixes: []
    };
  }

  // Les méthodes de mise à jour de grilles complexes ont été supprimées avec la simplification

  async updateTarifFixes(data: TarifFixe[]): Promise<void> {
    const grids = await this.getTarificationGrids();
    grids.tarifFixes = data;
    localStorage.setItem(this.gridsStorageKey, JSON.stringify(grids));
  }

  // Statistiques
  async getTarificationStats(): Promise<TarificationStats> {
    const guarantees = await this.getGuarantees();
    const packages = await this.getPackages();

    const activeGuarantees = guarantees.filter(g => g.isActive).length;
    const activePackages = packages.filter(p => p.isActive).length;

    // Simuler les garanties les plus utilisées
    const mostUsedGuarantees = guarantees.slice(0, 5).map(g => ({
      guaranteeId: g.id,
      guaranteeName: g.name,
      usageCount: Math.floor(Math.random() * 100) + 10
    }));

    const averagePackagePrice = packages.length > 0
      ? packages.reduce((sum, p) => sum + p.totalPrice, 0) / packages.length
      : 0;

    const prices = packages.map(p => p.totalPrice);
    const priceRange = {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0
    };

    return {
      totalGuarantees: guarantees.length,
      activeGuarantees,
      totalPackages: packages.length,
      activePackages,
      mostUsedGuarantees,
      averagePackagePrice,
      priceRange
    };
  }

  // Grilles de tarification RC
  async getTarificationRC(): Promise<TarifRC[]> {
    // Essayer de charger depuis Supabase
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase
        .from('tarif_rc')
        .select('id, category, energy, power_min, power_max, prime, is_active')
        .eq('is_active', true)
        .order('energy', { ascending: true })
        .order('power_min', { ascending: true });

      if (!error && data && Array.isArray(data)) {
        logger.auth('Loaded RC tariffs from database:', data.length);
        return data.map(row => this.mapTarifRcRow(row));
      }
    } catch (err) {
      logger.warn('Failed to load RC tariffs from database, using defaults:', err);
    }

    // Retourner les données initiales par défaut
    return initialTarifRC;
  }

  // CRUD operations pour les tarifs RC
  async createTarifRC(tarif: Omit<TarifRC, 'id'>): Promise<TarifRC> {
    const { supabase } = await import('@/lib/supabase');

    const { data, error } = await supabase
      .from('tarif_rc')
      .insert({
        category: tarif.category,
        energy: tarif.energy,
        power_min: tarif.powerMin,
        power_max: tarif.powerMax,
        prime: tarif.prime,
        is_active: true
      })
      .select('id, category, energy, power_min, power_max, prime')
      .single();

    if (error) {
      logger.error('Error creating RC tariff:', error);
      throw new Error(`Erreur lors de la création: ${error.message}`);
    }

    logger.info('RC tariff created:', data);
    return this.mapTarifRcRow(data);
  }

  async updateTarifRC(id: string, tarif: Partial<TarifRC>): Promise<TarifRC> {
    const { supabase } = await import('@/lib/supabase');

    const payload: Record<string, any> = {};
    if (tarif.category !== undefined) payload.category = tarif.category;
    if (tarif.energy !== undefined) payload.energy = tarif.energy;
    if (tarif.powerMin !== undefined) payload.power_min = tarif.powerMin;
    if (tarif.powerMax !== undefined) payload.power_max = tarif.powerMax;
    if (tarif.prime !== undefined) payload.prime = tarif.prime;

    const { data, error } = await supabase
      .from('tarif_rc')
      .update(payload)
      .eq('id', id)
      .select('id, category, energy, power_min, power_max, prime')
      .single();

    if (error) {
      logger.error('Error updating RC tariff:', error);
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
    }

    logger.info('RC tariff updated:', data);
    return this.mapTarifRcRow(data);
  }

  async deleteTarifRC(id: string): Promise<void> {
    const { supabase } = await import('@/lib/supabase');

    const { error } = await supabase
      .from('tarif_rc')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting RC tariff:', error);
      throw new Error(`Erreur lors de la suppression: ${error.message}`);
    }

    logger.info('RC tariff deleted:', id);
  }

  // Catégories de garanties
  getGuaranteeCategories(): { value: GuaranteeCategory; label: string }[] {
    return [
      { value: 'RESPONSABILITE_CIVILE', label: 'Responsabilité Civile' },
      { value: 'DEFENSE_RECOURS', label: 'Défense et Recours' },
      { value: 'INDIVIDUELLE_CONDUCTEUR', label: 'Individuelle Conducteur' },
      { value: 'INDIVIDUELLE_PASSAGERS', label: 'Individuelle Passagers' },
      { value: 'INCENDIE', label: 'Incendie' },
      { value: 'VOL', label: 'Vol' },
      { value: 'VOL_MAINS_ARMEES', label: 'Vol à mains armées' },
      { value: 'BRIS_GLACES', label: 'Bris de glaces' },
      { value: 'TIERCE_COMPLETE', label: 'Tierce Complète' },
      { value: 'TIERCE_COLLISION', label: 'Tierce Collision' },
      { value: 'ASSISTANCE', label: 'Assistance' },
      { value: 'AVANCE_RECOURS', label: 'Avance sur recours' },
      { value: 'ACCESSOIRES', label: 'Accessoires' }
    ];
  }

  // Méthodes de calcul
  getCalculationMethods(): { value: CalculationMethodType; label: string; description: string }[] {
    return [
      {
        value: 'FREE',
        label: 'Gratuit',
        description: 'Prime nulle (gratuite)'
      },
      {
        value: 'FIXED_AMOUNT',
        label: 'Montant Fixe',
        description: 'Prime fixe indépendante du véhicule'
      },
      {
        value: 'RATE_ON_SI',
        label: 'Taux sur Valeur Assurée',
        description: 'Pourcentage appliqué sur la valeur vénale'
      },
      {
        value: 'RATE_ON_NEW_VALUE',
        label: 'Taux sur Valeur Neuve',
        description: 'Pourcentage appliqué sur la valeur neuve'
      },
      {
        value: 'MTPL_TARIFF',
        label: 'Grille Responsabilité Civile',
        description: 'Basé sur la grille officielle RC'
      },
      {
        value: 'TCM_TCL_MATRIX',
        label: 'Matrice Tierce',
        description: 'Basé sur la grille TCM/TCL'
      },
      {
        value: 'IC_IPT_FORMULA',
        label: 'Formule IC/IPT',
        description: 'Basé sur la grille IC/IPT'
      },
      {
        value: 'CONDITIONAL_RATE',
        label: 'Taux Conditionnel',
        description: 'Taux variable selon conditions'
      }
    ];
  }
}

export const guaranteeService = new GuaranteeService();

// Fournit les garanties par défaut intégrées (sans utiliser le stockage local)
// Utile comme repli d'affichage en environnement de dev si la base est vide
export function getBuiltinDefaultGuarantees(): Guarantee[] {
  return initialGuarantees;
}
