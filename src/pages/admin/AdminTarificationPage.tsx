import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { guaranteeService, getBuiltinDefaultGuarantees } from '@/features/tarification/services/guaranteeService';
import {
  tarificationSupabaseService,
  type FixedTariffItem,
  type FixedCoverageOption,
} from '@/features/tarification/services/tarificationSupabaseService'
import {
  Guarantee,
  GuaranteeFormData,
  CalculationMethodType,
  TierceFranchiseOptionType,
  TierceCapConfig,
  TarifFixe,
  TarifFixeFormData,
  TarifRC,
  TarifRCFormData,
  FireTheftConfig,
  IPTFormulaConfig,
  IPTConfig,
  IPTPlacesTariff,
  VariableBasedConfig,
  VariableSourceType,
  MatrixBasedConfig,
  MatrixTariff
} from '@/types/tarification';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Shield,
  Calculator,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Eye,
  Copy,
  FileText,
  Grid3X3,
  Database,
  Car,
  Zap,
  Fuel,
  DollarSign,
  Percent,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const FIRE_THEFT_DEFAULT_CONFIG: FireTheftConfig = {
  enabled: true,
  includeFireComponent: true,
  includeBaseTheftComponent: true,
  includeArmedTheftComponent: false,
  fireRatePercent: 0.42,
  theftRateBelowThresholdPercent: 1.1,
  theftRateAboveThresholdPercent: 2.1,
  armedTheftRateBelowThresholdPercent: 1.6,
  armedTheftRateAboveThresholdPercent: 2.2,
  sumInsuredThreshold: 25_000_000,
  autoLinkTheft: true,
};

const THEFT_ARMED_DEFAULT_CONFIG: FireTheftConfig = {
  enabled: true,
  includeFireComponent: false,
  includeBaseTheftComponent: true,
  includeArmedTheftComponent: true,
  fireRatePercent: 0,
  theftRateBelowThresholdPercent: 1.1,
  theftRateAboveThresholdPercent: 2.1,
  armedTheftRateBelowThresholdPercent: 1.6,
  armedTheftRateAboveThresholdPercent: 2.2,
  sumInsuredThreshold: 25_000_000,
  autoLinkTheft: false,
};

const GLASS_ROOF_DEFAULT_CONFIG = {
  enabled: true,
  ratePercent: 0.42,
};

const GLASS_STANDARD_DEFAULT_CONFIG = {
  enabled: true,
  ratePercent: 0.4,
};

const TIERCE_CAP_DEFAULT_CONFIG = {
  selectedOption: 'NONE' as TierceFranchiseOptionType,
  options: [
    {
      type: 'NONE' as TierceFranchiseOptionType,
      label: 'Sans franchise',
      ratePercent: 8,
      deductionPercent: 0,
    },
    {
      type: 'FRANCHISE_250' as TierceFranchiseOptionType,
      label: 'Franchise 250 000 FCFA',
      franchiseAmount: 250000,
      ratePercent: 7,
      deductionPercent: 20,
    },
    {
      type: 'FRANCHISE_500' as TierceFranchiseOptionType,
      label: 'Franchise 500 000 FCFA',
      franchiseAmount: 500000,
      ratePercent: 6,
      deductionPercent: 30,
    },
  ],
};

const getGlassRoofDefault = () => ({ ...GLASS_ROOF_DEFAULT_CONFIG });
const getGlassStandardDefault = () => ({ ...GLASS_STANDARD_DEFAULT_CONFIG });
const getTierceCapDefault = () => ({
  selectedOption: TIERCE_CAP_DEFAULT_CONFIG.selectedOption,
  options: TIERCE_CAP_DEFAULT_CONFIG.options.map(option => ({ ...option })),
});

// Helper pour IC_IPT_FORMULA (Individuelle Conducteur)
const getICIPTDefault = () => ({
  defaultFormula: 1,
  formulas: [
    {
      formula: 1,
      capitalDeces: 1000000,
      capitalInvalidite: 2000000,
      fraisMedicaux: 100000,
      prime: 5500,
      label: 'Formule 1'
    },
    {
      formula: 2,
      capitalDeces: 3000000,
      capitalInvalidite: 6000000,
      fraisMedicaux: 400000,
      prime: 8400,
      label: 'Formule 2'
    },
    {
      formula: 3,
      capitalDeces: 5000000,
      capitalInvalidite: 10000000,
      fraisMedicaux: 500000,
      prime: 15900,
      label: 'Formule 3'
    }
  ]
});

// Helper pour IPT_PLACES_FORMULA (Individuelle Personnes Transportées)
const getIPTPlacesDefault = () => ({
  defaultFormula: 1,
  formulas: [
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
        { places: 8, prime: 25400, label: '8 places' }
      ]
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
        { places: 8, prime: 32000, label: '8 places' }
      ]
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
        { places: 8, prime: 35000, label: '8 places' }
      ]
    }
  ]
});

// Helper pour MTPL_TARIFF (Responsabilité Civile)
const getMTPLDefault = () => ({
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
});

const getDynamicCoverageDefault = (method: CalculationMethodType): FireTheftConfig => {
  if (method === 'THEFT_ARMED') {
    return { ...THEFT_ARMED_DEFAULT_CONFIG };
  }
  return { ...FIRE_THEFT_DEFAULT_CONFIG };
};

