import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { insuranceNeedsSchema, InsuranceNeedsFormData } from '@/lib/zod-schemas'
import { useCompare } from '@/features/comparison/services/ComparisonContext'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
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
import { ArrowRight, ArrowLeft, AlertTriangle, Shield, Car, MessageCircle, Download, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import SimplifiedCoverageSelector from '@/components/coverage/SimplifiedCoverageSelector'
import {
  coverageTarificationService,
  type VehicleData,
} from '@/services/coverageTarificationService'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const DEFAULT_CONTRACT_DURATION = '12_mois'

const CONTRACT_DURATION_CONFIG: Record<string, { percentage: number; months: number }> = {
  '1_mois': { percentage: 0.15, months: 1 },
  '3_mois': { percentage: 0.30, months: 3 },
  '6_mois': { percentage: 0.55, months: 6 },
  '9_mois': { percentage: 0.80, months: 9 },
  '12_mois': { percentage: 1, months: 12 },
}

const getDurationConfig = (duration?: string) =>
  CONTRACT_DURATION_CONFIG[duration || DEFAULT_CONTRACT_DURATION] ||
  CONTRACT_DURATION_CONFIG[DEFAULT_CONTRACT_DURATION]

interface Step3NeedsProps {
  onBack: () => void
}

const Step3Needs: React.FC<Step3NeedsProps> = ({ onBack }: Step3NeedsProps) => {
  const { formData, updateInsuranceNeeds } = useCompare()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const isMountedRef = useRef(true)

  // Coverage-based tarification state (always enabled)
  const [selectedCoverages, setSelectedCoverages] = useState<Record<string, boolean>>({})
  const [totalPremium, setTotalPremium] = useState(0)
  const [premiumBreakdown, setPremiumBreakdown] = useState<Record<string, number>>({})
  const [tempQuoteId, setTempQuoteId] = useState<string | null>(null)
  const [coverageLoading, setCoverageLoading] = useState(false)
  const [coverageErrors, setCoverageErrors] = useState<string[]>([])
  const [availableCoverages, setAvailableCoverages] = useState<any[]>([])
  const [allGuarantees, setAllGuarantees] = useState<any[]>([])
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Fonction pour générer et télécharger le PDF
  const handleDownloadPDF = async () => {
    setIsGeneratingQuote(true)
    try {
      // TODO: Implémenter la génération PDF avec pdfService
      const { pdfService } = await import('@/features/quotes/services/pdfService')

      const quoteData = {
        id: tempQuoteId || `temp_${Date.now()}`,
        vehicleInfo: formData.vehicleInfo,
        coverages: selectedCoverages,
        premiumBreakdown,
        totalPremium: adjustedPremium,
        contractDuration,
        createdAt: new Date()
      }

      await pdfService.generateQuotePDF(quoteData)
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error)
      // TODO: Afficher une notification d'erreur
    } finally {
      setIsGeneratingQuote(false)
    }
  }

  // Fonction pour partager par WhatsApp
  const handleShareWhatsApp = () => {
    const message = `🚗 *Devis NOLI Assurance*\n` +
      `*Véhicule*: ${formData.vehicleInfo?.brand || ''} ${formData.vehicleInfo?.model || ''} (${formData.vehicleInfo?.year || ''})\n` +
      `*Total*: ${adjustedPremium.toLocaleString('fr-FR')} FCFA\n` +
      `*Mensuel*: ${monthlyPremium.toLocaleString('fr-FR')} FCFA\n` +
      `*Garanties*: ${Object.entries(selectedCoverages).filter(([_, isSelected]) => isSelected).length} sélectionnée(s)\n` +
      `*Pour recevoir votre devis complet, contactez-nous !\n` +
      `📞 +225 00 00 00\n` +
      `🌐 www.noli-assurance.ci`
    const whatsappUrl = `https://wa.me/22500000000?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  // Fonction pour partager par email
  const handleShareEmail = () => {
    const subject = encodeURIComponent('Devis NOLI Assurance - Assurance Automobile')
    const body = encodeURIComponent(
      `Bonjour,\n\n` +
      `Je souhaite recevoir un devis pour l'assurance de mon véhicule :\n\n` +
      `Véhicule: ${formData.vehicleInfo?.brand || ''} ${formData.vehicleInfo?.model || ''} (${formData.vehicleInfo?.year || ''})\n` +
      `Total: ${adjustedPremium.toLocaleString('fr-FR')} FCFA\n` +
      `Mensuel: ${monthlyPremium.toLocaleString('fr-FR')} FCFA\n` +
      `Garanties: ${Object.entries(selectedCoverages).filter(([_, isSelected]) => isSelected).length} sélectionnée(s)\n\n` +
      `Merci de me contacter pour finaliser ce devis.\n\n` +
      `Cordialement`
    )

    window.location.href = `mailto:devis@noli-assurance.ci?subject=${subject}&body=${body}`
  }

  // Prepare vehicle data for coverage calculation
  const vehicleInfo = formData.vehicleInfo || {}
  const vehicleData: VehicleData = useMemo(() => {
    const parseNumber = (value: string | number | undefined, fallback: number) => {
      if (typeof value === 'number') return value
      if (typeof value === 'string' && value.trim().length > 0) {
        const cleaned = value.replace(/[^\d]/g, '')
        const parsed = parseInt(cleaned, 10)
        return Number.isNaN(parsed) ? fallback : parsed
      }
      return fallback
    }

    return {
      category: '401',
      fiscal_power: parseNumber(vehicleInfo.fiscalPower, 6),
      fuel_type: vehicleInfo.fuel || 'essence',
      sum_insured: parseNumber(vehicleInfo.currentValue, 5_000_000),
      new_value: parseNumber(vehicleInfo.newValue, 8_000_000),
      seats: parseNumber(vehicleInfo.seats, 5),
      passenger_seats: parseNumber(vehicleInfo.seats, 5),
      nb_places: parseNumber(vehicleInfo.seats, 5),
    }
  }, [
    vehicleInfo.fiscalPower,
    vehicleInfo.fuel,
    vehicleInfo.currentValue,
    vehicleInfo.newValue,
    vehicleInfo.seats,
  ])

  // Convert legacy coverageType values to new enum values
  const normalizeCoverageType = (value: any): string => {
    const mapping: Record<string, string> = {
      'tiers': 'tiers_simple',
      'vol_incendie': 'tiers_plus',
      'tous_risques': 'tous_risques'
    }
    return mapping[value] || value || 'tiers_simple'
  }

  const { handleSubmit, formState: { errors }, setValue, watch } = useForm<InsuranceNeedsFormData>({
    resolver: zodResolver(insuranceNeedsSchema),
    defaultValues: {
      coverageType: normalizeCoverageType(formData.insuranceNeeds.coverageType) as any,
      effectiveDate: formData.insuranceNeeds.effectiveDate as any,
      contractDuration: formData.insuranceNeeds.contractDuration as any,
      options: formData.insuranceNeeds.options || [],
    },
  })
  const selectedOptions = watch('options') || []
  const contractDuration = watch('contractDuration') || DEFAULT_CONTRACT_DURATION
  const durationConfig = getDurationConfig(contractDuration)
  const adjustedPremium = Math.round(totalPremium * durationConfig.percentage)
  const monthlyPremium = durationConfig.months > 0
    ? Math.round((adjustedPremium || 0) / durationConfig.months)
    : adjustedPremium

  const findCoverageDetails = (coverageId: string) => {
    // D'abord essayer dans availableCoverages
    let coverage = availableCoverages.find((coverage) =>
      coverage.id === coverageId ||
      coverage.coverage_id === coverageId ||
      coverage.code === coverageId
    )

    // Si pas trouvé, essayer dans allGuarantees
    if (!coverage) {
      coverage = allGuarantees.find((guarantee) =>
        guarantee.id === coverageId ||
        guarantee.code === coverageId
      )
    }

    return coverage
  }

  const getEstimatedPremium = (coverageId: string): number => {
    const coverage = findCoverageDetails(coverageId)
    if (!coverage) return 0

    const { estimated_min_premium, estimated_max_premium } = coverage
    if (typeof estimated_min_premium === 'number' && estimated_min_premium > 0) {
      return estimated_min_premium
    }
    if (typeof estimated_max_premium === 'number' && estimated_max_premium > 0) {
      return estimated_max_premium
    }
    return 0
  }

  const getCoverageName = (coverageId: string) => {
    const coverage = findCoverageDetails(coverageId)
    if (coverage?.name) return coverage.name
    if (coverage?.display_name) return coverage.display_name
    if (coverage?.label) return coverage.label

    // Noms communs basés sur l'ID
    const commonNames: Record<string, string> = {
      'RC': 'Responsabilité Civile',
      'RESPONSABILITE_CIVILE': 'Responsabilité Civile',
      'DR': 'Défense et Recours',
      'DEFENSE_RETOUR': 'Défense et Recours',
      'IC': 'Individuelle Conducteur',
      'INDIVIDUELLE_CONDUCTEUR': 'Individuelle Conducteur',
      'IPT': 'Individuelle Passagers',
      'INDIVIDUELLE_PASSAGERS': 'Individuel Passagers',
      'INC': 'Incendie',
      'VOL': 'Vol',
      'VMA': 'Vol à mains armées',
      'VOL_MAINS_ARMEES': 'Vol à mains armées',
      'BDG': 'Bris de glaces',
      'BRIS_GLACES': 'Bris de glaces',
      'TDC': 'Tierce Complète',
      'TIERCE_COLLISION': 'Tierce Collision',
      'TCL': 'Tierce Collision',
      'ASSIST': 'Assistance',
      'ASR': 'Avance sur recours',
      'AVANCE_RECOURS': 'Avance sur recours',
      'INDIVIDUELLE_PASSAGER': 'Individuel Passager',
    }

    return commonNames[coverageId] || `Garantie ${coverageId}`
  }

  // Create temporary quote for coverage calculation
  useEffect(() => {
    // Always create temp quote or initialize coverages, even without user
    if (user) {
      createTempQuote()
    } else {
      // Initialize with default coverages even without user
      console.log('🔧 No user logged in, skipping temp quote creation (local mode)')
      setTempQuoteId(null)
      setCoverageLoading(false)
      setCoverageErrors([])
    }
  }, [user])

  const createTempQuote = async () => {
    if (!user) return

    console.log('🔧 Step3Needs: Creating temporary quote...')
    console.log('🔧 User:', user?.id)
    console.log('🔧 Vehicle data:', vehicleData)

    const timeoutId = window.setTimeout(() => {
      if (!isMountedRef.current) return
      console.warn('⏱️ Quote creation timeout, showing coverages without persisted quote')
      setCoverageLoading(false)
      setCoverageErrors((prev) =>
        prev.length > 0 ? prev : ['Connexion lente, affichage des garanties en mode local']
      )
    }, 5000)

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
        seats: vehicleData.seats,
        passenger_seats: vehicleData.passenger_seats,
        nb_places: vehicleData.nb_places,
      }

      const coverageReq = {
        coverage_type: formData.insuranceNeeds.coverageType,
        effective_date: formData.insuranceNeeds.effectiveDate,
        contract_duration: formData.insuranceNeeds.contractDuration,
        options: formData.insuranceNeeds.options || [],
      }

      const { data, error } = await (supabase
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
        .single() as any)

      console.log('🔧 Quote creation result:', { error, data })
      if (error || !data?.id) {
        console.error('🔧 Quote creation failed:', error)
        throw error || new Error('Quote creation failed')
      }

      console.log('🔧 Quote created successfully with ID:', data.id)
      if (isMountedRef.current) {
        setTempQuoteId(data.id)
      }
    } catch (error) {
      console.error('🔧 ERROR creating temporary quote:', error)
      console.error('🔧 Quote error details:', {
        message: (error as any)?.message,
        stack: (error as any)?.stack,
        name: (error as any)?.name,
        error
      })
      if (isMountedRef.current) {
        setCoverageErrors(['Erreur lors de la création du devis temporaire'])
        setTempQuoteId(null)
      }
    } finally {
      console.log('🔧 Quote creation process finished')
      clearTimeout(timeoutId)
      if (isMountedRef.current) {
        setCoverageLoading(false)
      }
    }
  }

  const handleCoverageChange = async (
    coverageId: string,
    isIncluded: boolean,
    formulaName?: string
  ) => {
    const nextSelectedCoverages = { ...selectedCoverages, [coverageId]: isIncluded }
    setSelectedCoverages(nextSelectedCoverages)

    const calculationPayload = {
      ...vehicleData,
      ...(formulaName && { formula_name: formulaName }),
    }

    console.log('[handleCoverageChange] Processing:', {
      coverageId,
      isIncluded,
      formulaName,
      calculationPayload
    })

    let localPremium = 0
    if (isIncluded) {
      try {
        const premium = await coverageTarificationService.calculateCoveragePremium(
          coverageId,
          calculationPayload
        )

        if (premium && premium > 0) {
          localPremium = premium
          console.log(`[handleCoverageChange] Calculated premium for ${coverageId}:`, premium)
        } else {
          console.warn(`[handleCoverageChange] Premium is zero or null for ${coverageId}`)
        }
      } catch (premiumError) {
        console.error('[handleCoverageChange] Error calculating individual premium:', premiumError)
        // Don't set coverageErrors for calculation issues - just use fallback
      }
    }

    if (!localPremium || localPremium <= 0) {
      localPremium = getEstimatedPremium(coverageId)
      if (localPremium > 0) {
        console.log(`[handleCoverageChange] Using estimated premium for ${coverageId}:`, localPremium)
      } else {
        console.warn(`[handleCoverageChange] No premium found for coverage ${coverageId}`)
        // Use 0 as fallback - don't block the UI
        localPremium = 0
      }
    }

    const updatedBreakdown = (() => {
      if (isIncluded) {
        return { ...premiumBreakdown, [coverageId]: localPremium }
      }
      const { [coverageId]: _, ...rest } = premiumBreakdown
      return rest
    })()

    setPremiumBreakdown(updatedBreakdown)
    const localTotal = Object.values(updatedBreakdown).reduce((sum, value) => sum + value, 0)
    setTotalPremium(localTotal)

    if (!tempQuoteId || tempQuoteId === 'temp-quote-id') {
      console.log('[handleCoverageChange] No temp quote, skipping server update')
      return
    }

    try {
      console.log('[handleCoverageChange] Adding coverage to quote:', tempQuoteId)
      await coverageTarificationService.addCoverageToQuote(
        tempQuoteId,
        coverageId,
        calculationPayload,
        isIncluded
      )

      const premiums = await coverageTarificationService.getQuoteCoveragePremiums(tempQuoteId)
      const serverBreakdown: Record<string, number> = {}
      premiums
        .filter((p) => p.is_included && p.premium_amount > 0)
        .forEach((p) => {
          serverBreakdown[p.coverage_id] = p.premium_amount
        })

      const cleanedServerBreakdown = Object.fromEntries(
        Object.entries(serverBreakdown).filter(([key]) => nextSelectedCoverages[key])
      )
      const mergedBreakdown = { ...updatedBreakdown, ...cleanedServerBreakdown }
      setPremiumBreakdown(mergedBreakdown)
      const mergedTotal = Object.values(mergedBreakdown).reduce((sum, value) => sum + value, 0)
      setTotalPremium(mergedTotal)
    } catch (error) {
      console.error('[handleCoverageChange] Error updating coverage:', error)
      // Don't show error to user or revert state - local calculation succeeded
      console.log('[handleCoverageChange] Using local calculation only')
    }
  }

  const onSubmit = async (data: InsuranceNeedsFormData) => {
    try {
      console.log('🚀 onSubmit called with data:', data)
      console.log('🚀 Current form data from context:', formData)

      // Merge coverage selections with form
      const enhancedData = {
        ...data,
        coverageData: {
          selectedCoverages,
          totalPremium,
          adjustedPremium,
          durationConfig,
          premiumBreakdown,
          vehicleData,
        },
      }

      console.log('🚀 Enhanced data prepared:', enhancedData)
      updateInsuranceNeeds(enhancedData)
      console.log('🚀 updateInsuranceNeeds called')

    // Persist estimated price and finalize quote status if a temporary quote exists
    if (tempQuoteId) {
      try {
        await coverageTarificationService.updateQuoteCoveragePremiums(tempQuoteId)
        const total = await coverageTarificationService.calculateQuoteTotalPremium(tempQuoteId)
        const fallbackTotal = Object.values(premiumBreakdown).reduce((sum, value) => sum + value, 0)
        const resolvedTotal = total > 0 ? Math.max(total, fallbackTotal) : fallbackTotal
        const durationPricing = getDurationConfig(data.contractDuration)
        const adjustedTotal = Math.round((resolvedTotal || 0) * durationPricing.percentage)
        const periodMonths = durationPricing.months > 0 ? durationPricing.months : 12
        const monthly = periodMonths > 0 ? Math.round(adjustedTotal / periodMonths) : adjustedTotal

        await (supabase
          .from('quotes')
          .update({
            estimated_price: monthly,
            status: 'PENDING' as any,
            coverage_requirements: {
              ...(enhancedData as any),
            } as any,
            valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          } as any)
          .eq('id', tempQuoteId)
          .single() as any)
        } catch (err) {
          console.error('Error finalizing quote:', err)
        }
    }

    // Persist the comparison summary locally so the results page can tailor offers
    try {
      const summaryPayload = {
        personalInfo: formData.personalInfo,
        vehicleInfo: formData.vehicleInfo,
        insuranceNeeds: enhancedData,
        estimated: {
          total: adjustedPremium,
          monthly: monthlyPremium,
        },
        timestamp: new Date().toISOString(),
      }
      console.log('💾 Saving comparison data:', summaryPayload)
      localStorage.setItem('noli:comparison:last', JSON.stringify(summaryPayload))
      console.log('✅ Data saved successfully')
    } catch (err) {
      console.warn('Unable to persist comparison summary', err)
    }

    // Navigate to next step
    console.log('🚀 Navigating to comparison results...')
    navigate('/comparison/results')
    } catch (error) {
      console.error('❌ ERROR in onSubmit:', error)
      console.error('❌ Error details:', {
        message: (error as any)?.message,
        stack: (error as any)?.stack,
        name: (error as any)?.name,
      })
      // Afficher une erreur à l'utilisateur
      setCoverageErrors(['Une erreur est survenue lors de la soumission du formulaire'])
    }
  }

  // Test function for debugging navigation
  const testNavigation = () => {
    console.log('🧪 TEST: Manual navigation triggered')
    const testData = {
      personalInfo: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '+22500000000'
      },
      vehicleInfo: {
        brand: 'Toyota',
        model: 'Yaris',
        year: '2020'
      },
      insuranceNeeds: {
        coverageType: 'tiers_simple',
        contractDuration: '12_mois'
      },
      estimated: {
        total: 100000,
        monthly: 8333
      },
      timestamp: new Date().toISOString()
    }

    try {
      console.log('🧪 TEST: Saving test data:', testData)
      localStorage.setItem('noli:comparison:last', JSON.stringify(testData))
      console.log('🧪 TEST: Data saved, navigating...')
      navigate('/comparison/results')
    } catch (error) {
      console.error('🧪 TEST: Error during test navigation:', error)
    }
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
          <Card className='p-8 bg-card/90 dark:bg-[#0b171a]/80 border border-border/40 dark:border-border/20'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
              <p className='text-sm text-muted-foreground'>Chargement des garanties...</p>
            </div>
          </Card>
        ) : (
          <SimplifiedCoverageSelector
            quoteId={tempQuoteId || ''}
            vehicleData={vehicleData}
            selectedCoverages={selectedCoverages}
            onCoverageChange={handleCoverageChange}
            onPremiumsChange={(total: number, breakdown: Record<string, number>) => {
              setTotalPremium(total)
              setPremiumBreakdown(breakdown)
            }}
            onCoveragesLoaded={setAvailableCoverages}
          />
        )}
      </div>

      {/* Contract Details - Mobile optimized */}
      <Card
        className={cn(
          isMobile ? "p-4" : "p-6",
          "bg-card/95 border border-border/40 shadow-sm",
          "dark:bg-[#0b171a]/90 dark:border-border/20 dark:shadow-[0_25px_60px_rgba(0,0,0.6)]"
        )}
      >
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
            <Input
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
                <SelectItem value='1_mois'>1 mois</SelectItem>
                <SelectItem value='3_mois'>3 mois</SelectItem>
                <SelectItem value='6_mois'>6 mois</SelectItem>
                <SelectItem value='9_mois'>9 mois</SelectItem>
                <SelectItem value='12_mois'>12 mois</SelectItem>
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
            {adjustedPremium > 0
              ? (isMobile
                ? `Voir les offres (${monthlyPremium.toLocaleString('fr-FR')} FCFA/mois)`
                : `Voir les offres (${adjustedPremium.toLocaleString('fr-FR')} FCFA)`)
              : 'Voir les offres'
            }
          </span>
          <ArrowRight className={cn(
            "transition-transform",
            isMobile ? "w-4 h-4" : "w-5 h-5 group-hover:translate-x-1"
          )} />
        </Button>

      </div>


      <div className='space-y-2 rounded-xl border border-border/60 bg-muted/20 p-4 text-sm leading-relaxed'>
        <p>Faire un devis d’assurance auto en ligne avec NOLI, c’est un peu comme choisir le bon trajet pour éviter les embouteillages : simple, rapide, efficace… et ça vous fait gagner du temps et de l’argent.</p>
        <p>Chez NOLI, on vous aide à comparer les assurances auto disponibles en Côte d’Ivoire pour trouver la formule qui protège vraiment votre véhicule, sans exploser votre budget. Que vous rouliez dans une petite citadine, un SUV familial, un taxi ou un véhicule de société, vous pouvez enfin voir clair dans les offres du marché.</p>
        <p>Et comme NOLI fonctionne en toute transparence :</p>
        <ul className='list-disc space-y-1 pl-5 marker:text-primary'>
          <li>➡️ NOLI est gratuit pour ses utilisateurs il n’y a aucun coup cachés.</li>
          <li>➡️ Si vous sélectionnez un devis, c’est l’assureur qui vous rappellera directement pour finaliser le contrat.</li>
        </ul>
        <p className='font-semibold'>NOLI simplifie, vous décidez.</p>
      </div>

    </form>
  )
}

export default Step3Needs
