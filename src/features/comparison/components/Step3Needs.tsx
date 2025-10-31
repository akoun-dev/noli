import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { insuranceNeedsSchema, InsuranceNeedsFormData } from '@/lib/zod-schemas'
import { useCompare } from '@/features/comparison/services/ComparisonContext'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import {
  ArrowRight,
  ArrowLeft,
  Shield,
  CircleDollarSign,
  Star,
  Calculator,
  Info,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { CoverageSelector } from '@/components/coverage/CoverageSelector'
import {
  coverageTarificationService,
  type VehicleData,
} from '@/services/coverageTarificationService'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthContext'

interface Step3NeedsProps {
  onBack: () => void
}

const Step3Needs: React.FC<Step3NeedsProps> = ({ onBack }: Step3NeedsProps) => {
  const { formData, updateInsuranceNeeds } = useCompare()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Coverage-based tarification state
  const [useAdvancedTarification, setUseAdvancedTarification] = useState(true)
  const [selectedCoverages, setSelectedCoverages] = useState<Record<string, boolean>>({})
  const [totalPremium, setTotalPremium] = useState(0)
  const [premiumBreakdown, setPremiumBreakdown] = useState<Record<string, number>>({})
  const [tempQuoteId, setTempQuoteId] = useState<string | null>(null)
  const [coverageLoading, setCoverageLoading] = useState(false)
  const [coverageErrors, setCoverageErrors] = useState<string[]>([])

  // Prepare vehicle data for coverage calculation
  const vehicleData: VehicleData = {
    category: '401', // Using default value since category is not in VehicleInfo
    fiscal_power: parseInt(formData.vehicleInfo.fiscalPower || '6'),
    fuel_type: formData.vehicleInfo.fuel || 'essence',
    sum_insured: parseInt(formData.vehicleInfo.currentValue || '5000000'),
    new_value: parseInt(formData.vehicleInfo.newValue || '8000000'),
  }

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<InsuranceNeedsFormData>({
    resolver: zodResolver(insuranceNeedsSchema),
    defaultValues: {
      ...formData.insuranceNeeds,
      options: formData.insuranceNeeds.options || [],
    },
  })

  const coverageType = watch('coverageType')
  const selectedOptions = watch('options') || []

  // Create temporary quote for coverage calculation
  useEffect(() => {
    if (user && useAdvancedTarification) {
      createTempQuote()
    }
  }, [user, useAdvancedTarification])

  const createTempQuote = async () => {
    if (!user) return

    try {
      setCoverageLoading(true)
      setCoverageErrors([])

      // Create a temporary quote for coverage calculation
      const quoteData = {
        user_id: user.id,
        category_id: 'AUTO',
        status: 'DRAFT' as const,
        personal_data: {
          firstName: formData.personalInfo.firstName,
          lastName: formData.personalInfo.lastName,
          email: formData.personalInfo.email,
          phone: formData.personalInfo.phone,
        },
        vehicle_data: vehicleData,
        coverage_requirements: {
          coverage_type: formData.insuranceNeeds.coverageType,
          effective_date: formData.insuranceNeeds.effectiveDate,
          contract_duration: formData.insuranceNeeds.contractDuration,
          options: formData.insuranceNeeds.options || [],
        },
      }

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData),
      })

      if (!response.ok) {
        throw new Error('Failed to create temporary quote')
      }

      const quote = await response.json()
      setTempQuoteId(quote.id)
    } catch (error) {
      console.error('Error creating temporary quote:', error)
      setCoverageErrors(['Erreur lors de la création du devis temporaire'])
    } finally {
      setCoverageLoading(false)
    }
  }

  const handleCoverageChange = async (
    coverageId: string,
    isIncluded: boolean,
    formulaName?: string
  ) => {
    setSelectedCoverages((prev) => ({ ...prev, [coverageId]: isIncluded }))

    if (tempQuoteId) {
      try {
        await coverageTarificationService.addCoverageToQuote(
          tempQuoteId,
          coverageId,
          {
            ...vehicleData,
            ...(formulaName && { formula_name: formulaName }),
          },
          isIncluded
        )

        // Recalculate total premium
        const newTotal = await coverageTarificationService.calculateQuoteTotalPremium(tempQuoteId)
        setTotalPremium(newTotal)

        // Update breakdown
        const premiums = await coverageTarificationService.getQuoteCoveragePremiums(tempQuoteId)
        const breakdown: Record<string, number> = {}
        premiums
          .filter((p) => p.is_included)
          .forEach((p) => {
            breakdown[p.coverage_id] = p.premium_amount
          })
        setPremiumBreakdown(breakdown)
      } catch (error) {
        console.error('Error updating coverage:', error)
        setCoverageErrors(['Erreur lors de la mise à jour des garanties'])
      }
    }
  }

  const onSubmit = (data: InsuranceNeedsFormData) => {
    // Merge advanced coverage data with traditional form data
    const enhancedData = {
      ...data,
      // Add coverage-specific data
      coverageData: useAdvancedTarification
        ? {
            selectedCoverages,
            totalPremium,
            premiumBreakdown,
            vehicleData,
          }
        : undefined,
    }

    updateInsuranceNeeds(enhancedData)
    navigate('/offres')
  }

  const coverageOptions = [
    {
      value: 'tiers',
      title: 'Responsabilité Civile (Tiers)',
      description: 'Couverture minimale obligatoire. Garantit les dommages causés aux tiers.',
      icon: Shield,
      badge: 'Économique',
    },
    {
      value: 'vol_incendie',
      title: 'Vol & Incendie',
      description: "Tiers + protection contre le vol et l'incendie.",
      icon: CircleDollarSign,
      badge: 'Populaire',
    },
    {
      value: 'tous_risques',
      title: 'Tous Risques',
      description: 'Protection maximale incluant les dommages de votre véhicule.',
      icon: Star,
      badge: 'Recommandé',
    },
  ]

  const insuranceOptions = [
    { id: 'conducteur_add', label: 'Conducteur additionnel' },
    { id: 'assistance_etendue', label: 'Assistance étendue' },
    { id: 'juridique_plus', label: 'Protection juridique renforcée' },
    { id: 'bris_glaces', label: 'Bris de glaces' },
    { id: 'catastrophes', label: 'Catastrophes naturelles' },
  ]

  const toggleOption = (optionId: string) => {
    const currentOptions = selectedOptions || []
    const newOptions = currentOptions.includes(optionId)
      ? currentOptions.filter((id) => id !== optionId)
      : [...currentOptions, optionId]
    setValue('options', newOptions)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-8 max-w-5xl mx-auto'>
      <div className='text-center space-y-2'>
        <h2 className='text-2xl md:text-3xl font-bold'>Votre assurance</h2>
        <p className='text-muted-foreground'>
          Choisissez votre formule d'assurance et les options qui vous conviennent
        </p>
      </div>

      {/* Tarification Mode Toggle */}
      <div className='flex justify-center'>
        <Card className='p-4 max-w-md w-full'>
          <div className='flex items-center justify-between space-x-4'>
            <div className='flex items-center space-x-2'>
              <Calculator className='w-5 h-5 text-primary' />
              <span className='font-medium'>Tarification avancée</span>
            </div>
            <input
              type='checkbox'
              checked={useAdvancedTarification}
              onChange={(e) => setUseAdvancedTarification(e.target.checked)}
              className='sr-only'
            />
            <div
              onClick={() => setUseAdvancedTarification(!useAdvancedTarification)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                useAdvancedTarification ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  useAdvancedTarification ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </div>
          </div>
          {useAdvancedTarification && (
            <div className='mt-3 text-xs text-muted-foreground'>
              <Info className='w-3 h-3 inline mr-1' />
              Calcul précis basé sur les 17 garanties du marché ivoirien
            </div>
          )}
        </Card>
      </div>
      {/* Coverage Type */}
      <div className='space-y-4'>
        <Label className='text-lg font-semibold'>Type de couverture *</Label>
        <RadioGroup
          value={coverageType}
          onValueChange={(value) => setValue('coverageType', value as any)}
          className='grid md:grid-cols-3 gap-4 items-stretch'
        >
          {coverageOptions.map((option) => (
            <div key={option.value} className='relative h-full'>
              <RadioGroupItem value={option.value} id={option.value} className='peer sr-only' />
              <Label
                htmlFor={option.value}
                className={cn(
                  'flex flex-col p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg h-full md:min-h-[200px] min-h-[180px]',
                  'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5',
                  errors.coverageType && 'border-destructive'
                )}
              >
                <div className='flex items-center justify-between mb-3'>
                  <div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center'>
                    <option.icon className='w-6 h-6 text-primary' />
                  </div>
                  <span className='text-xs font-medium px-2 py-1 bg-accent/20 text-accent rounded-full'>
                    {option.badge}
                  </span>
                </div>
                <h4 className='font-semibold text-foreground mb-2'>{option.title}</h4>
                <p className='text-sm text-muted-foreground'>{option.description}</p>
              </Label>
            </div>
          ))}
        </RadioGroup>
        {errors.coverageType && (
          <p className='text-sm text-destructive'>{errors.coverageType.message}</p>
        )}
      </div>

      {/* Effective Date & Duration */}
      <div className='grid md:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='effectiveDate'>Date d'effet *</Label>
          <input
            id='effectiveDate'
            type='date'
            value={watch('effectiveDate') || ''}
            onChange={(e) => setValue('effectiveDate', e.target.value)}
            className={cn(
              'w-full border rounded-md h-10 px-3 bg-background',
              errors.effectiveDate && 'border-destructive'
            )}
          />
          {errors.effectiveDate && (
            <p className='text-sm text-destructive'>{errors.effectiveDate.message}</p>
          )}
        </div>
        <div className='space-y-2'>
          <Label htmlFor='contractDuration'>Durée du contrat *</Label>
          <Select
            value={watch('contractDuration')}
            onValueChange={(v) => setValue('contractDuration', v)}
          >
            <SelectTrigger className={cn(errors.contractDuration && 'border-destructive')}>
              <SelectValue placeholder='Sélectionner' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='1_an'>1 an</SelectItem>
              <SelectItem value='6_mois'>6 mois</SelectItem>
            </SelectContent>
          </Select>
          {errors.contractDuration && (
            <p className='text-sm text-destructive'>{errors.contractDuration.message}</p>
          )}
        </div>
      </div>

      {/* Additional Options */}
      <div className='space-y-4'>
        <Label className='text-lg font-semibold'>Options complémentaires (facultatif)</Label>
        <Card className='p-6'>
          <div className='grid md:grid-cols-2 gap-4'>
            {insuranceOptions.map((option) => (
              <div
                key={option.id}
                className='flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors'
              >
                <Checkbox
                  id={option.id}
                  checked={selectedOptions?.includes(option.id)}
                  onCheckedChange={() => toggleOption(option.id)}
                />
                <Label htmlFor={option.id} className='flex-1 cursor-pointer text-sm font-medium'>
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Advanced Coverage Selector */}
      {useAdvancedTarification && (
        <div className='space-y-6'>
          {coverageErrors.length > 0 && (
            <Alert variant='destructive'>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>{coverageErrors.join(', ')}</AlertDescription>
            </Alert>
          )}

          {coverageLoading ? (
            <Card className='p-8'>
              <div className='text-center'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
                <p className='text-sm text-muted-foreground'>Chargement des garanties...</p>
              </div>
            </Card>
          ) : (
            tempQuoteId && (
              <CoverageSelector
                quoteId={tempQuoteId}
                vehicleData={vehicleData}
                selectedCoverages={selectedCoverages}
                onCoverageChange={handleCoverageChange}
                onPremiumsChange={(total, breakdown) => {
                  setTotalPremium(total)
                  setPremiumBreakdown(breakdown)
                }}
              />
            )
          )}

          {/* Premium Summary */}
          {totalPremium > 0 && (
            <Card className='p-6 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='font-semibold text-lg'>Prime estimée</h3>
                  <p className='text-sm text-muted-foreground'>
                    Basée sur{' '}
                    {Object.keys(selectedCoverages).filter((k) => selectedCoverages[k]).length}{' '}
                    garantie(s) sélectionnée(s)
                  </p>
                </div>
                <div className='text-right'>
                  <div className='text-3xl font-bold text-primary'>
                    {totalPremium.toLocaleString('fr-FR')} FCFA
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    /an ({Math.round(totalPremium / 12).toLocaleString('fr-FR')} FCFA/mois)
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className='flex gap-4'>
        <Button type='button' variant='outline' size='lg' onClick={onBack} className='flex-1'>
          <ArrowLeft className='mr-2 w-5 h-5' />
          Précédent
        </Button>
        <Button
          type='submit'
          size='lg'
          className='flex-1 bg-accent hover:bg-accent/90 text-accent-foreground group'
        >
          {useAdvancedTarification && totalPremium > 0
            ? `Voir les offres (${totalPremium.toLocaleString('fr-FR')} FCFA/an)`
            : 'Voir les offres'}
          <ArrowRight className='ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform' />
        </Button>
      </div>
    </form>
  )
}

export default Step3Needs
