import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  Sparkles,
  Calculator,
  Zap,
  Fuel,
  Gauge,
  Info,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

// ============================================
// TYPES
// ============================================

interface TarifRC {
  id: string
  fuel_type: 'ESSENCE' | 'DIESEL' | 'ELECTRIQUE' | 'HYBRIDE'
  fiscal_power_min: number
  fiscal_power_max: number
  prime: number
  is_active: boolean
}

interface TarifRCFormData {
  fuel_type: 'ESSENCE' | 'DIESEL' | 'ELECTRIQUE' | 'HYBRIDE'
  fiscal_power_min: number
  fiscal_power_max: number
  prime: number
}

interface TarifRCFormProps {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  initialData?: TarifRC
  onSuccess?: () => void
}

// ============================================
// DONNÉES PAR DÉFAUT
// ============================================

const defaultTarifs: Omit<TarifRC, 'id'>[] = [
  // Essence
  { fuel_type: 'ESSENCE', fiscal_power_min: 1, fiscal_power_max: 2, prime: 68675, is_active: true },
  { fuel_type: 'ESSENCE', fiscal_power_min: 3, fiscal_power_max: 4, prime: 75000, is_active: true },
  { fuel_type: 'ESSENCE', fiscal_power_min: 5, fiscal_power_max: 7, prime: 85000, is_active: true },
  { fuel_type: 'ESSENCE', fiscal_power_min: 8, fiscal_power_max: 10, prime: 95000, is_active: true },
  { fuel_type: 'ESSENCE', fiscal_power_min: 11, fiscal_power_max: 99, prime: 110000, is_active: true },
  // Diesel
  { fuel_type: 'DIESEL', fiscal_power_min: 1, fiscal_power_max: 2, prime: 68675, is_active: true },
  { fuel_type: 'DIESEL', fiscal_power_min: 3, fiscal_power_max: 4, prime: 75000, is_active: true },
  { fuel_type: 'DIESEL', fiscal_power_min: 5, fiscal_power_max: 7, prime: 85000, is_active: true },
  { fuel_type: 'DIESEL', fiscal_power_min: 8, fiscal_power_max: 10, prime: 95000, is_active: true },
  { fuel_type: 'DIESEL', fiscal_power_min: 11, fiscal_power_max: 99, prime: 110000, is_active: true },
]

// ============================================
// COMPOSANTS
// ============================================

const FuelTypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const config = {
    ESSENCE: { label: 'Essence', color: 'bg-red-100 text-red-700', icon: '⛽' },
    DIESEL: { label: 'Diesel', color: 'bg-blue-100 text-blue-700', icon: '🛢️' },
    ELECTRIQUE: { label: 'Électrique', color: 'bg-green-100 text-green-700', icon: '⚡' },
    HYBRIDE: { label: 'Hybride', color: 'bg-purple-100 text-purple-700', icon: '🔋' },
  }[type] || { label: type, color: 'bg-gray-100 text-gray-700', icon: '🚗' }

  return (
    <Badge className={config.color}>
      <span className='mr-1'>{config.icon}</span>
      {config.label}
    </Badge>
  )
}

interface TarifRangeCardProps {
  tarif: TarifRCFormData
  index: number
  onUpdate: (index: number, field: keyof TarifRCFormData, value: any) => void
  onRemove: (index: number) => void
  canRemove?: boolean
  error?: Record<string, string>
}

