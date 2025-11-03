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
  InsurancePackage,
  GuaranteeFormData,
  PackageFormData,
  CalculationMethodType,
  TarifFixe,
  TarifFixeFormData
} from '@/types/tarification';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Shield,
  Package,
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
  Database
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const AdminTarificationPage: React.FC = () => {
  const { user } = useAuth();
  const [guarantees, setGuarantees] = useState<Guarantee[]>([]);
  const [packages, setPackages] = useState<InsurancePackage[]>([]);
  const [tarifFixes, setTarifFixes] = useState<FixedTariffItem[]>([]);
  const [fixedCoverageOptions, setFixedCoverageOptions] = useState<FixedCoverageOption[]>([])
  const [freeCoverages, setFreeCoverages] = useState<Array<{ id: string; name: string; isMandatory: boolean }>>([])
  const [selectedCoverageId, setSelectedCoverageId] = useState<string>('')
  const [availableFormulas, setAvailableFormulas] = useState<string[]>([])
  const [selectedFormulaName, setSelectedFormulaName] = useState<string>('')
  const [statistics, setStatistics] = useState<{
    totalGuarantees: number;
    activeGuarantees: number;
    totalPackages: number;
    activePackages: number;
    averagePackagePrice: number;
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
  const [isCreatePackageDialogOpen, setIsCreatePackageDialogOpen] = useState(false);
  const [isEditGuaranteeDialogOpen, setIsEditGuaranteeDialogOpen] = useState(false);
  const [isEditPackageDialogOpen, setIsEditPackageDialogOpen] = useState(false);
  const [showInactive, setShowInactive] = useState(true);
  const [selectedGuarantee, setSelectedGuarantee] = useState<Guarantee | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<InsurancePackage | null>(null);
  const [selectedTarifFixe, setSelectedTarifFixe] = useState<FixedTariffItem | null>(null);

  const [newGuarantee, setNewGuarantee] = useState<GuaranteeFormData>({
    name: '',
    code: '',
    category: 'RESPONSABILITE_CIVILE',
    description: '',
    calculationMethod: 'FIXED_AMOUNT',
    isOptional: true
  });

  const [newPackage, setNewPackage] = useState<PackageFormData>({
    name: '',
    code: '',
    description: '',
    guaranteeIds: [],
    basePrice: 0
  });

  const [isCreateTarifFixeDialogOpen, setIsCreateTarifFixeDialogOpen] = useState(false);
  const [isEditTarifFixeDialogOpen, setIsEditTarifFixeDialogOpen] = useState(false);
  const [newTarifFixe, setNewTarifFixe] = useState<TarifFixeFormData>({
    guaranteeName: '',
    prime: 0,
    conditions: '',
    packPriceReduced: undefined,
  });

  useEffect(() => {
    // Only load data when user is authenticated
    if (user) {
      loadData();
    }
  }, [user]); // Re-load when user changes (fixes refresh issue)

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
            const codeAuto = (row.name || '')
              .trim()
              .toUpperCase()
              .replace(/[^A-Z0-9]/g, '')
              .slice(0, 8)
            return {
              id: row.id,
              name: row.name,
              code: codeAuto || 'GAR',
              category: 'RESPONSABILITE_CIVILE',
              description: '',
              calculationMethod: row.calculation_type as CalculationMethodType,
              isOptional: !row.is_mandatory,
              isActive: row.is_active,
              fixedAmount: row.fixed_amount ?? undefined,
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

      const [packagesData, statsData, grids, fixedTariffs, fixedOptions, freeCov] = await Promise.all([
        guaranteeService.getPackages(),
        guaranteeService.getTarificationStats(),
        guaranteeService.getTarificationGrids(), // fallback data only
        // Protège contre un Supabase local non démarré en dev
        withTimeout(
          tarificationSupabaseService.listFixedTariffs().catch(() => []),
          1500,
          [] as FixedTariffItem[]
        ),
        withTimeout(
          tarificationSupabaseService.listFixedCoverageOptions().catch(() => []),
          1500,
          [] as FixedCoverageOption[]
        ),
        withTimeout(
          tarificationSupabaseService.listFreeCoverages().catch(() => []),
          1500,
          [] as Array<{ id: string; name: string; isMandatory: boolean }>
        )
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
      setPackages(packagesData);
      setStatistics(statsData);
      setTarifFixes(fixedTariffs as FixedTariffItem[]);
      setFixedCoverageOptions(fixedOptions as FixedCoverageOption[])
      setFreeCoverages(freeCov)
      logger.debug('AdminTarificationPage.loadData: done', {
        guarantees: Array.isArray(supaGuaranteesData) ? supaGuaranteesData.length : 'n/a',
        packages: Array.isArray(packagesData) ? packagesData.length : 'n/a',
        fixedTariffs: Array.isArray(fixedTariffs) ? fixedTariffs.length : 'n/a',
        fixedOptions: Array.isArray(fixedOptions) ? fixedOptions.length : 'n/a',
        freeCoverages: Array.isArray(freeCov) ? freeCov.length : 'n/a',
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
      if (!newGuarantee.name?.trim()) missing.push('Nom')
      if (!method) missing.push('Méthode de calcul')

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
        toast.error(`Veuillez remplir tous les champs obligatoires: ${missing.join(', ')}`)
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
        isOptional: true
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

  const handleCreatePackage = async () => {
    try {
      if (!newPackage.name || !newPackage.code || !newPackage.description || newPackage.guaranteeIds.length === 0) {
        return;
      }

      await guaranteeService.createPackage(newPackage);
      setIsCreatePackageDialogOpen(false);
      setNewPackage({
        name: '',
        code: '',
        description: '',
        guaranteeIds: [],
        basePrice: 0
      });
      loadData();
    } catch (error) {
      logger.error('Error creating package:', error);
    }
  };

  const handleUpdateGuarantee = async () => {
    try {
      if (!selectedGuarantee) return

      const missing: string[] = []
      const method = newGuarantee.calculationMethod
      if (!newGuarantee.name?.trim()) missing.push('Nom')
      if (!method) missing.push('Méthode de calcul')

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
        toast.error(`Veuillez remplir tous les champs obligatoires: ${missing.join(', ')}`)
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
        isOptional: true
      });
      loadData();
    } catch (error) {
      logger.error('Error updating guarantee:', error);
    }
  };

  const handleUpdatePackage = async () => {
    try {
      if (!selectedPackage || !newPackage.name || !newPackage.code || !newPackage.description || newPackage.guaranteeIds.length === 0) {
        return;
      }

      await guaranteeService.updatePackage(selectedPackage.id, newPackage);
      setIsEditPackageDialogOpen(false);
      setSelectedPackage(null);
      setNewPackage({
        name: '',
        code: '',
        description: '',
        guaranteeIds: [],
        basePrice: 0
      });
      loadData();
    } catch (error) {
      logger.error('Error updating package:', error);
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

  const handleDeletePackage = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce package ?')) {
      return;
    }

    try {
      await guaranteeService.deletePackage(id);
      loadData();
    } catch (error) {
      logger.error('Error deleting package:', error);
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

  const handleTogglePackage = async (id: string) => {
    try {
      await guaranteeService.togglePackage(id);
      loadData();
    } catch (error) {
      logger.error('Error toggling package:', error);
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

  const openEditPackageDialog = (pkg: InsurancePackage) => {
    setSelectedPackage(pkg);
    setNewPackage({
      name: pkg.name,
      code: pkg.code,
      description: pkg.description,
      guaranteeIds: pkg.guarantees,
      basePrice: pkg.basePrice
    });
    setIsEditPackageDialogOpen(true);
  };

  const filteredGuarantees = guarantees.filter(guarantee => {
    const matchesSearch = `${guarantee.name} ${guarantee.code} ${guarantee.description || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesActive = showInactive ? true : guarantee.isActive;
    return matchesSearch && matchesActive;
  });

  const filteredPackages = packages.filter(pkg =>
    `${pkg.name} ${pkg.code} ${pkg.description || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const calculationMethods = guaranteeService.getCalculationMethods();
  const selectableCalculationMethods = calculationMethods.filter(
    (m) => m.value === 'FREE' || m.value === 'FIXED_AMOUNT'
  );

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
            Gérez les garanties, packages et grilles de tarification
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
              <CardTitle className="text-sm font-medium">Packages</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalPackages}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.activePackages} actifs
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
                {Math.round(statistics.averagePackagePrice).toLocaleString()} FCFA
              </div>
              <p className="text-xs text-muted-foreground">
                Par package
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
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full">
          <TabsTrigger value="guarantees" className="text-xs sm:text-sm">Garanties</TabsTrigger>
          <TabsTrigger value="packages" className="text-xs sm:text-sm">Packages</TabsTrigger>
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
                  <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Créer une nouvelle garantie</DialogTitle>
                      <DialogDescription>
                        Définissez une nouvelle garantie avec sa méthode de calcul
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="guarantee-name">Nom de la garantie</Label>
                          <Input
                            id="guarantee-name"
                            value={newGuarantee.name}
                            onChange={(e) => setNewGuarantee(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Ex: Responsabilité Civile"
                          />
                        </div>
                        <div>
                          <Label htmlFor="guarantee-code">Code</Label>
                          <Input
                            id="guarantee-code"
                            value={newGuarantee.code}
                            onChange={(e) => setNewGuarantee(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                            placeholder="Ex: RC"
                            maxLength={10}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="guarantee-description">Description</Label>
                        <Textarea
                          id="guarantee-description"
                          value={newGuarantee.description}
                          onChange={(e) => setNewGuarantee(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Description détaillée de la garantie"
                          rows={3}
                        />
                      </div>

                      <div>
                          <Label>Méthode de calcul</Label>
                          <Select
                            value={newGuarantee.calculationMethod}
                            onValueChange={(value: CalculationMethodType) =>
                              setNewGuarantee(prev => ({ ...prev, calculationMethod: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {selectableCalculationMethods.map(method => (
                                <SelectItem key={method.value} value={method.value}>
                                  {method.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                          <>
                            {isFixed && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <Label>Montant fixe (FCFA)</Label>
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
                                  />
                                </div>
                              </div>
                            )}
                            {showRate && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <Label>Taux (%)</Label>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={newGuarantee.rate || ''}
                                    onChange={(e) => setNewGuarantee(prev => ({ ...prev, rate: parseFloat(e.target.value) || undefined }))}
                                    placeholder="Ex: 1.5"
                                  />
                                </div>
                                {showMinMax && (
                                  <div className="flex items-end text-sm text-muted-foreground">
                                    Les montants mini/maxi ci‑dessous sont optionnels
                                  </div>
                                )}
                              </div>
                            )}

                            {showMinMax && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <Label>Montant minimum (FCFA)</Label>
                                  <Input
                                    type="number"
                                    value={newGuarantee.minValue || ''}
                                    onChange={(e) => setNewGuarantee(prev => ({ ...prev, minValue: parseFloat(e.target.value) || undefined }))}
                                    placeholder="Ex: 50000"
                                  />
                                </div>
                                <div>
                                  <Label>Montant maximum (FCFA)</Label>
                                  <Input
                                    type="number"
                                    value={newGuarantee.maxValue || ''}
                                    onChange={(e) => setNewGuarantee(prev => ({ ...prev, maxValue: parseFloat(e.target.value) || undefined }))}
                                    placeholder="Ex: 500000"
                                  />
                                </div>
                              </div>
                            )}

                            {isFree && (
                              <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                  Cette garantie est gratuite: aucun taux ni montant à saisir ici.
                                </AlertDescription>
                              </Alert>
                            )}
                          </>
                        )
                      })()}

                      <div>
                        <Label htmlFor="guarantee-conditions">Conditions</Label>
                        <Textarea
                          id="guarantee-conditions"
                          value={newGuarantee.conditions || ''}
                          onChange={(e) => setNewGuarantee(prev => ({ ...prev, conditions: e.target.value }))}
                          placeholder="Conditions d'application (optionnel)"
                          rows={2}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="guarantee-optional"
                          checked={newGuarantee.isOptional}
                          onCheckedChange={(checked) =>
                            setNewGuarantee(prev => ({ ...prev, isOptional: checked as boolean }))
                          }
                        />
                        <Label htmlFor="guarantee-optional">Garantie optionnelle</Label>
                      </div>
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
                        <div className="text-xs">
                          {calculationMethods.find(m => m.value === guarantee.calculationMethod)?.label}
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

        <TabsContent value="packages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Gestion des Packages</span>
                <Dialog open={isCreatePackageDialogOpen} onOpenChange={setIsCreatePackageDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Nouveau Package
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Créer un nouveau package</DialogTitle>
                      <DialogDescription>
                        Définissez un package d'assurances avec des garanties pré-sélectionnées
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="package-name">Nom du package</Label>
                          <Input
                            id="package-name"
                            value={newPackage.name}
                            onChange={(e) => setNewPackage(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Ex: Plan Essentiel"
                          />
                        </div>
                        <div>
                          <Label htmlFor="package-code">Code</Label>
                          <Input
                            id="package-code"
                            value={newPackage.code}
                            onChange={(e) => setNewPackage(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                            placeholder="Ex: ESSENTIEL"
                            maxLength={20}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="package-description">Description</Label>
                        <Textarea
                          id="package-description"
                          value={newPackage.description}
                          onChange={(e) => setNewPackage(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Description détaillée du package"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Prix de base (FCFA)</Label>
                        <Input
                          type="number"
                          value={newPackage.basePrice}
                          onChange={(e) => setNewPackage(prev => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))}
                          placeholder="Ex: 150000"
                        />
                      </div>

                      <div>
                        <Label>Garanties incluses</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                          {[...fixedCoverageOptions.map((c) => ({ id: c.id, name: c.name })), ...freeCoverages.map((c) => ({ id: c.id, name: c.name }))]
                            .map((cov) => (
                              <div key={cov.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`package-${cov.id}`}
                                  checked={newPackage.guaranteeIds.includes(cov.id)}
                                  onCheckedChange={(checked) =>
                                    setNewPackage((prev) => ({
                                      ...prev,
                                      guaranteeIds: checked
                                        ? [...prev.guaranteeIds, cov.id]
                                        : prev.guaranteeIds.filter((id) => id !== cov.id),
                                    }))
                                  }
                                />
                                <Label
                                  htmlFor={`package-${cov.id}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {cov.name}
                                </Label>
                              </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {newPackage.guaranteeIds.length} garantie(s) sélectionnée(s)
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreatePackageDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleCreatePackage}>
                        Créer le package
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
                    placeholder="Rechercher un package..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:max-w-sm"
                  />
                </div>
              </div>

              <div className="responsive-table-wrapper">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="p-2">Package</TableHead>
                      <TableHead className="p-2 hidden sm:table-cell">Prix de base</TableHead>
                      <TableHead className="p-2">Prix total</TableHead>
                      <TableHead className="p-2 hidden md:table-cell">Garanties</TableHead>
                      <TableHead className="p-2">Statut</TableHead>
                      <TableHead className="p-2">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {filteredPackages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="p-2">
                        <div>
                          <div className="font-medium flex items-center gap-2 text-sm">
                            {pkg.name}
                            {pkg.isPopular && (
                              <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-800" style={{ fontSize: '0.7rem' }}>
                                Populaire
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">Code: {pkg.code}</div>
                          {pkg.description && (
                            <div className="text-xs text-muted-foreground max-w-xs truncate">
                              {pkg.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-2 hidden sm:table-cell">
                        <div className="text-xs">
                          {pkg.basePrice.toLocaleString()} FCFA
                        </div>
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="font-medium text-sm">
                          {pkg.totalPrice.toLocaleString()} FCFA
                        </div>
                      </TableCell>
                      <TableCell className="p-2 hidden md:table-cell">
                        <div className="text-xs">
                          {pkg.guarantees.length} garantie(s)
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {pkg.guarantees.slice(0, 2).map(gId => {
                            const guarantee = guarantees.find(g => g.id === gId);
                            return guarantee?.name;
                          }).filter(Boolean).join(', ')}
                          {pkg.guarantees.length > 2 && '...'}
                        </div>
                      </TableCell>
                      <TableCell className="p-2">
                        <Badge variant="outline" className={pkg.isActive ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'} style={{ fontSize: '0.7rem' }}>
                          {pkg.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditPackageDialog(pkg)}
                            className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTogglePackage(pkg.id)}
                            className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                          >
                            {pkg.isActive ? <XCircle className="w-3 h-3 sm:w-4 sm:h-4" /> : <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePackage(pkg.id)}
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

          {import.meta.env.VITE_MOCK_DATA === 'true' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Grille Responsabilité Civile
                </CardTitle>
                <CardDescription>
                  Tarifs RC par catégorie, énergie et puissance fiscale
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  Catégorie 401 - Essence (1-2 CV): 68,675 FCFA<br />
                  Catégorie 401 - Diesel (2-4 CV): 87,885 FCFA<br />
                  Catégorie 401 - Essence (3-6 CV): 87,885 FCFA<br />
                  Catégorie 401 - Diesel (5-6 CV): 102,345 FCFA<br />
                  Catégorie 401 - Essence (7-9 CV): 102,345 FCFA<br />
                  Catégorie 402 - Essence (1-2 CV): 58,900 FCFA<br />
                  Catégorie 402 - Diesel (2-4 CV): 78,500 FCFA
                </div>
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Voir la grille complète
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5" />
                  Grille TCM/TCL (Tierce)
                </CardTitle>
                <CardDescription>
                  Taux applicables selon valeur neuve et franchise
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  Tierce Complète (401):<br />
                  • Valeur ≤ 12M, Franchise 0%: 4.40%<br />
                  • Valeur ≤ 12M, Franchise 250K: 3.52%<br />
                  • Valeur 12M-25M, Franchise 250K: 3.828%<br />
                  <br />
                  Tierce Collision (401):<br />
                  • Valeur ≤ 40M, Franchise 50K: 4.311%
                </div>
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Voir la grille complète
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Grille IC/IPT
                </CardTitle>
                <CardDescription>
                  Tarifs Individuelle Conducteur/Passagers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  Individuelle Conducteur:<br />
                  • Formule 1: 5,500 FCFA<br />
                  • Formule 2: 8,400 FCFA<br />
                  • Formule 3: 15,900 FCFA<br />
                  <br />
                  Individuelle Passagers:<br />
                  • Formule 1 (3 places): 8,400 FCFA<br />
                  • Formule 1 (4 places): 10,200 FCFA<br />
                  • Formule 2 (3 places): 10,000 FCFA<br />
                  • Formule 2 (4 places): 12,000 FCFA
                </div>
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Voir la grille complète
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Tarifs Fixes
                </CardTitle>
                <CardDescription>
                  Garanties à montant fixe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  • Défense et Recours: 7,950 FCFA<br />
                  • Avance sur recours: 15,000 FCFA<br />
                  • Vol des accessoires: 15,000 FCFA<br />
                  • Assistance Bronze: 48,000 FCFA<br />
                  • Assistance Silver: 65,000 FCFA<br />
                  • (Prix réduits pour packages disponibles)
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    document.getElementById('tarifs-fixes-section')?.scrollIntoView({ behavior: 'smooth' })
                  }
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Voir tous les tarifs
                </Button>
              </CardContent>
            </Card>
          </div>
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
                <DialogContent className="max-w-[95vw] sm:max-w-md">
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
            <DialogContent className="max-w-[95vw] sm:max-w-md">
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
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la garantie</DialogTitle>
            <DialogDescription>Mettez à jour les informations de la garantie</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-guarantee-name">Nom de la garantie</Label>
                <Input
                  id="edit-guarantee-name"
                  value={newGuarantee.name}
                  onChange={(e) => setNewGuarantee((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-guarantee-code">Code</Label>
                <Input
                  id="edit-guarantee-code"
                  value={newGuarantee.code}
                  onChange={(e) => setNewGuarantee((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  maxLength={10}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-guarantee-description">Description</Label>
              <Textarea
                id="edit-guarantee-description"
                value={newGuarantee.description}
                onChange={(e) => setNewGuarantee((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <Label>Méthode de calcul</Label>
              <Select
                value={newGuarantee.calculationMethod}
                onValueChange={(value: CalculationMethodType) =>
                  setNewGuarantee((prev) => ({ ...prev, calculationMethod: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectableCalculationMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Champs dynamiques selon la méthode de calcul (édition) */}
            {(() => {
              const method = newGuarantee.calculationMethod
              const showRate = ['RATE_ON_SI', 'RATE_ON_NEW_VALUE', 'CONDITIONAL_RATE'].includes(method as string)
              const showMinMax = showRate
              const isFixed = method === 'FIXED_AMOUNT'
              const isFree = (method as any) === 'FREE'

              return (
                <>
                  {isFixed && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Montant fixe (FCFA)</Label>
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
                        />
                      </div>
                    </div>
                  )}
                  {showRate && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Taux (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={newGuarantee.rate || ''}
                          onChange={(e) => setNewGuarantee(prev => ({ ...prev, rate: parseFloat(e.target.value) || undefined }))}
                          placeholder="Ex: 1.5"
                        />
                      </div>
                      {showMinMax && (
                        <div className="flex items-end text-sm text-muted-foreground">
                          Les montants mini/maxi ci‑dessous sont optionnels
                        </div>
                      )}
                    </div>
                  )}

                  {showMinMax && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Montant minimum (FCFA)</Label>
                        <Input
                          type="number"
                          value={newGuarantee.minValue || ''}
                          onChange={(e) => setNewGuarantee(prev => ({ ...prev, minValue: parseFloat(e.target.value) || undefined }))}
                          placeholder="Ex: 50000"
                        />
                      </div>
                      <div>
                        <Label>Montant maximum (FCFA)</Label>
                        <Input
                          type="number"
                          value={newGuarantee.maxValue || ''}
                          onChange={(e) => setNewGuarantee(prev => ({ ...prev, maxValue: parseFloat(e.target.value) || undefined }))}
                          placeholder="Ex: 500000"
                        />
                      </div>
                    </div>
                  )}

                  {isFree && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Cette garantie est gratuite: aucun taux ni montant à saisir ici.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )
            })()}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-guarantee-optional"
                checked={newGuarantee.isOptional}
                onCheckedChange={(checked) =>
                  setNewGuarantee((prev) => ({ ...prev, isOptional: checked as boolean }))
                }
              />
              <Label htmlFor="edit-guarantee-optional">Garantie optionnelle</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditGuaranteeDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateGuarantee}>Mettre à jour</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour modifier un package */}
      <Dialog open={isEditPackageDialogOpen} onOpenChange={setIsEditPackageDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le package</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations du package
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-package-name">Nom du package</Label>
                <Input
                  id="edit-package-name"
                  value={newPackage.name}
                  onChange={(e) => setNewPackage(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-package-code">Code</Label>
                <Input
                  id="edit-package-code"
                  value={newPackage.code}
                  onChange={(e) => setNewPackage(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  maxLength={20}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-package-description">Description</Label>
              <Textarea
                id="edit-package-description"
                value={newPackage.description}
                onChange={(e) => setNewPackage(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <Label>Prix de base (FCFA)</Label>
              <Input
                type="number"
                value={newPackage.basePrice}
                onChange={(e) => setNewPackage(prev => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div>
              <Label>Garanties incluses</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {guarantees.filter(g => g.isActive).map(guarantee => (
                  <div key={guarantee.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-package-${guarantee.id}`}
                      checked={newPackage.guaranteeIds.includes(guarantee.id)}
                      onCheckedChange={(checked) =>
                        setNewPackage(prev => ({
                          ...prev,
                          guaranteeIds: checked
                            ? [...prev.guaranteeIds, guarantee.id]
                            : prev.guaranteeIds.filter(id => id !== guarantee.id)
                        }))
                      }
                    />
                    <Label
                      htmlFor={`edit-package-${guarantee.id}`}
                      className="text-sm cursor-pointer"
                      title={guarantee.description}
                    >
                      {guarantee.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPackageDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdatePackage}>
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTarificationPage;