export const AdminTarificationPage: React.FC = () => {
  // Important: wait for real authentication before loading data
  const { user, isAuthenticated, isLoading, isInitializing } = useAuth();
  const [guarantees, setGuarantees] = useState<Guarantee[]>([]);
  const [tarifFixes, setTarifFixes] = useState<FixedTariffItem[]>([]);
  const [fixedCoverageOptions, setFixedCoverageOptions] = useState<FixedCoverageOption[]>([])
  const [freeCoverages, setFreeCoverages] = useState<Array<{ id: string; name: string; isMandatory: boolean }>>([])
  const [selectedCoverageId, setSelectedCoverageId] = useState<string>('')
  const [availableFormulas, setAvailableFormulas] = useState<string[]>([])
  const [selectedFormulaName, setSelectedFormulaName] = useState<string>('')

  // États pour la Responsabilité Civile
  const [tarifRC, setTarifRC] = useState<TarifRC[]>([])
  const [showRCEditForm, setShowRCEditForm] = useState(false)
  const [editingRC, setEditingRC] = useState<TarifRC | null>(null)
  const [searchRCEnergy, setSearchRCEnergy] = useState<'Tous' | 'Essence' | 'Diesel'>('Tous')

  // Fonctions CRUD pour les tarifs RC
  const handleCreateRC = async (tarif: Omit<TarifRC, 'id'>) => {
    try {
      setLoading(true)
      const newTarif = await guaranteeService.createTarifRC(tarif)
      setTarifRC(prev => [...prev, newTarif])
      toast.success('Tranche tarifaire créée avec succès')
      setShowRCEditForm(false)
      setEditingRC(null)
    } catch (error) {
      logger.error('Error creating RC tariff:', error)
      toast.error('Erreur lors de la création de la tranche tarifaire')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRC = async (id: string, tarif: Partial<TarifRC>) => {
    try {
      setLoading(true)
      const updatedTarif = await guaranteeService.updateTarifRC(id, tarif)
      setTarifRC(prev => prev.map(t => t.id === id ? updatedTarif : t))
      toast.success('Tranche tarifaire mise à jour avec succès')
      setShowRCEditForm(false)
      setEditingRC(null)
    } catch (error) {
      logger.error('Error updating RC tariff:', error)
      toast.error('Erreur lors de la mise à jour de la tranche tarifaire')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRC = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tranche tarifaire ?')) {
      return
    }

    try {
      setLoading(true)
      await guaranteeService.deleteTarifRC(id)
      setTarifRC(prev => prev.filter(t => t.id !== id))
      toast.success('Tranche tarifaire supprimée avec succès')
    } catch (error) {
      logger.error('Error deleting RC tariff:', error)
      toast.error('Erreur lors de la suppression de la tranche tarifaire')
    } finally {
      setLoading(false)
    }
  }
  const [statistics, setStatistics] = useState<{
    totalGuarantees: number;
    activeGuarantees: number;
    priceRange: { min: number; max: number };
    mostUsedGuarantees: Array<{
      guaranteeId: string;
      guaranteeName: string;
      usageCount: number;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateGuaranteeDialogOpen, setIsCreateGuaranteeDialogOpen] = useState(false);
  const [isCreatingGuarantee, setIsCreatingGuarantee] = useState(false);
  const [isEditGuaranteeDialogOpen, setIsEditGuaranteeDialogOpen] = useState(false);
  const [showInactive, setShowInactive] = useState(true);
  const [selectedGuarantee, setSelectedGuarantee] = useState<Guarantee | null>(null);
  const [selectedTarifFixe, setSelectedTarifFixe] = useState<FixedTariffItem | null>(null);

  const [newGuarantee, setNewGuarantee] = useState<GuaranteeFormData>({
    name: '',
    code: '',
    category: 'RESPONSABILITE_CIVILE',
    description: '',
    calculationMethod: 'FIXED_AMOUNT',
    isOptional: true,
    parameters: undefined
  });
  const [existingGuaranteeCodes, setExistingGuaranteeCodes] = useState<string[]>([]);

  // Générer automatiquement le code lorsque le nom change
  const generateCodeFromName = async (name: string) => {
    if (!name.trim()) {
      setNewGuarantee(prev => ({ ...prev, code: '' }));
      return;
    }

    try {
      // Récupérer les garanties existantes si pas déjà chargées
      if (existingGuaranteeCodes.length === 0) {
        const guarantees = await guaranteeService.getGuarantees();
        const codes = guarantees.map(g => g.code);
        setExistingGuaranteeCodes(codes);
      }

      // Générer le code automatiquement
      const generatedCode = guaranteeService.generateGuaranteeCode(name, existingGuaranteeCodes);
      setNewGuarantee(prev => ({ ...prev, code: generatedCode }));
    } catch (error) {
      console.error('Erreur lors de la génération du code:', error);
      // En cas d'erreur, générer un code de base
      const fallbackCode = name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 8) || `GAR_${Date.now().toString().slice(-6)}`;
      setNewGuarantee(prev => ({ ...prev, code: fallbackCode }));
    }
  };

  // Gérer le changement du nom pour générer automatiquement le code
  const handleGuaranteeNameChange = async (value: string) => {
    setNewGuarantee(prev => ({ ...prev, name: value }));
    await generateCodeFromName(value);
  };

  const [isCreateTarifFixeDialogOpen, setIsCreateTarifFixeDialogOpen] = useState(false);
  const [isEditTarifFixeDialogOpen, setIsEditTarifFixeDialogOpen] = useState(false);
  const [newTarifFixe, setNewTarifFixe] = useState<TarifFixeFormData>({
    guaranteeName: '',
    prime: 0,
    conditions: '',
    packPriceReduced: undefined,
  });

  useEffect(() => {
    // Load data only when the session is confirmed AND initialization is complete
    // Avoid triggering when we only have a cached preview user (not authenticated yet)
    // OR when we're still fetching the role from the database
    if (!isLoading && !isInitializing && isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, isLoading, isInitializing]);

  // Petit utilitaire pour éviter qu'un appel réseau bloque l'écran de chargement
  const withTimeout = async <T,>(promise: Promise<T>, ms = 1500, fallback: T): Promise<T> => {
    return await Promise.race<Promise<T>>([
      promise,
      new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
    ])
  }

  const loadData = async () => {
    try {
      setLoading(true);
      logger.debug('AdminTarificationPage.loadData: start')
      logger.debug('AdminTarificationPage.loadData: calling listAdminCoverages')
      const supaGuaranteesData = await withTimeout(
        tarificationSupabaseService
          .listAdminCoverages()
          .then(rows => {
            logger.debug(`AdminTarificationPage.loadData: received ${rows.length} rows from Supabase`)
            return rows.map(row => {
              const metadata = (row.metadata || {}) as Record<string, any>
              const parameters = metadata.parameters as Guarantee['parameters'] | undefined
              const category = (metadata.category as Guarantee['category']) || 'RESPONSABILITE_CIVILE'
              const description =
                row.description ||
                (metadata.description as string | undefined) ||
                ''
              const existingCode =
                row.code ||
                (metadata.code as string | undefined) ||
                ''
              const fallbackCode = (row.name || '')
                .trim()
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
                .slice(0, 8)
              return {
                id: row.id,
                name: row.name,
                code: existingCode || fallbackCode || 'GAR',
                category,
                description,
                calculationMethod:
                  (metadata.calculationMethod as CalculationMethodType | undefined) ||
                  (row.calculation_type as CalculationMethodType),
                isOptional: !row.is_mandatory,
                isActive: row.is_active,
                fixedAmount: row.fixed_amount ?? undefined,
                parameters,
                minValue: typeof metadata.minValue === 'number' ? metadata.minValue : undefined,
                maxValue: typeof metadata.maxValue === 'number' ? metadata.maxValue : undefined,
                rate: typeof metadata.rate === 'number' ? metadata.rate : undefined,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'supabase'
              } as Guarantee
            })
          })
          .catch((err) => {
            logger.error('Erreur de chargement des garanties (DB):', err)
            toast.error("Impossible de charger les garanties depuis la base")
            return [] as Guarantee[]
          }),
        10000, // Augmenté à 10 secondes
        [] as Guarantee[]
      )
      logger.debug(`AdminTarificationPage.loadData: final supaGuaranteesData length: ${supaGuaranteesData.length}`)

      const [statsData, grids, fixedTariffs, fixedOptions, freeCov, rcData] = await Promise.all([
        guaranteeService.getTarificationStats(),
        guaranteeService.getTarificationGrids(), // fallback data only
        // Protège contre un Supabase local non démarré en dev
        withTimeout(
          tarificationSupabaseService.listFixedTariffs().catch(() => []),
          5000,
          [] as FixedTariffItem[]
        ),
        withTimeout(
          tarificationSupabaseService.listFixedCoverageOptions().catch(() => []),
          5000,
          [] as FixedCoverageOption[]
        ),
        withTimeout(
          tarificationSupabaseService.listFreeCoverages().catch(() => []),
          5000,
          [] as Array<{ id: string; name: string; isMandatory: boolean }>
        ),
        // Charger les tarifs RC
        guaranteeService.getTarificationRC().catch(() => [])
      ]);

      // Fallback only if explicitly allowed via env flag
      let finalGuarantees = supaGuaranteesData
      const allowFallback = (import.meta as any).env?.VITE_ALLOW_GUARANTEE_FALLBACK === 'true'
      if (allowFallback && (!Array.isArray(finalGuarantees) || finalGuarantees.length === 0)) {
        try {
          if ((import.meta as any).env?.VITE_MOCK_DATA === 'true') {
            const local = await guaranteeService.getGuarantees()
            if (Array.isArray(local) && local.length > 0) finalGuarantees = local as any
          }
        } catch (_) {
          // ignore
        }
        if ((!finalGuarantees || finalGuarantees.length === 0) && allowFallback) {
          finalGuarantees = getBuiltinDefaultGuarantees() as any
          logger.warn('AdminTarificationPage.loadData: using built-in default guarantees as fallback')
        }
      }

      setGuarantees(finalGuarantees);
      setStatistics(statsData);
      setTarifFixes(fixedTariffs as FixedTariffItem[]);
      setFixedCoverageOptions(fixedOptions as FixedCoverageOption[])
      setFreeCoverages(freeCov)
      setTarifRC(rcData || grids.tarifRC || [])
      logger.debug('AdminTarificationPage.loadData: done', {
        guarantees: Array.isArray(supaGuaranteesData) ? supaGuaranteesData.length : 'n/a',
        fixedTariffs: Array.isArray(fixedTariffs) ? fixedTariffs.length : 'n/a',
        fixedOptions: Array.isArray(fixedOptions) ? fixedOptions.length : 'n/a',
        freeCoverages: Array.isArray(freeCov) ? freeCov.length : 'n/a',
        rcTarifs: Array.isArray(rcData) ? rcData.length : 'n/a',
      })
    } catch (error) {
      logger.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données de tarification');
    } finally {
      setLoading(false);
    }
  };

  // ---- Tarifs Fixes CRUD ----
  const handleCreateTarifFixe = async () => {
    try {
      if (!selectedCoverageId || !newTarifFixe.prime) {
        toast.error('Sélectionnez une garantie et saisissez une prime');
        return;
      }

      await tarificationSupabaseService.createFixedTariff({
        coverageId: selectedCoverageId,
        fixedAmount: Number(newTarifFixe.prime) || 0,
        formulaName: selectedFormulaName || undefined,
        conditionsText: newTarifFixe.conditions || undefined,
        packPriceReduced:
          newTarifFixe.packPriceReduced === undefined || newTarifFixe.packPriceReduced === null
            ? undefined
            : Number(newTarifFixe.packPriceReduced),
      })

      const refreshed = await tarificationSupabaseService.listFixedTariffs()
      setTarifFixes(refreshed)
      setIsCreateTarifFixeDialogOpen(false);
      setNewTarifFixe({ guaranteeName: '', prime: 0, conditions: '', packPriceReduced: undefined });
      setSelectedCoverageId('')
      setSelectedFormulaName('')
      toast.success('Tarif fixe créé');
    } catch (error) {
      logger.error('Error creating fixed tariff:', error);
      toast.error('Erreur lors de la création du tarif');
    }
  };

  const openEditTarifFixeDialog = (tarif: FixedTariffItem) => {
    setSelectedTarifFixe(tarif);
    setNewTarifFixe({
      guaranteeName: `${tarif.coverageName}${tarif.formulaName ? ' - ' + tarif.formulaName : ''}`,
      prime: tarif.fixedAmount,
      conditions: tarif.conditions || '',
      packPriceReduced: tarif.packPriceReduced ?? undefined,
    });
    setSelectedCoverageId(tarif.coverageId)
    setSelectedFormulaName(tarif.formulaName || '')
    setIsEditTarifFixeDialogOpen(true);
  };

  const handleUpdateTarifFixe = async () => {
    if (!selectedTarifFixe) return;
    try {
      if (!selectedCoverageId || !newTarifFixe.prime) {
        toast.error('Sélectionnez une garantie et saisissez une prime');
        return;
      }

      await tarificationSupabaseService.updateFixedTariff(selectedTarifFixe.id, {
        coverageId: selectedCoverageId,
        fixedAmount: Number(newTarifFixe.prime) || 0,
        formulaName: selectedFormulaName || null,
        conditionsText: newTarifFixe.conditions ?? null,
        packPriceReduced:
          newTarifFixe.packPriceReduced === undefined || newTarifFixe.packPriceReduced === null
            ? null
            : Number(newTarifFixe.packPriceReduced),
      })

      const refreshed = await tarificationSupabaseService.listFixedTariffs()
      setTarifFixes(refreshed)
      setIsEditTarifFixeDialogOpen(false);
      setSelectedTarifFixe(null);
      setNewTarifFixe({ guaranteeName: '', prime: 0, conditions: '', packPriceReduced: undefined });
      setSelectedCoverageId('')
      setSelectedFormulaName('')
      toast.success('Tarif fixe mis à jour');
    } catch (error) {
      logger.error('Error updating fixed tariff:', error);
      toast.error('Erreur lors de la mise à jour du tarif');
    }
  };

  const handleDeleteTarifFixe = async (id: string) => {
    if (!confirm('Supprimer ce tarif fixe ?')) return;
    try {
      await tarificationSupabaseService.deleteFixedTariff(id)
      const refreshed = await tarificationSupabaseService.listFixedTariffs()
      setTarifFixes(refreshed)
      toast.success('Tarif fixe supprimé');
    } catch (error) {
      logger.error('Error deleting fixed tariff:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleCreateGuarantee = async () => {
    try {
      if (isCreatingGuarantee) return
      setIsCreatingGuarantee(true)
      const missing: string[] = []
      const method = newGuarantee.calculationMethod
      
      // Validation améliorée avec messages plus précis
      if (!newGuarantee.name?.trim()) {
        missing.push('Nom de la garantie')
      }
      // Le code est généré automatiquement, pas besoin de valider
      if (!method) {
        missing.push('Méthode de calcul')
      }

      const needsRate = ['RATE_ON_SI', 'RATE_ON_NEW_VALUE', 'CONDITIONAL_RATE'].includes(method as string)
      if (needsRate && (!newGuarantee.rate || Number.isNaN(newGuarantee.rate) || (newGuarantee.rate as number) <= 0)) {
        missing.push('Taux (%)')
      }
      const isFixed = method === 'FIXED_AMOUNT'
      if (isFixed && (!newGuarantee.fixedAmount || Number.isNaN(newGuarantee.fixedAmount) || (newGuarantee.fixedAmount as number) <= 0)) {
        missing.push('Montant fixe (FCFA)')
      }

      if (missing.length > 0) {
        logger.warn('handleCreateGuarantee: missing fields', missing)
        toast.error(`Champs obligatoires manquants: ${missing.join(', ')}`, {
          description: 'Veuillez compléter les informations requises avant de continuer.',
          duration: 5000
        })
        return
      }

      // Normaliser les champs selon la méthode choisie
      const payload: GuaranteeFormData = { ...newGuarantee }
      if (!payload.code || !payload.code.trim()) {
        const auto = (payload.name || '')
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 8)
        payload.code = auto || 'GAR'
      }
      if (method === 'FREE') {
        payload.rate = undefined
        payload.minValue = undefined
        payload.maxValue = undefined
        payload.fixedAmount = undefined
      } else if (method === 'FIXED_AMOUNT') {
        payload.rate = undefined
        payload.minValue = undefined
        payload.maxValue = undefined
      } else if (method === 'FIRE_THEFT' || method === 'THEFT_ARMED') {
        payload.rate = undefined
        payload.minValue = undefined
        payload.maxValue = undefined
        payload.fixedAmount = undefined
        payload.parameters = {
          ...(payload.parameters ?? {}),
          fireTheftConfig:
            payload.parameters?.fireTheftConfig ?? {
              ...getDynamicCoverageDefault(method),
              enabled: true,
            },
        }
      } else if (method === 'GLASS_ROOF') {
        payload.rate = undefined
        payload.minValue = undefined
        payload.maxValue = undefined
        payload.fixedAmount = undefined
        payload.parameters = {
          ...(payload.parameters ?? {}),
          glassRoofConfig: payload.parameters?.glassRoofConfig ?? getGlassRoofDefault(),
        }
      } else if (method === 'IC_IPT_FORMULA') {
        payload.rate = undefined
        payload.minValue = undefined
        payload.maxValue = undefined
        payload.fixedAmount = undefined
        payload.parameters = {
          ...(payload.parameters ?? {}),
          icIptConfig: payload.parameters?.icIptConfig ?? getICIPTDefault(),
        }
      } else if (method === 'IPT_PLACES_FORMULA') {
        payload.rate = undefined
        payload.minValue = undefined
        payload.maxValue = undefined
        payload.fixedAmount = undefined
        payload.parameters = {
          ...(payload.parameters ?? {}),
          iptConfig: payload.parameters?.iptConfig ?? getIPTPlacesDefault(),
        }
      } else if (method === 'MTPL_TARIFF') {
        payload.rate = undefined
        payload.minValue = undefined
        payload.maxValue = undefined
        payload.fixedAmount = undefined
        payload.parameters = {
          ...(payload.parameters ?? {}),
          mtplTariffConfig: payload.parameters?.mtplTariffConfig ?? getMTPLDefault(),
        }
      } else if (['RATE_ON_SI', 'RATE_ON_NEW_VALUE', 'CONDITIONAL_RATE'].includes(method as string)) {
        payload.fixedAmount = undefined
      }

      logger.api('handleCreateGuarantee: payload', payload)
      // Try Supabase first (with timeout to avoid UI freeze if PostgREST is not ready)
      try {
        const coverageId = await withTimeout(
          tarificationSupabaseService.createCoverage({
            name: payload.name,
            calculationMethod: payload.calculationMethod,
            isOptional: payload.isOptional,
            code: payload.code,
            description: payload.description,
          }),
          4000,
          null as unknown as string
        )
        if (!coverageId) {
          logger.warn('handleCreateGuarantee: Supabase create timed out, fallback to local')
          await guaranteeService.createGuarantee(payload)
        } else {
          logger.api('handleCreateGuarantee: created coverage in Supabase', { coverageId })
          await guaranteeService.updateGuarantee(coverageId, payload)
          if (method === 'FIXED_AMOUNT' && payload.fixedAmount) {
            await tarificationSupabaseService.upsertCoverageFixedTariff(coverageId, payload.fixedAmount)
            logger.api('handleCreateGuarantee: upserted fixed tariff', { coverageId, fixedAmount: payload.fixedAmount })
          }
        }
      } catch (e) {
        // Fallback local storage in dev
        logger.warn('handleCreateGuarantee: Supabase create failed, fallback to local', e)
        await guaranteeService.createGuarantee(payload)
      }
      setIsCreateGuaranteeDialogOpen(false);
      setNewGuarantee({
        name: '',
        code: '',
        category: 'RESPONSABILITE_CIVILE',
        description: '',
        calculationMethod: 'FIXED_AMOUNT',
        isOptional: true,
        parameters: undefined
      });
      toast.success('Garantie créée avec succès');
      loadData();
    } catch (error) {
      logger.error('Error creating guarantee:', error);
      toast.error('Erreur lors de la création de la garantie');
    } finally {
      setIsCreatingGuarantee(false)
    }
  };

  const handleUpdateGuarantee = async () => {
    try {
      if (!selectedGuarantee) return

      const missing: string[] = []
      const method = newGuarantee.calculationMethod
      
      // Validation améliorée avec messages plus précis
      if (!newGuarantee.name?.trim()) {
        missing.push('Nom de la garantie')
      }
      // Le code est généré automatiquement, pas besoin de valider
      if (!method) {
        missing.push('Méthode de calcul')
      }

      const needsRate = ['RATE_ON_SI', 'RATE_ON_NEW_VALUE', 'CONDITIONAL_RATE'].includes(method as string)
      if (needsRate && (!newGuarantee.rate || Number.isNaN(newGuarantee.rate) || (newGuarantee.rate as number) <= 0)) {
        missing.push('Taux (%)')
      }
      const isFixed = method === 'FIXED_AMOUNT'
      if (isFixed && (!newGuarantee.fixedAmount || Number.isNaN(newGuarantee.fixedAmount) || (newGuarantee.fixedAmount as number) <= 0)) {
        missing.push('Montant fixe (FCFA)')
      }

      if (missing.length > 0) {
        logger.warn('handleUpdateGuarantee: missing fields', missing)
        toast.error(`Champs obligatoires manquants: ${missing.join(', ')}`, {
          description: 'Veuillez compléter les informations requises avant de continuer.',
          duration: 5000
        })
        return
      }

      // Normaliser les champs selon la méthode choisie
      const payload: Partial<GuaranteeFormData> = { ...newGuarantee }
      if (!payload.code || (typeof payload.code === 'string' && !payload.code.trim())) {
        const auto = (payload.name || '')
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 8)
        payload.code = auto || 'GAR'
      }
      if (method === 'FREE') {
        payload.rate = undefined
        payload.minValue = undefined
        payload.maxValue = undefined
        payload.fixedAmount = undefined
      } else if (method === 'FIXED_AMOUNT') {
        payload.rate = undefined
        payload.minValue = undefined
        payload.maxValue = undefined
      } else if (method === 'FIRE_THEFT' || method === 'THEFT_ARMED') {
        payload.rate = undefined
        payload.minValue = undefined
        payload.maxValue = undefined
        payload.fixedAmount = undefined
        payload.parameters = {
          ...(payload.parameters ?? {}),
          fireTheftConfig:
            payload.parameters?.fireTheftConfig ?? {
              ...getDynamicCoverageDefault(method),
              enabled: true,
            },
        }
      } else if (method === 'GLASS_ROOF') {
        payload.rate = undefined
        payload.minValue = undefined
        payload.maxValue = undefined
        payload.fixedAmount = undefined
        payload.parameters = {
          ...(payload.parameters ?? {}),
          glassRoofConfig: payload.parameters?.glassRoofConfig ?? getGlassRoofDefault(),
        }
      } else if (method === 'IC_IPT_FORMULA') {
        payload.rate = undefined
        payload.minValue = undefined
        payload.maxValue = undefined
        payload.fixedAmount = undefined
        payload.parameters = {
          ...(payload.parameters ?? {}),
          icIptConfig: payload.parameters?.icIptConfig ?? getICIPTDefault(),
        }
      } else if (method === 'IPT_PLACES_FORMULA') {
        payload.rate = undefined
        payload.minValue = undefined
        payload.maxValue = undefined
        payload.fixedAmount = undefined
        payload.parameters = {
          ...(payload.parameters ?? {}),
          iptConfig: payload.parameters?.iptConfig ?? getIPTPlacesDefault(),
        }
      } else if (method === 'MTPL_TARIFF') {
        payload.rate = undefined
        payload.minValue = undefined
        payload.maxValue = undefined
        payload.fixedAmount = undefined
        payload.parameters = {
          ...(payload.parameters ?? {}),
          mtplTariffConfig: payload.parameters?.mtplTariffConfig ?? getMTPLDefault(),
        }
      } else if (['RATE_ON_SI', 'RATE_ON_NEW_VALUE', 'CONDITIONAL_RATE'].includes(method as string)) {
        payload.fixedAmount = undefined
      }

      logger.api('handleUpdateGuarantee: payload', { id: selectedGuarantee.id, payload })
      try {
        await tarificationSupabaseService.updateCoverageDetails(selectedGuarantee.id, {
          name: payload.name!,
          calculationMethod: payload.calculationMethod!,
          isOptional: payload.isOptional!,
        })
        logger.api('handleUpdateGuarantee: updated coverage in Supabase', { id: selectedGuarantee.id })
        await guaranteeService.updateGuarantee(selectedGuarantee.id, payload)
        if (method === 'FIXED_AMOUNT' && payload.fixedAmount) {
          await tarificationSupabaseService.upsertCoverageFixedTariff(selectedGuarantee.id, payload.fixedAmount)
          logger.api('handleUpdateGuarantee: upserted fixed tariff', { id: selectedGuarantee.id, fixedAmount: payload.fixedAmount })
        }
      } catch (e) {
        logger.warn('handleUpdateGuarantee: Supabase update failed, fallback to local', e)
        await guaranteeService.updateGuarantee(selectedGuarantee.id, payload)
      }
      setIsEditGuaranteeDialogOpen(false);
      setSelectedGuarantee(null);
      setNewGuarantee({
        name: '',
        code: '',
        category: 'RESPONSABILITE_CIVILE',
        description: '',
        calculationMethod: 'FIXED_AMOUNT',
        isOptional: true,
        parameters: undefined
      });
      loadData();
    } catch (error) {
      logger.error('Error updating guarantee:', error);
    }
  };

  const handleDeleteGuarantee = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette garantie ?')) {
      return;
    }

    try {
      try {
        await tarificationSupabaseService.deleteCoverage(id)
        logger.api('handleDeleteGuarantee: deleted coverage in Supabase', { id })
      } catch (e) {
        logger.warn('handleDeleteGuarantee: Supabase delete failed, fallback to local', e)
        await guaranteeService.deleteGuarantee(id)
      }
      loadData();
    } catch (error) {
      logger.error('Error deleting guarantee:', error);
    }
  };

  const handleToggleGuarantee = async (id: string) => {
    try {
      const found = guarantees.find(g => g.id === id)
      if (found) {
        try {
          await tarificationSupabaseService.updateCoverageDetails(id, { isActive: !found.isActive })
          logger.api('handleToggleGuarantee: toggled in Supabase', { id, to: !found.isActive })
        } catch (e) {
          logger.warn('handleToggleGuarantee: Supabase toggle failed, fallback to local', e)
          await guaranteeService.toggleGuarantee(id)
        }
      }
      loadData();
    } catch (error) {
      logger.error('Error toggling guarantee:', error);
    }
  };

  const openEditGuaranteeDialog = (guarantee: Guarantee) => {
    setSelectedGuarantee(guarantee);
    setNewGuarantee({
      name: guarantee.name,
      code: guarantee.code,
      category: guarantee.category,
      description: guarantee.description,
      calculationMethod: guarantee.calculationMethod,
      isOptional: guarantee.isOptional,
      conditions: guarantee.conditions,
      minValue: guarantee.minValue,
      maxValue: guarantee.maxValue,
      rate: guarantee.rate,
      franchiseOptions: guarantee.franchiseOptions,
      parameters: guarantee.parameters
    });
    setIsEditGuaranteeDialogOpen(true);
  };

  const filteredGuarantees = guarantees.filter(guarantee => {
    const matchesSearch = `${guarantee.name} ${guarantee.code} ${guarantee.description || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesActive = showInactive ? true : guarantee.isActive;
    return matchesSearch && matchesActive;
  });

  const calculationMethods = guaranteeService.getCalculationMethods();
  const selectableCalculationMethods = calculationMethods.filter(
    (m) => ['FREE', 'FIXED_AMOUNT', 'VARIABLE_BASED', 'MATRIX_BASED'].includes(m.value)
  );

  const removeFireTheftConfig = (parameters?: Guarantee['parameters']) => {
    if (!parameters || !parameters.fireTheftConfig) {
      return parameters;
    }
    const { fireTheftConfig: _removed, ...rest } = parameters;
    return Object.keys(rest).length > 0 ? rest : undefined;
  };

  const removeGlassRoofConfig = (parameters?: Guarantee['parameters']) => {
    if (!parameters || !parameters.glassRoofConfig) {
      return parameters;
    }
    const { glassRoofConfig: _removed, ...rest } = parameters;
    return Object.keys(rest).length > 0 ? rest : undefined;
  };

  const removeGlassStandardConfig = (parameters?: Guarantee['parameters']) => {
    if (!parameters || !parameters.glassStandardConfig) {
      return parameters;
    }
    const { glassStandardConfig: _removed, ...rest } = parameters;
    return Object.keys(rest).length > 0 ? rest : undefined;
  };

  // Configuration pour les tarifs RC
  const updateMTPLTariffConfig = (updates: any) => {
    setNewGuarantee((prev) => {
      const nextParams = { ...(prev.parameters ?? {}) };
      nextParams.mtplTariffConfig = {
        ...(nextParams.mtplTariffConfig ?? {}),
        ...updates,
      };
      return {
        ...prev,
        parameters: nextParams,
      };
    });
  };

  const handleTarifChange = (key: string, value: string) => {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return;
    }
    updateMTPLTariffConfig({ [key]: parsed });
  };

  // Configuration pour IC/IPT Formules
  const updateICIPTConfig = (updates: any) => {
    setNewGuarantee((prev) => {
      const nextParams = { ...(prev.parameters ?? {}) };
      nextParams.icIptConfig = {
        ...(nextParams.icIptConfig ?? {}),
        ...updates,
      };
      return {
        ...prev,
        parameters: nextParams,
      };
    });
  };

  const handleFormulaChange = (formulaNumber: number, field: string, value: string) => {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return;
    }

    setNewGuarantee((prev) => {
      const nextParams = { ...(prev.parameters ?? {}) };
      const currentConfig = nextParams.icIptConfig ?? { defaultFormula: 1, formulas: [] };
      const formulas = [...(currentConfig.formulas ?? [])];

      // Trouver ou créer la formule
      let formula = formulas.find(f => f.formula === formulaNumber);
      if (!formula) {
        formula = {
          formula: formulaNumber,
          capitalDeces: 0,
          capitalInvalidite: 0,
          fraisMedicaux: 0,
          prime: 0,
          label: `Formule ${formulaNumber}`
        };
        formulas.push(formula);
      }

      // Mettre à jour le champ
      (formula as any)[field] = parsed;

      nextParams.icIptConfig = {
        ...currentConfig,
        formulas
      };

      return {
        ...prev,
        parameters: nextParams,
      };
    });
  };

  const handleDefaultFormulaChange = (value: string) => {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 3) {
      return;
    }
    updateICIPTConfig({ defaultFormula: parsed });
  };

  // Configuration pour IPT Formules par places
  const updateIPTConfig = (updates: any) => {
    setNewGuarantee((prev) => {
      const nextParams = { ...(prev.parameters ?? {}) };
      nextParams.iptConfig = {
        ...(nextParams.iptConfig ?? {}),
        ...updates,
      };
      return {
        ...prev,
        parameters: nextParams,
      };
    });
  };

  const handleIPTFormulaChange = (formulaNumber: number, field: string, value: string) => {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return;
    }

    setNewGuarantee((prev) => {
      const nextParams = { ...(prev.parameters ?? {}) };
      const currentConfig = nextParams.iptConfig ?? { defaultFormula: 1, formulas: [] };
      const formulas = [...(currentConfig.formulas ?? [])];

      // Trouver ou créer la formule
      let formula = formulas.find(f => f.formula === formulaNumber);
      if (!formula) {
        formula = {
          formula: formulaNumber,
          capitalDeces: 0,
          capitalInvalidite: 0,
          fraisMedicaux: 0,
          prime: 0,
          label: `Formule ${formulaNumber}`,
          placesTariffs: []
        };
        formulas.push(formula);
      }

      // Mettre à jour le champ
      (formula as any)[field] = parsed;

      nextParams.iptConfig = {
        ...currentConfig,
        formulas
      };

      return {
        ...prev,
        parameters: nextParams,
      };
    });
  };

  const handleIPTPlacesTariffChange = (formulaNumber: number, places: number, value: string) => {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return;
    }

    setNewGuarantee((prev) => {
      const nextParams = { ...(prev.parameters ?? {}) };
      const currentConfig = nextParams.iptConfig ?? { defaultFormula: 1, formulas: [] };
      const formulas = [...(currentConfig.formulas ?? [])];

      // Trouver ou créer la formule
      let formula = formulas.find(f => f.formula === formulaNumber);
      if (!formula) {
        formula = {
          formula: formulaNumber,
          capitalDeces: 0,
          capitalInvalidite: 0,
          fraisMedicaux: 0,
          prime: 0,
          label: `Formule ${formulaNumber}`,
          placesTariffs: []
        };
        formulas.push(formula);
      }

      // S'assurer que placesTariffs existe
      if (!formula.placesTariffs) {
        formula.placesTariffs = [];
      }

      // Trouver ou créer le tarif pour ce nombre de places
      let placesTariff = formula.placesTariffs.find(t => t.places === places);
      if (!placesTariff) {
        placesTariff = {
          places,
          prime: 0,
          label: `${places} places`
        };
        formula.placesTariffs.push(placesTariff);
      }

      // Mettre à jour la prime
      placesTariff.prime = parsed;

      nextParams.iptConfig = {
        ...currentConfig,
        formulas
      };

      return {
        ...prev,
        parameters: nextParams,
      };
    });
  };

  const handleIPTDefaultFormulaChange = (value: string) => {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 3) {
      return;
    }
    updateIPTConfig({ defaultFormula: parsed });
  };

  const removeTierceCapConfig = (parameters?: Guarantee['parameters']) => {
    if (!parameters || !parameters.tierceCapConfig) {
      return parameters;
    }
    const { tierceCapConfig: _removed, ...rest } = parameters;
    return Object.keys(rest).length > 0 ? rest : undefined;
  };

  const setFireTheftConfigEnabled = (enabled: boolean) => {
    if (newGuarantee.calculationMethod !== 'FIRE_THEFT') {
      return;
    }
    setNewGuarantee((prev) => {
      if (!enabled) {
        return {
          ...prev,
          parameters: removeFireTheftConfig(prev.parameters),
        };
      }
      const nextParams = { ...(prev.parameters ?? {}) };
      const defaults = getDynamicCoverageDefault(prev.calculationMethod);
      const current = nextParams.fireTheftConfig ?? defaults;
      nextParams.fireTheftConfig = {
        ...defaults,
        ...current,
        enabled: true,
      };
      return { ...prev, parameters: nextParams };
    });
  };

  const updateFireTheftConfig = (updates: Partial<FireTheftConfig>) => {
    setNewGuarantee((prev) => {
      const nextParams = { ...(prev.parameters ?? {}) };
      const baseConfig = nextParams.fireTheftConfig
        ? { ...nextParams.fireTheftConfig }
        : { ...getDynamicCoverageDefault(prev.calculationMethod), enabled: true };
      nextParams.fireTheftConfig = {
        ...baseConfig,
        ...updates,
        enabled: true,
      };
      return { ...prev, parameters: nextParams };
    });
  };

  const updateTierceCapConfig = (updater: (config: TierceCapConfig) => TierceCapConfig) => {
    setNewGuarantee(prev => {
      const nextParams = { ...(prev.parameters ?? {}) };
      const current =
        nextParams.tierceCapConfig
          ? {
              ...nextParams.tierceCapConfig,
              options: nextParams.tierceCapConfig.options.map(option => ({ ...option })),
            }
          : getTierceCapDefault();
      const updated = updater({
        ...current,
        options: current.options.map(option => ({ ...option })),
      });
      nextParams.tierceCapConfig = updated;
      return { ...prev, parameters: nextParams };
    });
  };

  const handleCalculationMethodChange = (value: CalculationMethodType) => {
    setNewGuarantee((prev) => {
      let nextParams = prev.parameters;
      if (value === 'FIRE_THEFT' || value === 'THEFT_ARMED') {
        const defaults = getDynamicCoverageDefault(value);
        const existing = nextParams?.fireTheftConfig ?? {};
        nextParams = {
          ...(nextParams ?? {}),
          fireTheftConfig: {
            ...defaults,
            ...existing,
            enabled: existing.enabled ?? true,
          },
        };
        nextParams = removeGlassRoofConfig(nextParams);
        nextParams = removeGlassStandardConfig(nextParams);
        nextParams = removeTierceCapConfig(nextParams);
      } else if (value === 'GLASS_ROOF') {
        nextParams = {
          ...(nextParams ?? {}),
          glassRoofConfig: nextParams?.glassRoofConfig ?? getGlassRoofDefault(),
        };
        nextParams = removeFireTheftConfig(nextParams);
        nextParams = removeGlassStandardConfig(nextParams);
        nextParams = removeTierceCapConfig(nextParams);
      } else if (value === 'GLASS_STANDARD') {
        nextParams = {
          ...(nextParams ?? {}),
          glassStandardConfig: nextParams?.glassStandardConfig ?? getGlassStandardDefault(),
        };
        nextParams = removeFireTheftConfig(nextParams);
        nextParams = removeGlassRoofConfig(nextParams);
        nextParams = removeTierceCapConfig(nextParams);
      } else if (value === 'TIERCE_COMPLETE_CAP' || value === 'TIERCE_COLLISION_CAP') {
        nextParams = {
          ...(nextParams ?? {}),
          tierceCapConfig: nextParams?.tierceCapConfig ?? getTierceCapDefault(),
        };
        nextParams = removeFireTheftConfig(nextParams);
        nextParams = removeGlassRoofConfig(nextParams);
        nextParams = removeGlassStandardConfig(nextParams);
      } else if (value === 'IC_IPT_FORMULA') {
        nextParams = {
          ...(nextParams ?? {}),
          icIptConfig: nextParams?.icIptConfig ?? getICIPTDefault(),
        };
        nextParams = removeFireTheftConfig(nextParams);
        nextParams = removeGlassRoofConfig(nextParams);
        nextParams = removeGlassStandardConfig(nextParams);
        nextParams = removeTierceCapConfig(nextParams);
      } else if (value === 'IPT_PLACES_FORMULA') {
        nextParams = {
          ...(nextParams ?? {}),
          iptConfig: nextParams?.iptConfig ?? getIPTPlacesDefault(),
        };
        nextParams = removeFireTheftConfig(nextParams);
        nextParams = removeGlassRoofConfig(nextParams);
        nextParams = removeGlassStandardConfig(nextParams);
        nextParams = removeTierceCapConfig(nextParams);
      } else if (value === 'MTPL_TARIFF') {
        nextParams = {
          ...(nextParams ?? {}),
          mtplTariffConfig: nextParams?.mtplTariffConfig ?? getMTPLDefault(),
        };
        nextParams = removeFireTheftConfig(nextParams);
        nextParams = removeGlassRoofConfig(nextParams);
        nextParams = removeGlassStandardConfig(nextParams);
        nextParams = removeTierceCapConfig(nextParams);
      } else {
        nextParams = removeFireTheftConfig(nextParams);
        nextParams = removeGlassRoofConfig(nextParams);
        nextParams = removeGlassStandardConfig(nextParams);
        nextParams = removeTierceCapConfig(nextParams);
      }

      return {
        ...prev,
        calculationMethod: value,
        parameters: nextParams,
      };
    });
  };

  const renderFireTheftConfigSection = () => {
    const method = newGuarantee.calculationMethod;
    if (method !== 'FIRE_THEFT' && method !== 'THEFT_ARMED') {
      return null;
    }

    const config = newGuarantee.parameters?.fireTheftConfig;
    const defaults = getDynamicCoverageDefault(method);
    const resolvedConfig = {
      ...defaults,
      ...(config ?? {}),
    };

    const handlePercentChange = (key: keyof FireTheftConfig) => (value: string) => {
      const parsed = parseFloat(value);
      if (!Number.isFinite(parsed)) {
        return;
      }
      updateFireTheftConfig({ [key]: parsed } as Partial<FireTheftConfig>);
    };

    const handleThresholdChange = (value: string) => {
      const parsed = parseInt(value, 10);
      if (!Number.isFinite(parsed)) {
        return;
      }
      updateFireTheftConfig({ sumInsuredThreshold: parsed });
    };

    if (method === 'THEFT_ARMED') {
      return (
        <Card className="border border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Configuration Vol + Vol à mains armées</CardTitle>
            <CardDescription>
              Deux composantes s&apos;additionnent sur la valeur vénale selon le seuil SI (25M FCFA par défaut).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Seuil valeur assurée (FCFA)</Label>
                <Input
                  type="number"
                  value={resolvedConfig.sumInsuredThreshold ?? ''}
                  onChange={(e) => handleThresholdChange(e.target.value)}
                  placeholder="25000000"
                />
              </div>
            </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Taux Vol simple (≤ seuil) (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={resolvedConfig.theftRateBelowThresholdPercent ?? ''}
                  onChange={(e) => handlePercentChange('theftRateBelowThresholdPercent')(e.target.value)}
                  placeholder="1.1"
                />
              </div>
              <div>
                <Label>Taux Vol simple (&gt; seuil) (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={resolvedConfig.theftRateAboveThresholdPercent ?? ''}
                  onChange={(e) => handlePercentChange('theftRateAboveThresholdPercent')(e.target.value)}
                  placeholder="2.1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Taux Vol à mains armées (≤ seuil) (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={resolvedConfig.armedTheftRateBelowThresholdPercent ?? ''}
                  onChange={(e) => handlePercentChange('armedTheftRateBelowThresholdPercent')(e.target.value)}
                  placeholder="1.6"
                />
              </div>
              <div>
                <Label>Taux Vol à mains armées (&gt; seuil) (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={resolvedConfig.armedTheftRateAboveThresholdPercent ?? ''}
                  onChange={(e) => handlePercentChange('armedTheftRateAboveThresholdPercent')(e.target.value)}
                  placeholder="2.2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // FIRE_THEFT UI
    const enabled = resolvedConfig.enabled !== false;
    return (
      <Card className="border border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Configuration Incendie & Vol</CardTitle>
          <CardDescription>
            Les taux s&apos;appliquent sur la valeur vénale fournie par le prospect. Vous pouvez ajuster seuil et
            pourcentages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="fire-theft-enabled"
              checked={enabled}
              onCheckedChange={(checked) => setFireTheftConfigEnabled(Boolean(checked))}
            />
            <div>
              <Label htmlFor="fire-theft-enabled">Activer la formule dynamique</Label>
              <p className="text-xs text-muted-foreground">
                Utilise la valeur vénale saisie lors de la demande de devis.
              </p>
            </div>
          </div>

          {enabled && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Taux Incendie (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={resolvedConfig.fireRatePercent ?? ''}
                    onChange={(e) => handlePercentChange('fireRatePercent')(e.target.value)}
                    placeholder="0.42"
                  />
                  <p className="text-xs text-muted-foreground">Toujours appliqué.</p>
                </div>
                <div>
                  <Label>Seuil valeur assurée (FCFA)</Label>
                  <Input
                    type="number"
                    value={resolvedConfig.sumInsuredThreshold ?? ''}
                    onChange={(e) => handleThresholdChange(e.target.value)}
                    placeholder="25000000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Taux Vol (≤ seuil) (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={resolvedConfig.theftRateBelowThresholdPercent ?? ''}
                    onChange={(e) => handlePercentChange('theftRateBelowThresholdPercent')(e.target.value)}
                    placeholder="1.1"
                  />
                </div>
                <div>
                  <Label>Taux Vol (&gt; seuil) (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={resolvedConfig.theftRateAboveThresholdPercent ?? ''}
                    onChange={(e) => handlePercentChange('theftRateAboveThresholdPercent')(e.target.value)}
                    placeholder="2.1"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="fire-theft-link-vol"
                  checked={!!resolvedConfig.autoLinkTheft}
                  onCheckedChange={(checked) => updateFireTheftConfig({ autoLinkTheft: Boolean(checked) })}
                />
                <div>
                  <Label htmlFor="fire-theft-link-vol">Associer automatiquement Vol simple</Label>
                  <p className="text-xs text-muted-foreground">
                    Permet de regrouper Incendie et Vol dans la même offre.
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderGlassRoofConfigSection = () => {
    if (newGuarantee.calculationMethod !== 'GLASS_ROOF') {
      return null;
    }

    const config = newGuarantee.parameters?.glassRoofConfig ?? getGlassRoofDefault();
    return (
      <Card className="border border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Configuration Bris de glaces – Toits ouvrants</CardTitle>
          <CardDescription>
            Saisissez le pourcentage appliqué sur le prix d&apos;achat (valeur neuve). Par défaut&nbsp;: 0,42&nbsp;%.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Taux (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={config.ratePercent ?? ''}
                onChange={(e) => {
                  const parsed = parseFloat(e.target.value);
                  setNewGuarantee((prev) => ({
                    ...prev,
                    parameters: {
                      ...(prev.parameters ?? {}),
                      glassRoofConfig: {
                        ...getGlassRoofDefault(),
                        ...(prev.parameters?.glassRoofConfig ?? {}),
                        ratePercent: Number.isFinite(parsed) ? parsed : undefined,
                      },
                    },
                  }));
                }}
                placeholder="0.42"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderGlassStandardConfigSection = () => {
    if (newGuarantee.calculationMethod !== 'GLASS_STANDARD') {
      return null;
    }

    const config = newGuarantee.parameters?.glassStandardConfig ?? getGlassStandardDefault();
    return (
      <Card className="border border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Configuration Bris de glaces</CardTitle>
          <CardDescription>
            Taux appliqué sur le prix d&apos;achat / valeur neuve. Par défaut&nbsp;: 0,4&nbsp;%.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Taux (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={config.ratePercent ?? ''}
                onChange={(e) => {
                  const parsed = parseFloat(e.target.value);
                  setNewGuarantee(prev => ({
                    ...prev,
                    parameters: {
                      ...(prev.parameters ?? {}),
                      glassStandardConfig: {
                        ...getGlassStandardDefault(),
                        ...(prev.parameters?.glassStandardConfig ?? {}),
                        ratePercent: Number.isFinite(parsed) ? parsed : undefined,
                      },
                    },
                  }));
                }}
                placeholder="0.4"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTierceCapConfigSection = () => {
    const method = newGuarantee.calculationMethod;
    if (method !== 'TIERCE_COMPLETE_CAP' && method !== 'TIERCE_COLLISION_CAP') {
      return null;
    }

    const config = newGuarantee.parameters?.tierceCapConfig ?? getTierceCapDefault();

    const handleOptionChange = (type: TierceFranchiseOptionType, field: 'ratePercent' | 'deductionPercent', value: string) => {
      const parsed = parseFloat(value);
      updateTierceCapConfig(cfg => ({
        ...cfg,
        options: cfg.options.map(option =>
          option.type === type
            ? {
                ...option,
                [field]: Number.isFinite(parsed) ? parsed : undefined,
              }
            : option
        ),
      }));
    };

    return (
      <Card className="border border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {method === 'TIERCE_COMPLETE_CAP' ? 'Tierce complète plafonnée' : 'Tierce collision plafonnée'}
          </CardTitle>
          <CardDescription>
            Configurez les taux appliqués sur la valeur neuve selon le niveau de franchise.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Franchise appliquée</Label>
            <Select
              value={config.selectedOption}
              onValueChange={(value: TierceFranchiseOptionType) =>
                updateTierceCapConfig(cfg => ({ ...cfg, selectedOption: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {config.options.map(option => (
                  <SelectItem key={option.type} value={option.type}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-6">
            {config.options.map(option => (
              <div key={option.type} className="border rounded-md p-4 space-y-3">
                <div className="font-medium">{option.label}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Taux (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={option.ratePercent ?? ''}
                      onChange={(e) => handleOptionChange(option.type, 'ratePercent', e.target.value)}
                      placeholder="8"
                    />
                  </div>
                  <div>
                    <Label>Réduction (%)</Label>
                    <Input
                      type="number"
                      step="1"
                      value={option.deductionPercent ?? ''}
                      onChange={(e) => handleOptionChange(option.type, 'deductionPercent', e.target.value)}
                      placeholder="20"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderMTPLTariffConfigSection = () => {
    const method = newGuarantee.calculationMethod;
    if (method !== 'MTPL_TARIFF') {
      return null;
    }

    const config = newGuarantee.parameters?.mtplTariffConfig ?? {};

    // Valeurs par défaut basées sur les spécifications
    const defaultTarifs = {
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

    const getTarifValue = (key: string) => {
      return config[key] ?? defaultTarifs[key as keyof typeof defaultTarifs] ?? 0;
    };

    return (
      <Card className="border border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Configuration Responsabilité Civile (JAUNE)</CardTitle>
          <CardDescription>
            Modifiez les tarifs selon la puissance fiscale et le type de moteur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Moteur Essence */}
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Fuel className="h-4 w-4" />
                Moteur Essence
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                  <span className="text-gray-700">1 à 2 CV</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={getTarifValue('essence_1_2')}
                      onChange={(e) => handleTarifChange('essence_1_2', e.target.value)}
                      className="w-28 h-8 text-xs"
                      min="0"
                      step="1000"
                    />
                    <span className="text-xs text-gray-600">FCFA</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                  <span className="text-gray-700">3 à 6 CV</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={getTarifValue('essence_3_6')}
                      onChange={(e) => handleTarifChange('essence_3_6', e.target.value)}
                      className="w-28 h-8 text-xs"
                      min="0"
                      step="1000"
                    />
                    <span className="text-xs text-gray-600">FCFA</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                  <span className="text-gray-700">7 à 9 CV</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={getTarifValue('essence_7_9')}
                      onChange={(e) => handleTarifChange('essence_7_9', e.target.value)}
                      className="w-28 h-8 text-xs"
                      min="0"
                      step="1000"
                    />
                    <span className="text-xs text-gray-600">FCFA</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                  <span className="text-gray-700">10 à 11 CV</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={getTarifValue('essence_10_11')}
                      onChange={(e) => handleTarifChange('essence_10_11', e.target.value)}
                      className="w-28 h-8 text-xs"
                      min="0"
                      step="1000"
                    />
                    <span className="text-xs text-gray-600">FCFA</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                  <span className="text-gray-700">12 CV et plus</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={getTarifValue('essence_12_plus')}
                      onChange={(e) => handleTarifChange('essence_12_plus', e.target.value)}
                      className="w-28 h-8 text-xs"
                      min="0"
                      step="1000"
                    />
                    <span className="text-xs text-gray-600">FCFA</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Moteur Diesel */}
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Car className="h-4 w-4" />
                Moteur Diesel
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded">
                  <span className="text-gray-700">1 CV</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={getTarifValue('diesel_1')}
                      onChange={(e) => handleTarifChange('diesel_1', e.target.value)}
                      className="w-28 h-8 text-xs"
                      min="0"
                      step="1000"
                    />
                    <span className="text-xs text-gray-600">FCFA</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded">
                  <span className="text-gray-700">2 à 4 CV</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={getTarifValue('diesel_2_4')}
                      onChange={(e) => handleTarifChange('diesel_2_4', e.target.value)}
                      className="w-28 h-8 text-xs"
                      min="0"
                      step="1000"
                    />
                    <span className="text-xs text-gray-600">FCFA</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded">
                  <span className="text-gray-700">5 à 6 CV</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={getTarifValue('diesel_5_6')}
                      onChange={(e) => handleTarifChange('diesel_5_6', e.target.value)}
                      className="w-28 h-8 text-xs"
                      min="0"
                      step="1000"
                    />
                    <span className="text-xs text-gray-600">FCFA</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded">
                  <span className="text-gray-700">7 à 8 CV</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={getTarifValue('diesel_7_8')}
                      onChange={(e) => handleTarifChange('diesel_7_8', e.target.value)}
                      className="w-28 h-8 text-xs"
                      min="0"
                      step="1000"
                    />
                    <span className="text-xs text-gray-600">FCFA</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded">
                  <span className="text-gray-700">9 CV et plus</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={getTarifValue('diesel_9_plus')}
                      onChange={(e) => handleTarifChange('diesel_9_plus', e.target.value)}
                      className="w-28 h-8 text-xs"
                      min="0"
                      step="1000"
                    />
                    <span className="text-xs text-gray-600">FCFA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Les tarifs modifiés ici seront appliqués automatiquement lors du calcul
              des primes selon la puissance fiscale et le type de moteur du véhicule.
              Les modifications sont sauvegardées avec la garantie.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderICIPTFormulaConfigSection = () => {
    const method = newGuarantee.calculationMethod;
    if (method !== 'IC_IPT_FORMULA') {
      return null;
    }

    const config = newGuarantee.parameters?.icIptConfig ?? {};

    // Valeurs par défaut basées sur les spécifications
    const defaultFormulas = [
      {
        formula: 1,
        capitalDeces: 1000000,
        capitalInvalidite: 2000000,
        fraisMedicaux: 100000,
        prime: 5500,
        label: 'Formule 1'
      },
      {
        formula: 2,
        capitalDeces: 3000000,
        capitalInvalidite: 6000000,
        fraisMedicaux: 400000,
        prime: 8400,
        label: 'Formule 2'
      },
      {
        formula: 3,
        capitalDeces: 5000000,
        capitalInvalidite: 10000000,
        fraisMedicaux: 500000,
        prime: 15900,
        label: 'Formule 3'
      }
    ];

    const formulas = config.formulas && config.formulas.length > 0
      ? config.formulas
      : defaultFormulas;

    const getFormulaValue = (formulaNumber: number, field: string) => {
      const formula = formulas.find(f => f.formula === formulaNumber);
      return formula ? (formula as any)[field] : defaultFormulas[formulaNumber - 1][field as keyof typeof defaultFormulas[0]];
    };

    return (
      <Card className="border border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Configuration Individuelle Conducteur / Passagers</CardTitle>
          <CardDescription>
            Modifiez les capitaux et primes pour chaque formule de garantie.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sélection de la formule par défaut */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Label className="text-sm font-medium text-blue-900">Formule par défaut</Label>
            <Select
              value={config.defaultFormula?.toString() ?? '1'}
              onValueChange={handleDefaultFormulaChange}
            >
              <SelectTrigger className="w-32 mt-2">
                <SelectValue placeholder="Formule par défaut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Formule 1</SelectItem>
                <SelectItem value="2">Formule 2</SelectItem>
                <SelectItem value="3">Formule 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Configuration des formules */}
          <div className="space-y-6">
            {[1, 2, 3].map(formulaNumber => (
              <div key={formulaNumber} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {formulaNumber}
                  </span>
                  Formule {formulaNumber}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <Label className="text-gray-700">Capital Décès (FCFA)</Label>
                    <Input
                      type="number"
                      value={getFormulaValue(formulaNumber, 'capitalDeces')}
                      onChange={(e) => handleFormulaChange(formulaNumber, 'capitalDeces', e.target.value)}
                      className="mt-1 h-8 text-xs"
                      min="0"
                      step="100000"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-700">Capital Invalidité (FCFA)</Label>
                    <Input
                      type="number"
                      value={getFormulaValue(formulaNumber, 'capitalInvalidite')}
                      onChange={(e) => handleFormulaChange(formulaNumber, 'capitalInvalidite', e.target.value)}
                      className="mt-1 h-8 text-xs"
                      min="0"
                      step="100000"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-700">Frais Médicaux (FCFA)</Label>
                    <Input
                      type="number"
                      value={getFormulaValue(formulaNumber, 'fraisMedicaux')}
                      onChange={(e) => handleFormulaChange(formulaNumber, 'fraisMedicaux', e.target.value)}
                      className="mt-1 h-8 text-xs"
                      min="0"
                      step="10000"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-700">PRIME (FCFA)</Label>
                    <Input
                      type="number"
                      value={getFormulaValue(formulaNumber, 'prime')}
                      onChange={(e) => handleFormulaChange(formulaNumber, 'prime', e.target.value)}
                      className="mt-1 h-8 text-xs font-semibold text-green-700 border-green-200 focus:border-green-400"
                      min="0"
                      step="100"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Les capitaux et primes modifiés ici seront appliqués automatiquement lors du calcul.
              La formule par défaut est sélectionnée automatiquement sauf si une autre est spécifiée manuellement.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderIPTPlacesFormulaConfigSection = () => {
    const method = newGuarantee.calculationMethod;
    if (method !== 'IPT_PLACES_FORMULA') {
      return null;
    }

    const config = newGuarantee.parameters?.iptConfig ?? {};

    // Valeurs par défaut basées sur les spécifications
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
          { places: 8, prime: 25400, label: '8 places' }
        ]
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
          { places: 8, prime: 32000, label: '8 places' }
        ]
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
          { places: 8, prime: 35000, label: '8 places' }
        ]
      }
    ];

    const formulas = config.formulas && config.formulas.length > 0
      ? config.formulas
      : defaultFormulas;

    const getFormulaValue = (formulaNumber: number, field: string) => {
      const formula = formulas.find(f => f.formula === formulaNumber);
      return formula ? (formula as any)[field] : defaultFormulas[formulaNumber - 1][field as keyof typeof defaultFormulas[0]];
    };

    const getPlacesTariffValue = (formulaNumber: number, places: number) => {
      const formula = formulas.find(f => f.formula === formulaNumber);
      if (formula && formula.placesTariffs) {
        const placesTariff = formula.placesTariffs.find(t => t.places === places);
        return placesTariff ? placesTariff.prime : defaultFormulas[formulaNumber - 1].placesTariffs?.find(t => t.places === places)?.prime ?? 0;
      }
      return defaultFormulas[formulaNumber - 1].placesTariffs?.find(t => t.places === places)?.prime ?? 0;
    };

    const placesOptions = [3, 4, 5, 6, 7, 8];

    return (
      <Card className="border border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Configuration Individuelle Personnes Transportées</CardTitle>
          <CardDescription>
            Modifiez les capitaux et les primes selon le nombre de places pour chaque formule.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sélection de la formule par défaut */}
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <Label className="text-sm font-medium text-green-900">Formule par défaut</Label>
            <Select
              value={config.defaultFormula?.toString() ?? '1'}
              onValueChange={handleIPTDefaultFormulaChange}
            >
              <SelectTrigger className="w-32 mt-2">
                <SelectValue placeholder="Formule par défaut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Formule 1</SelectItem>
                <SelectItem value="2">Formule 2</SelectItem>
                <SelectItem value="3">Formule 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Configuration des formules */}
          <div className="space-y-6">
            {[1, 2, 3].map(formulaNumber => (
              <div key={formulaNumber} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {formulaNumber}
                  </span>
                  Formule {formulaNumber}
                </h4>

                {/* Capitaux */}
                <div className="mb-4">
                  <h5 className="text-xs font-medium text-gray-600 mb-2">CAPITAUX PAR PERSONNE</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="text-gray-700">Capital Décès (FCFA)</Label>
                      <Input
                        type="number"
                        value={getFormulaValue(formulaNumber, 'capitalDeces')}
                        onChange={(e) => handleIPTFormulaChange(formulaNumber, 'capitalDeces', e.target.value)}
                        className="mt-1 h-8 text-xs"
                        min="0"
                        step="100000"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-700">Capital Invalidité (FCFA)</Label>
                      <Input
                        type="number"
                        value={getFormulaValue(formulaNumber, 'capitalInvalidite')}
                        onChange={(e) => handleIPTFormulaChange(formulaNumber, 'capitalInvalidite', e.target.value)}
                        className="mt-1 h-8 text-xs"
                        min="0"
                        step="100000"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-700">Frais Médicaux (FCFA)</Label>
                      <Input
                        type="number"
                        value={getFormulaValue(formulaNumber, 'fraisMedicaux')}
                        onChange={(e) => handleIPTFormulaChange(formulaNumber, 'fraisMedicaux', e.target.value)}
                        className="mt-1 h-8 text-xs"
                        min="0"
                        step="10000"
                      />
                    </div>
                  </div>
                </div>

                {/* Tarifs par places */}
                <div>
                  <h5 className="text-xs font-medium text-gray-600 mb-2">PRIMES SELON NOMBRE DE PLACES</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
                    {placesOptions.map(places => (
                      <div key={places} className="bg-gray-50 rounded p-2">
                        <Label className="text-xs text-gray-600">{places} places</Label>
                        <Input
                          type="number"
                          value={getPlacesTariffValue(formulaNumber, places)}
                          onChange={(e) => handleIPTPlacesTariffChange(formulaNumber, places, e.target.value)}
                          className="mt-1 h-8 text-xs font-semibold text-green-700 border-green-200 focus:border-green-400"
                          min="0"
                          step="100"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Les capitaux et primes modifiés ici seront appliqués automatiquement lors du calcul.
              Le tarif applicable est celui correspondant au nombre de places du véhicule (tarif supérieur si pas de correspondance exacte).
              La formule par défaut est sélectionnée automatiquement sauf si une autre est spécifiée manuellement.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Nouvelle fonction de rendu pour VARIABLE_BASED
  const renderVariableBasedConfigSection = () => {
    const method = newGuarantee.calculationMethod;
    if (method !== 'VARIABLE_BASED') {
      return null;
    }

    const config = (newGuarantee.parameters?.variableBased ?? newGuarantee.parameters?.variableBasedConfig) as VariableBasedConfig | undefined;
    const variableSource = config?.variableSource ?? 'VENAL_VALUE';

    return (
      <Card className="border border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Configuration Basée sur une Variable</CardTitle>
          <CardDescription>
            Définissez la variable du véhicule et les tarifs appliqués
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Variable source</Label>
            <select
              className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={variableSource}
              onChange={(e) => {
                const variableSource = e.target.value as VariableSourceType;
                setNewGuarantee(prev => ({
                  ...prev,
                  parameters: {
                    ...prev.parameters,
                    variableBased: {
                      variableSource,
                      ratePercent: 0
                    }
                  }
                }));
              }}
            >
              <option value="VENAL_VALUE">Valeur vénale (taux %)</option>
              <option value="NEW_VALUE">Valeur neuve (taux %)</option>
            </select>
          </div>

          {/* Formulaire standard pour toutes les sources (taux %) */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Taux (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config?.ratePercent ?? ''}
                  onChange={(e) => {
                    const ratePercent = parseFloat(e.target.value);
                    setNewGuarantee(prev => ({
                      ...prev,
                      parameters: {
                        ...prev.parameters,
                        variableBased: {
                          ...prev.parameters?.variableBased,
                          variableSource,
                          ratePercent: Number.isFinite(ratePercent) ? ratePercent : 0
                        }
                      }
                    }));
                  }}
                  placeholder="0.42"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Montant minimum (FCFA) - Optionnel</Label>
                <Input
                  type="number"
                  value={config?.minAmount ?? ''}
                  onChange={(e) => {
                    const minAmount = parseInt(e.target.value, 10);
                    setNewGuarantee(prev => ({
                      ...prev,
                      parameters: {
                        ...prev.parameters,
                        variableBased: {
                          ...prev.parameters?.variableBased,
                          variableSource,
                          ratePercent: config?.ratePercent ?? 0,
                          minAmount: Number.isFinite(minAmount) ? minAmount : undefined
                        }
                      }
                    }));
                  }}
                  placeholder="50000"
                />
              </div>
              <div>
                <Label>Montant maximum (FCFA) - Optionnel</Label>
                <Input
                  type="number"
                  value={config?.maxAmount ?? ''}
                  onChange={(e) => {
                    const maxAmount = parseInt(e.target.value, 10);
                    setNewGuarantee(prev => ({
                      ...prev,
                      parameters: {
                        ...prev.parameters,
                        variableBased: {
                          ...prev.parameters?.variableBased,
                          variableSource,
                          ratePercent: config?.ratePercent ?? 0,
                          maxAmount: Number.isFinite(maxAmount) ? maxAmount : undefined
                        }
                      }
                    }));
                  }}
                  placeholder="500000"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Nouvelle fonction de rendu pour MATRIX_BASED
  const renderMatrixBasedConfigSection = () => {
    const method = newGuarantee.calculationMethod;
    if (method !== 'MATRIX_BASED') {
      return null;
    }

    const config = (newGuarantee.parameters?.matrixBased ?? newGuarantee.parameters?.matrixBasedConfig) as MatrixBasedConfig | undefined;
    const dimension = config?.dimension ?? 'FISCAL_POWER';

    return (
      <Card className="border border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Configuration Basée sur une Matrice</CardTitle>
          <CardDescription>
            Définissez la grille de tarification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Dimension de la matrice</Label>
            <select
              className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={dimension}
              onChange={(e) => {
                const dimension = e.target.value as MatrixBasedConfig['dimension'];
                setNewGuarantee(prev => ({
                  ...prev,
                  parameters: {
                    ...prev.parameters,
                    matrixBased: {
                      dimension,
                      tariffs: [],
                      defaultPrime: config?.defaultPrime
                    }
                  }
                }));
              }}
            >
              <option value="FISCAL_POWER">Puissance fiscale (CV)</option>
              <option value="FUEL_TYPE">Type de carburant</option>
              <option value="VEHICLE_CATEGORY">Catégorie de véhicule (401, 402, etc.)</option>
              <option value="SEATS">Nombre de places</option>
              <option value="FORMULA">Formule (1, 2, 3...)</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Choisissez la dimension unique pour la grille de tarification
            </p>
          </div>

          {/* Formulaire dynamique pour FISCAL_POWER */}
          {dimension === 'FISCAL_POWER' ? (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-900">
                  <strong>Configuration :</strong> Définissez les tarifs selon le type de carburant et la puissance fiscale (CV).
                </p>
              </div>

              {(!config?.tariffs || config.tariffs.length === 0) ? (
                <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                  <Layers className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-4">Aucun tarif configuré</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewGuarantee(prev => ({
                        ...prev,
                        parameters: {
                          ...prev.parameters,
                          matrixBased: {
                            dimension: 'FISCAL_POWER',
                            tariffs: [
                              // Tarifs par défaut pour Essence
                              { key: `essence_1_2_${Date.now()}`, fuelType: 'Essence', fiscalPowerMin: 1, fiscalPowerMax: 2, prime: 68675 },
                              { key: `essence_3_4_${Date.now()}`, fuelType: 'Essence', fiscalPowerMin: 3, fiscalPowerMax: 4, prime: 75000 },
                              { key: `essence_5_7_${Date.now()}`, fuelType: 'Essence', fiscalPowerMin: 5, fiscalPowerMax: 7, prime: 85000 },
                              { key: `essence_8_10_${Date.now()}`, fuelType: 'Essence', fiscalPowerMin: 8, fiscalPowerMax: 10, prime: 95000 },
                              { key: `essence_11_plus_${Date.now()}`, fuelType: 'Essence', fiscalPowerMin: 11, fiscalPowerMax: 99, prime: 110000 },
                              // Tarifs par défaut pour Diesel
                              { key: `diesel_1_2_${Date.now()}`, fuelType: 'Diesel', fiscalPowerMin: 1, fiscalPowerMax: 2, prime: 68675 },
                              { key: `diesel_3_4_${Date.now()}`, fuelType: 'Diesel', fiscalPowerMin: 3, fiscalPowerMax: 4, prime: 75000 },
                              { key: `diesel_5_7_${Date.now()}`, fuelType: 'Diesel', fiscalPowerMin: 5, fiscalPowerMax: 7, prime: 85000 },
                              { key: `diesel_8_10_${Date.now()}`, fuelType: 'Diesel', fiscalPowerMin: 8, fiscalPowerMax: 10, prime: 95000 },
                              { key: `diesel_11_plus_${Date.now()}`, fuelType: 'Diesel', fiscalPowerMin: 11, fiscalPowerMax: 99, prime: 110000 },
                            ]
                          }
                        }
                      }));
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Initialiser avec tarifs par défaut
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Essence */}
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <Fuel className="h-4 w-4 text-blue-600" />
                          Essence
                        </h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newTariffs = [...(config.tariffs || [])];
                            newTariffs.push({
                              key: `essence_custom_${Date.now()}`,
                              fuelType: 'Essence',
                              fiscalPowerMin: 1,
                              fiscalPowerMax: 99,
                              prime: 0
                            });
                            setNewGuarantee(prev => ({
                              ...prev,
                              parameters: {
                                ...prev.parameters,
                                matrixBased: {
                                  dimension: 'FISCAL_POWER',
                                  tariffs: newTariffs
                                }
                              }
                            }));
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Ajouter
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {config.tariffs.filter(t => t.fuelType === 'Essence').map((tariff) => (
                          <div key={tariff.key} className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder="Min CV"
                              value={tariff.fiscalPowerMin}
                              onChange={(e) => {
                                const newMin = parseInt(e.target.value, 10);
                                const newTariffs = [...(config.tariffs || [])];
                                const tariffIdx = newTariffs.findIndex(t => t.key === tariff.key);
                                if (tariffIdx >= 0) {
                                  newTariffs[tariffIdx] = { ...tariff, fiscalPowerMin: Number.isFinite(newMin) ? newMin : 1 };
                                  setNewGuarantee(prev => ({
                                    ...prev,
                                    parameters: {
                                      ...prev.parameters,
                                      matrixBased: {
                                        dimension: 'FISCAL_POWER',
                                        tariffs: newTariffs
                                      }
                                    }
                                  }));
                                }
                              }}
                              className="h-8 w-16 text-sm"
                            />
                            <span className="text-xs text-gray-500">-</span>
                            <Input
                              type="number"
                              placeholder="Max CV"
                              value={tariff.fiscalPowerMax === 99 ? '11+' : tariff.fiscalPowerMax}
                              onChange={(e) => {
                                const val = e.target.value;
                                const newMax = val === '11+' ? 99 : parseInt(val, 10);
                                const newTariffs = [...(config.tariffs || [])];
                                const tariffIdx = newTariffs.findIndex(t => t.key === tariff.key);
                                if (tariffIdx >= 0) {
                                  newTariffs[tariffIdx] = { ...tariff, fiscalPowerMax: Number.isFinite(newMax) ? newMax : 99 };
                                  setNewGuarantee(prev => ({
                                    ...prev,
                                    parameters: {
                                      ...prev.parameters,
                                      matrixBased: {
                                        dimension: 'FISCAL_POWER',
                                        tariffs: newTariffs
                                      }
                                    }
                                  }));
                                }
                              }}
                              className="h-8 w-16 text-sm"
                            />
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">CV</span>
                            <Input
                              type="number"
                              placeholder="Tarif"
                              value={tariff.prime}
                              onChange={(e) => {
                                const newPrime = parseInt(e.target.value, 10);
                                const newTariffs = [...(config.tariffs || [])];
                                const tariffIdx = newTariffs.findIndex(t => t.key === tariff.key);
                                if (tariffIdx >= 0) {
                                  newTariffs[tariffIdx] = { ...tariff, prime: Number.isFinite(newPrime) ? newPrime : 0 };
                                  setNewGuarantee(prev => ({
                                    ...prev,
                                    parameters: {
                                      ...prev.parameters,
                                      matrixBased: {
                                        dimension: 'FISCAL_POWER',
                                        tariffs: newTariffs
                                      }
                                    }
                                  }));
                                }
                              }}
                              className="h-8 w-24 text-sm"
                            />
                            <span className="text-xs text-gray-500">FCFA</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                const newTariffs = config.tariffs?.filter(t => t.key !== tariff.key) ?? [];
                                setNewGuarantee(prev => ({
                                  ...prev,
                                  parameters: {
                                    ...prev.parameters,
                                    matrixBased: {
                                      dimension: 'FISCAL_POWER',
                                      tariffs: newTariffs
                                    }
                                  }
                                }));
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Diesel */}
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <Fuel className="h-4 w-4 text-gray-600" />
                          Diesel
                        </h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newTariffs = [...(config.tariffs || [])];
                            newTariffs.push({
                              key: `diesel_custom_${Date.now()}`,
                              fuelType: 'Diesel',
                              fiscalPowerMin: 1,
                              fiscalPowerMax: 99,
                              prime: 0
                            });
                            setNewGuarantee(prev => ({
                              ...prev,
                              parameters: {
                                ...prev.parameters,
                                matrixBased: {
                                  dimension: 'FISCAL_POWER',
                                  tariffs: newTariffs
                                }
                              }
                            }));
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Ajouter
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {config.tariffs?.filter(t => t.fuelType === 'Diesel').map((tariff) => (
                          <div key={tariff.key} className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder="Min CV"
                              value={tariff.fiscalPowerMin}
                              onChange={(e) => {
                                const newMin = parseInt(e.target.value, 10);
                                const newTariffs = [...(config.tariffs || [])];
                                const tariffIdx = newTariffs.findIndex(t => t.key === tariff.key);
                                if (tariffIdx >= 0) {
                                  newTariffs[tariffIdx] = { ...tariff, fiscalPowerMin: Number.isFinite(newMin) ? newMin : 1 };
                                  setNewGuarantee(prev => ({
                                    ...prev,
                                    parameters: {
                                      ...prev.parameters,
                                      matrixBased: {
                                        dimension: 'FISCAL_POWER',
                                        tariffs: newTariffs
                                      }
                                    }
                                  }));
                                }
                              }}
                              className="h-8 w-16 text-sm"
                            />
                            <span className="text-xs text-gray-500">-</span>
                            <Input
                              type="number"
                              placeholder="Max CV"
                              value={tariff.fiscalPowerMax === 99 ? '11+' : tariff.fiscalPowerMax}
                              onChange={(e) => {
                                const val = e.target.value;
                                const newMax = val === '11+' ? 99 : parseInt(val, 10);
                                const newTariffs = [...(config.tariffs || [])];
                                const tariffIdx = newTariffs.findIndex(t => t.key === tariff.key);
                                if (tariffIdx >= 0) {
                                  newTariffs[tariffIdx] = { ...tariff, fiscalPowerMax: Number.isFinite(newMax) ? newMax : 99 };
                                  setNewGuarantee(prev => ({
                                    ...prev,
                                    parameters: {
                                      ...prev.parameters,
                                      matrixBased: {
                                        dimension: 'FISCAL_POWER',
                                        tariffs: newTariffs
                                      }
                                    }
                                  }));
                                }
                              }}
                              className="h-8 w-16 text-sm"
                            />
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">CV</span>
                            <Input
                              type="number"
                              placeholder="Tarif"
                              value={tariff.prime}
                              onChange={(e) => {
                                const newPrime = parseInt(e.target.value, 10);
                                const newTariffs = [...(config.tariffs || [])];
                                const tariffIdx = newTariffs.findIndex(t => t.key === tariff.key);
                                if (tariffIdx >= 0) {
                                  newTariffs[tariffIdx] = { ...tariff, prime: Number.isFinite(newPrime) ? newPrime : 0 };
                                  setNewGuarantee(prev => ({
                                    ...prev,
                                    parameters: {
                                      ...prev.parameters,
                                      matrixBased: {
                                        dimension: 'FISCAL_POWER',
                                        tariffs: newTariffs
                                      }
                                    }
                                  }));
                                }
                              }}
                              className="h-8 w-24 text-sm"
                            />
                            <span className="text-xs text-gray-500">FCFA</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                const newTariffs = config.tariffs?.filter(t => t.key !== tariff.key) ?? [];
                                setNewGuarantee(prev => ({
                                  ...prev,
                                  parameters: {
                                    ...prev.parameters,
                                    matrixBased: {
                                      dimension: 'FISCAL_POWER',
                                      tariffs: newTariffs
                                    }
                                  }
                                }));
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <Label>Prime par défaut (FCFA) - Optionnel</Label>
                <Input
                  type="number"
                  value={config?.defaultPrime ?? ''}
                  onChange={(e) => {
                    const defaultPrime = parseInt(e.target.value, 10);
                    setNewGuarantee(prev => ({
                      ...prev,
                      parameters: {
                        ...prev.parameters,
                        matrixBased: {
                          dimension,
                          tariffs: config?.tariffs ?? [],
                          defaultPrime: Number.isFinite(defaultPrime) ? defaultPrime : undefined
                        }
                      }
                    }));
                  }}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Utilisée si aucune correspondance n'est trouvée dans la matrice
                </p>
              </div>
            </div>
          ) : (
            // Formulaire simple pour les autres dimensions
            <>
              <div>
                <Label>Prime par défaut (FCFA) - Optionnel</Label>
                <Input
                  type="number"
                  value={config?.defaultPrime ?? ''}
                  onChange={(e) => {
                    const defaultPrime = parseInt(e.target.value, 10);
                    setNewGuarantee(prev => ({
                      ...prev,
                      parameters: {
                        ...prev.parameters,
                        matrixBased: {
                          dimension,
                          tariffs: config?.tariffs ?? [],
                          defaultPrime: Number.isFinite(defaultPrime) ? defaultPrime : undefined
                        }
                      }
                    }));
                  }}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Utilisée si aucune correspondance n'est trouvée dans la matrice
                </p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm text-amber-900">
                  <strong>Attention :</strong> Pour cette dimension, les tarifs doivent être configurés via l'onglet "Grilles" ou en utilisant les méthodes de calcul basées sur une variable.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Tarification & Garanties</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gérez les garanties et grilles de tarification
          </p>
        </div>
      </div>

      {statistics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Garanties</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalGuarantees}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.activeGuarantees} actives
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prix Moyen</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((statistics.priceRange.min + statistics.priceRange.max) / 2).toLocaleString()} FCFA
              </div>
              <p className="text-xs text-muted-foreground">
                Moyenne des garanties
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gamme de Prix</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(statistics.priceRange.min).toLocaleString()} - {Math.round(statistics.priceRange.max).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                FCFA
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="guarantees" className="space-y-4">
        <TabsList className="grid grid-cols-1 sm:grid-cols-4 w-full">
          <TabsTrigger value="guarantees" className="text-xs sm:text-sm">Garanties</TabsTrigger>
          <TabsTrigger value="grids" className="text-xs sm:text-sm">Grilles</TabsTrigger>
          <TabsTrigger value="statistics" className="text-xs sm:text-sm">Statistiques</TabsTrigger>
        </TabsList>

        <TabsContent value="guarantees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Gestion des Garanties</span>
                <Dialog open={isCreateGuaranteeDialogOpen} onOpenChange={setIsCreateGuaranteeDialogOpen}>
                  <DialogTrigger asChild>
                      <Button disabled={isCreatingGuarantee}>
                        <Plus className="w-4 h-4 mr-2" />
                      {isCreatingGuarantee ? 'Création…' : 'Nouvelle Garantie'}
                      </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[98vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-xl">Créer une nouvelle garantie</DialogTitle>
                      <DialogDescription className="text-base">
                        Définissez une nouvelle garantie avec sa méthode de calcul et ses paramètres
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6 py-4">
                      {/* Section Informations générales */}
                      <Card className="border border-gray-200 shadow-sm">
                        <CardHeader className="pb-3 bg-gray-50/50">
                          <CardTitle className="text-base flex items-center gap-2">
                            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 text-xs font-bold">1</span>
                            </div>
                            Informations générales
                          </CardTitle>
                          <CardDescription className="text-sm">
                            Informations de base sur la garantie
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                          <div className="space-y-2">
                              <Label htmlFor="guarantee-name" className="flex items-center gap-1">
                                Nom de la garantie <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="guarantee-name"
                                value={newGuarantee.name}
                                onChange={(e) => handleGuaranteeNameChange(e.target.value)}
                                placeholder="Ex: Responsabilité Civile"
                                className="transition-colors focus:border-blue-500"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Le code sera généré automatiquement à partir du nom
                              </p>
                            </div>

                          <div className="space-y-2">
                            <Label htmlFor="guarantee-description">Description</Label>
                            <Textarea
                              id="guarantee-description"
                              value={newGuarantee.description}
                              onChange={(e) => setNewGuarantee(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Description détaillée de la garantie"
                              rows={3}
                              className="transition-colors focus:border-blue-500"
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Section Méthode de calcul */}
                      <Card className="border border-gray-200 shadow-sm">
                        <CardHeader className="pb-3 bg-gray-50/50">
                          <CardTitle className="text-base flex items-center gap-2">
                            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 text-xs font-bold">2</span>
                            </div>
                            Méthode de calcul
                          </CardTitle>
                          <CardDescription className="text-sm">
                            Définissez comment la prime de cette garantie est calculée
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                          <div className="space-y-3">
                            <Label className="flex items-center gap-1 text-sm font-medium">
                              Méthode de calcul <span className="text-red-500">*</span>
                            </Label>

                            {/* Cartes de sélection de méthode */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* Méthode FREE */}
                              <button
                                type="button"
                                onClick={() => setNewGuarantee(prev => ({ ...prev, calculationMethod: 'FREE' }))}
                                className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                                  newGuarantee.calculationMethod === 'FREE'
                                    ? 'border-green-500 bg-green-50 shadow-md'
                                    : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/30'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-lg ${
                                    newGuarantee.calculationMethod === 'FREE'
                                      ? 'bg-green-500 text-white'
                                      : 'bg-green-100 text-green-600'
                                  }`}>
                                    <Sparkles className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm mb-1">Gratuit</div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      Prime nulle (gratuite) - Aucun frais pour cette garantie
                                    </p>
                                  </div>
                                  {newGuarantee.calculationMethod === 'FREE' && (
                                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                  )}
                                </div>
                              </button>

                              {/* Méthode FIXED_AMOUNT */}
                              <button
                                type="button"
                                onClick={() => setNewGuarantee(prev => ({ ...prev, calculationMethod: 'FIXED_AMOUNT' }))}
                                className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                                  newGuarantee.calculationMethod === 'FIXED_AMOUNT'
                                    ? 'border-blue-500 bg-blue-50 shadow-md'
                                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-lg ${
                                    newGuarantee.calculationMethod === 'FIXED_AMOUNT'
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-blue-100 text-blue-600'
                                  }`}>
                                    <DollarSign className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm mb-1">Montant Fixe</div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      Prime fixe indépendante du véhicule - Ex: 15 000 FCFA
                                    </p>
                                  </div>
                                  {newGuarantee.calculationMethod === 'FIXED_AMOUNT' && (
                                    <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                  )}
                                </div>
                              </button>

                              {/* Méthode VARIABLE_BASED */}
                              <button
                                type="button"
                                onClick={() => setNewGuarantee(prev => ({ ...prev, calculationMethod: 'VARIABLE_BASED' }))}
                                className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                                  newGuarantee.calculationMethod === 'VARIABLE_BASED'
                                    ? 'border-purple-500 bg-purple-50 shadow-md'
                                    : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/30'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-lg ${
                                    newGuarantee.calculationMethod === 'VARIABLE_BASED'
                                      ? 'bg-purple-500 text-white'
                                      : 'bg-purple-100 text-purple-600'
                                  }`}>
                                    <Percent className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm mb-1">Basé sur une variable</div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      Pourcentage sur une valeur du véhicule - Ex: 0.42% de la valeur vénale
                                    </p>
                                  </div>
                                  {newGuarantee.calculationMethod === 'VARIABLE_BASED' && (
                                    <CheckCircle className="h-5 w-5 text-purple-500 flex-shrink-0" />
                                  )}
                                </div>
                              </button>

                              {/* Méthode MATRIX_BASED */}
                              <button
                                type="button"
                                onClick={() => setNewGuarantee(prev => ({ ...prev, calculationMethod: 'MATRIX_BASED' }))}
                                className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                                  newGuarantee.calculationMethod === 'MATRIX_BASED'
                                    ? 'border-orange-500 bg-orange-50 shadow-md'
                                    : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/30'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-lg ${
                                    newGuarantee.calculationMethod === 'MATRIX_BASED'
                                      ? 'bg-orange-500 text-white'
                                      : 'bg-orange-100 text-orange-600'
                                  }`}>
                                    <Layers className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm mb-1">Basé sur une matrice</div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      Grille de tarification - Ex: par puissance fiscale ou type de carburant
                                    </p>
                                  </div>
                                  {newGuarantee.calculationMethod === 'MATRIX_BASED' && (
                                    <CheckCircle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                                  )}
                                </div>
                              </button>
                            </div>

                            {/* Description détaillée de la méthode sélectionnée */}
                            {newGuarantee.calculationMethod && (
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <div className="flex items-start gap-2">
                                  <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                  <div className="text-sm text-blue-800">
                                    <span className="font-medium">
                                      {selectableCalculationMethods.find(m => m.value === newGuarantee.calculationMethod)?.label}:
                                    </span>
                                    {' '}
                                    {selectableCalculationMethods.find(m => m.value === newGuarantee.calculationMethod)?.description}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Champs dynamiques selon la méthode de calcul */}
                          {(() => {
                            const method = newGuarantee.calculationMethod
                            const showRate = ['RATE_ON_SI', 'RATE_ON_NEW_VALUE', 'CONDITIONAL_RATE'].includes(method as string)
                            const showMinMax = showRate
                            const isFixed = method === 'FIXED_AMOUNT'
                            // FREE n'est pas sélectionnable ici (géré via Supabase), mais on prépare le cas
                            const isFree = (method as any) === 'FREE'

                            return (
                              <div className="space-y-4 pt-2">
                                {isFixed && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label className="flex items-center gap-1">
                                        Montant fixe (FCFA) <span className="text-red-500">*</span>
                                      </Label>
                                      <Input
                                        type="number"
                                        value={newGuarantee.fixedAmount ?? ''}
                                        onChange={(e) =>
                                          setNewGuarantee((prev) => ({
                                            ...prev,
                                            fixedAmount: parseFloat(e.target.value) || undefined,
                                          }))
                                        }
                                        placeholder="Ex: 15000"
                                        className="transition-colors focus:border-blue-500"
                                      />
                                    </div>
                                  </div>
                                )}
                                
                                {showRate && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label className="flex items-center gap-1">
                                          Taux (%) <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                          type="number"
                                          step="0.1"
                                          value={newGuarantee.rate || ''}
                                          onChange={(e) => setNewGuarantee(prev => ({ ...prev, rate: parseFloat(e.target.value) || undefined }))}
                                          placeholder="Ex: 1.5"
                                          className="transition-colors focus:border-blue-500"
                                        />
                                      </div>
                                    </div>
                                    {showMinMax && (
                                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                        <div className="flex items-center gap-2 text-sm text-blue-700">
                                          <AlertTriangle className="h-4 w-4" />
                                          Les montants minimum et maximum ci-dessous sont optionnels
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {showMinMax && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label>Montant minimum (FCFA)</Label>
                                      <Input
                                        type="number"
                                        value={newGuarantee.minValue || ''}
                                        onChange={(e) => setNewGuarantee(prev => ({ ...prev, minValue: parseFloat(e.target.value) || undefined }))}
                                        placeholder="Ex: 50000"
                                        className="transition-colors focus:border-blue-500"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Montant maximum (FCFA)</Label>
                                      <Input
                                        type="number"
                                        value={newGuarantee.maxValue || ''}
                                        onChange={(e) => setNewGuarantee(prev => ({ ...prev, maxValue: parseFloat(e.target.value) || undefined }))}
                                        placeholder="Ex: 500000"
                                        className="transition-colors focus:border-blue-500"
                                      />
                                    </div>
                                  </div>
                                )}

                                {isFree && (
                                  <Alert className="bg-green-50 border-green-200">
                                    <AlertTriangle className="h-4 w-4 text-green-600" />
                                    <AlertDescription className="text-green-700">
                                      Cette garantie est gratuite: aucun taux ni montant à saisir ici.
                                    </AlertDescription>
                                  </Alert>
                                )}
                              </div>
                            )
                          })()}
                        </CardContent>
                      </Card>

                      {/* Section Configuration avancée */}
                      {(newGuarantee.calculationMethod === 'VARIABLE_BASED' ||
                        newGuarantee.calculationMethod === 'MATRIX_BASED' ||
                        newGuarantee.calculationMethod === 'FIRE_THEFT' ||
                        newGuarantee.calculationMethod === 'THEFT_ARMED' ||
                        newGuarantee.calculationMethod === 'GLASS_ROOF' ||
                        newGuarantee.calculationMethod === 'MTPL_TARIFF' ||
                        newGuarantee.calculationMethod === 'IC_IPT_FORMULA' ||
                        newGuarantee.calculationMethod === 'IPT_PLACES_FORMULA') && (
                        <Card className="border border-gray-200 shadow-sm">
                          <CardHeader className="pb-3 bg-gray-50/50">
                            <CardTitle className="text-base flex items-center gap-2">
                              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 text-xs font-bold">3</span>
                              </div>
                              Configuration avancée
                            </CardTitle>
                            <CardDescription className="text-sm">
                              Paramètres spécifiques à la méthode de calcul sélectionnée
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-4 space-y-4">
                            {renderVariableBasedConfigSection()}
                            {renderMatrixBasedConfigSection()}
                            {renderFireTheftConfigSection()}
                            {renderGlassRoofConfigSection()}
                            {renderGlassStandardConfigSection()}
                            {renderTierceCapConfigSection()}
                            {renderMTPLTariffConfigSection()}
                            {renderICIPTFormulaConfigSection()}
                            {renderIPTPlacesFormulaConfigSection()}
                          </CardContent>
                        </Card>
                      )}

                      {/* Section Options et conditions */}
                      <Card className="border border-gray-200 shadow-sm">
                        <CardHeader className="pb-3 bg-gray-50/50">
                          <CardTitle className="text-base flex items-center gap-2">
                            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 text-xs font-bold">4</span>
                            </div>
                            Options et conditions
                          </CardTitle>
                          <CardDescription className="text-sm">
                            Définissez les conditions d'application et les options de la garantie
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="guarantee-conditions">Conditions d'application</Label>
                            <Textarea
                              id="guarantee-conditions"
                              value={newGuarantee.conditions || ''}
                              onChange={(e) => setNewGuarantee(prev => ({ ...prev, conditions: e.target.value }))}
                              placeholder="Conditions d'application (optionnel)"
                              rows={2}
                              className="transition-colors focus:border-blue-500"
                            />
                          </div>

                          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                            <Checkbox
                              id="guarantee-optional"
                              checked={newGuarantee.isOptional}
                              onCheckedChange={(checked) =>
                                setNewGuarantee(prev => ({ ...prev, isOptional: checked as boolean }))
                              }
                              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <div className="space-y-1">
                              <Label htmlFor="guarantee-optional" className="cursor-pointer font-medium">
                                Garantie optionnelle
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Cochez si cette garantie n'est pas obligatoire dans le contrat
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateGuaranteeDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleCreateGuarantee} disabled={isCreatingGuarantee}>
                        Créer la garantie
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher une garantie..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:max-w-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="show-inactive"
                    checked={showInactive}
                    onCheckedChange={(checked) => setShowInactive(!!checked)}
                  />
                  <Label htmlFor="show-inactive" className="text-sm">Afficher inactives</Label>
                </div>
              </div>

              <div className="responsive-table-wrapper">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="p-2">Garantie</TableHead>
                      {/* Colonne Catégorie retirée */}
                      <TableHead className="p-2 hidden md:table-cell">Méthode de calcul</TableHead>
                      <TableHead className="p-2">Taux/Montant</TableHead>
                      <TableHead className="p-2">Statut</TableHead>
                      <TableHead className="p-2">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {filteredGuarantees.map((guarantee) => (
                    <TableRow key={guarantee.id}>
                      <TableCell className="p-2">
                        <div>
                          <div className="font-medium text-sm">{guarantee.name}</div>
                          <div className="text-xs text-muted-foreground">Code: {guarantee.code}</div>
                          {guarantee.description && (
                            <div className="text-xs text-muted-foreground max-w-xs truncate">
                              {guarantee.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      {/* Cellule Catégorie retirée */}
                      <TableCell className="p-2 hidden md:table-cell">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">
                            {calculationMethods.find(m => m.value === guarantee.calculationMethod)?.label}
                          </span>
                          <span className="text-xs text-muted-foreground max-w-xs truncate" title={calculationMethods.find(m => m.value === guarantee.calculationMethod)?.description}>
                            {calculationMethods.find(m => m.value === guarantee.calculationMethod)?.description}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="text-xs">
                          {(() => {
                            const method = guarantee.calculationMethod
                            if (method === 'FREE') {
                              return 'Gratuit'
                            }
                            if (method === 'FIXED_AMOUNT') {
                              return typeof guarantee.fixedAmount === 'number'
                                ? `${guarantee.fixedAmount.toLocaleString()} FCFA`
                                : '-'
                            }
                            if (['RATE_ON_SI', 'RATE_ON_NEW_VALUE', 'CONDITIONAL_RATE'].includes(method as string)) {
                              return typeof guarantee.rate === 'number' ? `${guarantee.rate}%` : '-'
                            }
                            return '-'
                          })()}
                        </div>
                        {guarantee.minValue && guarantee.maxValue && (
                          <div className="text-xs text-muted-foreground">
                            Min: {guarantee.minValue.toLocaleString()} - Max: {guarantee.maxValue.toLocaleString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="flex flex-col gap-1">
                          <Badge className={guarantee.isActive ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'} style={{ fontSize: '0.7rem' }}>
                            {guarantee.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {!guarantee.isOptional && (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400" style={{ fontSize: '0.7rem' }}>
                              Obligatoire
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditGuaranteeDialog(guarantee)}
                            className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleGuarantee(guarantee.id)}
                            className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                          >
                            {guarantee.isActive ? <XCircle className="w-3 h-3 sm:w-4 sm:h-4" /> : <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteGuarantee(guarantee.id)}
                            className="text-red-600 hover:text-red-700 h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="grids" className="space-y-4">
          {import.meta.env.VITE_MOCK_DATA === 'true' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Mode démonstration activé (VITE_MOCK_DATA=true). Les grilles affichées ci‑dessous sont des exemples.
              </AlertDescription>
            </Alert>
          )}

          {/* Section Garanties Gratuites (Supabase) */}
          {freeCoverages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" /> Garanties Gratuites
                </CardTitle>
                <CardDescription>Garanties dont la prime est gratuite</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {freeCoverages.map((c) => (
                    <div key={c.id} className="flex items-center justify-between border p-2 rounded-md">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Gratuit</Badge>
                        <span className="font-medium">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.isMandatory && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">Obligatoire</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {freeCoverages.length === 0 && (
                    <div className="text-sm text-muted-foreground">Aucune garantie gratuite configurée</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}


          {/* Gestion des Tarifs Fixes */}
          <Card id="tarifs-fixes-section">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base sm:text-lg">Gestion des Tarifs Fixes</CardTitle>
              <Dialog open={isCreateTarifFixeDialogOpen} onOpenChange={(open) => {
                setIsCreateTarifFixeDialogOpen(open)
                if (open) {
                  // reset selection and preload options
                  setSelectedCoverageId('')
                  setSelectedFormulaName('')
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" /> Nouveau tarif
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[98vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Nouveau tarif fixe</DialogTitle>
                    <DialogDescription>Ajouter un tarif fixe de garantie</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Garantie</Label>
                      <Select
                        value={selectedCoverageId}
                        onValueChange={async (val) => {
                          setSelectedCoverageId(val)
                          setSelectedFormulaName('')
                          try {
                            const formulas = await tarificationSupabaseService.listFormulas(val)
                            setAvailableFormulas(formulas)
                          } catch (e) {
                            setAvailableFormulas([])
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une garantie" />
                        </SelectTrigger>
                        <SelectContent>
                          {fixedCoverageOptions.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {availableFormulas.length > 0 && (
                      <div>
                        <Label>Formule (si applicable)</Label>
                        <Select value={selectedFormulaName} onValueChange={(v) => setSelectedFormulaName(v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir une formule" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableFormulas.map((f) => (
                              <SelectItem key={f} value={f}>
                                {f}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <Label>Prime (FCFA)</Label>
                      <Input
                        type="number"
                        value={newTarifFixe.prime}
                        onChange={(e) => setNewTarifFixe((p) => ({ ...p, prime: Number(e.target.value) || 0 }))}
                        placeholder="Ex: 15000"
                      />
                    </div>
                    <div>
                      <Label>Conditions (optionnel)</Label>
                      <Input
                        value={newTarifFixe.conditions || ''}
                        onChange={(e) => setNewTarifFixe((p) => ({ ...p, conditions: e.target.value }))}
                        placeholder="Ex: Uniquement pickups"
                      />
                    </div>
                    <div>
                      <Label>Prix réduit en pack (optionnel)</Label>
                      <Input
                        type="number"
                        value={newTarifFixe.packPriceReduced ?? ''}
                        onChange={(e) =>
                          setNewTarifFixe((p) => ({
                            ...p,
                            packPriceReduced: e.target.value === '' ? undefined : Number(e.target.value) || 0,
                          }))
                        }
                        placeholder="Ex: 4240"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateTarifFixeDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleCreateTarifFixe}>Créer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="responsive-table-wrapper">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Garantie</TableHead>
                      <TableHead className="hidden sm:table-cell">Conditions</TableHead>
                      <TableHead>Prime</TableHead>
                      <TableHead className="hidden md:table-cell">Prix pack</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tarifFixes.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">
                          {t.coverageName}
                          {t.formulaName ? (
                            <span className="text-xs text-muted-foreground"> — {t.formulaName}</span>
                          ) : null}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{t.conditions || '-'}</TableCell>
                        <TableCell>{t.fixedAmount.toLocaleString('fr-FR')} FCFA</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {t.packPriceReduced != null ? `${t.packPriceReduced.toLocaleString('fr-FR')} FCFA` : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditTarifFixeDialog(t)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteTarifFixe(t.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Dialog: Edit Tarif Fixe */}
          <Dialog open={isEditTarifFixeDialogOpen} onOpenChange={(open) => {
            setIsEditTarifFixeDialogOpen(open)
            if (!open) {
              setSelectedCoverageId('')
              setSelectedFormulaName('')
            }
          }}>
            <DialogContent className="max-w-[98vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Modifier le tarif fixe</DialogTitle>
                <DialogDescription>Mettre à jour les informations</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Garantie</Label>
                  <Select
                    value={selectedCoverageId}
                    onValueChange={async (val) => {
                      setSelectedCoverageId(val)
                      setSelectedFormulaName('')
                      try {
                        const formulas = await tarificationSupabaseService.listFormulas(val)
                        setAvailableFormulas(formulas)
                      } catch (e) {
                        setAvailableFormulas([])
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une garantie" />
                    </SelectTrigger>
                    <SelectContent>
                      {fixedCoverageOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {availableFormulas.length > 0 && (
                  <div>
                    <Label>Formule (si applicable)</Label>
                    <Select value={selectedFormulaName} onValueChange={(v) => setSelectedFormulaName(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une formule" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFormulas.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label>Prime (FCFA)</Label>
                  <Input
                    type="number"
                    value={newTarifFixe.prime}
                    onChange={(e) => setNewTarifFixe((p) => ({ ...p, prime: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Conditions (optionnel)</Label>
                  <Input
                    value={newTarifFixe.conditions || ''}
                    onChange={(e) => setNewTarifFixe((p) => ({ ...p, conditions: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Prix réduit en pack (optionnel)</Label>
                  <Input
                    type="number"
                    value={newTarifFixe.packPriceReduced ?? ''}
                    onChange={(e) =>
                      setNewTarifFixe((p) => ({
                        ...p,
                        packPriceReduced: e.target.value === '' ? undefined : Number(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditTarifFixeDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleUpdateTarifFixe}>Enregistrer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Garanties les plus utilisées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statistics?.mostUsedGuarantees?.map((item: {
                    guaranteeId: string;
                    guaranteeName: string;
                    usageCount: number;
                  }, index: number) => (
                    <div key={item.guaranteeId} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">
                          #{index + 1}
                        </span>
                        <span>{item.guaranteeName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${(item.usageCount / 100) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground min-w-[3rem]">
                          {item.usageCount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Répartition par catégorie retirée de l'UI */}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Configuration des méthodes de calcul</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {calculationMethods.map(method => (
                  <div key={method.value} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">{method.label}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {method.description}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      {guarantees.filter(g => g.calculationMethod === method.value).length} garantie(s) utilisent cette méthode
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog pour modifier une garantie */}
      <Dialog open={isEditGuaranteeDialogOpen} onOpenChange={setIsEditGuaranteeDialogOpen}>
        <DialogContent className="max-w-[98vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Modifier la garantie</DialogTitle>
            <DialogDescription className="text-base">Mettez à jour les informations de la garantie</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Section Informations générales */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-3 bg-gray-50/50">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-bold">1</span>
                  </div>
                  Informations générales
                </CardTitle>
                <CardDescription className="text-sm">
                  Informations de base sur la garantie
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-guarantee-name" className="flex items-center gap-1">
                      Nom de la garantie <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-guarantee-name"
                      value={newGuarantee.name}
                      onChange={(e) => setNewGuarantee((prev) => ({ ...prev, name: e.target.value }))}
                      className="transition-colors focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-guarantee-code" className="flex items-center gap-1">
                      Code <span className="text-red-500">*</span>
                      <span className="text-xs text-orange-600">(modifiable)</span>
                    </Label>
                    <Input
                      id="edit-guarantee-code"
                      value={newGuarantee.code}
                      onChange={(e) => setNewGuarantee((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      maxLength={10}
                      className="transition-colors focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500">
                      Attention : modifier ce code peut affecter les contrats existants
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-guarantee-description">Description</Label>
                  <Textarea
                    id="edit-guarantee-description"
                    value={newGuarantee.description}
                    onChange={(e) => setNewGuarantee((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="transition-colors focus:border-blue-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section Méthode de calcul */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-3 bg-gray-50/50">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-bold">2</span>
                  </div>
                  Méthode de calcul
                </CardTitle>
                <CardDescription className="text-sm">
                  Définissez comment la prime de cette garantie est calculée
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-3">
                  <Label className="flex items-center gap-1 text-sm font-medium">
                    Méthode de calcul <span className="text-red-500">*</span>
                  </Label>

                  {/* Cartes de sélection de méthode (même design que création) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Méthode FREE */}
                    <button
                      type="button"
                      onClick={() => setNewGuarantee(prev => ({ ...prev, calculationMethod: 'FREE' }))}
                      className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                        newGuarantee.calculationMethod === 'FREE'
                          ? 'border-green-500 bg-green-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          newGuarantee.calculationMethod === 'FREE'
                            ? 'bg-green-500 text-white'
                            : 'bg-green-100 text-green-600'
                        }`}>
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm mb-1">Gratuit</div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Prime nulle (gratuite) - Aucun frais pour cette garantie
                          </p>
                        </div>
                        {newGuarantee.calculationMethod === 'FREE' && (
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>

                    {/* Méthode FIXED_AMOUNT */}
                    <button
                      type="button"
                      onClick={() => setNewGuarantee(prev => ({ ...prev, calculationMethod: 'FIXED_AMOUNT' }))}
                      className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                        newGuarantee.calculationMethod === 'FIXED_AMOUNT'
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          newGuarantee.calculationMethod === 'FIXED_AMOUNT'
                            ? 'bg-blue-500 text-white'
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          <DollarSign className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm mb-1">Montant Fixe</div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Prime fixe indépendante du véhicule - Ex: 15 000 FCFA
                          </p>
                        </div>
                        {newGuarantee.calculationMethod === 'FIXED_AMOUNT' && (
                          <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>

                    {/* Méthode VARIABLE_BASED */}
                    <button
                      type="button"
                      onClick={() => setNewGuarantee(prev => ({ ...prev, calculationMethod: 'VARIABLE_BASED' }))}
                      className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                        newGuarantee.calculationMethod === 'VARIABLE_BASED'
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          newGuarantee.calculationMethod === 'VARIABLE_BASED'
                            ? 'bg-purple-500 text-white'
                            : 'bg-purple-100 text-purple-600'
                        }`}>
                          <Percent className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm mb-1">Basé sur une variable</div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Pourcentage sur une valeur du véhicule - Ex: 0.42% de la valeur vénale
                          </p>
                        </div>
                        {newGuarantee.calculationMethod === 'VARIABLE_BASED' && (
                          <CheckCircle className="h-5 w-5 text-purple-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>

                    {/* Méthode MATRIX_BASED */}
                    <button
                      type="button"
                      onClick={() => setNewGuarantee(prev => ({ ...prev, calculationMethod: 'MATRIX_BASED' }))}
                      className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                        newGuarantee.calculationMethod === 'MATRIX_BASED'
                          ? 'border-orange-500 bg-orange-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          newGuarantee.calculationMethod === 'MATRIX_BASED'
                            ? 'bg-orange-500 text-white'
                            : 'bg-orange-100 text-orange-600'
                        }`}>
                          <Layers className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm mb-1">Basé sur une matrice</div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Grille de tarification - Ex: par puissance fiscale et carburant
                          </p>
                        </div>
                        {newGuarantee.calculationMethod === 'MATRIX_BASED' && (
                          <CheckCircle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Description détaillée de la méthode sélectionnée */}
                  {newGuarantee.calculationMethod && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800">
                          <span className="font-medium">
                            {selectableCalculationMethods.find(m => m.value === newGuarantee.calculationMethod)?.label}:
                          </span>
                          {' '}
                          {selectableCalculationMethods.find(m => m.value === newGuarantee.calculationMethod)?.description}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Champs dynamiques selon la méthode de calcul (édition) */}
                {(() => {
                  const method = newGuarantee.calculationMethod
                  const showRate = ['RATE_ON_SI', 'RATE_ON_NEW_VALUE', 'CONDITIONAL_RATE'].includes(method as string)
                  const showMinMax = showRate
                  const isFixed = method === 'FIXED_AMOUNT'
                  const isFree = (method as any) === 'FREE'

                  return (
                    <div className="space-y-4 pt-2">
                      {isFixed && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-1">
                              Montant fixe (FCFA) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              type="number"
                              value={newGuarantee.fixedAmount ?? ''}
                              onChange={(e) =>
                                setNewGuarantee((prev) => ({
                                  ...prev,
                                  fixedAmount: parseFloat(e.target.value) || undefined,
                                }))
                              }
                              placeholder="Ex: 15000"
                              className="transition-colors focus:border-blue-500"
                            />
                          </div>
                        </div>
                      )}
                      
                      {showRate && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="flex items-center gap-1">
                                Taux (%) <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={newGuarantee.rate || ''}
                                onChange={(e) => setNewGuarantee(prev => ({ ...prev, rate: parseFloat(e.target.value) || undefined }))}
                                placeholder="Ex: 1.5"
                                className="transition-colors focus:border-blue-500"
                              />
                            </div>
                          </div>
                          {showMinMax && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                              <div className="flex items-center gap-2 text-sm text-blue-700">
                                <AlertTriangle className="h-4 w-4" />
                                Les montants minimum et maximum ci-dessous sont optionnels
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {showMinMax && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Montant minimum (FCFA)</Label>
                            <Input
                              type="number"
                              value={newGuarantee.minValue || ''}
                              onChange={(e) => setNewGuarantee(prev => ({ ...prev, minValue: parseFloat(e.target.value) || undefined }))}
                              placeholder="Ex: 50000"
                              className="transition-colors focus:border-blue-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Montant maximum (FCFA)</Label>
                            <Input
                              type="number"
                              value={newGuarantee.maxValue || ''}
                              onChange={(e) => setNewGuarantee(prev => ({ ...prev, maxValue: parseFloat(e.target.value) || undefined }))}
                              placeholder="Ex: 500000"
                              className="transition-colors focus:border-blue-500"
                            />
                          </div>
                        </div>
                      )}

                      {isFree && (
                        <Alert className="bg-green-50 border-green-200">
                          <AlertTriangle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-700">
                            Cette garantie est gratuite: aucun taux ni montant à saisir ici.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            {/* Section Configuration avancée */}
            {(newGuarantee.calculationMethod === 'VARIABLE_BASED' ||
              newGuarantee.calculationMethod === 'MATRIX_BASED' ||
              newGuarantee.calculationMethod === 'FIRE_THEFT' ||
              newGuarantee.calculationMethod === 'THEFT_ARMED' ||
              newGuarantee.calculationMethod === 'GLASS_ROOF' ||
              newGuarantee.calculationMethod === 'MTPL_TARIFF' ||
              newGuarantee.calculationMethod === 'IC_IPT_FORMULA' ||
              newGuarantee.calculationMethod === 'IPT_PLACES_FORMULA') && (
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-3 bg-gray-50/50">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-xs font-bold">3</span>
                    </div>
                    Configuration avancée
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Paramètres spécifiques à la méthode de calcul sélectionnée
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {renderVariableBasedConfigSection()}
                  {renderMatrixBasedConfigSection()}
                  {renderFireTheftConfigSection()}
                  {renderGlassRoofConfigSection()}
                  {renderGlassStandardConfigSection()}
                  {renderTierceCapConfigSection()}
                  {renderMTPLTariffConfigSection()}
                  {renderICIPTFormulaConfigSection()}
                  {renderIPTPlacesFormulaConfigSection()}
                </CardContent>
              </Card>
            )}

            {/* Section Options et conditions */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-3 bg-gray-50/50">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-bold">4</span>
                  </div>
                  Options et conditions
                </CardTitle>
                <CardDescription className="text-sm">
                  Définissez les conditions d'application et les options de la garantie
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-guarantee-conditions">Conditions d'application</Label>
                  <Textarea
                    id="edit-guarantee-conditions"
                    value={newGuarantee.conditions || ''}
                    onChange={(e) => setNewGuarantee(prev => ({ ...prev, conditions: e.target.value }))}
                    rows={2}
                    className="transition-colors focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                  <Checkbox
                    id="edit-guarantee-optional"
                    checked={newGuarantee.isOptional}
                    onCheckedChange={(checked) =>
                      setNewGuarantee((prev) => ({ ...prev, isOptional: checked as boolean }))
                    }
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="edit-guarantee-optional" className="cursor-pointer font-medium">
                      Garantie optionnelle
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Cochez si cette garantie n'est pas obligatoire dans le contrat
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditGuaranteeDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateGuarantee}>Mettre à jour</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AdminTarificationPage;
