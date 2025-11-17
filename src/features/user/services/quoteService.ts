import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { QuoteWithDetails, QuoteHistoryFilters, QuoteHistoryStats } from '../types/quote'
import { PDFService } from '../../../services/pdfService'
import { NotificationService } from '../../../services/notificationService'
import { supabase } from '@/lib/supabase'
import { useGlobalLoading } from '@/components/common/GlobalLoading'

// API functions
export const fetchUserQuotes = async (
  filters?: QuoteHistoryFilters
): Promise<QuoteWithDetails[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('quotes')
    .select(
      `
      id,
      estimated_price,
      status,
      created_at,
      updated_at,
      category_id,
      insurance_categories(name, icon),
      user_id,
      vehicle_data,
      coverage_requirements,
      valid_until
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user quotes:', error)
    return [] // Retourner un tableau vide au lieu de lancer une erreur
  }

  let results: QuoteWithDetails[] = (data || []).map((q: any) => {
    const vehicle = q.vehicle_data || {}
    const needs = q.coverage_requirements || {}
    const coverageMap: Record<string, string> = {
      all_risks: 'Tous Risques',
      third_party_plus: 'Tiers +',
      basic: 'Tiers',
      comprehensive: 'Complet',
    }

    return {
      id: q.id,
      userId: q.user_id,
      offerId: q.category_id, // Utiliser category_id comme offerId pour compatibilité
      // Minimal comparisonData for compatibility
      comparisonData: {
        personalInfo: {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          birthDate: new Date(),
          licenseDate: new Date(),
          hasAccidents: false,
          accidentCount: 0,
          usage: (needs.usage || 'personal') as any,
          annualKm: needs.annual_km || 0,
        },
        vehicleInfo: {
          vehicleType: vehicle.vehicle_type || 'voiture',
          brand: vehicle.brand || '',
          model: vehicle.model || '',
          year: vehicle.year || 0,
          fiscalPower: 0,
          registration: vehicle.registration || '',
          value: vehicle.value || 0,
        },
        insuranceNeeds: {
          coverageType: (needs.coverage_type || 'tiers') as any,
          options: [],
          monthlyBudget: 0,
          franchise: 0,
        },
      },
      price: (q.estimated_price || 0) * 12, // afficher prix annuel
      status: String(q.status || 'PENDING').toLowerCase() as any,
      createdAt: q.created_at,
      expiresAt: q.valid_until || q.created_at,
      insurerName: q.insurance_categories?.name || 'Assureur',
      insurerLogo: '',
      vehicleInfo: {
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year || 0,
        registration: vehicle.registration || '',
      },
      coverageName: q.insurance_categories?.name || 'Assurance',
      updatedAt: q.updated_at || q.created_at,
    } as QuoteWithDetails
  })

  // Filters
  if (filters?.status) {
    results = results.filter((r) => r.status === filters.status)
  }
  if (filters?.dateRange) {
    results = results.filter((r) => {
      const d = new Date(r.createdAt)
      return d >= filters.dateRange!.start && d <= filters.dateRange!.end
    })
  }
  if (filters?.insurer) {
    const s = filters.insurer.toLowerCase()
    results = results.filter((r) => r.insurerName.toLowerCase().includes(s))
  }

  return results
}

export const fetchQuoteStats = async (): Promise<QuoteHistoryStats> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return {
      totalQuotes: 0,
      pendingQuotes: 0,
      approvedQuotes: 0,
      rejectedQuotes: 0,
      expiredQuotes: 0,
      averageProcessingTime: 0,
    }

  try {
    const { data, error } = await supabase
      .from('quote_offers')
      .select('status, created_at, updated_at, quote:quote_id ( user_id )')
      .eq('quote.user_id', user.id)
    if (error) throw error

    const total = data?.length || 0
    const byStatus = (data || []).reduce(
      (acc: any, q: any) => {
        const s = String(q.status || 'PENDING').toLowerCase()
        acc[s] = (acc[s] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Rough average processing time (approved and rejected)
    const durations: number[] = (data || [])
      .filter(
        (q: any) => ['APPROVED', 'REJECTED'].includes(String(q.status).toUpperCase()) && q.updated_at
      )
      .map(
        (q: any) =>
          (new Date(q.updated_at).getTime() - new Date(q.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0

    return {
      totalQuotes: total,
      pendingQuotes: byStatus['pending'] || 0,
      approvedQuotes: byStatus['approved'] || 0,
      rejectedQuotes: byStatus['rejected'] || 0,
      expiredQuotes: byStatus['expired'] || 0,
      averageProcessingTime: Math.round(avg * 10) / 10,
    }
  } catch (_) {
    // Fallback si la table quote_offers n'existe pas: utiliser quotes de l'utilisateur
    const { data: quotes } = await supabase
      .from('quotes')
      .select('status, created_at, updated_at')
      .eq('user_id', user.id)

    const total = quotes?.length || 0
    const byStatus = (quotes || []).reduce(
      (acc: any, q: any) => {
        const s = String(q.status || 'PENDING').toLowerCase()
        acc[s] = (acc[s] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const durations: number[] = (quotes || [])
      .filter(
        (q: any) => ['APPROVED', 'REJECTED'].includes(String(q.status).toUpperCase()) && q.updated_at
      )
      .map(
        (q: any) =>
          (new Date(q.updated_at).getTime() - new Date(q.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0

    return {
      totalQuotes: total,
      pendingQuotes: byStatus['pending'] || 0,
      approvedQuotes: byStatus['approved'] || 0,
      rejectedQuotes: byStatus['rejected'] || 0,
      expiredQuotes: byStatus['expired'] || 0,
      averageProcessingTime: Math.round(avg * 10) / 10,
    }
  }
}

export const downloadQuotePdf = async (quoteId: string): Promise<void> => {
  // Charger les données nécessaires
  const { data, error } = await supabase
    .from('quote_offers')
    .select(
      `
      id,
      price,
      created_at,
      offer:offer_id ( name, insurer:insurer_id ( name ) ),
      quote:quote_id ( personal_data, vehicle_data, coverage_requirements )
    `
    )
    .eq('id', quoteId)
    .single()
  if (error || !data) throw error || new Error('Devis non trouvé')

  const vehicle = data.quote?.vehicle_data || {}
  const personal = data.quote?.personal_data || {}
  const needs = data.quote?.coverage_requirements || {}

  const pdf = new PDFService()
  const blob = await pdf.generateQuotePDF({
    id: data.id,
    createdAt: new Date(data.created_at),
    customerInfo: {
      fullName: personal.full_name || '',
      email: personal.email || '',
      phone: personal.phone || '',
      address: personal.address || '',
      birthDate: personal.birth_date ? new Date(personal.birth_date) : new Date(),
      licenseNumber: personal.license_number || '',
      licenseDate: personal.license_date ? new Date(personal.license_date) : new Date(),
    },
    vehicleInfo: {
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      year: vehicle.year || 0,
      registrationNumber: vehicle.registration || '',
      vehicleType: vehicle.vehicle_type || 'voiture',
      fuelType: vehicle.fuel_type || '',
      value: vehicle.value || 0,
    },
    insuranceInfo: {
      insurer: data.offer?.insurer?.name || 'Assureur',
      offerName: data.offer?.name || 'Offre',
      coverageType: needs.coverage_type || 'tiers',
      price: { monthly: data.price, annual: data.price * 12 },
      franchise: 0,
      features: [],
      guarantees: {},
    },
    personalInfo: {
      usage: needs.usage || 'personal',
      annualKilometers: needs.annual_km || 0,
      parkingType: needs.parking_type || '',
      historyClaims: needs.history_claims || '',
    },
  })

  // Télécharger
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `devis-assurance-${data.id}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const sendQuoteNotifications = async (
  quoteId: string,
  channels: ('email' | 'whatsapp' | 'sms')[] = ['email', 'whatsapp']
): Promise<void> => {
  const { data, error } = await supabase
    .from('quote_offers')
    .select(
      `
      id,
      price,
      offer:offer_id ( name, insurer:insurer_id ( name ) ),
      quote:quote_id ( personal_data )
    `
    )
    .eq('id', quoteId)
    .single()
  if (error || !data) throw error || new Error('Devis non trouvé')

  const personal = data.quote?.personal_data || {}

  await NotificationService.sendNotification(
    channels,
    {
      email: personal.email || '',
      phone: personal.phone || '',
    },
    'quoteGenerated',
    {
      firstName: (personal.full_name || '').split(' ')[0] || '',
      quoteId: data.id,
      price: (data.price || 0) * 12,
      insurerName: data.offer?.insurer?.name || 'Assureur',
      downloadUrl: `${window.location.origin}/devis/${data.id}`,
    }
  )
}

export const updateQuoteStatus = async (
  quoteId: string,
  status: 'approved' | 'rejected' | 'pending'
): Promise<void> => {
  const map: Record<string, string> = {
    approved: 'APPROVED',
    rejected: 'REJECTED',
    pending: 'PENDING',
  }
  const { error } = await supabase
    .from('quote_offers')
    .update({ status: map[status] as any })
    .eq('id', quoteId)
  if (error) throw error

  if (status === 'approved') {
    // Charger données pour notification
    const { data } = await supabase
      .from('quote_offers')
      .select(
        'id, offer:offer_id ( insurer:insurer_id ( name ) ), quote:quote_id ( personal_data )'
      )
      .eq('id', quoteId)
      .single()
    const personal = data?.quote?.personal_data || {}
    await NotificationService.sendNotification(
      ['email', 'whatsapp'],
      { email: personal.email || '', phone: personal.phone || '' },
      'quoteApproved',
      {
        firstName: (personal.full_name || '').split(' ')[0] || '',
        quoteId,
        insurerName: data?.offer?.insurer?.name || 'Assureur',
        nextSteps:
          "Veuillez préparer votre pièce d'identité, permis de conduire et carte grise pour la finalisation du contrat.",
      }
    )
  }
}

// React Query hooks
export const useUserQuotes = (filters?: QuoteHistoryFilters) => {
  const { setLoading } = useGlobalLoading();
  
  return useQuery({
    queryKey: ['user-quotes', filters],
    queryFn: () => fetchUserQuotes(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes au lieu de 5
    refetchOnWindowFocus: false,
  })
}

export const useQuoteStats = () => {
  return useQuery({
    queryKey: ['quote-stats'],
    queryFn: fetchQuoteStats,
    staleTime: 10 * 60 * 1000, // 10 minutes au lieu de 5
    refetchOnWindowFocus: false,
  })
}

export const useDownloadQuotePdf = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: downloadQuotePdf,
    onSuccess: (_, quoteId) => {
      toast.success('PDF téléchargé avec succès')
    },
    onError: (error) => {
      toast.error('Erreur lors du téléchargement du PDF')
    },
  })
}

export const useSendQuoteNotifications = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      quoteId,
      channels,
    }: {
      quoteId: string
      channels: ('email' | 'whatsapp' | 'sms')[]
    }) => sendQuoteNotifications(quoteId, channels),
    onSuccess: (_, { quoteId, channels }) => {
      toast.success(`Notifications envoyées avec succès via ${channels.join(', ')}`)
    },
    onError: (error) => {
      toast.error("Erreur lors de l'envoi des notifications")
    },
  })
}

export const useUpdateQuoteStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      quoteId,
      status,
    }: {
      quoteId: string
      status: 'approved' | 'rejected' | 'pending'
    }) => updateQuoteStatus(quoteId, status),
    onSuccess: (_, { quoteId, status }) => {
      toast.success(
        `Statut du devis mis à jour : ${status === 'approved' ? 'Approuvé' : status === 'rejected' ? 'Rejeté' : 'En attente'}`
      )
      // Invalidate quotes query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['user-quotes'] })
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour du statut')
    },
  })
}
