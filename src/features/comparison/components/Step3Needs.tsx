import React, { useState, useEffect, useMemo } from 'react'
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
import { ArrowRight, ArrowLeft, AlertTriangle, Shield, Car, Download, Mail, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { CoverageSelector } from '@/components/coverage/CoverageSelector'
import ProgressiveCoverageSelector from '@/components/coverage/ProgressiveCoverageSelector'
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
import { PDFService } from '@/features/quotes/services/pdfService'
import { NotificationService } from '@/services/notificationService'
import { toast } from 'sonner'

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
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false)

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

  const findCoverageDetails = (coverageId: string) =>
    availableCoverages.find((coverage) => coverage.coverage_id === coverageId)

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
    return coverage?.name || `Garantie ${coverageId}`
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
      if (user) {
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
      // Revert the state change on error
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

  // Fonction pour générer et télécharger le PDF
  const handleDownloadPdf = async () => {
    if (!tempQuoteId || !user) {
      toast.error('Impossible de générer le PDF : informations manquantes')
      return
    }

    try {
      setIsGeneratingPdf(true)
      
      // Préparer les données pour le PDF
      const personalInfo = formData.personalInfo || {}
      const vehicleInfo = formData.vehicleInfo || {}
      const insuranceNeeds = formData.insuranceNeeds || {}
      
      const pdfData = {
        id: tempQuoteId,
        createdAt: new Date(),
        customerInfo: {
          fullName: `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim(),
          email: personalInfo.email || user.email || '',
          phone: personalInfo.phone || '',
          address: (personalInfo as any).address || '',
          birthDate: (personalInfo as any).birthDate ? new Date((personalInfo as any).birthDate) : new Date(),
          licenseNumber: (personalInfo as any).licenseNumber || '',
          licenseDate: (personalInfo as any).licenseDate ? new Date((personalInfo as any).licenseDate) : new Date(),
        },
        vehicleInfo: {
          brand: (vehicleInfo as any).brand || '',
          model: (vehicleInfo as any).model || '',
          year: (vehicleInfo as any).year || new Date().getFullYear(),
          registrationNumber: (vehicleInfo as any).registration || '',
          vehicleType: (vehicleInfo as any).vehicleType || 'voiture',
          fuelType: vehicleInfo.fuel || 'essence',
          value: typeof vehicleInfo.currentValue === 'number' ? vehicleInfo.currentValue : parseInt(vehicleInfo.currentValue as string) || 0,
        },
        insuranceInfo: {
          insurer: 'NOLI Assurance',
          offerName: insuranceNeeds.coverageType || 'tiers',
          coverageType: insuranceNeeds.coverageType || 'tiers',
          price: {
            monthly: Math.round(totalPremium / 12),
            annual: totalPremium,
          },
          franchise: 0,
          features: Object.entries(selectedCoverages)
            .filter(([_, isSelected]) => isSelected)
            .map(([coverageId]) => getCoverageName(coverageId)),
          guarantees: selectedCoverages,
        },
        personalInfo: {
          usage: (insuranceNeeds as any).usage || 'personal',
          annualKilometers: (insuranceNeeds as any).annualKm || 0,
          parkingType: (insuranceNeeds as any).parkingType || '',
          historyClaims: (insuranceNeeds as any).historyClaims || '',
        },
      }

      const pdfService = new PDFService()
      const blob = await pdfService.generateQuotePDF(pdfData)
      
      // Télécharger le PDF
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `devis-assurance-${tempQuoteId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('PDF téléchargé avec succès')
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error)
      toast.error('Erreur lors de la génération du PDF')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  // Fonction pour envoyer le devis par email
  const handleSendEmail = async () => {
    if (!tempQuoteId || !user) {
      toast.error('Impossible d\'envoyer l\'email : informations manquantes')
      return
    }

    try {
      setIsSendingEmail(true)
      
      const personalInfo = formData.personalInfo || {}
      const firstName = personalInfo.firstName || ''
      const email = personalInfo.email || user.email || ''
      
      await NotificationService.sendNotification(
        ['email'],
        { email, phone: personalInfo.phone || '' },
        'quoteGenerated',
        {
          firstName,
          quoteId: tempQuoteId,
          price: totalPremium,
          insurerName: 'NOLI Assurance',
          downloadUrl: `${window.location.origin}/devis/${tempQuoteId}`,
        }
      )
      
      toast.success('Email envoyé avec succès')
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error)
      toast.error('Erreur lors de l\'envoi de l\'email')
    } finally {
      setIsSendingEmail(false)
    }
  }

  // Fonction pour envoyer le devis par WhatsApp
  const handleSendWhatsApp = async () => {
    if (!tempQuoteId || !user) {
      toast.error('Impossible d\'envoyer par WhatsApp : informations manquantes')
      return
    }

    try {
      setIsSendingWhatsApp(true)
      
      const personalInfo = formData.personalInfo || {}
      const firstName = personalInfo.firstName || ''
      const phone = personalInfo.phone || ''
      
      await NotificationService.sendNotification(
        ['whatsapp'],
        { email: personalInfo.email || user.email || '', phone },
        'quoteGenerated',
        {
          firstName,
          quoteId: tempQuoteId,
          price: totalPremium,
          insurerName: 'NOLI Assurance',
          downloadUrl: `${window.location.origin}/devis/${tempQuoteId}`,
        }
      )
      
      toast.success('Message WhatsApp envoyé avec succès')
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message WhatsApp:', error)
      toast.error('Erreur lors de l\'envoi du message WhatsApp')
    } finally {
      setIsSendingWhatsApp(false)
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
          <Card className='p-8'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
              <p className='text-sm text-muted-foreground'>Chargement des garanties...</p>
            </div>
          </Card>
        ) : (
          (() => {
            console.log('🔧 Step3Needs: About to render ProgressiveCoverageSelector')
            console.log('🔧 Props:', {
              tempQuoteId,
              vehicleData,
              selectedCoverages,
              user: !!user
            })
            return (
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
            )
          })()
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
           isMobile ? "w-11/12 max-w-sm" : "max-w-2xl mx-auto",
           "p-0 overflow-hidden"
         )}>
           {/* Header avec design moderne */}
           <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
             <DialogHeader className="text-center space-y-2">
               <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-full mb-3">
                 <Shield className="w-6 h-6" />
               </div>
               <DialogTitle className="text-xl font-semibold text-white">
                 Votre devis personnalisé
               </DialogTitle>
               <DialogDescription className="text-blue-100 text-sm">
                 Protection sur mesure pour votre véhicule
               </DialogDescription>
             </DialogHeader>
           </div>

           <div className="p-6 space-y-6">
             {/* Prix mis en avant */}
             <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
               <div className="flex items-center justify-center gap-2 mb-2">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                 <span className="text-sm font-medium text-green-700">Devis immédiat</span>
               </div>
               <div className="text-4xl font-bold text-gray-900 mb-1">
                 {totalPremium.toLocaleString('fr-FR')}
                 <span className="text-lg font-normal text-gray-600 ml-1">FCFA</span>
               </div>
               <div className="text-sm text-gray-600 mb-3">
                 {Math.round(totalPremium / 12).toLocaleString('fr-FR')} FCFA
                 <span className="text-gray-500"> / mois</span>
               </div>
               <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                 {Object.entries(selectedCoverages).filter(([_, isSelected]) => isSelected).length} garantie(s) sélectionnée(s)
               </div>
             </div>

             {/* Options de partage */}
             <div className="space-y-3">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="font-semibold text-gray-900">Recevoir votre devis</h3>
                 <span className="text-xs text-gray-500">Formats disponibles</span>
               </div>

               <div className="grid gap-3">
                 {/* Bouton PDF - Design moderne */}
                 <Button
                   onClick={handleDownloadPdf}
                   disabled={isGeneratingPdf}
                   className="relative h-12 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white rounded-xl shadow-lg transition-all duration-200 group overflow-hidden"
                 >
                   <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                   <div className="relative flex items-center justify-center gap-3">
                     <div className={cn(
                       "w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center",
                       isGeneratingPdf && "animate-spin"
                     )}>
                       {isGeneratingPdf ? (
                         <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                       ) : (
                         <Download className="w-5 h-5" />
                       )}
                     </div>
                     <div className="text-left">
                       <div className="font-semibold">
                         {isGeneratingPdf ? 'Génération...' : 'Télécharger le PDF'}
                       </div>
                       <div className="text-xs opacity-80">Document officiel</div>
                     </div>
                   </div>
                 </Button>

                 {/* Boutons Email et WhatsApp - Design moderne côte à côte */}
                 <div className="grid grid-cols-2 gap-3">
                   <Button
                     onClick={handleSendEmail}
                     disabled={isSendingEmail}
                     variant="outline"
                     className="relative h-12 border-2 hover:border-blue-500 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
                   >
                     <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl"></div>
                     <div className="relative flex flex-col items-center gap-1">
                       <div className={cn(
                         "w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center",
                         isSendingEmail && "animate-pulse"
                       )}>
                         {isSendingEmail ? (
                           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                         ) : (
                           <Mail className="w-4 h-4" />
                         )}
                       </div>
                       <span className="text-xs font-medium">
                         {isSendingEmail ? 'Envoi...' : 'Email'}
                       </span>
                     </div>
                   </Button>

                   <Button
                     onClick={handleSendWhatsApp}
                     disabled={isSendingWhatsApp}
                     variant="outline"
                     className="relative h-12 border-2 hover:border-green-500 hover:bg-green-50 rounded-xl transition-all duration-200 group"
                   >
                     <div className="absolute inset-0 bg-gradient-to-r from-green-100 to-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl"></div>
                     <div className="relative flex flex-col items-center gap-1">
                       <div className={cn(
                         "w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center",
                         isSendingWhatsApp && "animate-pulse"
                       )}>
                         {isSendingWhatsApp ? (
                           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                         ) : (
                           <MessageCircle className="w-4 h-4" />
                         )}
                       </div>
                       <span className="text-xs font-medium">
                         {isSendingWhatsApp ? 'Envoi...' : 'WhatsApp'}
                       </span>
                     </div>
                   </Button>
                 </div>
               </div>
             </div>

             {/* Infos supplémentaires */}
             <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
               <div className="flex items-center gap-3 text-sm text-gray-600">
                 <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                 <span>Recevez votre devis instantanément par email ou WhatsApp</span>
               </div>
               <div className="flex items-center gap-3 text-sm text-gray-600 mt-2">
                 <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                 <span>PDF valide pour 30 jours avec référence unique</span>
               </div>
             </div>

             {/* Bouton fermer stylé */}
             <Button
               variant="ghost"
               onClick={() => setIsQuoteModalOpen(false)}
               className="w-full h-11 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
             >
               Fermer
             </Button>
           </div>
         </DialogContent>
       </Dialog>
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
