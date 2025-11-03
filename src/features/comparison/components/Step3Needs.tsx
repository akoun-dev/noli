import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { insuranceNeedsSchema, InsuranceNeedsFormData } from '@/lib/zod-schemas'
import { useCompare } from '@/features/comparison/services/ComparisonContext'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
// Removed coverage type radio group
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { ArrowRight, ArrowLeft, AlertTriangle, Shield, Car } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { CoverageSelector } from '@/components/coverage/CoverageSelector'
import ProgressiveCoverageSelector from '@/components/coverage/ProgressiveCoverageSelector'
import DynamicPricingSummary from '@/components/coverage/DynamicPricingSummary'
import {
  coverageTarificationService,
  type VehicleData,
} from '@/services/coverageTarificationService'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useIsMobile } from '@/hooks/use-mobile'

interface Step3NeedsProps {
  onBack: () => void
}

const Step3Needs: React.FC<Step3NeedsProps> = ({ onBack }: Step3NeedsProps) => {
  const { formData, updateInsuranceNeeds } = useCompare()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isMobile = useIsMobile()

  // Coverage-based tarification state (always enabled)
  const [selectedCoverages, setSelectedCoverages] = useState<Record<string, boolean>>({})
  const [totalPremium, setTotalPremium] = useState(0)
  const [premiumBreakdown, setPremiumBreakdown] = useState<Record<string, number>>({})
  const [tempQuoteId, setTempQuoteId] = useState<string | null>(null)
  const [coverageLoading, setCoverageLoading] = useState(false)
  const [coverageErrors, setCoverageErrors] = useState<string[]>([])
  const [availableCoverages, setAvailableCoverages] = useState<any[]>([])

  // Prepare vehicle data for coverage calculation
  const vehicleData: VehicleData = {
    category: '401', // Using default value since category is not in VehicleInfo
    fiscal_power: parseInt(formData.vehicleInfo.fiscalPower || '6'),
    fuel_type: formData.vehicleInfo.fuel || 'essence',
    sum_insured: parseInt(formData.vehicleInfo.currentValue || '5000000'),
    new_value: parseInt(formData.vehicleInfo.newValue || '8000000'),
  }

  const { handleSubmit, formState: { errors }, setValue, watch } = useForm<InsuranceNeedsFormData>({
    resolver: zodResolver(insuranceNeedsSchema),
    defaultValues: {
      coverageType: (formData.insuranceNeeds.coverageType as any) || 'tiers',
      effectiveDate: formData.insuranceNeeds.effectiveDate as any,
      contractDuration: formData.insuranceNeeds.contractDuration as any,
      options: formData.insuranceNeeds.options || [],
    },
  })
  const selectedOptions = watch('options') || []

  // Create temporary quote for coverage calculation
  useEffect(() => {
    if (user) {
      createTempQuote()
    }
  }, [user])

  const createTempQuote = async () => {
    if (!user) return

    try {
      setCoverageLoading(true)
      setCoverageErrors([])

      // Resolve Auto category id
      let categoryId: string | null = null
      try {
        const { data: cat } = await supabase
          .from('insurance_categories')
          .select('id')
          .ilike('name', 'auto')
          .limit(1)
          .single() as any
        categoryId = cat?.id || null
      } catch (_) {
        categoryId = null
      }

      // Build personal and vehicle payload compatible with DB functions
      const personalData = {
        full_name: `${formData.personalInfo.firstName || ''} ${formData.personalInfo.lastName || ''}`.trim(),
        first_name: formData.personalInfo.firstName || '',
        last_name: formData.personalInfo.lastName || '',
        email: formData.personalInfo.email || '',
        phone: formData.personalInfo.phone || '',
      }
      const vehiclePayload = {
        category: vehicleData.category,
        fiscal_power: vehicleData.fiscal_power,
        fuel_type: vehicleData.fuel_type,
        // Ensure value field is present for RPCs relying on it
        value: vehicleData.sum_insured || vehicleData.new_value || 0,
        sum_insured: vehicleData.sum_insured,
        new_value: vehicleData.new_value,
      }

      const coverageReq = {
        coverage_type: formData.insuranceNeeds.coverageType,
        effective_date: formData.insuranceNeeds.effectiveDate,
        contract_duration: formData.insuranceNeeds.contractDuration,
        options: formData.insuranceNeeds.options || [],
      }

      const { data, error } = await supabase
        .from('quotes')
        .insert({
          user_id: user.id,
          category_id: categoryId || 'AUTO',
          status: 'DRAFT' as any,
          personal_data: personalData as any,
          vehicle_data: vehiclePayload as any,
          coverage_requirements: coverageReq as any,
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        } as any)
        .select('id')
        .single() as any

      if (error || !data?.id) throw error || new Error('Quote creation failed')

      setTempQuoteId(data.id)
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
    // Update local state immediately for UI responsiveness
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
        // Revert the state change on error
        setSelectedCoverages((prev) => ({ ...prev, [coverageId]: !isIncluded }))
      }
    }
  }

  const onSubmit = async (data: InsuranceNeedsFormData) => {
    // Merge coverage selections with form
    const enhancedData = {
      ...data,
      coverageData: {
        selectedCoverages,
        totalPremium,
        premiumBreakdown,
        vehicleData,
      },
    }

    updateInsuranceNeeds(enhancedData)

    // Persist estimated price and finalize quote status if a temporary quote exists
    if (tempQuoteId) {
      try {
        await coverageTarificationService.updateQuoteCoveragePremiums(tempQuoteId)
        const total = await coverageTarificationService.calculateQuoteTotalPremium(tempQuoteId)
        const monthly = Math.round((total || 0) / 12)

        await (supabase
          .from('quotes') as any)
          .update({
            estimated_price: monthly,
            status: 'PENDING' as any,
            coverage_requirements: {
              ...(enhancedData as any),
            } as any,
          } as any)
          .eq('id', tempQuoteId)
      } catch (err) {
        console.error('Error finalizing quote:', err)
      }
    }

    navigate('/offres')
  }


  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn(
      "space-y-6",
      isMobile ? "px-2" : "max-w-5xl mx-auto px-4"
    )}>

      {/* Enhanced Coverage Selection */}
      <div className='space-y-4'>
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
          <ProgressiveCoverageSelector
            quoteId={tempQuoteId || ''}
            vehicleData={vehicleData}
            selectedCoverages={selectedCoverages}
            onCoverageChange={handleCoverageChange}
            onPremiumsChange={(total: number, breakdown: Record<string, number>) => {
              setTotalPremium(total)
              setPremiumBreakdown(breakdown)
            }}
            canCalculate={!!user}
          />
        )}
      </div>

      {/* Contract Details - Mobile optimized */}
      <Card className={cn(
        isMobile ? "p-4" : "p-6"
      )}>
        <h3 className={cn(
          "font-semibold mb-4 flex items-center gap-2",
          isMobile ? "text-base" : "text-lg"
        )}>
          <Shield className="w-4 h-4 text-primary" />
          Détails du contrat
        </h3>
        <div className={cn(
          "grid gap-4",
          isMobile ? "grid-cols-1" : "md:grid-cols-2"
        )}>
          <div className='space-y-2'>
            <Label htmlFor='effectiveDate' className={cn(
              isMobile ? "text-sm" : "text-base"
            )}>
              Date d'effet *
            </Label>
            <input
              id='effectiveDate'
              type='date'
              value={watch('effectiveDate') || ''}
              onChange={(e) => setValue('effectiveDate', e.target.value)}
              className={cn(
                'w-full border rounded-md bg-background transition-colors',
                isMobile ? 'h-9 px-3 text-sm' : 'h-10 px-3',
                errors.effectiveDate && 'border-destructive focus:ring-destructive'
              )}
            />
            {errors.effectiveDate && (
              <p className='text-xs text-destructive'>{errors.effectiveDate.message}</p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='contractDuration' className={cn(
              isMobile ? "text-sm" : "text-base"
            )}>
              Durée du contrat *
            </Label>
            <Select value={watch('contractDuration') || ''} onValueChange={(v) => setValue('contractDuration', v)}>
              <SelectTrigger className={cn(
                errors.contractDuration && 'border-destructive',
                isMobile && "h-9 text-sm"
              )}>
                <SelectValue placeholder='Sélectionner' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='1_an'>1 an</SelectItem>
                <SelectItem value='6_mois'>6 mois</SelectItem>
              </SelectContent>
            </Select>
            {errors.contractDuration && (
              <p className='text-xs text-destructive'>{errors.contractDuration.message}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Floating Action Buttons - Mobile optimized */}
      <div className={cn(
        "sticky bottom-0 bg-background/95 backdrop-blur-sm border-t p-4 -mx-4",
        isMobile ? "gap-2 flex-col" : "flex gap-4 max-w-5xl mx-auto"
      )}>
        <Button
          type='button'
          variant='outline'
          size={isMobile ? "default" : "lg"}
          onClick={onBack}
          className={cn(
            "flex items-center justify-center gap-2",
            isMobile ? "w-full" : "flex-1"
          )}
        >
          <ArrowLeft className={cn("w-4 h-4", !isMobile && "w-5 h-5")} />
          {isMobile ? "Retour" : "Précédent"}
        </Button>
        <Button
          type='submit'
          size={isMobile ? "default" : "lg"}
          className={cn(
            "flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground",
            "transition-all duration-200 group",
            isMobile ? "w-full" : "flex-1"
          )}
        >
          <span>
            {totalPremium > 0
              ? (isMobile
                ? `Voir les offres (${Math.round(totalPremium / 12).toLocaleString('fr-FR')}€/mois)`
                : `Voir les offres (${totalPremium.toLocaleString('fr-FR')} FCFA/an)`)
              : 'Voir les offres'
            }
          </span>
          <ArrowRight className={cn(
            "transition-transform",
            isMobile ? "w-4 h-4" : "w-5 h-5 group-hover:translate-x-1"
          )} />
        </Button>
      </div>

      {/* Trust indicators - Mobile footer */}
      <div className={cn(
        "text-center text-xs text-muted-foreground border-t pt-4",
        isMobile ? "-mx-2 px-2" : "-mx-4 px-4"
      )}>
        <div className={cn(
          "flex items-center justify-center gap-4",
          isMobile ? "flex-col gap-2" : "gap-4"
        )}>
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            <span>Paiement sécurisé</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Modification possible</span>
          </div>
          <div className="flex items-center gap-1">
            <ArrowRight className="w-3 h-3" />
            <span>Sans engagement</span>
          </div>
        </div>
      </div>
    </form>
  )
}

export default Step3Needs
