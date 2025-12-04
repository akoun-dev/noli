import React, { useState, useEffect, useMemo } from 'react'
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
        const parsed = parseInt(value, 10)
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
    }
  }, [
    vehicleInfo.fiscalPower,
    vehicleInfo.fuel,
    vehicleInfo.currentValue,
    vehicleInfo.newValue,
  ])

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
    if (user) {
      createTempQuote()
    }
  }, [user])

  const createTempQuote = async () => {
    if (!user) return

    console.log('🔧 Step3Needs: Creating temporary quote...')
    console.log('🔧 User:', user?.id)
    console.log('🔧 Vehicle data:', vehicleData)

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
      setTempQuoteId(data.id)
    } catch (error) {
      console.error('🔧 ERROR creating temporary quote:', error)
      console.error('🔧 Quote error details:', {
        message: (error as any)?.message,
        stack: (error as any)?.stack,
        name: (error as any)?.name,
        error
      })
      setCoverageErrors(['Erreur lors de la création du devis temporaire'])
    } finally {
      console.log('🔧 Quote creation process finished')
      setCoverageLoading(false)
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

    let localPremium = 0
    if (isIncluded) {
      try {
        const premium = await coverageTarificationService.calculateCoveragePremium(
          coverageId,
          calculationPayload
        )

        if (premium && premium > 0) {
          localPremium = premium
          console.log(`Calculated premium for ${coverageId}:`, premium)
        }
      } catch (premiumError) {
        console.error('Error calculating individual premium:', premiumError)
      }
    }

    if (!localPremium || localPremium <= 0) {
      localPremium = getEstimatedPremium(coverageId)
      if (localPremium > 0) {
        console.log(`Using estimated premium for ${coverageId}:`, localPremium)
      } else {
        console.warn(`No premium found for coverage ${coverageId}`)
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

    if (!tempQuoteId) {
      return
    }

    try {
      await coverageTarificationService.addCoverageToQuote(
        tempQuoteId,
        coverageId,
        calculationPayload,
        isIncluded
      )

      const newTotal = await coverageTarificationService.calculateQuoteTotalPremium(tempQuoteId)
      const premiums = await coverageTarificationService.getQuoteCoveragePremiums(tempQuoteId)
      const serverBreakdown: Record<string, number> = {}
      premiums
        .filter((p) => p.is_included && p.premium_amount > 0)
        .forEach((p) => {
          serverBreakdown[p.coverage_id] = p.premium_amount
        })

      let mergedBreakdown: Record<string, number> = updatedBreakdown
      setPremiumBreakdown((prev) => {
        const merged = { ...prev, ...serverBreakdown }
        Object.keys(merged).forEach((key) => {
          if (!nextSelectedCoverages[key]) {
            delete merged[key]
          }
        })
        mergedBreakdown = merged
        return merged
      })

      const fallbackServerTotal = Object.values(mergedBreakdown).reduce((sum, value) => sum + value, 0)
      setTotalPremium(newTotal > 0 ? newTotal : fallbackServerTotal)
    } catch (error) {
      console.error('Error updating coverage:', error)
      setCoverageErrors(['Erreur lors de la mise à jour des garanties'])
      // Revert state change on error
      setSelectedCoverages((prev) => ({ ...prev, [coverageId]: !isIncluded }))
    }
  }

  const onSubmit = async (data: InsuranceNeedsFormData) => {
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

    updateInsuranceNeeds(enhancedData)

    // Persist estimated price and finalize quote status if a temporary quote exists
    if (tempQuoteId) {
      try {
        await coverageTarificationService.updateQuoteCoveragePremiums(tempQuoteId)
        const total = await coverageTarificationService.calculateQuoteTotalPremium(tempQuoteId)
        const durationPricing = getDurationConfig(data.contractDuration)
        const adjustedTotal = Math.round((total || 0) * durationPricing.percentage)
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

    // Navigate to next step
    navigate('/comparison/results')
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
            canCalculate={!!user}
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

      {/* Quote Modal */}
      <Dialog open={isQuoteModalOpen} onOpenChange={setIsQuoteModalOpen}>
        <DialogTrigger asChild>
          <Button
            type='button'
            variant='ghost'
            size="sm"
            className="text-muted-foreground"
          >
            Voir le devis
          </Button>
        </DialogTrigger>
        <DialogContent className={cn(
          isMobile ? "w-11/12 max-w-md" : "max-w-lg"
        )}>
          <DialogHeader>
            <DialogTitle className="text-xl">Votre devis personnalisé</DialogTitle>
            <DialogDescription>
              Récapitulatif de votre protection automobile
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Section Prix */}
            <div className="text-center space-y-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <div className="text-4xl font-bold text-primary">
                {adjustedPremium.toLocaleString('fr-FR')} FCFA
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {monthlyPremium.toLocaleString('fr-FR')} FCFA par mois
              </div>
              <div className="text-xs text-muted-foreground">
                {Object.entries(selectedCoverages).filter(([_, isSelected]) => isSelected).length} garantie(s) sélectionnée(s)
              </div>
            </div>

            {/* Section Véhicule */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">Véhicule assuré</h4>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                {formData.vehicleInfo?.brand || ''} {formData.vehicleInfo?.model || ''} ({formData.vehicleInfo?.year || ''})
              </div>
            </div>

            {/* Section Garanties */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">Garanties incluses</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Object.entries(selectedCoverages)
                  .filter(([_, isSelected]) => isSelected)
                  .map(([coverageId]) => (
                    <div key={coverageId} className="flex items-center justify-between text-sm">
                      <span>{getCoverageName(coverageId)}</span>
                      <span className="text-muted-foreground">
                        {premiumBreakdown[coverageId]?.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Section Actions */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Recevoir votre devis</h4>
              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 h-12 text-sm"
                  onClick={handleShareWhatsApp}
                >
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  Recevoir par WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 h-12 text-sm"
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingQuote}
                >
                  <Download className="w-4 h-4 text-blue-600" />
                  {isGeneratingQuote ? 'Génération...' : 'Télécharger le PDF'}
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 h-12 text-sm"
                  onClick={handleShareEmail}
                >
                  <Mail className="w-4 h-4 text-red-600" />
                  Recevoir par email
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  )
}

export default Step3Needs
