import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase' // Direct Supabase client import
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Check, Pause, Play, LayoutGrid } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { logger } from '@/lib/logger'
import {
  guaranteeService,
  getBuiltinDefaultGuarantees,
} from '@/features/tarification/services/guaranteeService'
import {
  tarificationSupabaseService,
  type FixedTariffItem,
  type FixedCoverageOption,
} from '@/features/tarification/services/tarificationSupabaseService'
import {
  Guarantee,
  GuaranteeFormData,
  CalculationMethodType,
  TarifFixe,
  TarifFixeFormData,
  TarifRC,
  TarifRCFormData,
  VariableBasedConfig,
  VariableSourceType,
  MatrixBasedConfig,
  MatrixTariff,
} from '@/types/tarification'
import {
  Plus,
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
  List,
  Database,
  Zap,
  DollarSign,
  Percent,
  Package,
  Layers,
  Sparkles,
  Fuel,
  MoreHorizontal,
  Building,
  Edit,
  Trash2,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'


// StatCard Component
interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon: Icon, color }) => {
  return (
    <Card className='overflow-hidden hover:shadow-md transition-all duration-200'>
      <CardContent className='p-6'>
        <div className='flex items-center justify-between'>
          <div className='flex-1'>
            <p className='text-sm font-medium text-muted-foreground mb-1'>{title}</p>
            <p className='text-2xl font-bold tracking-tight'>{value}</p>
            {subtitle && <p className='text-xs text-muted-foreground'>{subtitle}</p>}
          </div>
          <div className={`h-12 w-12 rounded-lg bg-opacity-10 flex items-center justify-center ${color.replace('text-', 'bg-').replace('dark:', 'dark:bg-')}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// GuaranteeCard Component
interface GuaranteeCardProps {
  guarantee: Guarantee
  insurer?: { id: string; name: string; code?: string; logo_url?: string }
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}

const GuaranteeCard: React.FC<GuaranteeCardProps> = ({
  guarantee,
  insurer,
  onEdit,
  onToggle,
  onDelete,
}) => {
  const getCalculationMethodLabel = (method: CalculationMethodType) => {
    const methods: Record<CalculationMethodType, { label: string; description: string; color: string }> = {
      FIXED_AMOUNT: { label: 'Montant Fixe', description: 'Montant fixe en FCFA', color: 'text-blue-600' },
      RATE_ON_SI: { label: 'Taux SI', description: 'Pourcentage de la somme assurée', color: 'text-green-600' },
      RATE_ON_NEW_VALUE: { label: 'Taux Valeur Neuf', description: 'Pourcentage de la valeur à neuf', color: 'text-purple-600' },
      CONDITIONAL_RATE: { label: 'Taux Conditionnel', description: 'Taux selon conditions', color: 'text-orange-600' },
      MATRIX_BASED: { label: 'Matrice', description: 'Basé sur une matrice', color: 'text-pink-600' },
      VARIABLE_BASED: { label: 'Variable', description: 'Basé sur des variables', color: 'text-cyan-600' },
      FREE: { label: 'Gratuit', description: 'Sans coût', color: 'text-emerald-600' },
    }
    return methods[method] || { label: method, description: '', color: 'text-gray-600' }
  }

  const methodInfo = getCalculationMethodLabel(guarantee.calculationMethod)
  const getValueDisplay = () => {
    if (guarantee.calculationMethod === 'FREE') return 'Gratuit'
    if (guarantee.calculationMethod === 'FIXED_AMOUNT') {
      return typeof guarantee.fixedAmount === 'number'
        ? `${guarantee.fixedAmount.toLocaleString()} FCFA`
        : '-'
    }
    if (['RATE_ON_SI', 'RATE_ON_NEW_VALUE', 'CONDITIONAL_RATE'].includes(guarantee.calculationMethod)) {
      return typeof guarantee.rate === 'number' ? `${guarantee.rate}%` : '-'
    }
    return '-'
  }

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 ${
      !guarantee.isActive ? 'opacity-60' : ''
    }`}>
      <CardContent className='p-4'>
        {/* Header */}
        <div className='flex items-start justify-between mb-3'>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 mb-1'>
              <h3 className='font-semibold text-base truncate'>{guarantee.name}</h3>
              {!guarantee.isOptional && (
                <Badge variant='outline' className='text-xs bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'>
                  Obligatoire
                </Badge>
              )}
            </div>
            <p className='text-xs text-muted-foreground'>Code: {guarantee.code}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className='h-4 w-4 mr-2' />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggle}>
                {guarantee.isActive ? (
                  <>
                    <XCircle className='h-4 w-4 mr-2' />
                    Désactiver
                  </>
                ) : (
                  <>
                    <CheckCircle className='h-4 w-4 mr-2' />
                    Activer
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className='text-red-600'>
                <Trash2 className='h-4 w-4 mr-2' />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {guarantee.description && (
          <p className='text-sm text-muted-foreground mb-3 line-clamp-2'>
            {guarantee.description}
          </p>
        )}

        {/* Calculation Method */}
        <div className='space-y-2 mb-3'>
          <div className='flex items-center justify-between'>
            <span className='text-xs text-muted-foreground'>Méthode</span>
            <span className={`text-xs font-medium ${methodInfo.color}`}>
              {methodInfo.label}
            </span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-xs text-muted-foreground'>Valeur</span>
            <span className='text-sm font-semibold'>{getValueDisplay()}</span>
          </div>
          {guarantee.minValue && guarantee.maxValue && (
            <div className='text-xs text-muted-foreground'>
              Min: {guarantee.minValue.toLocaleString()} - Max: {guarantee.maxValue.toLocaleString()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between pt-3 border-t'>
          {insurer && (
            <div className='text-xs text-muted-foreground flex items-center gap-1'>
              {insurer.logo_url && (
                <img
                  src={insurer.logo_url}
                  alt={insurer.name}
                  className='w-4 h-4 rounded object-cover'
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
              <Building className='h-3 w-3' />
              {insurer.name}
            </div>
          )}
          <Badge
            variant={guarantee.isActive ? 'default' : 'secondary'}
            className={`text-xs ${
              guarantee.isActive
                ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
            }`}
          >
            {guarantee.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export const AdminTarificationPage: React.FC = () => {
  // Important: wait for real authentication before loading data
  // ✅ Corrigé : isInitializing retiré pour éviter le blocage après refresh
  const { user, isAuthenticated, isLoading } = useAuth()
  const [guarantees, setGuarantees] = useState<Guarantee[]>([])
  const [tarifFixes, setTarifFixes] = useState<FixedTariffItem[]>([])
  const [fixedCoverageOptions, setFixedCoverageOptions] = useState<FixedCoverageOption[]>([])
  const [freeCoverages, setFreeCoverages] = useState<
    Array<{ id: string; name: string; isMandatory: boolean }>
  >([])
  const [selectedCoverageId, setSelectedCoverageId] = useState<string>('')
  const [availableFormulas, setAvailableFormulas] = useState<string[]>([])
  const [selectedFormulaName, setSelectedFormulaName] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid') // Nouveau: mode d'affichage

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
      setTarifRC((prev) => [...prev, newTarif])
      showNotification('success', 'Tranche tarifaire créée avec succès')
      setShowRCEditForm(false)
      setEditingRC(null)
    } catch (error) {
      logger.error('Error creating RC tariff:', error)
      showNotification('error', 'Erreur lors de la création de la tranche tarifaire')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRC = async (id: string, tarif: Partial<TarifRC>) => {
    try {
      setLoading(true)
      const updatedTarif = await guaranteeService.updateTarifRC(id, tarif)
      setTarifRC((prev) => prev.map((t) => (t.id === id ? updatedTarif : t)))
      showNotification('success', 'Tranche tarifaire mise à jour avec succès')
      setShowRCEditForm(false)
      setEditingRC(null)
    } catch (error) {
      logger.error('Error updating RC tariff:', error)
      showNotification('error', 'Erreur lors de la mise à jour de la tranche tarifaire')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRC = async (id: string) => {
    showConfirmDialog(
      'Supprimer la tranche tarifaire',
      'Êtes-vous sûr de vouloir supprimer cette tranche tarifaire ?',
      async () => {
        try {
          setLoading(true)
          await guaranteeService.deleteTarifRC(id)
          setTarifRC((prev) => prev.filter((t) => t.id !== id))
          showNotification('success', 'Tranche tarifaire supprimée avec succès')
        } catch (error) {
          logger.error('Error deleting RC tariff:', error)
          showNotification('error', 'Erreur lors de la suppression de la tranche tarifaire')
        } finally {
          setLoading(false)
        }
      }
    )
  }
  const [statistics, setStatistics] = useState<{
    totalGuarantees: number
    activeGuarantees: number
    priceRange: { min: number; max: number }
    mostUsedGuarantees: Array<{
      guaranteeId: string
      guaranteeName: string
      usageCount: number
    }>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateGuaranteeDialogOpen, setIsCreateGuaranteeDialogOpen] = useState(false)
  const [isCreatingGuarantee, setIsCreatingGuarantee] = useState(false)
  const [isEditGuaranteeDialogOpen, setIsEditGuaranteeDialogOpen] = useState(false)
  const [showInactive, setShowInactive] = useState(true)
  const [selectedGuarantee, setSelectedGuarantee] = useState<Guarantee | null>(null)
  const [selectedTarifFixe, setSelectedTarifFixe] = useState<FixedTariffItem | null>(null)

  const [newGuarantee, setNewGuarantee] = useState<GuaranteeFormData>({
    name: '',
    code: '',
    category: 'RESPONSABILITE_CIVILE',
    description: '',
    calculationMethod: 'FIXED_AMOUNT',
    isOptional: true,
    insurerId: '00000000-0000-0000-0000-000000000001', // Default insurer
    parameters: undefined,
  })
  const [insurers, setInsurers] = useState<Array<{ id: string; name: string; code?: string; logo_url?: string }>>([])
  const [loadingInsurers, setLoadingInsurers] = useState(true)
  const [insurersDropdownOpen, setInsurersDropdownOpen] = useState(false)
  const [existingGuaranteeCodes, setExistingGuaranteeCodes] = useState<string[]>([])

  // États pour les notifications et confirmations
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info' | 'warning'
    message: string
    description?: string
  } | null>(null)

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })

  // Fonction pour afficher une notification
  const showNotification = (
    type: 'success' | 'error' | 'info' | 'warning',
    message: string,
    description?: string
  ) => {
    setNotification({ type, message, description })
    // Auto-dismiss après 5 secondes
    setTimeout(() => setNotification(null), 5000)
  }

  // Fonction pour afficher une confirmation
  const showConfirmDialog = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm })
  }

  // Générer automatiquement le code lorsque le nom change
  const generateCodeFromName = async (name: string) => {
    if (!name.trim()) {
      setNewGuarantee((prev) => ({ ...prev, code: '' }))
      return
    }

    try {
      // Récupérer les garanties existantes si pas déjà chargées
      if (existingGuaranteeCodes.length === 0) {
        const guarantees = await guaranteeService.getGuarantees()
        const codes = guarantees.map((g) => g.code)
        setExistingGuaranteeCodes(codes)
      }

      // Générer le code automatiquement
      const generatedCode = guaranteeService.generateGuaranteeCode(name, existingGuaranteeCodes)
      setNewGuarantee((prev) => ({ ...prev, code: generatedCode }))
    } catch (error) {
      console.error('Erreur lors de la génération du code:', error)
      // En cas d'erreur, générer un code de base
      const fallbackCode =
        name
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 8) || `GAR_${Date.now().toString().slice(-6)}`
      setNewGuarantee((prev) => ({ ...prev, code: fallbackCode }))
    }
  }

  // Gérer le changement du nom pour générer automatiquement le code
  const handleGuaranteeNameChange = async (value: string) => {
    setNewGuarantee((prev) => ({ ...prev, name: value }))
    await generateCodeFromName(value)
  }

  const [isCreateTarifFixeDialogOpen, setIsCreateTarifFixeDialogOpen] = useState(false)
  const [isEditTarifFixeDialogOpen, setIsEditTarifFixeDialogOpen] = useState(false)
  const [newTarifFixe, setNewTarifFixe] = useState<TarifFixeFormData>({
    guaranteeName: '',
    prime: 0,
    conditions: '',
    packPriceReduced: undefined,
  })

  useEffect(() => {
    // Load data only when the session is confirmed
    // Avoid triggering when we only have a cached preview user (not authenticated yet)
    // ✅ Corrigé : isInitializing retiré pour éviter le blocage après refresh
    if (!isLoading && isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated, isLoading])

  // Petit utilitaire pour éviter qu'un appel réseau bloque l'écran de chargement
  const withTimeout = async <T,>(promise: Promise<T>, ms = 1500, fallback: T): Promise<T> => {
    return await Promise.race<Promise<T>>([
      promise,
      new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
    ])
  }

  const loadData = async () => {
    try {
      setLoading(true)
      logger.debug('AdminTarificationPage.loadData: start')
      logger.debug('AdminTarificationPage.loadData: loading insurers')
      
      // Load insurers for the guarantee creation form
      try {
        setLoadingInsurers(true)
        const { data: insurersData, error: insurersError } = await supabase
          .from('insurers')
          .select('id, name, code, logo_url')
          .order('name', { ascending: true })
        
        if (insurersError) {
          logger.error('Failed to load insurers:', insurersError)
          showNotification('error', `Erreur de chargement des assureurs: ${insurersError.message}`)
        } else {
          setInsurers(insurersData || [])
          logger.debug(`Loaded ${insurersData?.length || 0} insurers`)
        }
      } catch (insurersLoadError) {
        logger.error('Error loading insurers:', insurersLoadError)
        showNotification('error', 'Erreur lors du chargement des assureurs')
      } finally {
        setLoadingInsurers(false)
      }
      
      logger.debug('AdminTarificationPage.loadData: calling listAdminCoverages')
      const supaGuaranteesData = await withTimeout(
        tarificationSupabaseService
          .listAdminCoverages()
          .then((rows) => {
            logger.debug(
              `AdminTarificationPage.loadData: received ${rows.length} rows from Supabase`
            )
            return rows.map((row) => {
              const metadata = (row.metadata || {}) as Record<string, any>
              const parameters = metadata.parameters as Guarantee['parameters'] | undefined
              const category =
                (metadata.category as Guarantee['category']) || 'RESPONSABILITE_CIVILE'
              const description =
                row.description || (metadata.description as string | undefined) || ''
              const existingCode = row.code || (metadata.code as string | undefined) || ''
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
                createdBy: 'supabase',
                insurerId: row.insurer_id || undefined,
              } as Guarantee
            })
          })
          .catch((err) => {
            logger.error('Erreur de chargement des garanties (DB):', err)
            showNotification('error', 'Impossible de charger les garanties depuis la base')
            return [] as Guarantee[]
          }),
        10000, // Augmenté à 10 secondes
        [] as Guarantee[]
      )
      logger.debug(
        `AdminTarificationPage.loadData: final supaGuaranteesData length: ${supaGuaranteesData.length}`
      )

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
        guaranteeService.getTarificationRC().catch(() => []),
      ])

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
          logger.warn(
            'AdminTarificationPage.loadData: using built-in default guarantees as fallback'
          )
        }
      }

      setGuarantees(finalGuarantees)
      setStatistics(statsData)
      setTarifFixes(fixedTariffs as FixedTariffItem[])
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
      logger.error('Error loading data:', error)
      showNotification('error', 'Erreur lors du chargement des données de tarification')
    } finally {
      setLoading(false)
    }
  }

  // ---- Tarifs Fixes CRUD ----
  const handleCreateTarifFixe = async () => {
    try {
      if (!selectedCoverageId || !newTarifFixe.prime) {
        showNotification('error', 'Sélectionnez une garantie et saisissez une prime')
        return
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
      setIsCreateTarifFixeDialogOpen(false)
      setNewTarifFixe({ guaranteeName: '', prime: 0, conditions: '', packPriceReduced: undefined })
      setSelectedCoverageId('')
      setSelectedFormulaName('')
      showNotification('success', 'Tarif fixe créé')
    } catch (error) {
      logger.error('Error creating fixed tariff:', error)
      showNotification('error', 'Erreur lors de la création du tarif')
    }
  }

  const openEditTarifFixeDialog = (tarif: FixedTariffItem) => {
    setSelectedTarifFixe(tarif)
    setNewTarifFixe({
      guaranteeName: `${tarif.coverageName}${tarif.formulaName ? ' - ' + tarif.formulaName : ''}`,
      prime: tarif.fixedAmount,
      conditions: tarif.conditions || '',
      packPriceReduced: tarif.packPriceReduced ?? undefined,
    })
    setSelectedCoverageId(tarif.coverageId)
    setSelectedFormulaName(tarif.formulaName || '')
    setIsEditTarifFixeDialogOpen(true)
  }

  const handleUpdateTarifFixe = async () => {
    if (!selectedTarifFixe) return
    try {
      if (!selectedCoverageId || !newTarifFixe.prime) {
        showNotification('error', 'Sélectionnez une garantie et saisissez une prime')
        return
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
      setIsEditTarifFixeDialogOpen(false)
      setSelectedTarifFixe(null)
      setNewTarifFixe({ guaranteeName: '', prime: 0, conditions: '', packPriceReduced: undefined })
      setSelectedCoverageId('')
      setSelectedFormulaName('')
      showNotification('success', 'Tarif fixe mis à jour')
    } catch (error) {
      logger.error('Error updating fixed tariff:', error)
      showNotification('error', 'Erreur lors de la mise à jour du tarif')
    }
  }

  const handleDeleteTarifFixe = async (id: string) => {
    showConfirmDialog(
      'Supprimer le tarif fixe',
      'Êtes-vous sûr de vouloir supprimer ce tarif fixe ?',
      async () => {
        try {
          await tarificationSupabaseService.deleteFixedTariff(id)
          const refreshed = await tarificationSupabaseService.listFixedTariffs()
          setTarifFixes(refreshed)
          showNotification('success', 'Tarif fixe supprimé')
        } catch (error) {
          logger.error('Error deleting fixed tariff:', error)
          showNotification('error', 'Erreur lors de la suppression')
        }
      }
    )
  }

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

      const isFixed = method === 'FIXED_AMOUNT'
      if (
        isFixed &&
        (!newGuarantee.fixedAmount ||
          Number.isNaN(newGuarantee.fixedAmount) ||
          (newGuarantee.fixedAmount as number) <= 0)
      ) {
        missing.push('Montant fixe (FCFA)')
      }

      if (missing.length > 0) {
        logger.warn('handleCreateGuarantee: missing fields', missing)
        showNotification('error', `Champs obligatoires manquants: ${missing.join(', ')}`, 'Veuillez compléter les informations requises avant de continuer.')
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
            insurerId: '00000000-0000-0000-0000-000000000001', // TODO: Replace with selected insurer from form
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
            await tarificationSupabaseService.upsertCoverageFixedTariff(
              coverageId,
              payload.fixedAmount
            )
            logger.api('handleCreateGuarantee: upserted fixed tariff', {
              coverageId,
              fixedAmount: payload.fixedAmount,
            })
          }
        }
      } catch (e) {
        // Fallback local storage in dev
        logger.warn('handleCreateGuarantee: Supabase create failed, fallback to local', e)
        await guaranteeService.createGuarantee(payload)
      }
      setIsCreateGuaranteeDialogOpen(false)
      setNewGuarantee({
        name: '',
        code: '',
        category: 'RESPONSABILITE_CIVILE',
        description: '',
        calculationMethod: 'FIXED_AMOUNT',
        isOptional: true,
        parameters: undefined,
      })
      showNotification('success', 'Garantie créée avec succès')
      loadData()
    } catch (error) {
      logger.error('Error creating guarantee:', error)
      showNotification('error', 'Erreur lors de la création de la garantie')
    } finally {
      setIsCreatingGuarantee(false)
    }
  }

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

      const isFixed = method === 'FIXED_AMOUNT'
      if (
        isFixed &&
        (!newGuarantee.fixedAmount ||
          Number.isNaN(newGuarantee.fixedAmount) ||
          (newGuarantee.fixedAmount as number) <= 0)
      ) {
        missing.push('Montant fixe (FCFA)')
      }

      if (missing.length > 0) {
        logger.warn('handleUpdateGuarantee: missing fields', missing)
        showNotification('error', `Champs obligatoires manquants: ${missing.join(', ')}`, 'Veuillez compléter les informations requises avant de continuer.')
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
      }

      logger.api('handleUpdateGuarantee: payload', { id: selectedGuarantee.id, payload })
      try {
        await tarificationSupabaseService.updateCoverageDetails(selectedGuarantee.id, {
          name: payload.name!,
          calculationMethod: payload.calculationMethod!,
          isOptional: payload.isOptional!,
        })
        logger.api('handleUpdateGuarantee: updated coverage in Supabase', {
          id: selectedGuarantee.id,
        })
        await guaranteeService.updateGuarantee(selectedGuarantee.id, payload)
        if (method === 'FIXED_AMOUNT' && payload.fixedAmount) {
          await tarificationSupabaseService.upsertCoverageFixedTariff(
            selectedGuarantee.id,
            payload.fixedAmount
          )
          logger.api('handleUpdateGuarantee: upserted fixed tariff', {
            id: selectedGuarantee.id,
            fixedAmount: payload.fixedAmount,
          })
        }
      } catch (e) {
        logger.warn('handleUpdateGuarantee: Supabase update failed, fallback to local', e)
        await guaranteeService.updateGuarantee(selectedGuarantee.id, payload)
      }
      setIsEditGuaranteeDialogOpen(false)
      setSelectedGuarantee(null)
      setNewGuarantee({
        name: '',
        code: '',
        category: 'RESPONSABILITE_CIVILE',
        description: '',
        calculationMethod: 'FIXED_AMOUNT',
        isOptional: true,
        parameters: undefined,
      })
      showNotification('success', 'Garantie mise à jour avec succès')
      loadData()
    } catch (error) {
      logger.error('Error updating guarantee:', error)
      showNotification('error', 'Erreur lors de la mise à jour de la garantie')
    }
  }

  const handleDeleteGuarantee = async (id: string) => {
    const guarantee = guarantees.find((g) => g.id === id)
    showConfirmDialog(
      'Supprimer la garantie',
      `Êtes-vous sûr de vouloir supprimer la garantie "${guarantee?.name}" ? Cette action est irréversible.`,
      async () => {
        try {
          try {
            await tarificationSupabaseService.deleteCoverage(id)
            logger.api('handleDeleteGuarantee: deleted coverage in Supabase', { id })
          } catch (e) {
            logger.warn('handleDeleteGuarantee: Supabase delete failed, fallback to local', e)
            await guaranteeService.deleteGuarantee(id)
          }
          loadData()
          showNotification('success', 'Garantie supprimée avec succès')
        } catch (error) {
          logger.error('Error deleting guarantee:', error)
          showNotification('error', 'Erreur lors de la suppression de la garantie')
        }
      }
    )
  }

  const handleToggleGuarantee = async (id: string) => {
    try {
      const found = guarantees.find((g) => g.id === id)
      if (found) {
        const newStatus = !found.isActive
        try {
          await tarificationSupabaseService.updateCoverageDetails(id, { isActive: newStatus })
          logger.api('handleToggleGuarantee: toggled in Supabase', { id, to: newStatus })
        } catch (e) {
          logger.warn('handleToggleGuarantee: Supabase toggle failed, fallback to local', e)
          await guaranteeService.toggleGuarantee(id)
        }
        showNotification(
          'success',
          `Garantie ${newStatus ? 'activée' : 'désactivée'}`,
          `"${found.name}" est maintenant ${newStatus ? 'active' : 'inactive'}`
        )
      }
      loadData()
    } catch (error) {
      logger.error('Error toggling guarantee:', error)
      showNotification('error', 'Erreur lors du changement de statut')
    }
  }

  const openEditGuaranteeDialog = (guarantee: Guarantee) => {
    setSelectedGuarantee(guarantee)
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
      parameters: guarantee.parameters,
    })
    setIsEditGuaranteeDialogOpen(true)
  }

  const filteredGuarantees = guarantees.filter((guarantee) => {
    const insurerName = guarantee.insurerId 
      ? insurers.find(i => i.id === guarantee.insurerId)?.name || ''
      : (insurers[0]?.name || 'Système')
    const matchesSearch = `${guarantee.name} ${guarantee.code} ${guarantee.description || ''} ${insurerName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesActive = showInactive ? true : guarantee.isActive
    return matchesSearch && matchesActive
  })

  const calculationMethods = guaranteeService.getCalculationMethods()
  const selectableCalculationMethods = calculationMethods.filter((m) =>
    ['FREE', 'FIXED_AMOUNT', 'VARIABLE_BASED', 'MATRIX_BASED'].includes(m.value)
  )


  const handleCalculationMethodChange = (value: CalculationMethodType) => {
    setNewGuarantee((prev) => ({
      ...prev,
      calculationMethod: value,
      parameters: prev.parameters,
    }))
  }

  // Nouvelle fonction de rendu pour VARIABLE_BASED
  const renderVariableBasedConfigSection = () => {
    const method = newGuarantee.calculationMethod
    if (method !== 'VARIABLE_BASED') {
      return null
    }

    const config = (newGuarantee.parameters?.variableBased ??
      newGuarantee.parameters?.variableBasedConfig) as VariableBasedConfig | undefined
    const variableSource = config?.variableSource ?? 'VENAL_VALUE'
    const conditionedByNewValue = config?.conditionedByNewValue ?? false
    const newValueThreshold = config?.newValueThreshold ?? 25_000_000
    const rateBelowThresholdPercent = config?.rateBelowThresholdPercent ?? 1.1
    const rateAboveThresholdPercent = config?.rateAboveThresholdPercent ?? 2.1

    return (
      <Card className='border border-dashed'>
        <CardHeader className='pb-2'>
          <CardTitle className='text-base'>Configuration Basée sur une Variable</CardTitle>
          <CardDescription>
            Définissez la variable du véhicule et les tarifs appliqués
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label>Variable source</Label>
            <select
              className='w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm'
              value={variableSource}
              onChange={(e) => {
                const variableSource = e.target.value as VariableSourceType
                setNewGuarantee((prev) => ({
                  ...prev,
                  parameters: {
                    ...prev.parameters,
                    variableBased: {
                      ...prev.parameters?.variableBased,
                      variableSource,
                      ratePercent: 0,
                      // Conserver la condition existante quelle que soit la source
                      conditionedByNewValue: prev.parameters?.variableBased?.conditionedByNewValue ?? false,
                    },
                  },
                }))
              }}
            >
              <option value='VENAL_VALUE'>Valeur vénale (taux %)</option>
              <option value='NEW_VALUE'>Valeur neuve (taux %)</option>
            </select>
          </div>

          {/* Case à cocher "Conditionné par la valeur neuve" - visible pour VENAL_VALUE et NEW_VALUE */}
          {variableSource && (
            <div className='flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <Checkbox
                id='conditioned-by-new-value'
                checked={conditionedByNewValue}
                onCheckedChange={(checked) => {
                  const isChecked = Boolean(checked)
                  setNewGuarantee((prev) => ({
                    ...prev,
                    parameters: {
                      ...prev.parameters,
                      variableBased: {
                        ...prev.parameters?.variableBased,
                        variableSource,
                        conditionedByNewValue: isChecked,
                        newValueThreshold: isChecked ? 25_000_000 : undefined,
                        rateBelowThresholdPercent: isChecked ? 1.1 : undefined,
                        rateAboveThresholdPercent: isChecked ? 2.1 : undefined,
                      },
                    },
                  }))
                }}
              />
              <div>
                <Label htmlFor='conditioned-by-new-value' className='cursor-pointer text-sm font-medium'>
                  Conditionné par la valeur neuve
                </Label>
                <p className='text-xs text-muted-foreground'>
                  Applique un taux différent selon le seuil de 25 000 000 FCFA
                </p>
                <p className='text-xs text-blue-700 mt-1'>
                  1,1% × Vehicle Sum Insured si SI ≤ 25 000 000<br />
                  2,1% × Vehicle Sum Insured si SI {'>'} 25 000 000
                </p>
              </div>
            </div>
          )}

          {/* Formulaire standard pour toutes les sources (taux %) - masqué si condition activée */}
          {!conditionedByNewValue ? (
            <div className='space-y-4'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <Label>Taux (%)</Label>
                  <Input
                    type='number'
                    step='0.01'
                    value={config?.ratePercent ?? ''}
                    onChange={(e) => {
                      const ratePercent = parseFloat(e.target.value)
                      setNewGuarantee((prev) => ({
                        ...prev,
                        parameters: {
                          ...prev.parameters,
                          variableBased: {
                            ...prev.parameters?.variableBased,
                            variableSource,
                            ratePercent: Number.isFinite(ratePercent) ? ratePercent : 0,
                          },
                        },
                      }))
                    }}
                    placeholder='0.42'
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Configuration spécifique pour la condition "Conditionné par la valeur neuve" */
            <div className='space-y-4 p-3 bg-green-50 border border-green-200 rounded-lg'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <Label>Seuil valeur vénale (FCFA)</Label>
                  <Input
                    type='number'
                    value={newValueThreshold}
                    onChange={(e) => {
                      const threshold = parseInt(e.target.value, 10)
                      setNewGuarantee((prev) => ({
                        ...prev,
                        parameters: {
                          ...prev.parameters,
                          variableBased: {
                            ...prev.parameters?.variableBased,
                            variableSource,
                            conditionedByNewValue: true,
                            newValueThreshold: Number.isFinite(threshold) ? threshold : 25_000_000,
                          },
                        },
                      }))
                    }}
                    placeholder='25000000'
                  />
                  <p className='text-xs text-muted-foreground'>Seuil par défaut: 25 000 000 FCFA</p>
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <Label>Taux si SI ≤ seuil (%)</Label>
                  <Input
                    type='number'
                    step='0.01'
                    value={rateBelowThresholdPercent}
                    onChange={(e) => {
                      const rate = parseFloat(e.target.value)
                      setNewGuarantee((prev) => ({
                        ...prev,
                        parameters: {
                          ...prev.parameters,
                          variableBased: {
                            ...prev.parameters?.variableBased,
                            variableSource,
                            conditionedByNewValue: true,
                            rateBelowThresholdPercent: Number.isFinite(rate) ? rate : 1.1,
                          },
                        },
                      }))
                    }}
                    placeholder='1.1'
                  />
                  <p className='text-xs text-muted-foreground'>Taux appliqué si SI ≤ seuil</p>
                </div>
                <div>
                  <Label>Taux si SI {'>'} seuil (%)</Label>
                  <Input
                    type='number'
                    step='0.01'
                    value={rateAboveThresholdPercent}
                    onChange={(e) => {
                      const rate = parseFloat(e.target.value)
                      setNewGuarantee((prev) => ({
                        ...prev,
                        parameters: {
                          ...prev.parameters,
                          variableBased: {
                            ...prev.parameters?.variableBased,
                            variableSource,
                            conditionedByNewValue: true,
                            rateAboveThresholdPercent: Number.isFinite(rate) ? rate : 2.1,
                          },
                        },
                      }))
                    }}
                    placeholder='2.1'
                  />
                  <p className='text-xs text-muted-foreground'>Taux appliqué si SI {'>'} seuil</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Nouvelle fonction de rendu pour MATRIX_BASED
  const renderMatrixBasedConfigSection = () => {
    const method = newGuarantee.calculationMethod
    if (method !== 'MATRIX_BASED') {
      return null
    }

    const config = (newGuarantee.parameters?.matrixBased ??
      newGuarantee.parameters?.matrixBasedConfig) as MatrixBasedConfig | undefined
    const dimension = config?.dimension ?? 'FISCAL_POWER'

    return (
      <Card className='border border-dashed'>
        <CardHeader className='pb-2'>
          <CardTitle className='text-base'>Configuration Basée sur une Matrice</CardTitle>
          <CardDescription>Définissez la grille de tarification</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label>Dimension de la matrice</Label>
            <select
              className='w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm'
              value={dimension}
              onChange={(e) => {
                const dimension = e.target.value as MatrixBasedConfig['dimension']
                setNewGuarantee((prev) => ({
                  ...prev,
                  parameters: {
                    ...prev.parameters,
                    matrixBased: {
                      dimension,
                      tariffs: [],
                      defaultPrime: config?.defaultPrime,
                    },
                  },
                }))
              }}
            >
              <option value='FISCAL_POWER'>Puissance fiscale (CV)</option>
              <option value='FUEL_TYPE'>Type de carburant</option>
              <option value='VEHICLE_CATEGORY'>Catégorie de véhicule (401, 402, etc.)</option>
              <option value='SEATS'>Nombre de places</option>
              <option value='FORMULA'>Formule</option>
            </select>
            <p className='text-xs text-muted-foreground mt-1'>
              Choisissez la dimension unique pour la grille de tarification
            </p>
          </div>

          {/* Formulaire dynamique pour FISCAL_POWER */}
          {dimension === 'FISCAL_POWER' ? (
            <div className='space-y-4'>
              <div className='p-3 bg-blue-50 border border-blue-200 rounded-md'>
                <p className='text-sm text-blue-900'>
                  <strong>Configuration :</strong> Définissez les tarifs selon le type de carburant
                  et la puissance fiscale (CV).
                </p>
              </div>

              {!config?.tariffs || config.tariffs.length === 0 ? (
                <div className='text-center p-6 border-2 border-dashed border-gray-300 rounded-lg'>
                  <Layers className='h-8 w-8 text-gray-400 mx-auto mb-2' />
                  <p className='text-sm text-gray-500 mb-4'>Aucun tarif configuré</p>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setNewGuarantee((prev) => ({
                        ...prev,
                        parameters: {
                          ...prev.parameters,
                          matrixBased: {
                            dimension: 'FISCAL_POWER',
                            tariffs: [
                              // Tarifs par défaut pour Essence
                              {
                                key: `essence_1_2_${Date.now()}`,
                                fuelType: 'Essence',
                                fiscalPowerMin: 1,
                                fiscalPowerMax: 2,
                                prime: 68675,
                              },
                              {
                                key: `essence_3_4_${Date.now()}`,
                                fuelType: 'Essence',
                                fiscalPowerMin: 3,
                                fiscalPowerMax: 4,
                                prime: 75000,
                              },
                              {
                                key: `essence_5_7_${Date.now()}`,
                                fuelType: 'Essence',
                                fiscalPowerMin: 5,
                                fiscalPowerMax: 7,
                                prime: 85000,
                              },
                              {
                                key: `essence_8_10_${Date.now()}`,
                                fuelType: 'Essence',
                                fiscalPowerMin: 8,
                                fiscalPowerMax: 10,
                                prime: 95000,
                              },
                              {
                                key: `essence_11_plus_${Date.now()}`,
                                fuelType: 'Essence',
                                fiscalPowerMin: 11,
                                fiscalPowerMax: 99,
                                prime: 110000,
                              },
                              // Tarifs par défaut pour Diesel
                              {
                                key: `diesel_1_2_${Date.now()}`,
                                fuelType: 'Diesel',
                                fiscalPowerMin: 1,
                                fiscalPowerMax: 2,
                                prime: 68675,
                              },
                              {
                                key: `diesel_3_4_${Date.now()}`,
                                fuelType: 'Diesel',
                                fiscalPowerMin: 3,
                                fiscalPowerMax: 4,
                                prime: 75000,
                              },
                              {
                                key: `diesel_5_7_${Date.now()}`,
                                fuelType: 'Diesel',
                                fiscalPowerMin: 5,
                                fiscalPowerMax: 7,
                                prime: 85000,
                              },
                              {
                                key: `diesel_8_10_${Date.now()}`,
                                fuelType: 'Diesel',
                                fiscalPowerMin: 8,
                                fiscalPowerMax: 10,
                                prime: 95000,
                              },
                              {
                                key: `diesel_11_plus_${Date.now()}`,
                                fuelType: 'Diesel',
                                fiscalPowerMin: 11,
                                fiscalPowerMax: 99,
                                prime: 110000,
                              },
                            ],
                          },
                        },
                      }))
                    }}
                  >
                    <Plus className='h-4 w-4 mr-2' />
                    Initialiser avec tarifs par défaut
                  </Button>
                </div>
              ) : (
                <div className='space-y-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {/* Essence */}
                    <div className='border rounded-lg p-3'>
                      <div className='flex items-center justify-between mb-3'>
                        <h4 className='font-medium text-sm flex items-center gap-2'>
                          <Fuel className='h-4 w-4 text-blue-600' />
                          Essence
                        </h4>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => {
                            const newTariffs = [...(config.tariffs || [])]
                            newTariffs.push({
                              key: `essence_custom_${Date.now()}`,
                              fuelType: 'Essence',
                              fiscalPowerMin: 1,
                              fiscalPowerMax: 99,
                              prime: 0,
                            })
                            setNewGuarantee((prev) => ({
                              ...prev,
                              parameters: {
                                ...prev.parameters,
                                matrixBased: {
                                  dimension: 'FISCAL_POWER',
                                  tariffs: newTariffs,
                                },
                              },
                            }))
                          }}
                        >
                          <Plus className='h-3 w-3 mr-1' />
                          Ajouter
                        </Button>
                      </div>
                      <div className='space-y-2'>
                        {config.tariffs
                          .filter((t) => t.fuelType === 'Essence')
                          .map((tariff) => (
                            <div key={tariff.key} className='flex items-center gap-2'>
                              <Input
                                type='number'
                                placeholder='Min CV'
                                value={tariff.fiscalPowerMin}
                                onChange={(e) => {
                                  const newMin = parseInt(e.target.value, 10)
                                  const newTariffs = [...(config.tariffs || [])]
                                  const tariffIdx = newTariffs.findIndex(
                                    (t) => t.key === tariff.key
                                  )
                                  if (tariffIdx >= 0) {
                                    newTariffs[tariffIdx] = {
                                      ...tariff,
                                      fiscalPowerMin: Number.isFinite(newMin) ? newMin : 1,
                                    }
                                    setNewGuarantee((prev) => ({
                                      ...prev,
                                      parameters: {
                                        ...prev.parameters,
                                        matrixBased: {
                                          dimension: 'FISCAL_POWER',
                                          tariffs: newTariffs,
                                        },
                                      },
                                    }))
                                  }
                                }}
                                className='h-8 w-16 text-sm'
                              />
                              <span className='text-xs text-gray-500'>-</span>
                              <Input
                                type='number'
                                placeholder='Max CV'
                                value={tariff.fiscalPowerMax === 99 ? '11+' : tariff.fiscalPowerMax}
                                onChange={(e) => {
                                  const val = e.target.value
                                  const newMax = val === '11+' ? 99 : (parseInt(val, 10) || 99)
                                  const newTariffs = [...(config.tariffs || [])]
                                  const tariffIdx = newTariffs.findIndex(
                                    (t) => t.key === tariff.key
                                  )
                                  if (tariffIdx >= 0) {
                                    newTariffs[tariffIdx] = {
                                      ...tariff,
                                      fiscalPowerMax: Number.isFinite(newMax) ? newMax : 99,
                                    }
                                    setNewGuarantee((prev) => ({
                                      ...prev,
                                      parameters: {
                                        ...prev.parameters,
                                        matrixBased: {
                                          dimension: 'FISCAL_POWER',
                                          tariffs: newTariffs,
                                        },
                                      },
                                    }))
                                  }
                                }}
                                className='h-8 w-16 text-sm'
                              />
                              <span className='text-xs bg-gray-100 px-2 py-1 rounded'>CV</span>
                              <Input
                                type='number'
                                placeholder='Tarif'
                                value={tariff.prime}
                                onChange={(e) => {
                                  const newPrime = parseInt(e.target.value, 10)
                                  const newTariffs = [...(config.tariffs || [])]
                                  const tariffIdx = newTariffs.findIndex(
                                    (t) => t.key === tariff.key
                                  )
                                  if (tariffIdx >= 0) {
                                    newTariffs[tariffIdx] = {
                                      ...tariff,
                                      prime: Number.isFinite(newPrime) ? newPrime : 0,
                                    }
                                    setNewGuarantee((prev) => ({
                                      ...prev,
                                      parameters: {
                                        ...prev.parameters,
                                        matrixBased: {
                                          dimension: 'FISCAL_POWER',
                                          tariffs: newTariffs,
                                        },
                                      },
                                    }))
                                  }
                                }}
                                className='h-8 w-24 text-sm'
                              />
                              <span className='text-xs text-gray-500'>FCFA</span>
                              <Button
                                type='button'
                                variant='ghost'
                                size='sm'
                                className='h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50'
                                onClick={() => {
                                  const newTariffs =
                                    config.tariffs?.filter((t) => t.key !== tariff.key) ?? []
                                  setNewGuarantee((prev) => ({
                                    ...prev,
                                    parameters: {
                                      ...prev.parameters,
                                      matrixBased: {
                                        dimension: 'FISCAL_POWER',
                                        tariffs: newTariffs,
                                      },
                                    },
                                  }))
                                }}
                              >
                                <Trash2 className='h-3 w-3' />
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Diesel */}
                    <div className='border rounded-lg p-3'>
                      <div className='flex items-center justify-between mb-3'>
                        <h4 className='font-medium text-sm flex items-center gap-2'>
                          <Fuel className='h-4 w-4 text-gray-600' />
                          Diesel
                        </h4>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => {
                            const newTariffs = [...(config.tariffs || [])]
                            newTariffs.push({
                              key: `diesel_custom_${Date.now()}`,
                              fuelType: 'Diesel',
                              fiscalPowerMin: 1,
                              fiscalPowerMax: 99,
                              prime: 0,
                            })
                            setNewGuarantee((prev) => ({
                              ...prev,
                              parameters: {
                                ...prev.parameters,
                                matrixBased: {
                                  dimension: 'FISCAL_POWER',
                                  tariffs: newTariffs,
                                },
                              },
                            }))
                          }}
                        >
                          <Plus className='h-3 w-3 mr-1' />
                          Ajouter
                        </Button>
                      </div>
                      <div className='space-y-2'>
                        {config.tariffs
                          ?.filter((t) => t.fuelType === 'Diesel')
                          .map((tariff) => (
                            <div key={tariff.key} className='flex items-center gap-2'>
                              <Input
                                type='number'
                                placeholder='Min CV'
                                value={tariff.fiscalPowerMin}
                                onChange={(e) => {
                                  const newMin = parseInt(e.target.value, 10)
                                  const newTariffs = [...(config.tariffs || [])]
                                  const tariffIdx = newTariffs.findIndex(
                                    (t) => t.key === tariff.key
                                  )
                                  if (tariffIdx >= 0) {
                                    newTariffs[tariffIdx] = {
                                      ...tariff,
                                      fiscalPowerMin: Number.isFinite(newMin) ? newMin : 1,
                                    }
                                    setNewGuarantee((prev) => ({
                                      ...prev,
                                      parameters: {
                                        ...prev.parameters,
                                        matrixBased: {
                                          dimension: 'FISCAL_POWER',
                                          tariffs: newTariffs,
                                        },
                                      },
                                    }))
                                  }
                                }}
                                className='h-8 w-16 text-sm'
                              />
                              <span className='text-xs text-gray-500'>-</span>
                              <Input
                                type='number'
                                placeholder='Max CV'
                                value={tariff.fiscalPowerMax === 99 ? '11+' : tariff.fiscalPowerMax}
                                onChange={(e) => {
                                  const val = e.target.value
                                  const newMax = val === '11+' ? 99 : (parseInt(val, 10) || 99)
                                  const newTariffs = [...(config.tariffs || [])]
                                  const tariffIdx = newTariffs.findIndex(
                                    (t) => t.key === tariff.key
                                  )
                                  if (tariffIdx >= 0) {
                                    newTariffs[tariffIdx] = {
                                      ...tariff,
                                      fiscalPowerMax: Number.isFinite(newMax) ? newMax : 99,
                                    }
                                    setNewGuarantee((prev) => ({
                                      ...prev,
                                      parameters: {
                                        ...prev.parameters,
                                        matrixBased: {
                                          dimension: 'FISCAL_POWER',
                                          tariffs: newTariffs,
                                        },
                                      },
                                    }))
                                  }
                                }}
                                className='h-8 w-16 text-sm'
                              />
                              <span className='text-xs bg-gray-100 px-2 py-1 rounded'>CV</span>
                              <Input
                                type='number'
                                placeholder='Tarif'
                                value={tariff.prime}
                                onChange={(e) => {
                                  const newPrime = parseInt(e.target.value, 10)
                                  const newTariffs = [...(config.tariffs || [])]
                                  const tariffIdx = newTariffs.findIndex(
                                    (t) => t.key === tariff.key
                                  )
                                  if (tariffIdx >= 0) {
                                    newTariffs[tariffIdx] = {
                                      ...tariff,
                                      prime: Number.isFinite(newPrime) ? newPrime : 0,
                                    }
                                    setNewGuarantee((prev) => ({
                                      ...prev,
                                      parameters: {
                                        ...prev.parameters,
                                        matrixBased: {
                                          dimension: 'FISCAL_POWER',
                                          tariffs: newTariffs,
                                        },
                                      },
                                    }))
                                  }
                                }}
                                className='h-8 w-24 text-sm'
                              />
                              <span className='text-xs text-gray-500'>FCFA</span>
                              <Button
                                type='button'
                                variant='ghost'
                                size='sm'
                                className='h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50'
                                onClick={() => {
                                  const newTariffs =
                                    config.tariffs?.filter((t) => t.key !== tariff.key) ?? []
                                  setNewGuarantee((prev) => ({
                                    ...prev,
                                    parameters: {
                                      ...prev.parameters,
                                      matrixBased: {
                                        dimension: 'FISCAL_POWER',
                                        tariffs: newTariffs,
                                      },
                                    },
                                  }))
                                }}
                              >
                                <Trash2 className='h-3 w-3' />
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className='mt-4'>
                <Label>Prime par défaut (FCFA) - Optionnel</Label>
                <Input
                  type='number'
                  value={config?.defaultPrime ?? ''}
                  onChange={(e) => {
                    const defaultPrime = parseInt(e.target.value, 10)
                    setNewGuarantee((prev) => ({
                      ...prev,
                      parameters: {
                        ...prev.parameters,
                        matrixBased: {
                          dimension,
                          tariffs: config?.tariffs ?? [],
                          defaultPrime: Number.isFinite(defaultPrime) ? defaultPrime : undefined,
                        },
                      },
                    }))
                  }}
                  placeholder='0'
                />
                <p className='text-xs text-muted-foreground mt-1'>
                  Utilisée si aucune correspondance n'est trouvée dans la matrice
                </p>
              </div>
            </div>
          ) : dimension === 'FORMULA' ? (
            // Configuration pour FORMULA (formules avec plafonds et primes)
            <div className='space-y-4'>
              <div className='p-3 bg-purple-50 border border-purple-200 rounded-md'>
                <p className='text-sm text-purple-900'>
                  <strong>Configuration :</strong> Définissez les formules avec leurs plafonds de garanties et primes.
                </p>
              </div>

              {/* Case à cocher pour utiliser le nombre de places */}
              <div className='flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg'>
                <input
                  type='checkbox'
                  id='usePlaces'
                  checked={config?.formulas?.some(f => f.usePlaces) ?? false}
                  onChange={(e) => {
                    const usePlaces = e.target.checked
                    const newFormulas = (config?.formulas ?? []).map(f => ({
                      ...f,
                      usePlaces,
                      placesTariffs: usePlaces ? [] : undefined
                    }))
                    setNewGuarantee((prev) => ({
                      ...prev,
                      parameters: {
                        ...prev.parameters,
                        matrixBased: {
                          dimension: 'FORMULA',
                          formulas: newFormulas,
                        },
                      },
                    }))
                  }}
                  className='h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500'
                />
                <div>
                  <Label htmlFor='usePlaces' className='cursor-pointer text-sm font-medium'>
                    Utiliser le nombre de places pour déterminer la prime
                  </Label>
                  <p className='text-xs text-muted-foreground'>
                    La prime sera calculée en fonction du nombre de places du véhicule
                  </p>
                </div>
              </div>

              {!config?.formulas || config.formulas.length === 0 ? (
                <div className='text-center p-6 border-2 border-dashed border-gray-300 rounded-lg'>
                  <Layers className='h-8 w-8 text-gray-400 mx-auto mb-2' />
                  <p className='text-sm text-gray-500 mb-4'>Aucune formule configurée</p>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      const usePlaces = config?.formulas?.some(f => f.usePlaces) ?? false
                      setNewGuarantee((prev) => ({
                        ...prev,
                        parameters: {
                          ...prev.parameters,
                          matrixBased: {
                            dimension: 'FORMULA',
                            formulas: [
                              {
                                formula: 1,
                                label: 'Formule 1',
                                capitalDeces: 1000000,
                                capitalInvalidite: 2000000,
                                fraisMedicaux: 100000,
                                prime: 5500,
                                usePlaces,
                                placesTariffs: usePlaces ? [] : undefined,
                              },
                              {
                                formula: 2,
                                label: 'Formule 2',
                                capitalDeces: 3000000,
                                capitalInvalidite: 6000000,
                                fraisMedicaux: 400000,
                                prime: 8400,
                                usePlaces,
                                placesTariffs: usePlaces ? [] : undefined,
                              },
                              {
                                formula: 3,
                                label: 'Formule 3',
                                capitalDeces: 5000000,
                                capitalInvalidite: 10000000,
                                fraisMedicaux: 500000,
                                prime: 15900,
                                usePlaces,
                                placesTariffs: usePlaces ? [] : undefined,
                              },
                            ],
                          },
                        },
                      }))
                    }}
                  >
                    <Plus className='h-4 w-4 mr-2' />
                    Initialiser avec formules par défaut
                  </Button>
                </div>
              ) : (
                <div className='space-y-3'>
                  {config.formulas.map((formula) => (
                    <div key={formula.formula} className='border rounded-lg p-4 bg-white'>
                      <div className='flex items-center justify-between mb-3'>
                        <div className='flex items-center gap-2'>
                          <span className='font-semibold text-sm'>Formule {formula.formula}</span>
                          <Input
                            type='text'
                            value={formula.label}
                            onChange={(e) => {
                              const newFormulas = [...(config.formulas || [])]
                              const formulaIdx = newFormulas.findIndex(
                                (f) => f.formula === formula.formula
                              )
                              if (formulaIdx >= 0) {
                                newFormulas[formulaIdx] = { ...formula, label: e.target.value }
                                setNewGuarantee((prev) => ({
                                  ...prev,
                                  parameters: {
                                    ...prev.parameters,
                                    matrixBased: {
                                      dimension: 'FORMULA',
                                      formulas: newFormulas,
                                    },
                                  },
                                }))
                              }
                            }}
                            className='h-8 w-40 text-sm'
                            placeholder='Libellé'
                          />
                        </div>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50'
                          onClick={() => {
                            const newFormulas =
                              config.formulas?.filter((f) => f.formula !== formula.formula) ?? []
                            setNewGuarantee((prev) => ({
                              ...prev,
                              parameters: {
                                ...prev.parameters,
                                matrixBased: {
                                  dimension: 'FORMULA',
                                  formulas: newFormulas,
                                },
                              },
                            }))
                          }}
                        >
                          <Trash2 className='h-3 w-3' />
                        </Button>
                      </div>

                      <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                        <div>
                          <Label className='text-xs'>Capital Décès (FCFA)</Label>
                          <Input
                            type='number'
                            value={formula.capitalDeces}
                            onChange={(e) => {
                              const value = parseInt(e.target.value, 10)
                              const newFormulas = [...(config.formulas || [])]
                              const formulaIdx = newFormulas.findIndex(
                                (f) => f.formula === formula.formula
                              )
                              if (formulaIdx >= 0) {
                                newFormulas[formulaIdx] = {
                                  ...formula,
                                  capitalDeces: Number.isFinite(value) ? value : 0,
                                }
                                setNewGuarantee((prev) => ({
                                  ...prev,
                                  parameters: {
                                    ...prev.parameters,
                                    matrixBased: {
                                      dimension: 'FORMULA',
                                      formulas: newFormulas,
                                    },
                                  },
                                }))
                              }
                            }}
                            className='h-8 text-sm'
                            placeholder='1000000'
                          />
                        </div>

                        <div>
                          <Label className='text-xs'>Capital Invalidité (FCFA)</Label>
                          <Input
                            type='number'
                            value={formula.capitalInvalidite}
                            onChange={(e) => {
                              const value = parseInt(e.target.value, 10)
                              const newFormulas = [...(config.formulas || [])]
                              const formulaIdx = newFormulas.findIndex(
                                (f) => f.formula === formula.formula
                              )
                              if (formulaIdx >= 0) {
                                newFormulas[formulaIdx] = {
                                  ...formula,
                                  capitalInvalidite: Number.isFinite(value) ? value : 0,
                                }
                                setNewGuarantee((prev) => ({
                                  ...prev,
                                  parameters: {
                                    ...prev.parameters,
                                    matrixBased: {
                                      dimension: 'FORMULA',
                                      formulas: newFormulas,
                                    },
                                  },
                                }))
                              }
                            }}
                            className='h-8 text-sm'
                            placeholder='2000000'
                          />
                        </div>

                        <div>
                          <Label className='text-xs'>Frais Médicaux (FCFA)</Label>
                          <Input
                            type='number'
                            value={formula.fraisMedicaux}
                            onChange={(e) => {
                              const value = parseInt(e.target.value, 10)
                              const newFormulas = [...(config.formulas || [])]
                              const formulaIdx = newFormulas.findIndex(
                                (f) => f.formula === formula.formula
                              )
                              if (formulaIdx >= 0) {
                                newFormulas[formulaIdx] = {
                                  ...formula,
                                  fraisMedicaux: Number.isFinite(value) ? value : 0,
                                }
                                setNewGuarantee((prev) => ({
                                  ...prev,
                                  parameters: {
                                    ...prev.parameters,
                                    matrixBased: {
                                      dimension: 'FORMULA',
                                      formulas: newFormulas,
                                    },
                                  },
                                }))
                              }
                            }}
                            className='h-8 text-sm'
                            placeholder='100000'
                          />
                        </div>

                        {formula.usePlaces ? (
                          <div>
                            <Label className='text-xs'>Tarifs par places</Label>
                            <div className='text-xs text-purple-600 font-medium'>
                              {(!formula.placesTariffs || formula.placesTariffs.length === 0)
                                ? 'Non configuré'
                                : `${formula.placesTariffs.length} paliers`}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <Label className='text-xs'>Prime fixe (FCFA)</Label>
                            <Input
                              type='number'
                              value={formula.prime}
                              onChange={(e) => {
                                const value = parseInt(e.target.value, 10)
                                const newFormulas = [...(config.formulas || [])]
                                const formulaIdx = newFormulas.findIndex(
                                  (f) => f.formula === formula.formula
                                )
                                if (formulaIdx >= 0) {
                                  newFormulas[formulaIdx] = {
                                    ...formula,
                                    prime: Number.isFinite(value) ? value : 0,
                                  }
                                  setNewGuarantee((prev) => ({
                                    ...prev,
                                    parameters: {
                                      ...prev.parameters,
                                      matrixBased: {
                                        dimension: 'FORMULA',
                                        formulas: newFormulas,
                                      },
                                    },
                                  }))
                                }
                              }}
                              className='h-8 text-sm font-semibold text-purple-600'
                              placeholder='5500'
                            />
                          </div>
                        )}
                      </div>

                      {/* Section tarifs par nombre de places */}
                      {formula.usePlaces && (
                        <div className='mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-md'>
                          <div className='flex items-center justify-between mb-2'>
                            <Label className='text-sm font-medium text-indigo-900'>
                              Tarifs par nombre de places - Formule {formula.formula}
                            </Label>
                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              onClick={() => {
                                const newFormulas = [...(config.formulas || [])]
                                const formulaIdx = newFormulas.findIndex(
                                  (f) => f.formula === formula.formula
                                )
                                if (formulaIdx >= 0) {
                                  const newPlacesTariffs = [...(formula.placesTariffs || [])]
                                  const existingPlaces = newPlacesTariffs.map(t => t.places)
                                  const nextPlace = [3, 4, 5, 6, 7, 8, 99].find(p => !existingPlaces.includes(p)) ?? 99
                                  newPlacesTariffs.push({
                                    places: nextPlace,
                                    prime: 0,
                                    label: nextPlace === 99 ? '+ de 8 places' : `${nextPlace} places`
                                  })
                                  newFormulas[formulaIdx] = {
                                    ...formula,
                                    placesTariffs: newPlacesTariffs
                                  }
                                  setNewGuarantee((prev) => ({
                                    ...prev,
                                    parameters: {
                                      ...prev.parameters,
                                      matrixBased: {
                                        dimension: 'FORMULA',
                                        formulas: newFormulas,
                                      },
                                    },
                                  }))
                                }
                              }}
                            >
                              <Plus className='h-3 w-3 mr-1' />
                              Ajouter
                            </Button>
                          </div>

                          {!formula.placesTariffs || formula.placesTariffs.length === 0 ? (
                            <div className='text-center p-3 bg-white border border-dashed border-gray-300 rounded'>
                              <p className='text-xs text-gray-500 mb-2'>Aucun tarif configuré</p>
                              <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                onClick={() => {
                                  const newFormulas = [...(config.formulas || [])]
                                  const formulaIdx = newFormulas.findIndex(
                                    (f) => f.formula === formula.formula
                                  )
                                  if (formulaIdx >= 0) {
                                    newFormulas[formulaIdx] = {
                                      ...formula,
                                      placesTariffs: [
                                        { places: 3, prime: 8400, label: '3 places' },
                                        { places: 4, prime: 10200, label: '4 places' },
                                        { places: 5, prime: 16000, label: '5 places' },
                                        { places: 6, prime: 17800, label: '6 places' },
                                        { places: 7, prime: 19600, label: '7 places' },
                                        { places: 8, prime: 25400, label: '8 places' },
                                        { places: 99, prime: 0, label: '+ de 8 places' },
                                      ]
                                    }
                                    setNewGuarantee((prev) => ({
                                      ...prev,
                                      parameters: {
                                        ...prev.parameters,
                                        matrixBased: {
                                          dimension: 'FORMULA',
                                          formulas: newFormulas,
                                        },
                                      },
                                    }))
                                  }
                                }}
                              >
                                Initialiser avec tarifs par défaut
                              </Button>
                            </div>
                          ) : (
                            <div className='space-y-2'>
                              {formula.placesTariffs.map((tariff, idx) => (
                                <div key={idx} className='flex items-center gap-2 bg-white p-2 rounded border'>
                                  <Input
                                    type='text'
                                    value={tariff.label}
                                    onChange={(e) => {
                                      const newFormulas = [...(config.formulas || [])]
                                      const formulaIdx = newFormulas.findIndex(
                                        (f) => f.formula === formula.formula
                                      )
                                      if (formulaIdx >= 0) {
                                        const newPlacesTariffs = [...(formula.placesTariffs || [])]
                                        newPlacesTariffs[idx] = { ...tariff, label: e.target.value }
                                        newFormulas[formulaIdx] = {
                                          ...formula,
                                          placesTariffs: newPlacesTariffs
                                        }
                                        setNewGuarantee((prev) => ({
                                          ...prev,
                                          parameters: {
                                            ...prev.parameters,
                                            matrixBased: {
                                              dimension: 'FORMULA',
                                              formulas: newFormulas,
                                            },
                                          },
                                        }))
                                      }
                                    }}
                                    className='h-8 w-28 text-xs'
                                    placeholder='Label'
                                  />
                                  <Input
                                    type='number'
                                    value={tariff.places === 99 ? '' : tariff.places}
                                    disabled={tariff.places === 99}
                                    onChange={(e) => {
                                      const newFormulas = [...(config.formulas || [])]
                                      const formulaIdx = newFormulas.findIndex(
                                        (f) => f.formula === formula.formula
                                      )
                                      if (formulaIdx >= 0) {
                                        const newPlacesTariffs = [...(formula.placesTariffs || [])]
                                        newPlacesTariffs[idx] = { ...tariff, places: parseInt(e.target.value) || 0 }
                                        newFormulas[formulaIdx] = {
                                          ...formula,
                                          placesTariffs: newPlacesTariffs
                                        }
                                        setNewGuarantee((prev) => ({
                                          ...prev,
                                          parameters: {
                                            ...prev.parameters,
                                            matrixBased: {
                                              dimension: 'FORMULA',
                                              formulas: newFormulas,
                                            },
                                          },
                                        }))
                                      }
                                    }}
                                    className='h-8 w-16 text-xs'
                                    placeholder='Places'
                                  />
                                  <span className='text-xs text-gray-500'>places</span>
                                  <Input
                                    type='number'
                                    value={tariff.prime}
                                    onChange={(e) => {
                                      const newFormulas = [...(config.formulas || [])]
                                      const formulaIdx = newFormulas.findIndex(
                                        (f) => f.formula === formula.formula
                                      )
                                      if (formulaIdx >= 0) {
                                        const newPlacesTariffs = [...(formula.placesTariffs || [])]
                                        newPlacesTariffs[idx] = { ...tariff, prime: parseInt(e.target.value) || 0 }
                                        newFormulas[formulaIdx] = {
                                          ...formula,
                                          placesTariffs: newPlacesTariffs
                                        }
                                        setNewGuarantee((prev) => ({
                                          ...prev,
                                          parameters: {
                                            ...prev.parameters,
                                            matrixBased: {
                                              dimension: 'FORMULA',
                                              formulas: newFormulas,
                                            },
                                          },
                                        }))
                                      }
                                    }}
                                    className='h-8 w-24 text-xs font-semibold text-indigo-600'
                                    placeholder='Prime'
                                  />
                                  <span className='text-xs text-gray-500'>FCFA</span>
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='sm'
                                    className='h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50'
                                    onClick={() => {
                                      const newFormulas = [...(config.formulas || [])]
                                      const formulaIdx = newFormulas.findIndex(
                                        (f) => f.formula === formula.formula
                                      )
                                      if (formulaIdx >= 0) {
                                        const newPlacesTariffs = formula.placesTariffs?.filter((_, i) => i !== idx) ?? []
                                        newFormulas[formulaIdx] = {
                                          ...formula,
                                          placesTariffs: newPlacesTariffs
                                        }
                                        setNewGuarantee((prev) => ({
                                          ...prev,
                                          parameters: {
                                            ...prev.parameters,
                                            matrixBased: {
                                              dimension: 'FORMULA',
                                              formulas: newFormulas,
                                            },
                                          },
                                        }))
                                      }
                                    }}
                                  >
                                    <Trash2 className='h-3 w-3' />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='w-full'
                    onClick={() => {
                      const newFormulas = [...(config.formulas || [])]
                      const maxFormula = Math.max(...newFormulas.map((f) => f.formula), 0)
                      const usePlaces = config?.formulas?.some(f => f.usePlaces) ?? false
                      newFormulas.push({
                        formula: maxFormula + 1,
                        label: `Formule ${maxFormula + 1}`,
                        capitalDeces: 0,
                        capitalInvalidite: 0,
                        fraisMedicaux: 0,
                        prime: 0,
                        usePlaces,
                        placesTariffs: usePlaces ? [] : undefined,
                      })
                      setNewGuarantee((prev) => ({
                        ...prev,
                        parameters: {
                          ...prev.parameters,
                          matrixBased: {
                            dimension: 'FORMULA',
                            formulas: newFormulas,
                          },
                        },
                      }))
                    }}
                  >
                    <Plus className='h-4 w-4 mr-2' />
                    Ajouter une formule
                  </Button>
                </div>
              )}
            </div>
          ) : dimension === 'VEHICLE_CATEGORY' ? (
            // Configuration pour VEHICLE_CATEGORY (grilles TCM/TCL)
            <div className='space-y-4'>
              <div className='p-3 bg-green-50 border border-green-200 rounded-md'>
                <p className='text-sm text-green-900'>
                  <strong>Configuration :</strong> Définissez les grilles de tarification par catégorie de véhicule (Tierce Complète / Tierce Collision).
                </p>
                <p className='text-xs text-green-700 mt-1'>
                  Les tarifs sont calculés en fonction de la valeur à neuf (VN), de la franchise et du type de garantie.
                </p>
              </div>

              {!config?.categoryTariffs || config.categoryTariffs.length === 0 ? (
                <div className='text-center p-6 border-2 border-dashed border-gray-300 rounded-lg'>
                  <Database className='h-8 w-8 text-gray-400 mx-auto mb-2' />
                  <p className='text-sm text-gray-500 mb-4'>Aucune grille configurée</p>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setNewGuarantee((prev) => ({
                        ...prev,
                        parameters: {
                          ...prev.parameters,
                          matrixBased: {
                            dimension: 'VEHICLE_CATEGORY',
                            categoryTariffs: [
                              // Catégorie 401 & 412 - Tierce Complète
                              { key: `tc_401_dta_0_12m_${Date.now()}`, categoryCode: '401', categoryName: 'Tourisme (401/412)', guaranteeType: 'TIERCE_COMPLETE', valueNeufMin: 0, valueNeufMax: 12000000, valueLabel: '≤ 12M', franchise: 0, franchiseLabel: 'Sans franchise', rate: 4.680 },
                              { key: `tc_401_dta_12m_25m_500k_${Date.now()}`, categoryCode: '401', categoryName: 'Tourisme (401/412)', guaranteeType: 'TIERCE_COMPLETE', valueNeufMin: 12000001, valueNeufMax: 25000000, valueLabel: '12M < VN ≤ 25M', franchise: 500000, franchiseLabel: '500K', rate: 3.256 },
                              { key: `tc_401_dta_12m_25m_1m_${Date.now()}`, categoryCode: '401', categoryName: 'Tourisme (401/412)', guaranteeType: 'TIERCE_COMPLETE', valueNeufMin: 12000001, valueNeufMax: 25000000, valueLabel: '12M < VN ≤ 25M', franchise: 1000000, franchiseLabel: '1M', rate: 2.968 },
                              { key: `tc_401_dta_12m_25m_2m_${Date.now()}`, categoryCode: '401', categoryName: 'Tourisme (401/412)', guaranteeType: 'TIERCE_COMPLETE', valueNeufMin: 12000001, valueNeufMax: 25000000, valueLabel: '12M < VN ≤ 25M', franchise: 2000000, franchiseLabel: '2M', rate: 2.744 },
                              { key: `tc_401_dta_12m_25m_2.5m_${Date.now()}`, categoryCode: '401', categoryName: 'Tourisme (401/412)', guaranteeType: 'TIERCE_COMPLETE', valueNeufMin: 12000001, valueNeufMax: 25000000, valueLabel: '12M < VN ≤ 25M', franchise: 2500000, franchiseLabel: '2.5M', rate: 2.628 },
                              { key: `tc_401_dta_25m_40m_1m_${Date.now()}`, categoryCode: '401', categoryName: 'Tourisme (401/412)', guaranteeType: 'TIERCE_COMPLETE', valueNeufMin: 25000001, valueNeufMax: 40000000, valueLabel: '25M < VN ≤ 40M', franchise: 1000000, franchiseLabel: '1M', rate: 2.128 },
                              { key: `tc_401_dta_25m_40m_2m_${Date.now()}`, categoryCode: '401', categoryName: 'Tourisme (401/412)', guaranteeType: 'TIERCE_COMPLETE', valueNeufMin: 25000001, valueNeufMax: 40000000, valueLabel: '25M < VN ≤ 40M', franchise: 2000000, franchiseLabel: '2M', rate: 1.956 },
                              { key: `tc_401_dta_40m_110m_2.5m_${Date.now()}`, categoryCode: '401', categoryName: 'Tourisme (401/412)', guaranteeType: 'TIERCE_COMPLETE', valueNeufMin: 40000001, valueNeufMax: 110000000, valueLabel: '40M < VN ≤ 110M', franchise: 2500000, franchiseLabel: '2.5M', rate: 1.648 },
                              { key: `tc_401_dta_110m_2.5m_${Date.now()}`, categoryCode: '401', categoryName: 'Tourisme (401/412)', guaranteeType: 'TIERCE_COMPLETE', valueNeufMin: 110000001, valueNeufMax: 999999999, valueLabel: '> 110M', franchise: 2500000, franchiseLabel: '2.5M', rate: 1.248 },
                              // Catégorie 401 & 412 - Tierce Collision
                              { key: `tc_401_dc_0_40m_500k_${Date.now()}`, categoryCode: '401', categoryName: 'Tourisme (401/412)', guaranteeType: 'TIERCE_COLLISION', valueNeufMin: 0, valueNeufMax: 40000000, valueLabel: '≤ 40M', franchise: 500000, franchiseLabel: '500K', rate: 2.232 },
                              { key: `tc_401_dc_0_40m_1m_${Date.now()}`, categoryCode: '401', categoryName: 'Tourisme (401/412)', guaranteeType: 'TIERCE_COLLISION', valueNeufMin: 0, valueNeufMax: 40000000, valueLabel: '≤ 40M', franchise: 1000000, franchiseLabel: '1M', rate: 2.052 },
                              { key: `tc_401_dc_0_40m_2m_${Date.now()}`, categoryCode: '401', categoryName: 'Tourisme (401/412)', guaranteeType: 'TIERCE_COLLISION', valueNeufMin: 0, valueNeufMax: 40000000, valueLabel: '≤ 40M', franchise: 2000000, franchiseLabel: '2M', rate: 1.912 },
                              { key: `tc_401_dc_0_40m_2.5m_${Date.now()}`, categoryCode: '401', categoryName: 'Tourisme (401/412)', guaranteeType: 'TIERCE_COLLISION', valueNeufMin: 0, valueNeufMax: 40000000, valueLabel: '≤ 40M', franchise: 2500000, franchiseLabel: '2.5M', rate: 1.836 },
                              { key: `tc_401_dc_40m_500k_${Date.now()}`, categoryCode: '401', categoryName: 'Tourisme (401/412)', guaranteeType: 'TIERCE_COLLISION', valueNeufMin: 40000001, valueNeufMax: 999999999, valueLabel: '> 40M', franchise: 500000, franchiseLabel: '500K', rate: 1.764 },
                              { key: `tc_401_dc_40m_1m_${Date.now()}`, categoryCode: '401', categoryName: 'Tourisme (401/412)', guaranteeType: 'TIERCE_COLLISION', valueNeufMin: 40000001, valueNeufMax: 999999999, valueLabel: '> 40M', franchise: 1000000, franchiseLabel: '1M', rate: 1.628 },
                              { key: `tc_401_dc_40m_2m_${Date.now()}`, categoryCode: '401', categoryName: 'Tourisme (401/412)', guaranteeType: 'TIERCE_COLLISION', valueNeufMin: 40000001, valueNeufMax: 999999999, valueLabel: '> 40M', franchise: 2000000, franchiseLabel: '2M', rate: 1.516 },
                              { key: `tc_401_dc_40m_2.5m_${Date.now()}`, categoryCode: '401', categoryName: 'Tourisme (401/412)', guaranteeType: 'TIERCE_COLLISION', valueNeufMin: 40000001, valueNeufMax: 999999999, valueLabel: '> 40M', franchise: 2500000, franchiseLabel: '2.5M', rate: 1.456 },
                            ]
                          }
                        }
                      }))
                    }}
                  >
                    <Plus className='h-4 w-4 mr-2' />
                    Initialiser avec grilles par défaut
                  </Button>
                </div>
              ) : (
                <div className='space-y-4'>
                  {/* Grouper par catégorie et type de garantie */}
                  {(() => {
                    const groups = config.categoryTariffs?.reduce((acc, tariff) => {
                      const key = `${tariff.categoryCode}_${tariff.guaranteeType}`
                      if (!acc[key]) {
                        acc[key] = []
                      }
                      acc[key].push(tariff)
                      return acc
                    }, {} as Record<string, VehicleCategoryTariff[]>) ?? {}

                    const categoryLabels: Record<string, string> = {
                      '401_TIERCE_COMPLETE': 'Catégorie 401/412 - Tierce Complète (DTA)',
                      '401_TIERCE_COLLISION': 'Catégorie 401/412 - Tierce Collision (DC)',
                      '402_TIERCE_COMPLETE': 'Catégorie 402 - Tierce Complète (DTA)',
                      '402_TIERCE_COLLISION': 'Catégorie 402 - Tierce Collision (DC)',
                    }

                    return Object.entries(groups).map(([groupKey, tariffs]) => (
                      <div key={groupKey} className='border rounded-lg p-4 bg-white'>
                        <div className='flex items-center justify-between mb-3'>
                          <h4 className='font-semibold text-sm text-green-800'>
                            {categoryLabels[groupKey] || groupKey}
                          </h4>
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => {
                              const newCategoryTariffs = [...(config.categoryTariffs || [])]
                              const [categoryCode, guaranteeType] = groupKey.split('_')
                              const existingValueRanges = tariffs
                                .filter(t => t.categoryCode === categoryCode && t.guaranteeType === guaranteeType as any)
                                .map(t => t.valueNeufMax)
                              const maxValueRange = Math.max(...existingValueRanges, 0)

                              // Nouvelle tranche de valeur
                              const newValueMin = maxValueRange + 1
                              const newValueMax = maxValueRange === 0 ? 12000000 : maxValueRange * 2
                              newCategoryTariffs.push({
                                key: `${categoryCode}_${guaranteeType}_${newValueMin}_${newValueMax}_500k_${Date.now()}`,
                                categoryCode,
                                categoryName: categoryCode === '401' ? 'Tourisme' : 'Utilitaire',
                                guaranteeType: guaranteeType as any,
                                valueNeufMin: newValueMin,
                                valueNeufMax: newValueMax,
                                valueLabel: `${(newValueMin/1000000).toFixed(0)}M < VN ≤ ${(newValueMax/1000000).toFixed(0)}M`,
                                franchise: 500000,
                                franchiseLabel: '500K',
                                rate: 2.5
                              })
                              setNewGuarantee((prev) => ({
                                ...prev,
                                parameters: {
                                  ...prev.parameters,
                                  matrixBased: {
                                    dimension: 'VEHICLE_CATEGORY',
                                    categoryTariffs: newCategoryTariffs
                                  }
                                }
                              }))
                            }}
                          >
                            <Plus className='h-3 w-3 mr-1' />
                            Ajouter une tranche
                          </Button>
                        </div>

                        <div className='overflow-x-auto'>
                          <table className='w-full text-xs'>
                            <thead>
                              <tr className='bg-green-50 border-b'>
                                <th className='p-2 text-left'>Tranche VN</th>
                                <th className='p-2 text-center'>Sans franchise</th>
                                <th className='p-2 text-center'>500K</th>
                                <th className='p-2 text-center'>1M</th>
                                <th className='p-2 text-center'>2M</th>
                                <th className='p-2 text-center'>2.5M</th>
                                <th className='p-2 text-center w-8'></th>
                              </tr>
                            </thead>
                            <tbody>
                              {tariffs.map((tariff) => (
                                <tr key={tariff.key} className='border-b hover:bg-gray-50'>
                                  <td className='p-2 font-medium'>{tariff.valueLabel}</td>
                                  <td className='p-2 text-center'>
                                    {tariff.franchise === 0 ? (
                                      <span className='text-green-700 font-semibold'>{tariff.rate.toFixed(3)}%</span>
                                    ) : (
                                      <span className='text-gray-300'>-</span>
                                    )}
                                  </td>
                                  <td className='p-2 text-center'>
                                    {tariff.franchise === 500000 ? (
                                      <span className='text-green-700 font-semibold'>{tariff.rate.toFixed(3)}%</span>
                                    ) : (
                                      <button
                                        type='button'
                                        className='text-green-600 hover:text-green-800 underline'
                                        onClick={() => {
                                          const newCategoryTariffs = [...(config.categoryTariffs || [])]
                                          const idx = newCategoryTariffs.findIndex(t => t.key === tariff.key)
                                          if (idx >= 0) {
                                            newCategoryTariffs[idx] = { ...tariff, franchise: 500000, franchiseLabel: '500K' }
                                            setNewGuarantee((prev) => ({
                                              ...prev,
                                              parameters: {
                                                ...prev.parameters,
                                                matrixBased: {
                                                  dimension: 'VEHICLE_CATEGORY',
                                                  categoryTariffs: newCategoryTariffs
                                                }
                                              }
                                            }))
                                          }
                                        }}
                                      >
                                        +
                                      </button>
                                    )}
                                  </td>
                                  <td className='p-2 text-center'>
                                    {tariff.franchise === 1000000 ? (
                                      <span className='text-green-700 font-semibold'>{tariff.rate.toFixed(3)}%</span>
                                    ) : (
                                      <button
                                        type='button'
                                        className='text-green-600 hover:text-green-800 underline'
                                        onClick={() => {
                                          const newCategoryTariffs = [...(config.categoryTariffs || [])]
                                          const idx = newCategoryTariffs.findIndex(t => t.key === tariff.key)
                                          if (idx >= 0) {
                                            newCategoryTariffs[idx] = { ...tariff, franchise: 1000000, franchiseLabel: '1M' }
                                            setNewGuarantee((prev) => ({
                                              ...prev,
                                              parameters: {
                                                ...prev.parameters,
                                                matrixBased: {
                                                  dimension: 'VEHICLE_CATEGORY',
                                                  categoryTariffs: newCategoryTariffs
                                                }
                                              }
                                            }))
                                          }
                                        }}
                                      >
                                        +
                                      </button>
                                    )}
                                  </td>
                                  <td className='p-2 text-center'>
                                    {tariff.franchise === 2000000 ? (
                                      <span className='text-green-700 font-semibold'>{tariff.rate.toFixed(3)}%</span>
                                    ) : (
                                      <button
                                        type='button'
                                        className='text-green-600 hover:text-green-800 underline'
                                        onClick={() => {
                                          const newCategoryTariffs = [...(config.categoryTariffs || [])]
                                          const idx = newCategoryTariffs.findIndex(t => t.key === tariff.key)
                                          if (idx >= 0) {
                                            newCategoryTariffs[idx] = { ...tariff, franchise: 2000000, franchiseLabel: '2M' }
                                            setNewGuarantee((prev) => ({
                                              ...prev,
                                              parameters: {
                                                ...prev.parameters,
                                                matrixBased: {
                                                  dimension: 'VEHICLE_CATEGORY',
                                                  categoryTariffs: newCategoryTariffs
                                                }
                                              }
                                            }))
                                          }
                                        }}
                                      >
                                        +
                                      </button>
                                    )}
                                  </td>
                                  <td className='p-2 text-center'>
                                    {tariff.franchise === 2500000 ? (
                                      <span className='text-green-700 font-semibold'>{tariff.rate.toFixed(3)}%</span>
                                    ) : (
                                      <button
                                        type='button'
                                        className='text-green-600 hover:text-green-800 underline'
                                        onClick={() => {
                                          const newCategoryTariffs = [...(config.categoryTariffs || [])]
                                          const idx = newCategoryTariffs.findIndex(t => t.key === tariff.key)
                                          if (idx >= 0) {
                                            newCategoryTariffs[idx] = { ...tariff, franchise: 2500000, franchiseLabel: '2.5M' }
                                            setNewGuarantee((prev) => ({
                                              ...prev,
                                              parameters: {
                                                ...prev.parameters,
                                                matrixBased: {
                                                  dimension: 'VEHICLE_CATEGORY',
                                                  categoryTariffs: newCategoryTariffs
                                                }
                                              }
                                            }))
                                          }
                                        }}
                                      >
                                        +
                                      </button>
                                    )}
                                  </td>
                                  <td className='p-2'>
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='sm'
                                      className='h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50'
                                      onClick={() => {
                                        const newCategoryTariffs = config.categoryTariffs?.filter(t => t.key !== tariff.key) ?? []
                                        setNewGuarantee((prev) => ({
                                          ...prev,
                                          parameters: {
                                            ...prev.parameters,
                                            matrixBased: {
                                              dimension: 'VEHICLE_CATEGORY',
                                              categoryTariffs: newCategoryTariffs
                                            }
                                          }
                                        }))
                                      }}
                                    >
                                      <Trash2 className='h-3 w-3' />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mode édition pour modifier les taux */}
                        <div className='mt-3 p-3 bg-gray-50 rounded'>
                          <details>
                            <summary className='text-xs font-medium cursor-pointer text-gray-700'>
                              Mode édition - Modifier les taux manuellement
                            </summary>
                            <div className='mt-2 space-y-2'>
                              {tariffs.map((tariff) => (
                                <div key={tariff.key} className='flex items-center gap-2 bg-white p-2 rounded border'>
                                  <span className='text-xs w-24'>{tariff.valueLabel}</span>
                                  <span className='text-xs w-20'>{tariff.franchiseLabel}</span>
                                  <Input
                                    type='number'
                                    step='0.001'
                                    value={tariff.rate}
                                    onChange={(e) => {
                                      const rate = parseFloat(e.target.value)
                                      const newCategoryTariffs = [...(config.categoryTariffs || [])]
                                      const idx = newCategoryTariffs.findIndex(t => t.key === tariff.key)
                                      if (idx >= 0) {
                                        newCategoryTariffs[idx] = { ...tariff, rate: Number.isFinite(rate) ? rate : 0 }
                                        setNewGuarantee((prev) => ({
                                          ...prev,
                                          parameters: {
                                            ...prev.parameters,
                                            matrixBased: {
                                              dimension: 'VEHICLE_CATEGORY',
                                              categoryTariffs: newCategoryTariffs
                                            }
                                          }
                                        }))
                                      }
                                    }}
                                    className='h-7 w-20 text-xs'
                                  />
                                  <span className='text-xs text-gray-500'>%</span>
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      </div>
                    ))
                  })()}

                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='w-full'
                    onClick={() => {
                      const newCategoryTariffs = [...(config.categoryTariffs || [])]
                      newCategoryTariffs.push({
                        key: `custom_${Date.now()}`,
                        categoryCode: '401',
                        categoryName: 'Tourisme',
                        guaranteeType: 'TIERCE_COMPLETE',
                        valueNeufMin: 0,
                        valueNeufMax: 12000000,
                        valueLabel: 'Nouvelle tranche',
                        franchise: 500000,
                        franchiseLabel: '500K',
                        rate: 2.5
                      })
                      setNewGuarantee((prev) => ({
                        ...prev,
                        parameters: {
                          ...prev.parameters,
                          matrixBased: {
                            dimension: 'VEHICLE_CATEGORY',
                            categoryTariffs: newCategoryTariffs
                          }
                        }
                      }))
                    }}
                  >
                    <Plus className='h-4 w-4 mr-2' />
                    Ajouter un nouveau groupe
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // Formulaire simple pour les autres dimensions
            <>
              <div>
                <Label>Prime par défaut (FCFA) - Optionnel</Label>
                <Input
                  type='number'
                  value={config?.defaultPrime ?? ''}
                  onChange={(e) => {
                    const defaultPrime = parseInt(e.target.value, 10)
                    setNewGuarantee((prev) => ({
                      ...prev,
                      parameters: {
                        ...prev.parameters,
                        matrixBased: {
                          dimension,
                          tariffs: config?.tariffs ?? [],
                          defaultPrime: Number.isFinite(defaultPrime) ? defaultPrime : undefined,
                        },
                      },
                    }))
                  }}
                  placeholder='0'
                />
                <p className='text-xs text-muted-foreground mt-1'>
                  Utilisée si aucune correspondance n'est trouvée dans la matrice
                </p>
              </div>

              <div className='p-3 bg-amber-50 border border-amber-200 rounded-md'>
                <p className='text-sm text-amber-900'>
                  <strong>Attention :</strong> Pour cette dimension, les tarifs doivent être
                  configurés via l'onglet "Grilles" ou en utilisant les méthodes de calcul basées
                  sur une variable.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='text-lg'>Chargement...</div>
      </div>
    )
  }

  return (
    <div className='space-y-6 w-full'>


      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>Tarification & Garanties</h1>
          <p className='text-muted-foreground text-sm sm:text-base'>
            Gérez les garanties et grilles de tarification
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button size='sm' onClick={() => setIsCreateGuaranteeDialogOpen(true)}>
            <Plus className='h-4 w-4 mr-2' />
            Nouvelle Garantie
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {statistics ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <StatCard
            title='Total Garanties'
            value={statistics.totalGuarantees}
            subtitle={`${statistics.activeGuarantees} actives`}
            icon={Shield}
            color='text-blue-600 dark:text-blue-400'
          />
          <StatCard
            title='Prix Moyen'
            value={`${Math.round((statistics.priceRange.min + statistics.priceRange.max) / 2).toLocaleString()} FCFA`}
            subtitle='Moyenne des garanties'
            icon={TrendingUp}
            color='text-green-600 dark:text-green-400'
          />
          <StatCard
            title='Gamme de Prix'
            value={`${Math.round(statistics.priceRange.min).toLocaleString()} - ${Math.round(statistics.priceRange.max).toLocaleString()}`}
            subtitle='FCFA'
            icon={Calculator}
            color='text-purple-600 dark:text-purple-400'
          />
          <StatCard
            title='Tarifs Fixes'
            value={tarifFixes.length}
            subtitle={`${fixedCoverageOptions.length} options`}
            icon={Database}
            color='text-orange-600 dark:text-orange-400'
          />
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className='p-6'>
                <Skeleton className='h-12 w-12 mb-2' />
                <Skeleton className='h-8 w-24 mb-2' />
                <Skeleton className='h-4 w-32' />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className='space-y-4'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-xl font-semibold flex items-center gap-2'>
              <Shield className='h-5 w-5' />
              Garanties
            </h2>
            <p className='text-sm text-muted-foreground mt-1'>
              Gérez les garanties proposées par les assureurs
            </p>
          </div>
          <Badge variant='secondary'>
            {guarantees.length}
          </Badge>
        </div>

        {/* Filters Card */}
        <Card>
          <CardContent className='p-4'>
              <div className='flex flex-col sm:flex-row gap-4'>
                {/* Search */}
                <div className='flex-1'>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4' />
                    <Input
                      placeholder='Rechercher une garantie...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className='pl-10'
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className='flex gap-2'>
                  <Select
                    value={showInactive ? 'all' : 'active'}
                    onValueChange={(value) => setShowInactive(value === 'all')}
                  >
                    <SelectTrigger className='w-full sm:w-[140px]'>
                      <SelectValue placeholder='Statut' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='active'>Actives uniquement</SelectItem>
                      <SelectItem value='all'>Toutes</SelectItem>
                    </SelectContent>
                  </Select>

                  <Dialog open={isCreateGuaranteeDialogOpen} onOpenChange={setIsCreateGuaranteeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className='h-4 w-4 mr-2' />
                        Nouvelle
                      </Button>
                    </DialogTrigger>
                  <DialogContent className='max-w-[98vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto'>
                    <DialogHeader>
                      <DialogTitle className='text-xl'>Créer une nouvelle garantie</DialogTitle>
                      <DialogDescription className='text-base'>
                        Définissez une nouvelle garantie avec sa méthode de calcul et ses paramètres
                      </DialogDescription>
                    </DialogHeader>

                    <div className='space-y-6 py-4'>
                      {/* Section Informations générales */}
                      <Card className='border border-gray-200 shadow-sm'>
                        <CardHeader className='pb-3 bg-gray-50/50'>
                          <CardTitle className='text-base flex items-center gap-2'>
                            <div className='w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center'>
                              <span className='text-blue-600 text-xs font-bold'>1</span>
                            </div>
                            Informations générales
                          </CardTitle>
                          <CardDescription className='text-sm'>
                            Informations de base sur la garantie
                          </CardDescription>
                        </CardHeader>
                        <CardContent className='pt-4 space-y-4'>
                          <div className='space-y-2'>
                            <Label htmlFor='guarantee-name' className='flex items-center gap-1'>
                              Nom de la garantie <span className='text-red-500'>*</span>
                            </Label>
                            <Input
                              id='guarantee-name'
                              value={newGuarantee.name}
                              onChange={(e) => handleGuaranteeNameChange(e.target.value)}
                              placeholder='Ex: Responsabilité Civile'
                              className='transition-colors focus:border-blue-500'
                            />
                            <p className='text-xs text-gray-500 mt-1'>
                              Le code sera généré automatiquement à partir du nom
                            </p>
                          </div>

                          <div className='space-y-2'>
                            <Label htmlFor='guarantee-description'>Description</Label>
                            <Textarea
                              id='guarantee-description'
                              value={newGuarantee.description}
                              onChange={(e) =>
                                setNewGuarantee((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                              placeholder='Description détaillée de la garantie'
                              rows={3}
                              className='transition-colors focus:border-blue-500'
                            />
                          </div>

                          <div className='space-y-2'>
                            <Label htmlFor='guarantee-insurer' className='flex items-center gap-1'>
                              Assureur <span className='text-red-500'>*</span>
                            </Label>
                            <div className='relative'>
                              <div className='flex items-center border border-input bg-background rounded-md px-3 py-2 transition-colors focus-within:ring-1 focus-within:ring-blue-500'>
                                <Search className='h-4 w-4 text-gray-500 mr-2' />
                                <input
                                  type='text'
                                  placeholder='Rechercher un assureur...'
                                  className='flex-1 outline-none bg-transparent'
                                  value={searchTerm || insurers.find(i => i.id === newGuarantee.insurerId)?.name || ''}
                                  onChange={(e) => {
                                    setSearchTerm(e.target.value) // Updated search term
                                    setInsurersDropdownOpen(true)
                                  }}
                                  onFocus={() => setInsurersDropdownOpen(true)}
                                />
                              </div>
                              {insurersDropdownOpen && (
                                <div className='absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto'>
                                  {loadingInsurers ? (
                                    <div className='px-3 py-2 text-sm text-gray-500'>Chargement des assureurs...</div>
                                  ) : insurers.length === 0 ? (
                                    <div className='px-3 py-2 text-sm text-gray-500'>Aucun assureur disponible</div>
                                  ) : (
                                    insurers
                                      .filter(insurer => 
                                        insurer.name.toLowerCase().includes(searchTerm.toLowerCase())
                                      )
                                      .map((insurer) => (
                                        <div
                                          key={insurer.id}
                                          className={`px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center gap-2 ${
                                            newGuarantee.insurerId === insurer.id ? 'bg-blue-50' : ''
                                          }`}
                                          onClick={() => {
                                            setNewGuarantee((prev) => ({
                                              ...prev,
                                              insurerId: insurer.id,
                                            }))
                                            setSearchTerm('')
                                            setInsurersDropdownOpen(false)
                                          }}
                                        >
                                          <Check
                                            className={`h-4 w-4 ${
                                              newGuarantee.insurerId === insurer.id ? 'text-blue-600' : 'invisible'
                                            }`}
                                          />
                                          {insurer.logo_url && (
                                            <img
                                              src={insurer.logo_url}
                                              alt={insurer.name}
                                              className='w-6 h-6 rounded object-cover'
                                              onError={(e) => {
                                                e.currentTarget.style.display = 'none'
                                              }}
                                            />
                                          )}
                                          <div className='flex flex-col'>
                                            <span className='text-sm font-medium'>{insurer.name}</span>
                                            {insurer.code && (
                                              <span className='text-xs text-gray-500'>{insurer.code}</span>
                                            )}
                                          </div>
                                        </div>
                                      ))
                                  )}
                                </div>
                              )}
                            </div>
                            <p className='text-xs text-gray-500 mt-1'>
                              Chaque garantie doit être associée à un assureur
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Section Méthode de calcul */}
                      <Card className='border border-gray-200 shadow-sm'>
                        <CardHeader className='pb-3 bg-gray-50/50'>
                          <CardTitle className='text-base flex items-center gap-2'>
                            <div className='w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center'>
                              <span className='text-blue-600 text-xs font-bold'>2</span>
                            </div>
                            Méthode de calcul
                          </CardTitle>
                          <CardDescription className='text-sm'>
                            Définissez comment la prime de cette garantie est calculée
                          </CardDescription>
                        </CardHeader>
                        <CardContent className='pt-4 space-y-4'>
                          <div className='space-y-3'>
                            <Label className='flex items-center gap-1 text-sm font-medium'>
                              Méthode de calcul <span className='text-red-500'>*</span>
                            </Label>

                            {/* Cartes de sélection de méthode */}
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                              {/* Méthode FREE */}
                              <button
                                type='button'
                                onClick={() =>
                                  setNewGuarantee((prev) => ({
                                    ...prev,
                                    calculationMethod: 'FREE',
                                  }))
                                }
                                className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                                  newGuarantee.calculationMethod === 'FREE'
                                    ? 'border-green-500 bg-green-50 shadow-md'
                                    : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/30'
                                }`}
                              >
                                <div className='flex items-start gap-3'>
                                  <div
                                    className={`p-2 rounded-lg ${
                                      newGuarantee.calculationMethod === 'FREE'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-green-100 text-green-600'
                                    }`}
                                  >
                                    <Sparkles className='h-5 w-5' />
                                  </div>
                                  <div className='flex-1 min-w-0'>
                                    <div className='font-semibold text-sm mb-1'>Gratuit</div>
                                    <p className='text-xs text-muted-foreground leading-relaxed'>
                                      Prime nulle (gratuite) - Aucun frais pour cette garantie
                                    </p>
                                  </div>
                                  {newGuarantee.calculationMethod === 'FREE' && (
                                    <CheckCircle className='h-5 w-5 text-green-500 flex-shrink-0' />
                                  )}
                                </div>
                              </button>

                              {/* Méthode FIXED_AMOUNT */}
                              <button
                                type='button'
                                onClick={() =>
                                  setNewGuarantee((prev) => ({
                                    ...prev,
                                    calculationMethod: 'FIXED_AMOUNT',
                                  }))
                                }
                                className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                                  newGuarantee.calculationMethod === 'FIXED_AMOUNT'
                                    ? 'border-blue-500 bg-blue-50 shadow-md'
                                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
                                }`}
                              >
                                <div className='flex items-start gap-3'>
                                  <div
                                    className={`p-2 rounded-lg ${
                                      newGuarantee.calculationMethod === 'FIXED_AMOUNT'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-blue-100 text-blue-600'
                                    }`}
                                  >
                                    <DollarSign className='h-5 w-5' />
                                  </div>
                                  <div className='flex-1 min-w-0'>
                                    <div className='font-semibold text-sm mb-1'>Montant Fixe</div>
                                    <p className='text-xs text-muted-foreground leading-relaxed'>
                                      Prime fixe indépendante du véhicule - Ex: 15 000 FCFA
                                    </p>
                                  </div>
                                  {newGuarantee.calculationMethod === 'FIXED_AMOUNT' && (
                                    <CheckCircle className='h-5 w-5 text-blue-500 flex-shrink-0' />
                                  )}
                                </div>
                              </button>

                              {/* Méthode VARIABLE_BASED */}
                              <button
                                type='button'
                                onClick={() =>
                                  setNewGuarantee((prev) => ({
                                    ...prev,
                                    calculationMethod: 'VARIABLE_BASED',
                                  }))
                                }
                                className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                                  newGuarantee.calculationMethod === 'VARIABLE_BASED'
                                    ? 'border-purple-500 bg-purple-50 shadow-md'
                                    : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/30'
                                }`}
                              >
                                <div className='flex items-start gap-3'>
                                  <div
                                    className={`p-2 rounded-lg ${
                                      newGuarantee.calculationMethod === 'VARIABLE_BASED'
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-purple-100 text-purple-600'
                                    }`}
                                  >
                                    <Percent className='h-5 w-5' />
                                  </div>
                                  <div className='flex-1 min-w-0'>
                                    <div className='font-semibold text-sm mb-1'>
                                      Basé sur une variable
                                    </div>
                                    <p className='text-xs text-muted-foreground leading-relaxed'>
                                      Pourcentage sur une valeur du véhicule - Ex: 0.42% de la
                                      valeur vénale
                                    </p>
                                  </div>
                                  {newGuarantee.calculationMethod === 'VARIABLE_BASED' && (
                                    <CheckCircle className='h-5 w-5 text-purple-500 flex-shrink-0' />
                                  )}
                                </div>
                              </button>

                              {/* Méthode MATRIX_BASED */}
                              <button
                                type='button'
                                onClick={() =>
                                  setNewGuarantee((prev) => ({
                                    ...prev,
                                    calculationMethod: 'MATRIX_BASED',
                                  }))
                                }
                                className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                                  newGuarantee.calculationMethod === 'MATRIX_BASED'
                                    ? 'border-orange-500 bg-orange-50 shadow-md'
                                    : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/30'
                                }`}
                              >
                                <div className='flex items-start gap-3'>
                                  <div
                                    className={`p-2 rounded-lg ${
                                      newGuarantee.calculationMethod === 'MATRIX_BASED'
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-orange-100 text-orange-600'
                                    }`}
                                  >
                                    <Layers className='h-5 w-5' />
                                  </div>
                                  <div className='flex-1 min-w-0'>
                                    <div className='font-semibold text-sm mb-1'>
                                      Basé sur une matrice
                                    </div>
                                    <p className='text-xs text-muted-foreground leading-relaxed'>
                                      Grille de tarification - Ex: par puissance fiscale ou type de
                                      carburant
                                    </p>
                                  </div>
                                  {newGuarantee.calculationMethod === 'MATRIX_BASED' && (
                                    <CheckCircle className='h-5 w-5 text-orange-500 flex-shrink-0' />
                                  )}
                                </div>
                              </button>
                            </div>

                            {/* Description détaillée de la méthode sélectionnée */}
                            {newGuarantee.calculationMethod && (
                              <div className='mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md'>
                                <div className='flex items-start gap-2'>
                                  <FileText className='h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0' />
                                  <div className='text-sm text-blue-800'>
                                    <span className='font-medium'>
                                      {
                                        selectableCalculationMethods.find(
                                          (m) => m.value === newGuarantee.calculationMethod
                                        )?.label
                                      }
                                      :
                                    </span>{' '}
                                    {
                                      selectableCalculationMethods.find(
                                        (m) => m.value === newGuarantee.calculationMethod
                                      )?.description
                                    }
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Champs dynamiques selon la méthode de calcul */}
                          {(() => {
                            const method = newGuarantee.calculationMethod
                            const showRate = [
                              'RATE_ON_SI',
                              'RATE_ON_NEW_VALUE',
                              'CONDITIONAL_RATE',
                            ].includes(method as string)
                            const showMinMax = showRate
                            const isFixed = method === 'FIXED_AMOUNT'
                            // FREE n'est pas sélectionnable ici (géré via Supabase), mais on prépare le cas
                            const isFree = (method as any) === 'FREE'

                            return (
                              <div className='space-y-4 pt-2'>
                                {isFixed && (
                                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                    <div className='space-y-2'>
                                      <Label className='flex items-center gap-1'>
                                        Montant fixe (FCFA) <span className='text-red-500'>*</span>
                                      </Label>
                                      <Input
                                        type='number'
                                        value={newGuarantee.fixedAmount ?? ''}
                                        onChange={(e) =>
                                          setNewGuarantee((prev) => ({
                                            ...prev,
                                            fixedAmount: parseFloat(e.target.value) || undefined,
                                          }))
                                        }
                                        placeholder='Ex: 15000'
                                        className='transition-colors focus:border-blue-500'
                                      />
                                    </div>
                                  </div>
                                )}

                                {showRate && (
                                  <div className='space-y-4'>
                                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                      <div className='space-y-2'>
                                        <Label className='flex items-center gap-1'>
                                          Taux (%) <span className='text-red-500'>*</span>
                                        </Label>
                                        <Input
                                          type='number'
                                          step='0.1'
                                          value={newGuarantee.rate || ''}
                                          onChange={(e) =>
                                            setNewGuarantee((prev) => ({
                                              ...prev,
                                              rate: parseFloat(e.target.value) || undefined,
                                            }))
                                          }
                                          placeholder='Ex: 1.5'
                                          className='transition-colors focus:border-blue-500'
                                        />
                                      </div>
                                    </div>
                                    {showMinMax && (
                                      <div className='bg-blue-50 border border-blue-200 rounded-md p-3'>
                                        <div className='flex items-center gap-2 text-sm text-blue-700'>
                                          <AlertTriangle className='h-4 w-4' />
                                          Les montants minimum et maximum ci-dessous sont optionnels
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {showMinMax && (
                                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                    <div className='space-y-2'>
                                      <Label>Montant minimum (FCFA)</Label>
                                      <Input
                                        type='number'
                                        value={newGuarantee.minValue || ''}
                                        onChange={(e) =>
                                          setNewGuarantee((prev) => ({
                                            ...prev,
                                            minValue: parseFloat(e.target.value) || undefined,
                                          }))
                                        }
                                        placeholder='Ex: 50000'
                                        className='transition-colors focus:border-blue-500'
                                      />
                                    </div>
                                    <div className='space-y-2'>
                                      <Label>Montant maximum (FCFA)</Label>
                                      <Input
                                        type='number'
                                        value={newGuarantee.maxValue || ''}
                                        onChange={(e) =>
                                          setNewGuarantee((prev) => ({
                                            ...prev,
                                            maxValue: parseFloat(e.target.value) || undefined,
                                          }))
                                        }
                                        placeholder='Ex: 500000'
                                        className='transition-colors focus:border-blue-500'
                                      />
                                    </div>
                                  </div>
                                )}

                                {isFree && (
                                  <Alert className='bg-green-50 border-green-200'>
                                    <AlertTriangle className='h-4 w-4 text-green-600' />
                                    <AlertDescription className='text-green-700'>
                                      Cette garantie est gratuite: aucun taux ni montant à saisir
                                      ici.
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
                        newGuarantee.calculationMethod === 'MATRIX_BASED') && (
                        <Card className='border border-gray-200 shadow-sm'>
                          <CardHeader className='pb-3 bg-gray-50/50'>
                            <CardTitle className='text-base flex items-center gap-2'>
                              <div className='w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center'>
                                <span className='text-blue-600 text-xs font-bold'>3</span>
                              </div>
                              Configuration avancée
                            </CardTitle>
                            <CardDescription className='text-sm'>
                              Paramètres spécifiques à la méthode de calcul sélectionnée
                            </CardDescription>
                          </CardHeader>
                          <CardContent className='pt-4 space-y-4'>
                            {renderVariableBasedConfigSection()}
                            {renderMatrixBasedConfigSection()}
                          </CardContent>
                        </Card>
                      )}

                      {/* Section Options et conditions */}
                      <Card className='border border-gray-200 shadow-sm'>
                        <CardHeader className='pb-3 bg-gray-50/50'>
                          <CardTitle className='text-base flex items-center gap-2'>
                            <div className='w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center'>
                              <span className='text-blue-600 text-xs font-bold'>4</span>
                            </div>
                            Options et conditions
                          </CardTitle>
                          <CardDescription className='text-sm'>
                            Définissez les conditions d'application et les options de la garantie
                          </CardDescription>
                        </CardHeader>
                        <CardContent className='pt-4 space-y-4'>
                          <div className='space-y-2'>
                            <Label htmlFor='guarantee-conditions'>Conditions d'application</Label>
                            <Textarea
                              id='guarantee-conditions'
                              value={newGuarantee.conditions || ''}
                              onChange={(e) =>
                                setNewGuarantee((prev) => ({ ...prev, conditions: e.target.value }))
                              }
                              placeholder="Conditions d'application (optionnel)"
                              rows={2}
                              className='transition-colors focus:border-blue-500'
                            />
                          </div>

                          <div className='flex items-center space-x-3 p-3 bg-gray-50 rounded-md'>
                            <Checkbox
                              id='guarantee-optional'
                              checked={newGuarantee.isOptional}
                              onCheckedChange={(checked) =>
                                setNewGuarantee((prev) => ({
                                  ...prev,
                                  isOptional: checked as boolean,
                                }))
                              }
                              className='data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600'
                            />
                            <div className='space-y-1'>
                              <Label
                                htmlFor='guarantee-optional'
                                className='cursor-pointer font-medium'
                              >
                                Garantie optionnelle
                              </Label>
                              <p className='text-xs text-muted-foreground'>
                                Cochez si cette garantie n'est pas obligatoire dans le contrat
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <DialogFooter>
                      <Button
                        variant='outline'
                        onClick={() => setIsCreateGuaranteeDialogOpen(false)}
                      >
                        Annuler
                      </Button>
                      <Button onClick={handleCreateGuarantee} disabled={isCreatingGuarantee}>
                        Créer la garantie
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                </div>
              </div>

              {/* Guarantees Grid */}
              {loading ? (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i}>
                      <CardContent className='p-4'>
                        <Skeleton className='h-6 w-3/4 mb-2' />
                        <Skeleton className='h-4 w-1/2 mb-4' />
                        <Skeleton className='h-8 w-full mb-2' />
                        <Skeleton className='h-4 w-2/3' />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredGuarantees.length === 0 ? (
                <Card>
                  <CardContent className='py-12 text-center'>
                    <Shield className='h-16 w-16 mx-auto text-muted-foreground/30 mb-4' />
                    <h3 className='text-lg font-semibold mb-2'>Aucune garantie trouvée</h3>
                    <p className='text-sm text-muted-foreground mb-4'>
                      {searchTerm
                        ? 'Essayez de modifier vos critères de recherche'
                        : 'Commencez par créer une nouvelle garantie'}
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => setIsCreateGuaranteeDialogOpen(true)}>
                        <Plus className='h-4 w-4 mr-2' />
                        Créer une garantie
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className='space-y-4'>
                  <div className='flex justify-end'>
                    <div className='flex items-center gap-1 border rounded-lg p-1 bg-background'>
                      <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size='sm'
                        onClick={() => setViewMode('grid')}
                        title='Vue grille'
                      >
                        <LayoutGrid className='h-4 w-4' />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size='sm'
                        onClick={() => setViewMode('list')}
                        title='Vue liste'
                      >
                        <List className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                  {viewMode === 'grid' ? (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                      {filteredGuarantees.map((guarantee) => (
                        <GuaranteeCard
                          key={guarantee.id}
                          guarantee={guarantee}
                          insurer={
                            insurers.length > 0
                              ? guarantee.insurerId
                                ? insurers.find((i) => i.id === guarantee.insurerId)
                                : insurers[0]
                              : undefined
                          }
                          onEdit={() => openEditGuaranteeDialog(guarantee)}
                          onToggle={() => handleToggleGuarantee(guarantee.id)}
                          onDelete={() => handleDeleteGuarantee(guarantee.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className='space-y-2'>
                      {filteredGuarantees.map((guarantee) => (
                        <Card key={guarantee.id} className='hover:shadow-md transition-shadow'>
                          <CardContent className='p-4'>
                            <div className='flex items-center justify-between'>
                              <div className='flex-1'>
                                <h3 className='font-semibold text-lg mb-1'>{guarantee.name}</h3>
                                <p className='text-sm text-muted-foreground mb-2'>{guarantee.code}</p>
                                {(() => {
                                  const insurer = insurers.length > 0
                                    ? guarantee.insurerId
                                      ? insurers.find((i) => i.id === guarantee.insurerId)
                                      : insurers[0]
                                    : undefined
                                  return insurer ? (
                                    <div className='flex items-center gap-2 mb-2'>
                                      {insurer.logo_url && (
                                        <img
                                          src={insurer.logo_url}
                                          alt={insurer.name}
                                          className='w-4 h-4 rounded object-cover'
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none'
                                          }}
                                        />
                                      )}
                                      <span className='text-xs text-muted-foreground'>{insurer.name}</span>
                                    </div>
                                  ) : null
                                })()}
                                <div className='flex flex-wrap gap-2 mb-2'>
                                  <Badge variant='outline' className='text-xs'>
                                    {guarantee.category}
                                  </Badge>
                                  <Badge 
                                    variant={guarantee.isActive ? 'default' : 'secondary'}
                                    className={`text-xs ${guarantee.isActive ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'}`}
                                  >
                                    {guarantee.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                              </div>
                              <div className='flex items-center gap-2 ml-4'>
                                <Button 
                                  variant='outline' 
                                  size='sm'
                                  onClick={() => openEditGuaranteeDialog(guarantee)}
                                  title='Modifier'
                                >
                                  <Edit className='h-3 w-3' />
                                </Button>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() => handleToggleGuarantee(guarantee.id)}
                                  title={guarantee.isActive ? 'Désactiver' : 'Activer'}
                                >
                                  {guarantee.isActive ? <Pause className='h-3 w-3' /> : <Play className='h-3 w-3' />}
                                </Button>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() => handleDeleteGuarantee(guarantee.id)}
                                  title='Supprimer'
                                  className='text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                >
                                  <Trash2 className='h-3 w-3' />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      {/* Dialog pour modifier une garantie */}
      <Dialog open={isEditGuaranteeDialogOpen} onOpenChange={setIsEditGuaranteeDialogOpen}>
        <DialogContent className='max-w-[98vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-xl'>Modifier la garantie</DialogTitle>
            <DialogDescription className='text-base'>
              Mettez à jour les informations de la garantie
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-6 py-4'>
            {/* Section Informations générales */}
            <Card className='border border-gray-200 shadow-sm'>
              <CardHeader className='pb-3 bg-gray-50/50'>
                <CardTitle className='text-base flex items-center gap-2'>
                  <div className='w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center'>
                    <span className='text-blue-600 text-xs font-bold'>1</span>
                  </div>
                  Informations générales
                </CardTitle>
                <CardDescription className='text-sm'>
                  Informations de base sur la garantie
                </CardDescription>
              </CardHeader>
              <CardContent className='pt-4 space-y-4'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='edit-guarantee-name' className='flex items-center gap-1'>
                      Nom de la garantie <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='edit-guarantee-name'
                      value={newGuarantee.name}
                      onChange={(e) =>
                        setNewGuarantee((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className='transition-colors focus:border-blue-500'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='edit-guarantee-code' className='flex items-center gap-1'>
                      Code <span className='text-red-500'>*</span>
                      <span className='text-xs text-orange-600'>(modifiable)</span>
                    </Label>
                    <Input
                      id='edit-guarantee-code'
                      value={newGuarantee.code}
                      onChange={(e) =>
                        setNewGuarantee((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                      }
                      maxLength={10}
                      className='transition-colors focus:border-blue-500'
                    />
                    <p className='text-xs text-gray-500'>
                      Attention : modifier ce code peut affecter les contrats existants
                    </p>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='edit-guarantee-description'>Description</Label>
                  <Textarea
                    id='edit-guarantee-description'
                    value={newGuarantee.description}
                    onChange={(e) =>
                      setNewGuarantee((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={3}
                    className='transition-colors focus:border-blue-500'
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section Méthode de calcul */}
            <Card className='border border-gray-200 shadow-sm'>
              <CardHeader className='pb-3 bg-gray-50/50'>
                <CardTitle className='text-base flex items-center gap-2'>
                  <div className='w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center'>
                    <span className='text-blue-600 text-xs font-bold'>2</span>
                  </div>
                  Méthode de calcul
                </CardTitle>
                <CardDescription className='text-sm'>
                  Définissez comment la prime de cette garantie est calculée
                </CardDescription>
              </CardHeader>
              <CardContent className='pt-4 space-y-4'>
                <div className='space-y-3'>
                  <Label className='flex items-center gap-1 text-sm font-medium'>
                    Méthode de calcul <span className='text-red-500'>*</span>
                  </Label>

                  {/* Cartes de sélection de méthode (même design que création) */}
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    {/* Méthode FREE */}
                    <button
                      type='button'
                      onClick={() =>
                        setNewGuarantee((prev) => ({ ...prev, calculationMethod: 'FREE' }))
                      }
                      className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                        newGuarantee.calculationMethod === 'FREE'
                          ? 'border-green-500 bg-green-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/30'
                      }`}
                    >
                      <div className='flex items-start gap-3'>
                        <div
                          className={`p-2 rounded-lg ${
                            newGuarantee.calculationMethod === 'FREE'
                              ? 'bg-green-500 text-white'
                              : 'bg-green-100 text-green-600'
                          }`}
                        >
                          <Sparkles className='h-5 w-5' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='font-semibold text-sm mb-1'>Gratuit</div>
                          <p className='text-xs text-muted-foreground leading-relaxed'>
                            Prime nulle (gratuite) - Aucun frais pour cette garantie
                          </p>
                        </div>
                        {newGuarantee.calculationMethod === 'FREE' && (
                          <CheckCircle className='h-5 w-5 text-green-500 flex-shrink-0' />
                        )}
                      </div>
                    </button>

                    {/* Méthode FIXED_AMOUNT */}
                    <button
                      type='button'
                      onClick={() =>
                        setNewGuarantee((prev) => ({ ...prev, calculationMethod: 'FIXED_AMOUNT' }))
                      }
                      className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                        newGuarantee.calculationMethod === 'FIXED_AMOUNT'
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
                      }`}
                    >
                      <div className='flex items-start gap-3'>
                        <div
                          className={`p-2 rounded-lg ${
                            newGuarantee.calculationMethod === 'FIXED_AMOUNT'
                              ? 'bg-blue-500 text-white'
                              : 'bg-blue-100 text-blue-600'
                          }`}
                        >
                          <DollarSign className='h-5 w-5' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='font-semibold text-sm mb-1'>Montant Fixe</div>
                          <p className='text-xs text-muted-foreground leading-relaxed'>
                            Prime fixe indépendante du véhicule - Ex: 15 000 FCFA
                          </p>
                        </div>
                        {newGuarantee.calculationMethod === 'FIXED_AMOUNT' && (
                          <CheckCircle className='h-5 w-5 text-blue-500 flex-shrink-0' />
                        )}
                      </div>
                    </button>

                    {/* Méthode VARIABLE_BASED */}
                    <button
                      type='button'
                      onClick={() =>
                        setNewGuarantee((prev) => ({
                          ...prev,
                          calculationMethod: 'VARIABLE_BASED',
                        }))
                      }
                      className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                        newGuarantee.calculationMethod === 'VARIABLE_BASED'
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/30'
                      }`}
                    >
                      <div className='flex items-start gap-3'>
                        <div
                          className={`p-2 rounded-lg ${
                            newGuarantee.calculationMethod === 'VARIABLE_BASED'
                              ? 'bg-purple-500 text-white'
                              : 'bg-purple-100 text-purple-600'
                          }`}
                        >
                          <Percent className='h-5 w-5' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='font-semibold text-sm mb-1'>Basé sur une variable</div>
                          <p className='text-xs text-muted-foreground leading-relaxed'>
                            Pourcentage sur une valeur du véhicule - Ex: 0.42% de la valeur vénale
                          </p>
                        </div>
                        {newGuarantee.calculationMethod === 'VARIABLE_BASED' && (
                          <CheckCircle className='h-5 w-5 text-purple-500 flex-shrink-0' />
                        )}
                      </div>
                    </button>

                    {/* Méthode MATRIX_BASED */}
                    <button
                      type='button'
                      onClick={() =>
                        setNewGuarantee((prev) => ({ ...prev, calculationMethod: 'MATRIX_BASED' }))
                      }
                      className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                        newGuarantee.calculationMethod === 'MATRIX_BASED'
                          ? 'border-orange-500 bg-orange-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/30'
                      }`}
                    >
                      <div className='flex items-start gap-3'>
                        <div
                          className={`p-2 rounded-lg ${
                            newGuarantee.calculationMethod === 'MATRIX_BASED'
                              ? 'bg-orange-500 text-white'
                              : 'bg-orange-100 text-orange-600'
                          }`}
                        >
                          <Layers className='h-5 w-5' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='font-semibold text-sm mb-1'>Basé sur une matrice</div>
                          <p className='text-xs text-muted-foreground leading-relaxed'>
                            Grille de tarification - Ex: par puissance fiscale et carburant
                          </p>
                        </div>
                        {newGuarantee.calculationMethod === 'MATRIX_BASED' && (
                          <CheckCircle className='h-5 w-5 text-orange-500 flex-shrink-0' />
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Description détaillée de la méthode sélectionnée */}
                  {newGuarantee.calculationMethod && (
                    <div className='mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md'>
                      <div className='flex items-start gap-2'>
                        <FileText className='h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0' />
                        <div className='text-sm text-blue-800'>
                          <span className='font-medium'>
                            {
                              selectableCalculationMethods.find(
                                (m) => m.value === newGuarantee.calculationMethod
                              )?.label
                            }
                            :
                          </span>{' '}
                          {
                            selectableCalculationMethods.find(
                              (m) => m.value === newGuarantee.calculationMethod
                            )?.description
                          }
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Champs dynamiques selon la méthode de calcul (édition) */}
                {(() => {
                  const method = newGuarantee.calculationMethod
                  const showRate = ['RATE_ON_SI', 'RATE_ON_NEW_VALUE', 'CONDITIONAL_RATE'].includes(
                    method as string
                  )
                  const showMinMax = showRate
                  const isFixed = method === 'FIXED_AMOUNT'
                  const isFree = (method as any) === 'FREE'

                  return (
                    <div className='space-y-4 pt-2'>
                      {isFixed && (
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                          <div className='space-y-2'>
                            <Label className='flex items-center gap-1'>
                              Montant fixe (FCFA) <span className='text-red-500'>*</span>
                            </Label>
                            <Input
                              type='number'
                              value={newGuarantee.fixedAmount ?? ''}
                              onChange={(e) =>
                                setNewGuarantee((prev) => ({
                                  ...prev,
                                  fixedAmount: parseFloat(e.target.value) || undefined,
                                }))
                              }
                              placeholder='Ex: 15000'
                              className='transition-colors focus:border-blue-500'
                            />
                          </div>
                        </div>
                      )}

                      {showRate && (
                        <div className='space-y-4'>
                          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                            <div className='space-y-2'>
                              <Label className='flex items-center gap-1'>
                                Taux (%) <span className='text-red-500'>*</span>
                              </Label>
                              <Input
                                type='number'
                                step='0.1'
                                value={newGuarantee.rate || ''}
                                onChange={(e) =>
                                  setNewGuarantee((prev) => ({
                                    ...prev,
                                    rate: parseFloat(e.target.value) || undefined,
                                  }))
                                }
                                placeholder='Ex: 1.5'
                                className='transition-colors focus:border-blue-500'
                              />
                            </div>
                          </div>
                          {showMinMax && (
                            <div className='bg-blue-50 border border-blue-200 rounded-md p-3'>
                              <div className='flex items-center gap-2 text-sm text-blue-700'>
                                <AlertTriangle className='h-4 w-4' />
                                Les montants minimum et maximum ci-dessous sont optionnels
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {showMinMax && (
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                          <div className='space-y-2'>
                            <Label>Montant minimum (FCFA)</Label>
                            <Input
                              type='number'
                              value={newGuarantee.minValue || ''}
                              onChange={(e) =>
                                setNewGuarantee((prev) => ({
                                  ...prev,
                                  minValue: parseFloat(e.target.value) || undefined,
                                }))
                              }
                              placeholder='Ex: 50000'
                              className='transition-colors focus:border-blue-500'
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label>Montant maximum (FCFA)</Label>
                            <Input
                              type='number'
                              value={newGuarantee.maxValue || ''}
                              onChange={(e) =>
                                setNewGuarantee((prev) => ({
                                  ...prev,
                                  maxValue: parseFloat(e.target.value) || undefined,
                                }))
                              }
                              placeholder='Ex: 500000'
                              className='transition-colors focus:border-blue-500'
                            />
                          </div>
                        </div>
                      )}

                      {isFree && (
                        <Alert className='bg-green-50 border-green-200'>
                          <AlertTriangle className='h-4 w-4 text-green-600' />
                          <AlertDescription className='text-green-700'>
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
              newGuarantee.calculationMethod === 'MATRIX_BASED') && (
              <Card className='border border-gray-200 shadow-sm'>
                <CardHeader className='pb-3 bg-gray-50/50'>
                  <CardTitle className='text-base flex items-center gap-2'>
                    <div className='w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center'>
                      <span className='text-blue-600 text-xs font-bold'>3</span>
                    </div>
                    Configuration avancée
                  </CardTitle>
                  <CardDescription className='text-sm'>
                    Paramètres spécifiques à la méthode de calcul sélectionnée
                  </CardDescription>
                </CardHeader>
                <CardContent className='pt-4 space-y-4'>
                  {renderVariableBasedConfigSection()}
                  {renderMatrixBasedConfigSection()}
                </CardContent>
              </Card>
            )}

            {/* Section Options et conditions */}
            <Card className='border border-gray-200 shadow-sm'>
              <CardHeader className='pb-3 bg-gray-50/50'>
                <CardTitle className='text-base flex items-center gap-2'>
                  <div className='w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center'>
                    <span className='text-blue-600 text-xs font-bold'>4</span>
                  </div>
                  Options et conditions
                </CardTitle>
                <CardDescription className='text-sm'>
                  Définissez les conditions d'application et les options de la garantie
                </CardDescription>
              </CardHeader>
              <CardContent className='pt-4 space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='edit-guarantee-conditions'>Conditions d'application</Label>
                  <Textarea
                    id='edit-guarantee-conditions'
                    value={newGuarantee.conditions || ''}
                    onChange={(e) =>
                      setNewGuarantee((prev) => ({ ...prev, conditions: e.target.value }))
                    }
                    rows={2}
                    className='transition-colors focus:border-blue-500'
                  />
                </div>

                <div className='flex items-center space-x-3 p-3 bg-gray-50 rounded-md'>
                  <Checkbox
                    id='edit-guarantee-optional'
                    checked={newGuarantee.isOptional}
                    onCheckedChange={(checked) =>
                      setNewGuarantee((prev) => ({ ...prev, isOptional: checked as boolean }))
                    }
                    className='data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600'
                  />
                  <div className='space-y-1'>
                    <Label htmlFor='edit-guarantee-optional' className='cursor-pointer font-medium'>
                      Garantie optionnelle
                    </Label>
                    <p className='text-xs text-muted-foreground'>
                      Cochez si cette garantie n'est pas obligatoire dans le contrat
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsEditGuaranteeDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateGuarantee}>Mettre à jour</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Alert */}
      {notification && (
        <div className='fixed top-4 right-4 z-50 max-w-md'>
          <Alert
            variant={
              notification.type === 'success'
                ? 'default'
                : notification.type === 'error'
                  ? 'destructive'
                  : notification.type === 'warning'
                    ? 'default'
                    : 'default'
            }
            className={
              notification.type === 'success'
                ? 'border-green-500 bg-green-50 text-green-900'
                : notification.type === 'error'
                  ? 'border-red-500 bg-red-50 text-red-900'
                  : notification.type === 'warning'
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-900'
                    : 'border-blue-500 bg-blue-50 text-blue-900'
            }
          >
            <AlertDescription className='flex items-center justify-between'>
              <div>
                <div className='font-semibold'>{notification.message}</div>
                {notification.description && (
                  <div className='text-sm mt-1 opacity-90'>{notification.description}</div>
                )}
              </div>
              <button
                onClick={() => setNotification(null)}
                className='ml-4 opacity-70 hover:opacity-100'
              >
                ✕
              </button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Dialog de confirmation */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, isOpen: open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
            >
              Annuler
            </Button>
            <Button
              onClick={async () => {
                await confirmDialog.onConfirm()
                setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })
              }}
              variant='destructive'
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminTarificationPage
