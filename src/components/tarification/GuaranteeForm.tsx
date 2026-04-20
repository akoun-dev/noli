import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, FileText, Sparkles, DollarSign, Percent, Layers, Search, Check, Shield, Loader2 } from 'lucide-react'
import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'

interface GuaranteeFormData {
  name: string
  code: string
  description: string
  category: string
  calculationMethod: 'FREE' | 'FIXED_AMOUNT' | 'VARIABLE_BASED' | 'MATRIX_BASED'
  insurerId: string
  insurerName?: string
  fixedAmount?: number
  rate?: number
  minPrice?: number
  maxPrice?: number
  isMandatory?: boolean
}

interface GuaranteeFormProps {
  insurerId: string
  insurerName?: string
  onSubmit: (data: GuaranteeFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  error?: string | null
}

const selectableCalculationMethods = [
  {
    value: 'FREE',
    label: 'Gratuit',
    description: 'Prime nulle (gratuite) - Aucun frais pour cette garantie',
    icon: Sparkles,
    color: 'green',
  },
  {
    value: 'FIXED_AMOUNT',
    label: 'Montant Fixe',
    description: 'Prime fixe indépendante du véhicule - Ex: 15 000 FCFA',
    icon: DollarSign,
    color: 'blue',
  },
  {
    value: 'VARIABLE_BASED',
    label: 'Basé sur une variable',
    description: 'Pourcentage sur une valeur du véhicule - Ex: 0.42% de la valeur vénale',
    icon: Percent,
    color: 'purple',
  },
  {
    value: 'MATRIX_BASED',
    label: 'Basé sur une matrice',
    description: 'Grille de tarification - Ex: par puissance fiscale ou type de carburant',
    icon: Layers,
    color: 'orange',
  },
]

const categories = [
  { value: 'RC', label: 'Responsabilité Civile' },
  { value: 'DEFENSE_RECOURS', label: 'Défense et Recours' },
  { value: 'DOMMAGES', label: 'Dommages' },
  { value: 'PERSONNE', label: 'Personne' },
  { value: 'AUTRE', label: 'Autre' },
]

export const GuaranteeForm: React.FC<GuaranteeFormProps> = ({
  insurerId,
  insurerName,
  onSubmit,
  onCancel,
  isLoading = false,
  error = null,
}) => {
  const [formData, setFormData] = useState<GuaranteeFormData>({
    name: '',
    code: '',
    description: '',
    category: 'RC',
    calculationMethod: 'FIXED_AMOUNT',
    insurerId: insurerId,
    insurerName: insurerName || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      return
    }

    if (!formData.insurerId) {
      logger.error('Insurer ID is required for guarantee creation')
      return
    }

    await onSubmit(formData)
  }

  const getCategoryLabel = (category: string) => {
    return categories.find(c => c.value === category)?.label || category
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Informations sur l'assureur */}
      <Card className='border border-blue-200 shadow-sm'>
        <CardHeader className='pb-3 bg-blue-50/50'>
          <CardTitle className='text-base flex items-center gap-2'>
            <div className='w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center'>
              <span className='text-blue-600 text-xs font-bold'>ℹ️</span>
            </div>
            Assuranceur
          </CardTitle>
          <CardDescription className='text-sm'>
            Cette garantie sera associée à votre compagnie d'assurance
          </CardDescription>
        </CardHeader>
        <CardContent className='pt-4'>
          <div className='p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-3'>
            <Shield className='h-5 w-5 text-blue-600' />
            <div>
              <p className='font-medium text-sm'>{insurerName || 'Votre compagnie'}</p>
              <p className='text-xs text-muted-foreground'>ID: {insurerId}</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder='Ex: Responsabilité Civile'
              required
            />
            <p className='text-xs text-muted-foreground mt-1'>
              Le code sera généré automatiquement à partir du nom
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='guarantee-description'>Description</Label>
            <Textarea
              id='guarantee-description'
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder='Description détaillée de la garantie'
              rows={3}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='guarantee-category' className='flex items-center gap-1'>
              Catégorie <span className='text-red-500'>*</span>
            </Label>
            <select
              id='guarantee-category'
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              required
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
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
              {selectableCalculationMethods.map((method) => {
                const Icon = method.icon
                const colorClass = method.color === 'green' ? 'green' : method.color as any
                return (
                  <button
                    key={method.value}
                    type='button'
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        calculationMethod: method.value as any,
                      }))
                    }
                    className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                      formData.calculationMethod === method.value
                        ? `border-${colorClass}-500 bg-${colorClass}-50 shadow-md`
                        : `border-gray-200 bg-white hover:border-${colorClass}-300 hover:bg-${colorClass}-50/30`
                    }`}
                  >
                    <div className='flex items-start gap-3'>
                      <div
                        className={`p-2 rounded-lg ${
                          formData.calculationMethod === method.value
                            ? `bg-${colorClass}-500 text-white`
                            : `bg-${colorClass}-100 text-${colorClass}-600`
                        }`}
                      >
                        <Icon className='h-5 w-5' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='font-semibold text-sm mb-1'>{method.label}</div>
                        <p className='text-xs text-muted-foreground leading-relaxed'>
                          {method.description}
                        </p>
                      </div>
                      {formData.calculationMethod === method.value && (
                        <CheckCircle className={`h-5 w-5 text-${colorClass}-500 flex-shrink-0`} />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Description détaillée de la méthode sélectionnée */}
            {formData.calculationMethod && (
              <div className='mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md'>
                <div className='flex items-start gap-2'>
                  <FileText className='h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0' />
                  <div className='text-sm text-blue-800'>
                    <span className='font-medium'>
                      {selectableCalculationMethods.find((m) => m.value === formData.calculationMethod)?.label}
                    </span>{' '}
                    {selectableCalculationMethods.find((m) => m.value === formData.calculationMethod)?.description}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Champs dynamiques selon la méthode de calcul */}
          {(() => {
            const method = formData.calculationMethod
            const isFixed = method === 'FIXED_AMOUNT'
            const isVariable = method === 'VARIABLE_BASED'
            const isMatrix = method === 'MATRIX_BASED'

            return (
              <div className='space-y-4 pt-2'>
                {isFixed && (
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label className='flex items-center gap-1'>
                        Montant fixe (€) <span className='text-red-500'>*</span>
                      </Label>
                      <Input
                        type='number'
                        step='0.01'
                        value={formData.fixedAmount ?? ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            fixedAmount: parseFloat(e.target.value) || undefined,
                          }))
                        }
                        placeholder='Ex: 150.00'
                        required
                      />
                    </div>
                  </div>
                )}

                {isVariable && (
                  <div className='space-y-4'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <Label className='flex items-center gap-1'>
                          Taux (%) <span className='text-red-500'>*</span>
                        </Label>
                        <Input
                          type='number'
                          step='0.01'
                          value={formData.rate || ''}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              rate: parseFloat(e.target.value) || undefined,
                            }))
                          }
                          placeholder='Ex: 1.5'
                          required
                        />
                      </div>
                    </div>
                    <div className='bg-purple-50 border border-purple-200 rounded-md p-3'>
                      <div className='flex items-center gap-2 text-sm text-purple-700'>
                        <AlertCircle className='h-4 w-4' />
                        Le taux sera appliqué sur la valeur du véhicule
                      </div>
                    </div>
                  </div>
                )}

                {isMatrix && (
                  <div className='space-y-4'>
                    <Alert>
                      <AlertCircle className='h-4 w-4' />
                      <AlertDescription>
                        La grille de tarification doit être configurée séparément dans l'onglet "Gestion des grilles"
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* Section Options */}
      <Card className='border border-gray-200 shadow-sm'>
        <CardHeader className='pb-3 bg-gray-50/50'>
          <CardTitle className='text-base flex items-center gap-2'>
            <div className='w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center'>
              <span className='text-blue-600 text-xs font-bold'>3</span>
            </div>
            Options
          </CardTitle>
          <CardDescription className='text-sm'>
            Paramètres additionnels pour la garantie
          </CardDescription>
        </CardHeader>
        <CardContent className='pt-4 space-y-4'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                id='is-mandatory'
                checked={formData.isMandatory || false}
                onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
                className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
              />
              <Label htmlFor='is-mandatory' className='text-sm font-medium cursor-pointer'>
                Garantie obligatoire
              </Label>
            </div>
            <p className='text-xs text-muted-foreground'>
              Si cochée, cette garantie sera incluse automatiquement dans tous les devis
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className='flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t'>
        {onCancel && (
          <Button
            type='button'
            variant='outline'
            onClick={onCancel}
            disabled={isLoading}
          >
            Annuler
          </Button>
        )}
        <Button
          type='submit'
          disabled={isLoading || !formData.name.trim()}
          className='min-w-[120px]'
        >
          {isLoading ? (
            <>
              <Loader2 className='h-4 w-4 mr-2 animate-spin' />
              Création...
            </>
          ) : (
            'Créer la garantie'
          )}
        </Button>
      </div>
    </form>
  )
}
