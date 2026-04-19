import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'
import {
  Shield,
  Calculator,
  Sparkles,
  Save,
  AlertCircle,
  CheckCircle,
  Info,
  Building2,
  Users,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Guarantee, CalculationMethodType } from '@/types/tarification'
import { insurerService } from '@/features/admin/services/insurerService'

// ============================================
// TYPES
// ============================================

interface InsurerOption {
  id: string
  companyName: string
  email: string
  status: string
}

interface GuaranteeFormData {
  name: string
  code: string
  category: string
  description: string
  calculationMethod: CalculationMethodType
  fixedAmount?: number
  formula?: string
  isOptional: boolean
  isActive: boolean
  insurerId?: string
}

interface GuaranteeFormProps {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  initialData?: Guarantee
  onSuccess?: () => void
}

// ============================================
// DONNÉES PAR DÉFAUT
// ============================================

const defaultFormData: GuaranteeFormData = {
  name: '',
  code: '',
  category: 'AUTO',
  description: '',
  calculationMethod: 'FIXED_AMOUNT',
  fixedAmount: 0,
  formula: '',
  isOptional: true,
  isActive: true,
  insurerId: undefined,
}

// ============================================
// CATÉGORIES ET MÉTHODES
// ============================================

const categories = [
  { value: 'AUTO', label: 'Automobile', icon: '🚗' },
  { value: 'MOTO', label: 'Moto', icon: '🏍️' },
  { value: 'HABITAT', label: 'Habitat', icon: '🏠' },
  { value: 'SANTÉ', label: 'Santé', icon: '🏥' },
  { value: 'VIE', label: 'Vie', icon: '💜' },
  { value: 'VOYAGE', label: 'Voyage', icon: '✈️' },
]

const calculationMethods = [
  {
    value: 'FIXED_AMOUNT',
    label: 'Montant fixe',
    description: 'Montant fixe indépendant du véhicule',
    icon: '💰',
  },
  {
    value: 'FORMULA',
    label: 'Formule calculée',
    description: 'Calcul basé sur une formule personnalisée',
    icon: '🧮',
  },
  {
    value: 'PERCENTAGE',
    label: 'Pourcentage',
    description: 'Pourcentage de la prime de base',
    icon: '📊',
  },
  {
    value: 'FREE',
    label: 'Gratuit',
    description: 'Offert gratuitement (promotion)',
    icon: '🎁',
  },
]

// ============================================
// COMPOSANTS
// ============================================

