import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  Eye,
  MoreHorizontal,
  Pause,
  Play,
  Loader2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'
import {
  guaranteeService,
  getBuiltinDefaultGuarantees,
} from '@/features/tarification/services/guaranteeService'
import {
  Guarantee,
  GuaranteeFormData,
  CalculationMethodType,
} from '@/types/tarification'

import { GuaranteeForm } from '@/components/tarification/GuaranteeForm'

type ViewMode = 'grid' | 'list'

const InsurerGuaranteesPage = () => {
  const { user, isAuthenticated } = useAuth()
  const [guarantees, setGuarantees] = useState<Guarantee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingGuarantee, setEditingGuarantee] = useState<Guarantee | null>(null)
  const [viewingGuarantee, setViewingGuarantee] = useState<Guarantee | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Insurer info state
  const [insurerId, setInsurerId] = useState<string | null>(null)
  const [insurerName, setInsurerName] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<GuaranteeFormData>({
    name: '',
    code: '',
    description: '',
    category: 'RC',
    calculationType: 'FIXED_AMOUNT',
    calculationMethod: 'FIXED_AMOUNT',
    isMandatory: false,
    basePrice: 0,
    percentage: 0,
    minPrice: 0,
    maxPrice: 0,
  })

  // Load guarantees for the current insurer
  const loadGuarantees = async () => {
    if (!isAuthenticated || !user) return

    try {
      setIsLoading(true)
      setError(null)

      // Get insurer_id using RPC function
      const { data: insurerData, error: insurerError } = await supabase.rpc('get_current_insurer_id')

      if (insurerError || !insurerData || insurerData.length === 0) {
        throw new Error('Unable to retrieve insurer information. Please ensure your insurer account is properly set up.')
      }

      const insurerId = insurerData[0].insurer_id
      const insurerName = insurerData[0].insurer_name
      setInsurerId(insurerId)
      setInsurerName(insurerName)
      logger.info('Loading guarantees for insurer', { insurerId, insurerName })

      // Load guarantees for this insurer only
      const { data, error } = await supabase
        .from('coverages')
        .select('*')
        .eq('insurer_id', insurerId)
        .order('display_order', { ascending: true })

      if (error) throw error

      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        code: item.code,
        description: item.description || '',
        category: item.type,
        calculationType: item.calculation_type,
        calculationMethod: item.calculation_type,
        isMandatory: item.is_mandatory || false,
        isActive: item.is_active !== false,
        basePrice: item.metadata?.fixed_amount || 0,
        percentage: item.metadata?.percentage || 0,
        minPrice: item.metadata?.min_price || 0,
        maxPrice: item.metadata?.max_price || 0,
        insurerId: item.insurer_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }))

      setGuarantees(transformedData)
      logger.info('Loaded guarantees for insurer', { insurerId, count: transformedData.length })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load guarantees'
      setError(message)
      logger.error('Error loading guarantees', { error: message })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadGuarantees()
  }, [isAuthenticated, user])

  const filteredGuarantees = guarantees.filter((guarantee) => {
    const matchesSearch =
      searchTerm === '' ||
      guarantee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guarantee.code.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && guarantee.isActive) ||
      (statusFilter === 'inactive' && !guarantee.isActive)

    return matchesSearch && matchesStatus
  })

  const handleCreateGuarantee = async (data: any) => {
    if (!isAuthenticated || !user) return

    try {
      setIsSubmitting(true)
      setMutationError(null)

      // The GuaranteeForm already includes insurerId, so we don't need to fetch it again
      // But we'll validate it's present
      if (!data.insurerId) {
        throw new Error('Insurer ID is required. Please ensure your insurer account is properly set up.')
      }

      // Map GuaranteeForm data to database structure
      const guaranteeData = {
        name: data.name,
        code: data.code || `${data.category.substring(0, 3).toUpperCase()}-${Date.now()}`,
        description: data.description,
        type: data.category,
        calculation_type: data.calculationMethod,
        is_mandatory: data.isMandatory || false,
        is_active: true,
        insurer_id: data.insurerId,
        metadata: {
          fixed_amount: data.fixedAmount,
          percentage: data.rate,
          min_price: data.minPrice,
          max_price: data.maxPrice,
        },
        display_order: guarantees.length,
      }

      const { data: insertedData, error } = await supabase
        .from('coverages')
        .insert(guaranteeData)
        .select()
        .single()

      if (error) throw error

      logger.info('Guarantee created successfully', { id: insertedData.id, insurerId: data.insurerId })
      setIsCreateDialogOpen(false)
      resetForm()
      loadGuarantees()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create guarantee'
      setMutationError(message)
      logger.error('Error creating guarantee', { error: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateGuarantee = async () => {
    if (!editingGuarantee) return

    try {
      setIsSubmitting(true)
      setMutationError(null)

      const guaranteeData = {
        name: formData.name,
        description: formData.description,
        type: formData.category,
        calculation_type: formData.calculationType,
        is_mandatory: formData.isMandatory,
        metadata: {
          fixed_amount: formData.basePrice,
          percentage: formData.percentage,
          min_price: formData.minPrice,
          max_price: formData.maxPrice,
        },
      }

      const { error } = await supabase
        .from('coverages')
        .update(guaranteeData)
        .eq('id', editingGuarantee.id)

      if (error) throw error

      logger.info('Guarantee updated successfully', { id: editingGuarantee.id })
      setEditingGuarantee(null)
      resetForm()
      loadGuarantees()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update guarantee'
      setMutationError(message)
      logger.error('Error updating guarantee', { error: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteGuarantee = async () => {
    if (!viewingGuarantee) return

    try {
      setIsSubmitting(true)

      const { error } = await supabase
        .from('coverages')
        .update({ is_active: false })
        .eq('id', viewingGuarantee.id)

      if (error) throw error

      logger.info('Guarantee deactivated successfully', { id: viewingGuarantee.id })
      setShowDeleteDialog(false)
      setViewingGuarantee(null)
      loadGuarantees()
    } catch (err) {
      logger.error('Error deactivating guarantee', { error: err })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (guarantee: Guarantee) => {
    try {
      const { error } = await supabase
        .from('coverages')
        .update({ is_active: !guarantee.isActive })
        .eq('id', guarantee.id)

      if (error) throw error

      logger.info('Guarantee toggled', { id: guarantee.id, isActive: !guarantee.isActive })
      loadGuarantees()
    } catch (err) {
      logger.error('Error toggling guarantee', { error: err })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      category: 'RC',
      calculationType: 'FIXED_AMOUNT',
      calculationMethod: 'FIXED_AMOUNT',
      isMandatory: false,
      basePrice: 0,
      percentage: 0,
      minPrice: 0,
      maxPrice: 0,
    })
    setMutationError(null)
  }

  const openEditDialog = (guarantee: Guarantee) => {
    setEditingGuarantee(guarantee)
    setFormData({
      name: guarantee.name,
      code: guarantee.code,
      description: guarantee.description,
      category: guarantee.category,
      calculationType: guarantee.calculationType,
      calculationMethod: guarantee.calculationMethod,
      isMandatory: guarantee.isMandatory,
      basePrice: guarantee.basePrice,
      percentage: guarantee.percentage,
      minPrice: guarantee.minPrice,
      maxPrice: guarantee.maxPrice,
    })
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className='bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'>
        Active
      </Badge>
    ) : (
      <Badge className='bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400'>
        Inactive
      </Badge>
    )
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'RC': 'Responsabilité Civile',
      'DEFENSE_RECOURS': 'Défense et Recours',
      'DOMMAGES': 'Dommages',
      'PERSONNE': 'Personne',
      'AUTRE': 'Autre',
    }
    return labels[category] || category
  }

  const getCalculationTypeLabel = (type: CalculationMethodType) => {
    const labels: Record<string, string> = {
      'FIXED_AMOUNT': 'Montant Fixe',
      'MATRIX_BASED': 'Grille Tarifaire',
      'FORMULA_BASED': 'Formule',
      'FREE': 'Gratuit',
    }
    return labels[type] || type
  }

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className='p-6'>
                <div className='space-y-3'>
                  <div className='h-4 bg-muted animate-pulse rounded' />
                  <div className='h-3 bg-muted animate-pulse rounded w-3/4' />
                  <div className='h-3 bg-muted animate-pulse rounded w-1/2' />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6 w-full'>

      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold'>Mes Garanties</h1>
          <p className='text-muted-foreground'>
            Gérez les garanties proposées par votre compagnie
          </p>
        </div>
        <div className='flex gap-2'>
          <div className='flex bg-muted rounded-lg p-1'>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setViewMode('grid')}
            >
              <Shield className='h-4 w-4' />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setViewMode('list')}
            >
              <Settings className='h-4 w-4' />
            </Button>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={(open) => {
              setIsCreateDialogOpen(open)
              if (!open) resetForm()
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className='h-4 w-4 mr-2' />
                Nouvelle Garantie
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto p-0'>
              {!insurerId ? (
                <div className='p-6'>
                  <Alert variant="destructive">
                    <AlertTriangle className='h-4 w-4' />
                    <AlertDescription>
                      Unable to load insurer information. Please refresh the page.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <GuaranteeForm
                  insurerId={insurerId}
                  insurerName={insurerName || undefined}
                  onSubmit={handleCreateGuarantee}
                  onCancel={() => {
                    setIsCreateDialogOpen(false)
                    resetForm()
                  }}
                  isLoading={isSubmitting}
                  error={mutationError}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='p-4'>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Rechercher par nom, code...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className='w-full sm:w-[180px]'>
                <SelectValue placeholder='Statut' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tous les statuts</SelectItem>
                <SelectItem value='active'>Actifs</SelectItem>
                <SelectItem value='inactive'>Inactifs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Guarantees Grid/List */}
      {filteredGuarantees.length === 0 ? (
        <Card>
          <CardContent className='py-12 text-center'>
            <Shield className='h-16 w-16 mx-auto text-muted-foreground/30 mb-4' />
            <h3 className='text-lg font-semibold mb-2'>Aucune garantie trouvée</h3>
            <p className='text-sm text-muted-foreground mb-4'>
              {searchTerm || statusFilter !== 'all'
                ? 'Essayez de modifier vos critères de recherche'
                : 'Commencez par créer votre première garantie'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className='h-4 w-4 mr-2' />
                Créer une garantie
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {filteredGuarantees.map((guarantee) => (
            <GuaranteeCard
              key={guarantee.id}
              guarantee={guarantee}
              onEdit={openEditDialog}
              onView={setViewingGuarantee}
              onToggle={handleToggleActive}
              onDelete={(g) => {
                setViewingGuarantee(g)
                setShowDeleteDialog(true)
              }}
              getStatusBadge={getStatusBadge}
              getCategoryLabel={getCategoryLabel}
              getCalculationTypeLabel={getCalculationTypeLabel}
            />
          ))}
        </div>
      ) : (
        <div className='space-y-3'>
          {filteredGuarantees.map((guarantee) => (
            <GuaranteeListItem
              key={guarantee.id}
              guarantee={guarantee}
              onEdit={openEditDialog}
              onView={setViewingGuarantee}
              onToggle={handleToggleActive}
              onDelete={(g) => {
                setViewingGuarantee(g)
                setShowDeleteDialog(true)
              }}
              getStatusBadge={getStatusBadge}
              getCategoryLabel={getCategoryLabel}
              getCalculationTypeLabel={getCalculationTypeLabel}
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingGuarantee}
        onOpenChange={(open) => {
          if (!open) {
            setEditingGuarantee(null)
            resetForm()
          }
        }}
      >
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Modifier la garantie</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la garantie
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            {mutationError && (
              <Alert variant="destructive">
                <AlertTriangle className='h-4 w-4' />
                <AlertDescription>{mutationError}</AlertDescription>
              </Alert>
            )}

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='edit-name'>Nom de la garantie *</Label>
                <Input
                  id='edit-name'
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor='edit-category'>Catégorie *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='RC'>Responsabilité Civile</SelectItem>
                    <SelectItem value='DEFENSE_RECOURS'>Défense et Recours</SelectItem>
                    <SelectItem value='DOMMAGES'>Dommages</SelectItem>
                    <SelectItem value='PERSONNE'>Personne</SelectItem>
                    <SelectItem value='AUTRE'>Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor='edit-description'>Description</Label>
              <Textarea
                id='edit-description'
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='edit-calculationType'>Type de calcul *</Label>
                <Select
                  value={formData.calculationType}
                  onValueChange={(value) => setFormData({ ...formData, calculationType: value as CalculationMethodType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='FIXED_AMOUNT'>Montant Fixe</SelectItem>
                    <SelectItem value='MATRIX_BASED'>Grille Tarifaire</SelectItem>
                    <SelectItem value='FORMULA_BASED'>Formule</SelectItem>
                    <SelectItem value='FREE'>Gratuit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='flex items-center space-x-2 pt-6'>
                <Checkbox
                  id='edit-isMandatory'
                  checked={formData.isMandatory}
                  onCheckedChange={(checked) => setFormData({ ...formData, isMandatory: checked as boolean })}
                />
                <Label htmlFor='edit-isMandatory'>Garantie obligatoire</Label>
              </div>
            </div>

            {formData.calculationType === 'FIXED_AMOUNT' && (
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                <div>
                  <Label htmlFor='edit-basePrice'>Prix de base (€)</Label>
                  <Input
                    id='edit-basePrice'
                    type='number'
                    step='0.01'
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor='edit-minPrice'>Prix min (€)</Label>
                  <Input
                    id='edit-minPrice'
                    type='number'
                    step='0.01'
                    value={formData.minPrice}
                    onChange={(e) => setFormData({ ...formData, minPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor='edit-maxPrice'>Prix max (€)</Label>
                  <Input
                    id='edit-maxPrice'
                    type='number'
                    step='0.01'
                    value={formData.maxPrice}
                    onChange={(e) => setFormData({ ...formData, maxPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setEditingGuarantee(null)
                resetForm()
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleUpdateGuarantee} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Mise à jour...
                </>
              ) : (
                'Mettre à jour'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Désactiver la garantie</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <p>
              Êtes-vous sûr de vouloir désactiver la garantie{' '}
              <strong>{viewingGuarantee?.name}</strong> ?
            </p>
            <p className='text-sm text-muted-foreground'>
              La garantie ne sera plus proposée dans les nouveaux devis mais restera visible dans les historiques.
            </p>
            <DialogFooter>
              <Button variant='outline' onClick={() => setShowDeleteDialog(false)}>
                Annuler
              </Button>
              <Button variant='destructive' onClick={handleDeleteGuarantee} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    Désactivation...
                  </>
                ) : (
                  'Désactiver'
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// GuaranteeCard Component
interface GuaranteeCardProps {
  guarantee: Guarantee
  onEdit: (guarantee: Guarantee) => void
  onView: (guarantee: Guarantee) => void
  onToggle: (guarantee: Guarantee) => void
  onDelete: (guarantee: Guarantee) => void
  getStatusBadge: (isActive: boolean) => React.ReactNode
  getCategoryLabel: (category: string) => string
  getCalculationTypeLabel: (type: CalculationMethodType) => string
}

const GuaranteeCard: React.FC<GuaranteeCardProps> = ({
  guarantee,
  onEdit,
  onView,
  onToggle,
  onDelete,
  getStatusBadge,
  getCategoryLabel,
  getCalculationTypeLabel,
}) => {
  return (
    <Card className='hover:shadow-md transition-all duration-200'>
      <CardContent className='p-4'>
        <div className='flex items-start justify-between mb-3'>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-1'>
              <Shield className='h-5 w-5 text-primary' />
              <h3 className='font-semibold text-base'>{guarantee.name}</h3>
            </div>
            <p className='text-xs text-muted-foreground font-mono'>{guarantee.code}</p>
          </div>
          {getStatusBadge(guarantee.isActive)}
        </div>

        <div className='space-y-2 mb-3'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>Catégorie:</span>
            <Badge variant='outline'>{getCategoryLabel(guarantee.category)}</Badge>
          </div>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>Calcul:</span>
            <span className='font-medium'>{getCalculationTypeLabel(guarantee.calculationType)}</span>
          </div>
          {guarantee.calculationType === 'FIXED_AMOUNT' && guarantee.basePrice > 0 && (
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>Prix:</span>
              <span className='font-semibold'>{guarantee.basePrice.toFixed(2)} €</span>
            </div>
          )}
        </div>

        {guarantee.description && (
          <p className='text-sm text-muted-foreground mb-3 line-clamp-2'>
            {guarantee.description}
          </p>
        )}

        <div className='flex items-center justify-between pt-3 border-t'>
          <div className='flex gap-1'>
            {guarantee.isMandatory && (
              <Badge variant='secondary' className='text-xs'>Obligatoire</Badge>
            )}
          </div>
          <div className='flex gap-1'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onToggle(guarantee)}
              title={guarantee.isActive ? 'Désactiver' : 'Activer'}
            >
              {guarantee.isActive ? <Pause className='h-3 w-3' /> : <Play className='h-3 w-3' />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm'>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => onView(guarantee)}>
                  <Eye className='h-4 w-4 mr-2' />
                  Voir détails
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(guarantee)}>
                  <Edit className='h-4 w-4 mr-2' />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(guarantee)} className='text-red-600'>
                  <Trash2 className='h-4 w-4 mr-2' />
                  Désactiver
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// GuaranteeListItem Component
const GuaranteeListItem: React.FC<GuaranteeCardProps> = ({
  guarantee,
  onEdit,
  onView,
  onToggle,
  onDelete,
  getStatusBadge,
  getCategoryLabel,
  getCalculationTypeLabel,
}) => {
  return (
    <Card className='hover:shadow-md transition-all duration-200'>
      <CardContent className='p-4'>
        <div className='flex items-center gap-4'>
          <Shield className='h-10 w-10 text-primary flex-shrink-0' />
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 mb-1'>
              <h3 className='font-semibold truncate'>{guarantee.name}</h3>
              {getStatusBadge(guarantee.isActive)}
            </div>
            <p className='text-xs text-muted-foreground font-mono'>{guarantee.code}</p>
          </div>
          <div className='hidden sm:block flex-1'>
            <Badge variant='outline'>{getCategoryLabel(guarantee.category)}</Badge>
          </div>
          <div className='hidden md:block flex-1'>
            <span className='text-sm'>{getCalculationTypeLabel(guarantee.calculationType)}</span>
          </div>
          {guarantee.calculationType === 'FIXED_AMOUNT' && guarantee.basePrice > 0 && (
            <div className='hidden lg:block w-24 text-right'>
              <span className='font-semibold'>{guarantee.basePrice.toFixed(2)} €</span>
            </div>
          )}
          <div className='flex gap-1'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onToggle(guarantee)}
              title={guarantee.isActive ? 'Désactiver' : 'Activer'}
            >
              {guarantee.isActive ? <Pause className='h-3 w-3' /> : <Play className='h-3 w-3' />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm'>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => onView(guarantee)}>
                  <Eye className='h-4 w-4 mr-2' />
                  Voir détails
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(guarantee)}>
                  <Edit className='h-4 w-4 mr-2' />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(guarantee)} className='text-red-600'>
                  <Trash2 className='h-4 w-4 mr-2' />
                  Désactiver
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default InsurerGuaranteesPage