const TarifRangeCard: React.FC<TarifRangeCardProps> = ({
  tarif,
  index,
  onUpdate,
  onRemove,
  canRemove = true,
  error,
}) => {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className='border rounded-lg overflow-hidden'>
        <CollapsibleTrigger className='w-full px-3 sm:px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors'>
          <div className='flex items-center gap-2 sm:gap-3 min-w-0 flex-1'>
            <div className='flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex-shrink-0'>
              <Gauge className='h-4 w-4 sm:h-5 sm:w-5 text-primary' />
            </div>
            <div className='text-left min-w-0 flex-1'>
              <div className='flex items-center gap-1 sm:gap-2 flex-wrap'>
                <FuelTypeBadge type={tarif.fuel_type} />
                <span className='font-medium text-xs sm:text-sm truncate'>
                  {tarif.fiscal_power_min === tarif.fiscal_power_max
                    ? `CV ${tarif.fiscal_power_min}`
                    : `CV ${tarif.fiscal_power_min} - ${tarif.fiscal_power_max}`
                  }
                </span>
              </div>
            </div>
          </div>
          <div className='flex items-center gap-1 sm:gap-2 flex-shrink-0'>
            <span className='font-mono font-bold text-xs sm:text-sm hidden sm:block'>
              {tarif.prime.toLocaleString()} FCFA
            </span>
            {canRemove && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(index)
                }}
                className='text-red-500 hover:text-red-700 p-1 h-8 w-8'
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            )}
            {isExpanded ? (
              <ChevronDown className='h-4 w-4 text-muted-foreground flex-shrink-0' />
            ) : (
              <ChevronRight className='h-4 w-4 text-muted-foreground flex-shrink-0' />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className='px-3 sm:px-4 pb-4 space-y-3 sm:space-y-4'>
          {/* Type de carburant */}
          <div>
            <Label className='text-sm'>Type de carburant</Label>
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2'>
              {[
                { value: 'ESSENCE', label: 'Essence', emoji: '⛽' },
                { value: 'DIESEL', label: 'Diesel', emoji: '🛢️' },
                { value: 'ELECTRIQUE', label: 'Électrique', emoji: '⚡' },
                { value: 'HYBRIDE', label: 'Hybride', emoji: '🔋' },
              ].map((fuel) => (
                <button
                  key={fuel.value}
                  type='button'
                  onClick={() => onUpdate(index, 'fuel_type', fuel.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 sm:p-3 rounded-lg border-2 transition-colors',
                    tarif.fuel_type === fuel.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <span className='text-xl sm:text-2xl'>{fuel.emoji}</span>
                  <span className='text-[10px] sm:text-xs font-medium'>{fuel.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Plage de puissance fiscale */}
          <div className='grid grid-cols-2 gap-3 sm:gap-4'>
            <div>
              <Label htmlFor={`min-${index}`} className='text-sm'>CV minimum</Label>
              <Input
                id={`min-${index}`}
                type='number'
                min={1}
                max={99}
                value={tarif.fiscal_power_min}
                onChange={(e) => onUpdate(index, 'fiscal_power_min', parseInt(e.target.value))}
                className={cn('mt-1 text-sm', error?.fiscal_power_min && 'border-red-500')}
              />
            </div>
            <div>
              <Label htmlFor={`max-${index}`} className='text-sm'>CV maximum</Label>
              <Input
                id={`max-${index}`}
                type='number'
                min={1}
                max={99}
                value={tarif.fiscal_power_max}
                onChange={(e) => onUpdate(index, 'fiscal_power_max', parseInt(e.target.value))}
                className={cn('mt-1 text-sm', error?.fiscal_power_max && 'border-red-500')}
              />
            </div>
          </div>

          {/* Prime */}
          <div>
            <Label htmlFor={`prime-${index}`} className='text-sm'>Prime (FCFA)</Label>
            <div className='relative mt-1'>
              <Input
                id={`prime-${index}`}
                type='number'
                min={0}
                step={1000}
                value={tarif.prime}
                onChange={(e) => onUpdate(index, 'prime', parseFloat(e.target.value))}
                className={cn('pr-16 font-mono text-sm', error?.prime && 'border-red-500')}
              />
              <span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-muted-foreground'>
                FCFA
              </span>
            </div>
          </div>

          {/* Indicateur visuel de la prime */}
          <div className='flex items-center gap-2'>
            <span className='text-xs sm:text-sm text-muted-foreground hidden sm:inline'>Indicateur de prime:</span>
            <div className='flex-1 h-2 bg-gray-200 rounded-full overflow-hidden'>
              <div
                className={cn(
                  'h-full transition-all duration-500',
                  tarif.prime < 70000 ? 'w-1/3 bg-green-500' :
                  tarif.prime < 85000 ? 'w-1/2 bg-yellow-500' :
                  tarif.prime < 100000 ? 'w-2/3 bg-orange-500' :
                  'w-full bg-red-500'
                )}
              />
            </div>
            <span className='text-[10px] sm:text-xs text-muted-foreground'>
              {tarif.prime < 70000 ? 'Bas' :
               tarif.prime < 85000 ? 'Moyen' :
               tarif.prime < 100000 ? 'Élevé' : 'Très élevé'}
            </span>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export const TarifRCForm: React.FC<TarifRCFormProps> = ({
  open,
  onClose,
  mode,
  initialData,
  onSuccess,
}) => {
  const { toast } = useToast()
  const [tarifs, setTarifs] = useState<TarifRCFormData[]>(
    initialData ? [{ ...initialData, fuel_type: initialData.fuel_type as any }] : []
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Réinitialiser lors de l'ouverture
  useEffect(() => {
    if (open && mode === 'create') {
      setTarifs([])
      setErrors({})
    }
  }, [open, mode])

  // Ajouter un tarif
  const addTarif = () => {
    const newTarif: TarifRCFormData = {
      fuel_type: 'ESSENCE',
      fiscal_power_min: 1,
      fiscal_power_max: 2,
      prime: 68675,
    }
    setTarifs([...tarifs, newTarif])
  }

  // Mettre à jour un tarif
  const updateTarif = (index: number, field: keyof TarifRCFormData, value: any) => {
    const updated = [...tarifs]
    updated[index] = { ...updated[index], [field]: value }
    setTarifs(updated)
  }

  // Supprimer un tarif
  const removeTarif = (index: number) => {
    setTarifs(tarifs.filter((_, i) => i !== index))
  }

  // Initialiser avec les tarifs par défaut
  const initializeDefaults = () => {
    setTarifs([...defaultTarifs])
  }

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (tarifs.length === 0) {
      newErrors.general = 'Ajoutez au moins un tarif'
    }

    tarifs.forEach((tarif, index) => {
      if (!tarif.fuel_type) {
        newErrors[`tarif_${index}_fuel`] = 'Le type de carburant est requis'
      }
      if (tarif.fiscal_power_min < 1 || tarif.fiscal_power_min > 99) {
        newErrors[`tarif_${index}_min`] = 'CV min invalide (1-99)'
      }
      if (tarif.fiscal_power_max < 1 || tarif.fiscal_power_max > 99) {
        newErrors[`tarif_${index}_max`] = 'CV max invalide (1-99)'
      }
      if (tarif.fiscal_power_min > tarif.fiscal_power_max) {
        newErrors[`tarif_${index}_range`] = 'Min ne peut pas être supérieur à max'
      }
      if (!tarif.prime || tarif.prime <= 0) {
        newErrors[`tarif_${index}_prime`] = 'La prime doit être positive'
      }
    })

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
      // Supprimer d'abord tous les tarifs existants
      const { error: deleteError } = await supabase
        .from('tarification_rc')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Condition toujours vraie pour tout supprimer

      if (deleteError) {
        logger.error('Error deleting old tariffs:', deleteError)
        throw deleteError
      }

      // Insérer les nouveaux tarifs
      const tariffsToInsert = tarifs.map((tarif) => ({
        fuel_type: tarif.fuel_type,
        fiscal_power_min: tarif.fiscal_power_min,
        fiscal_power_max: tarif.fiscal_power_max,
        prime: tarif.prime,
        is_active: true,
      }))

      const { error: insertError } = await supabase
        .from('tarification_rc')
        .insert(tariffsToInsert)

      if (insertError) {
        logger.error('Error inserting tariffs:', insertError)
        throw insertError
      }

      logger.info('Tarifs RC saved successfully:', tarifs)

      toast({
        title: 'Succès',
        description: 'Tarifs enregistrés avec succès',
        variant: 'default',
      })
      onSuccess?.()
      onClose()
    } catch (error) {
      logger.error('Error saving tariffs:', error)
      toast({
        title: 'Erreur',
        description: "Erreur lors de l'enregistrement des tarifs",
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto'>
        <DialogHeader className='space-y-2 sm:space-y-3'>
          <DialogTitle className='flex items-center gap-2 text-lg sm:text-xl'>
            <Calculator className='h-5 w-5' />
            <span className='hidden sm:inline'>
              {mode === 'create' ? 'Configurer les tarifs RC' : 'Modifier les tarifs RC'}
            </span>
            <span className='sm:hidden'>
              {mode === 'create' ? 'Tarifs RC' : 'Modifier tarifs'}
            </span>
          </DialogTitle>
          <DialogDescription className='text-sm'>
            Définissez les tarifs de responsabilité civile selon le type de carburant et la puissance fiscale
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 sm:space-y-6 py-4'>
          {/* Actions rapides */}
          <div className='flex flex-col sm:flex-row gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={initializeDefaults}
              className='w-full sm:w-auto text-xs sm:text-sm'
            >
              <Sparkles className='h-4 w-4 mr-2' />
              <span className='hidden sm:inline'>Charger les tarifs par défaut</span>
              <span className='sm:hidden'>Tarifs par défaut</span>
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={addTarif}
              className='w-full sm:w-auto text-xs sm:text-sm'
            >
              <Plus className='h-4 w-4 mr-2' />
              Ajouter un tarif
            </Button>
          </div>

          {/* Liste des tarifs */}
          <div className='space-y-3 sm:space-y-4'>
            {tarifs.length === 0 ? (
              <div className='text-center py-8 sm:py-12 px-4 border-2 border-dashed rounded-lg'>
                <Calculator className='h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4' />
                <p className='text-base sm:text-lg font-medium mb-2'>Aucun tarif configuré</p>
                <p className='text-xs sm:text-sm text-muted-foreground mb-4'>
                  Ajoutez des tarifs ou initialisez avec les valeurs par défaut
                </p>
                <Button onClick={initializeDefaults} variant='outline' size='sm' className='w-full sm:w-auto'>
                  <Sparkles className='h-4 w-4 mr-2' />
                  Initialiser
                </Button>
              </div>
            ) : (
              <div className='space-y-3'>
                {tarifs.map((tarif, index) => (
                  <TarifRangeCard
                    key={index}
                    tarif={tarif}
                    index={index}
                    onUpdate={updateTarif}
                    onRemove={removeTarif}
                    canRemove={tarifs.length > 1}
                    error={Object.fromEntries(
                      Object.entries(errors).filter(([key]) => key.startsWith(`tarif_${index}_`))
                        .map(([key, value]) => [key.replace(`tarif_${index}_`, ''), value])
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Résumé */}
          {tarifs.length > 0 && (
            <Alert>
              <CheckCircle className='h-4 w-4' />
              <AlertDescription className='ml-2'>
                <div className='flex justify-between items-center'>
                  <span className='font-medium'>
                    {tarifs.length} tarif(s) configuré(s)
                  </span>
                  <div className='text-right'>
                    <span className='text-muted-foreground mr-2'>Primes:</span>
                    <span className='font-bold font-mono'>
                      {tarifs.reduce((sum, t) => sum + t.prime, 0).toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {errors.general && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription className='ml-2'>{errors.general}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <DialogFooter>
            <Button variant='outline' onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || tarifs.length === 0}>
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer les tarifs'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