const MethodBadge: React.FC<{ method: CalculationMethodType }> = ({ method }) => {
  const config = {
    FIXED_AMOUNT: { label: 'Fixe', color: 'bg-blue-100 text-blue-700', icon: '💰' },
    FORMULA: { label: 'Formule', color: 'bg-purple-100 text-purple-700', icon: '🧮' },
    PERCENTAGE: { label: '%', color: 'bg-green-100 text-green-700', icon: '📊' },
    FREE: { label: 'Gratuit', color: 'bg-yellow-100 text-yellow-700', icon: '🎁' },
  }[method]

  return (
    <Badge className={config.color}>
      <span className='mr-1'>{config.icon}</span>
      {config.label}
    </Badge>
  )
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export const GuaranteeForm: React.FC<GuaranteeFormProps> = ({
  open,
  onClose,
  mode,
  initialData,
  onSuccess,
}) => {
  const { toast } = useToast()
  const [formData, setFormData] = useState<GuaranteeFormData>(defaultFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [insurers, setInsurers] = useState<InsurerOption[]>([])
  const [isLoadingInsurers, setIsLoadingInsurers] = useState(false)

  // Réinitialiser lors de l'ouverture
  useEffect(() => {
    if (open && mode === 'create') {
      setFormData(defaultFormData)
      setErrors({})
    } else if (open && mode === 'edit' && initialData) {
      setFormData({
        name: initialData.name,
        code: initialData.code,
        category: initialData.category,
        description: initialData.description || '',
        calculationMethod: initialData.calculationMethod,
        fixedAmount: initialData.fixedAmount,
        formula: initialData.formula,
        isOptional: initialData.isOptional,
        isActive: initialData.isActive,
        insurerId: initialData.insurerId,
      })
      setErrors({})
    }
  }, [open, mode, initialData])

  // Charger les assureurs
  useEffect(() => {
    const loadInsurers = async () => {
      setIsLoadingInsurers(true)
      try {
        const data = await insurerService.listInsurers()
        setInsurers(
          data
            .filter((insurer: any) => insurer.status === 'active')
            .map((insurer: any) => ({
              id: insurer.id,
              companyName: insurer.companyName,
              email: insurer.email,
              status: insurer.status,
            }))
        )
      } catch (error) {
        logger.error('Error loading insurers:', error)
      } finally {
        setIsLoadingInsurers(false)
      }
    }

    if (open) {
      loadInsurers()
    }
  }, [open])

  // Mise à jour du formulaire
  const updateField = (field: keyof GuaranteeFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Génération automatique du code
  const generateCode = () => {
    const prefix = formData.category.substring(0, 3).toUpperCase()
    const suffix = formData.name
      .split(' ')
      .map((word) => word.substring(0, 2).toUpperCase())
      .join('')
    updateField('code', `${prefix}_${suffix}`)
  }

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis'
    }
    if (!formData.code.trim()) {
      newErrors.code = 'Le code est requis'
    }
    if (!formData.category) {
      newErrors.category = 'La catégorie est requise'
    }
    if (!formData.calculationMethod) {
      newErrors.calculationMethod = 'La méthode de calcul est requise'
    }
    if (formData.calculationMethod === 'FIXED_AMOUNT' && (!formData.fixedAmount || formData.fixedAmount <= 0)) {
      newErrors.fixedAmount = 'Le montant fixe doit être positif'
    }
    if (formData.calculationMethod === 'FORMULA' && !formData.formula?.trim()) {
      newErrors.formula = 'La formule est requise pour ce type de calcul'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Soumission
  const handleSubmit = async () => {
    if (!validate()) {
      return
    }

    setIsSubmitting(true)
    try {
      const dataToSave = {
        name: formData.name,
        code: formData.code.toUpperCase(),
        category: formData.category,
        description: formData.description,
        calculation_method: formData.calculationMethod,
        fixed_amount: formData.fixedAmount || null,
        formula: formData.formula || null,
        is_optional: formData.isOptional,
        is_active: formData.isActive,
        insurer_id: formData.insurerId || null,
      }

      if (mode === 'create') {
        const { error } = await supabase.from('guarantees').insert(dataToSave)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('guarantees')
          .update(dataToSave)
          .eq('id', initialData?.id)
        if (error) throw error
      }

      logger.info('Guarantee saved successfully:', formData)

      toast({
        title: 'Succès',
        description: mode === 'create' ? 'Garantie créée avec succès' : 'Garantie mise à jour',
        variant: 'default',
      })
      onSuccess?.()
      onClose()
    } catch (error) {
      logger.error('Error saving guarantee:', error)
      toast({
        title: 'Erreur',
        description: mode === 'create' ? "Erreur lors de la création" : "Erreur lors de la mise à jour",
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto'>
        <DialogHeader className='space-y-2 sm:space-y-3'>
          <DialogTitle className='flex items-center gap-2 text-lg sm:text-xl'>
            <Shield className='h-5 w-5' />
            {mode === 'create' ? 'Nouvelle garantie' : 'Modifier la garantie'}
          </DialogTitle>
          <DialogDescription className='text-sm'>
            {mode === 'create'
              ? 'Créez une nouvelle garantie pour vos produits d\'assurance'
              : 'Modifiez les informations de cette garantie'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 sm:space-y-6 py-4'>
          {/* Informations de base */}
          <div className='space-y-3 sm:space-y-4'>
            <h3 className='font-medium flex items-center gap-2 text-sm sm:text-base'>
              <Info className='h-4 w-4' />
              Informations de base
            </h3>

            {/* Nom */}
            <div className='space-y-2'>
              <Label htmlFor='name' className='text-sm'>
                Nom de la garantie <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='name'
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder='Ex: Assistance 0km'
                className={cn(errors.name && 'border-red-500', 'text-sm')}
              />
              {errors.name && <p className='text-xs sm:text-sm text-red-500'>{errors.name}</p>}
            </div>

            {/* Code + Génération automatique */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between gap-2'>
                <Label htmlFor='code' className='text-sm'>
                  Code <span className='text-red-500'>*</span>
                </Label>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={generateCode}
                  disabled={!formData.name}
                  className='text-xs'
                >
                  <Sparkles className='h-3 w-3 mr-1 sm:mr-2' />
                  <span className='hidden sm:inline'>Générer</span>
                  <span className='sm:hidden'> Gén</span>
                </Button>
              </div>
              <Input
                id='code'
                value={formData.code}
                onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                placeholder='Ex: AUTO_ASS_0KM'
                className={cn('font-mono text-sm', errors.code && 'border-red-500')}
              />
              {errors.code && <p className='text-xs sm:text-sm text-red-500'>{errors.code}</p>}
            </div>

            {/* Catégorie */}
            <div className='space-y-2'>
              <Label className='text-sm'>
                Catégorie <span className='text-red-500'>*</span>
              </Label>
              <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type='button'
                    onClick={() => updateField('category', cat.value)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 sm:p-3 rounded-lg border-2 transition-colors',
                      formData.category === cat.value
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <span className='text-xl sm:text-2xl'>{cat.icon}</span>
                    <span className='text-[10px] sm:text-xs font-medium'>{cat.label}</span>
                  </button>
                ))}
              </div>
              {errors.category && <p className='text-xs sm:text-sm text-red-500'>{errors.category}</p>}
            </div>
                  size='sm'
                  onClick={generateCode}
                  disabled={!formData.name}
                >
                  <Sparkles className='h-4 w-4 mr-2' />
                  Générer
                </Button>
              </div>
              <Input
                id='code'
                value={formData.code}
                onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                placeholder='Ex: AUTO_ASS_0KM'
                className={cn('font-mono', errors.code && 'border-red-500')}
              />
              {errors.code && <p className='text-sm text-red-500'>{errors.code}</p>}
            </div>

            {/* Catégorie */}
            <div className='space-y-2'>
              <Label>
                Catégorie <span className='text-red-500'>*</span>
              </Label>
              <div className='grid grid-cols-3 gap-2'>
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type='button'
                    onClick={() => updateField('category', cat.value)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors',
                      formData.category === cat.value
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <span className='text-2xl'>{cat.icon}</span>
                    <span className='text-xs font-medium'>{cat.label}</span>
                  </button>
                ))}
              </div>
              {errors.category && <p className='text-sm text-red-500'>{errors.category}</p>}
            </div>

            {/* Description */}
            <div className='space-y-2'>
              <Label htmlFor='description' className='text-sm'>Description</Label>
              <Textarea
                id='description'
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder='Décrivez cette garantie...'
                rows={3}
                className='text-sm resize-none'
              />
            </div>

            {/* Assureur associé */}
            <div className='space-y-2'>
              <Label htmlFor='insurer' className='flex items-center gap-2 text-sm'>
                <Building2 className='h-4 w-4' />
                Assureur associé
              </Label>
              {isLoadingInsurers ? (
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-primary' />
                  Chargement des assureurs...
                </div>
              ) : insurers.length === 0 ? (
                <Alert>
                  <Users className='h-4 w-4' />
                  <AlertDescription className='ml-2 text-xs sm:text-sm'>
                    Aucun assureur actif disponible. Cette garantie sera disponible pour tous les assureurs.
                  </AlertDescription>
                </Alert>
              ) : (
                <Select
                  value={formData.insurerId || 'all'}
                  onValueChange={(value) => updateField('insurerId', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger className={cn(errors.insurerId && 'border-red-500', 'text-sm')}>
                    <SelectValue placeholder='Sélectionnez un assureur (optionnel)' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>
                      <div className='flex items-center gap-2'>
                        <Users className='h-4 w-4' />
                        <span>Tous les assureurs</span>
                      </div>
                    </SelectItem>
                    {insurers.map((insurer) => (
                      <SelectItem key={insurer.id} value={insurer.id}>
                        <div className='flex items-center gap-2'>
                          <Building2 className='h-4 w-4' />
                          <span className='truncate'>{insurer.companyName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className='text-xs text-muted-foreground'>
                Laissez vide pour rendre cette garantie disponible à tous les assureurs
              </p>
              {errors.insurerId && <p className='text-xs sm:text-sm text-red-500'>{errors.insurerId}</p>}
            </div>
          </div>

          {/* Méthode de calcul */}
          <div className='space-y-4'>
            <h3 className='font-medium flex items-center gap-2'>
              <Calculator className='h-4 w-4' />
              Méthode de calcul <span className='text-red-500'>*</span>
            </h3>

            <div className='space-y-2'>
              {calculationMethods.map((method) => (
                <button
                  key={method.value}
                  type='button'
                  onClick={() => updateField('calculationMethod', method.value as CalculationMethodType)}
                  className={cn(
                    'w-full p-4 rounded-lg border-2 transition-colors text-left',
                    formData.calculationMethod === method.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className='flex items-start gap-3'>
                    <span className='text-2xl'>{method.icon}</span>
                    <div>
                      <div className='font-medium'>{method.label}</div>
                      <div className='text-sm text-muted-foreground'>{method.description}</div>
                    </div>
                  </div>
                </button>
              ))}
              {errors.calculationMethod && (
                <p className='text-sm text-red-500'>{errors.calculationMethod}</p>
              )}
            </div>

            {/* Champs spécifiques selon la méthode */}
            {formData.calculationMethod === 'FIXED_AMOUNT' && (
              <div className='space-y-2'>
                <Label htmlFor='fixedAmount'>
                  Montant fixe (FCFA) <span className='text-red-500'>*</span>
                </Label>
                <div className='relative'>
                  <Input
                    id='fixedAmount'
                    type='number'
                    min={0}
                    step={1000}
                    value={formData.fixedAmount || ''}
                    onChange={(e) => updateField('fixedAmount', parseFloat(e.target.value))}
                    className={cn('pr-16 font-mono', errors.fixedAmount && 'border-red-500')}
                  />
                  <span className='absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground'>
                    FCFA
                  </span>
                </div>
                {errors.fixedAmount && <p className='text-sm text-red-500'>{errors.fixedAmount}</p>}
              </div>
            )}

            {formData.calculationMethod === 'FORMULA' && (
              <div className='space-y-2'>
                <Label htmlFor='formula'>
                  Formule de calcul <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='formula'
                  value={formData.formula || ''}
                  onChange={(e) => updateField('formula', e.target.value)}
                  placeholder='Ex: base_prime * 0.1 + 5000'
                  className={cn('font-mono', errors.formula && 'border-red-500')}
                />
                <p className='text-xs text-muted-foreground'>
                  Utilisez les variables: base_prime, valeur_vehicule, puissance_fiscale
                </p>
                {errors.formula && <p className='text-sm text-red-500'>{errors.formula}</p>}
              </div>
            )}

            {formData.calculationMethod === 'PERCENTAGE' && (
              <Alert>
                <Info className='h-4 w-4' />
                <AlertDescription className='ml-2'>
                  Cette garantie sera calculée en pourcentage de la prime de base RC.
                </AlertDescription>
              </Alert>
            )}

            {formData.calculationMethod === 'FREE' && (
              <Alert>
                <CheckCircle className='h-4 w-4' />
                <AlertDescription className='ml-2'>
                  Cette garantie sera offerte gratuitement (promotion).
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* État */}
          <div className='flex items-center justify-between p-4 border rounded-lg'>
            <div>
              <Label className='font-medium'>État de la garantie</Label>
              <p className='text-sm text-muted-foreground'>
                {formData.isActive ? 'Garantie active et disponible' : 'Garantie désactivée'}
              </p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => updateField('isActive', checked)}
            />
          </div>

          {errors.general && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription className='ml-2'>{errors.general}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              'Enregistrement...'
            ) : (
              <>
                <Save className='h-4 w-4 mr-2' />
                {mode === 'create' ? 'Créer' : 'Mettre à jour'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
