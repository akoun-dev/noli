import { supabase } from '@/lib/supabase'
import { Database, DatabaseQuote, DatabaseQuoteOffer } from '@/types/database'

// Types pour les devis
export interface QuoteRequest {
  customerInfo: {
    fullName: string
    email: string
    phone: string
    address: string
    birthDate: string
    licenseNumber: string
    licenseDate: string
  }
  vehicleInfo: {
    brand: string
    model: string
    year: number
    registrationNumber: string
    vehicleType: string
    fuelType: string
    value: number
  }
  insuranceNeeds: {
    coverageType: string
    usage: string
    annualKilometers: number
    parkingType: string
    historyClaims: string
  }
}

export interface QuoteResponse {
  id: string
  quoteId: string
  offerId: string
  insurerId: string
  insurerName: string
  insurerLogo?: string
  offerName: string
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  price: {
    monthly: number
    annual: number
  }
  franchise: number
  features: string[]
  guarantees: { [key: string]: boolean }
  createdAt: Date
  validUntil: Date
}

export interface QuoteFormData {
  user_id: string
  category_id: string
  personal_data: any
  vehicle_data: any
  coverage_requirements: any
  status?: string
  valid_until?: string
}

export interface QuoteFilters {
  user_id?: string
  category_id?: string
  status?: string
  insurer_id?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}

export interface QuoteStats {
  total: number
  pending: number
  approved: number
  rejected: number
  expired: number
  conversion_rate: number
  avg_quote_value: number
  total_revenue: number
}

// Helper functions
function mapDbToQuote(db: DatabaseQuoteOffer): QuoteResponse {
  return {
    id: db.id,
    quoteId: db.quote_id,
    offerId: db.offer_id,
    insurerId: db.insurer_id || '',
    insurerName: db.insurer?.name || 'Assureur',
    insurerLogo: db.insurer?.logo_url || undefined,
    offerName: db.offer?.name || 'Offre',
    status: (db.status?.toLowerCase() || 'pending') as QuoteResponse['status'],
    price: {
      monthly: db.price || 0,
      annual: (db.price || 0) * 12,
    },
    franchise: db.offer?.deductible || 0,
    features: db.offer?.features || [],
    guarantees:
      db.offer?.features?.reduce(
        (acc, feature) => {
          acc[feature] = true
          return acc
        },
        {} as { [key: string]: boolean }
      ) || {},
    createdAt: new Date(db.created_at),
    validUntil: new Date(db.quote?.valid_until || new Date()),
  }
}

// Service Supabase direct
const quoteService = {
  // Créer un devis et générer les offres
  async createQuote(request: QuoteRequest): Promise<QuoteResponse[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non authentifié')

    // Trouver la catégorie auto
    const { data: category } = await supabase
      .from('insurance_categories')
      .select('id')
      .eq('name', 'Auto')
      .single()

    const categoryId =
      category?.id ||
      (await supabase.from('insurance_categories').select('id').eq('name', 'Auto').single()).data
        ?.id ||
      ''

    const personalData = {
      full_name: request.customerInfo.fullName,
      email: request.customerInfo.email,
      phone: request.customerInfo.phone,
      birth_date: request.customerInfo.birthDate,
      license_number: request.customerInfo.licenseNumber,
      license_date: request.customerInfo.licenseDate,
      address: request.customerInfo.address,
    }

    const vehicleData = {
      brand: request.vehicleInfo.brand,
      model: request.vehicleInfo.model,
      year: request.vehicleInfo.year,
      registration: request.vehicleInfo.registrationNumber,
      vehicle_type: request.vehicleInfo.vehicleType,
      fuel_type: request.vehicleInfo.fuelType,
      value: request.vehicleInfo.value,
    }

    const coverageRequirements = {
      coverage_type: request.insuranceNeeds.coverageType,
      usage: request.insuranceNeeds.usage,
      annual_km: request.insuranceNeeds.annualKilometers,
      parking_type: request.insuranceNeeds.parkingType,
      history_claims: request.insuranceNeeds.historyClaims,
    }

    // Créer le devis principal
    const { data: quote, error: quoteErr } = await supabase
      .from('quotes')
      .insert({
        user_id: user.id,
        category_id: categoryId,
        status: 'PENDING',
        personal_data: personalData,
        vehicle_data: vehicleData,
        coverage_requirements: coverageRequirements,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('*')
      .single()

    if (quoteErr || !quote) throw quoteErr || new Error('Erreur lors de la création du devis')

    // Récupérer les offres disponibles
    const { data: offers, error: offersErr } = await supabase
      .from('insurance_offers')
      .select(
        `
        id,
        name,
        insurer_id,
        price_min,
        price_max,
        deductible,
        contract_type,
        features,
        insurers!inner(name, logo_url)
      `
      )
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .eq('insurers.is_active', true)
      .limit(5)

    if (offersErr) throw offersErr

    // Créer les offres de devis
    const quoteOffers: Database['public']['Tables']['quote_offers']['Insert'][] = (
      offers || []
    ).map((offer) => {
      const min = offer.price_min || 30000
      const max = offer.price_max || 200000
      const vehicleValue = vehicleData.value || 1000000

      // Calcul intelligent du prix basé sur le profil
      let basePrice = vehicleValue * 0.03 // 3% de base

      // Ajustements selon le profil
      if (coverageRequirements.coverage_type === 'Tous Risques') {
        basePrice *= 2.5
      } else if (coverageRequirements.coverage_type === 'Tiers+') {
        basePrice *= 1.8
      }

      // Ajustement selon l'âge du véhicule
      const vehicleAge = new Date().getFullYear() - vehicleData.year
      if (vehicleAge > 10) basePrice *= 0.8
      else if (vehicleAge < 3) basePrice *= 1.2

      // Ajustement selon le kilométrage
      if (coverageRequirements.annual_km > 20000) basePrice *= 1.3
      else if (coverageRequirements.annual_km < 5000) basePrice *= 0.9

      // Ajustement selon l'historique
      if (coverageRequirements.history_claims === 'aucun') basePrice *= 0.85
      else if (coverageRequirements.history_claims === 'plusieurs') basePrice *= 1.5

      // Limiter entre min et max
      const finalPrice = Math.round(Math.max(min, Math.min(max, basePrice)) / 1000) * 1000

      return {
        quote_id: quote.id,
        offer_id: offer.id,
        insurer_id: offer.insurer_id,
        price: finalPrice,
        status: 'PENDING',
        notes: null,
      }
    })

    // Insérer les offres de devis
    if (quoteOffers.length > 0) {
      const { error: insertErr } = await supabase.from('quote_offers').insert(quoteOffers)
      if (insertErr) throw insertErr
    }

    // Récupérer les offres créées avec les détails
    const { data: result, error: fetchErr } = await supabase
      .from('quote_offers')
      .select(
        `
        id,
        price,
        status,
        created_at,
        quote:quote_id ( valid_until ),
        offer:offer_id ( name, deductible, features, insurers:insurer_id ( name, logo_url ) ),
        insurer:insurer_id ( name, logo_url )
      `
      )
      .eq('quote_id', quote.id)

    if (fetchErr) throw fetchErr

    return (result || []).map((q) => mapDbToQuote(q))
  },

  // Récupérer les devis d'un utilisateur
  async getUserQuotes(userId: string, filters?: QuoteFilters): Promise<QuoteResponse[]> {
    let query = supabase
      .from('quote_offers')
      .select(
        `
        *,
        quote:quote_id ( user_id, valid_until, personal_data, vehicle_data, coverage_requirements ),
        offer:offer_id ( name, deductible, features, insurers:insurer_id ( name, logo_url ) ),
        insurer:insurer_id ( name, logo_url )
      `
      )
      .eq('quote.user_id', userId)
      .order('created_at', { ascending: false })

    // Appliquer les filtres
    if (filters?.status) {
      query = query.eq('status', filters.status.toUpperCase())
    }

    if (filters?.insurer_id) {
      query = query.eq('insurer_id', filters.insurer_id)
    }

    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query
    if (error) throw error

    return (data || []).map((q) => mapDbToQuote(q))
  },

  // Récupérer tous les devis (admin)
  async getAllQuotes(filters?: QuoteFilters): Promise<QuoteResponse[]> {
    let query = supabase
      .from('quote_offers')
      .select(
        `
        *,
        quote:quote_id ( user_id, valid_until, personal_data, vehicle_data, coverage_requirements ),
        offer:offer_id ( name, deductible, features, insurers:insurer_id ( name, logo_url ) ),
        insurer:insurer_id ( name, logo_url )
      `
      )
      .order('created_at', { ascending: false })

    // Appliquer les filtres
    if (filters?.user_id) {
      query = query.eq('quote.user_id', filters.user_id)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status.toUpperCase())
    }

    if (filters?.insurer_id) {
      query = query.eq('insurer_id', filters.insurer_id)
    }

    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query
    if (error) throw error

    return (data || []).map((q) => mapDbToQuote(q))
  },

  // Récupérer un devis par ID
  async getQuoteById(quoteId: string): Promise<QuoteResponse | null> {
    const { data, error } = await supabase
      .from('quote_offers')
      .select(
        `
        *,
        quote:quote_id ( valid_until, personal_data, vehicle_data, coverage_requirements ),
        offer:offer_id ( name, deductible, features, insurers:insurer_id ( name, logo_url ) ),
        insurer:insurer_id ( name, logo_url )
      `
      )
      .eq('id', quoteId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return mapDbToQuote(data)
  },

  // Accepter un devis
  async acceptQuote(quoteId: string): Promise<boolean> {
    const { error } = await supabase
      .from('quote_offers')
      .update({
        status: 'APPROVED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', quoteId)

    if (error) throw error
    return true
  },

  // Rejeter un devis
  async rejectQuote(quoteId: string, reason?: string): Promise<boolean> {
    const { error } = await supabase
      .from('quote_offers')
      .update({
        status: 'REJECTED',
        notes: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', quoteId)

    if (error) throw error
    return true
  },

  // Mettre à jour le statut d'un devis
  async updateQuoteStatus(quoteId: string, status: string): Promise<boolean> {
    const { error } = await supabase
      .from('quote_offers')
      .update({
        status: status.toUpperCase(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', quoteId)

    if (error) throw error
    return true
  },

  // Supprimer un devis
  async deleteQuote(quoteId: string): Promise<boolean> {
    const { error } = await supabase.from('quote_offers').delete().eq('id', quoteId)

    if (error) throw error
    return true
  },

  // Récupérer les statistiques des devis
  async getQuoteStats(filters?: QuoteFilters): Promise<QuoteStats> {
    let query = supabase
      .from('quote_offers')
      .select('status, price, created_at')
      .order('created_at', { ascending: false })
      .limit(1000)

    // Appliquer les filtres pour les stats
    if (filters?.user_id) {
      // Pour les stats, on doit faire une jointure manuelle
      const { data: quoteData } = await supabase
        .from('quotes')
        .select('id')
        .eq('user_id', filters.user_id)

      if (quoteData && quoteData.length > 0) {
        const quoteIds = quoteData.map((q) => q.id)
        query = query.in('quote_id', quoteIds)
      }
    }

    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    const { data, error } = await query
    if (error) throw error

    const total = data?.length || 0
    const pending = data?.filter((q) => q.status === 'PENDING').length || 0
    const approved = data?.filter((q) => q.status === 'APPROVED').length || 0
    const rejected = data?.filter((q) => q.status === 'REJECTED').length || 0
    const expired = data?.filter((q) => q.status === 'EXPIRED').length || 0

    const conversionRate = total > 0 ? (approved / total) * 100 : 0

    const avgQuoteValue =
      data && data.length > 0 ? data.reduce((sum, q) => sum + (q.price || 0), 0) / data.length : 0

    const totalRevenue =
      data?.filter((q) => q.status === 'APPROVED').reduce((sum, q) => sum + (q.price || 0), 0) || 0

    return {
      total,
      pending,
      approved,
      rejected,
      expired,
      conversion_rate: Math.round(conversionRate * 100) / 100,
      avg_quote_value: Math.round(avgQuoteValue),
      total_revenue: totalRevenue,
    }
  },

  // Exporter les devis
  async exportQuotes(format: 'csv' | 'excel' = 'csv', filters?: QuoteFilters): Promise<Blob> {
    const quotes = await this.getAllQuotes(filters)

    // Créer le contenu CSV
    const headers = [
      'ID',
      'Assureur',
      'Offre',
      'Statut',
      'Prix mensuel',
      'Prix annuel',
      'Franchise',
      'Date de création',
      'Date de validité',
      'Client',
      'Véhicule',
    ]

    const rows = quotes.map((quote) => [
      quote.id,
      quote.insurerName,
      quote.offerName,
      quote.status,
      (quote.price.monthly / 100).toFixed(2) + '€',
      (quote.price.annual / 100).toFixed(2) + '€',
      (quote.franchise / 100).toFixed(2) + '€',
      new Date(quote.createdAt).toLocaleDateString('fr-FR'),
      new Date(quote.validUntil).toLocaleDateString('fr-FR'),
      quote.quoteId || '',
      quote.offerId || '',
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    return new Blob([csvContent], { type: 'text/csv' })
  },

  // Vérifier les devis expirants
  async checkExpiringQuotes(): Promise<QuoteResponse[]> {
    const { data, error } = await supabase
      .from('quote_offers')
      .select(
        `
        *,
        quote:quote_id ( valid_until ),
        offer:offer_id ( name, deductible, features, insurers:insurer_id ( name, logo_url ) ),
        insurer:insurer_id ( name, logo_url )
      `
      )
      .eq('status', 'PENDING')
      .lte('quote.valid_until', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .gte('quote.valid_until', new Date().toISOString())

    if (error) throw error
    return (data || []).map((q) => mapDbToQuote(q))
  },
}

export { quoteService }
export default quoteService
