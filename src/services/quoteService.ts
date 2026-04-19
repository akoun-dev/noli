import { QuoteData } from '@/features/quotes/services/pdfService'
import { notificationService } from './notificationService'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

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
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  insurer: string
  offerName: string
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

export class QuoteService {
  private static instance: QuoteService

  static getInstance(): QuoteService {
    if (!QuoteService.instance) {
      QuoteService.instance = new QuoteService()
    }
    return QuoteService.instance
  }

  // Simuler la génération de devis depuis plusieurs assureurs
  async generateQuotes(request: QuoteRequest): Promise<QuoteResponse[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non authentifié')

    const categoryId = 'auto'

    const personal_data = {
      full_name: request.customerInfo.fullName,
      email: request.customerInfo.email,
      phone: request.customerInfo.phone,
      birth_date: request.customerInfo.birthDate,
      license_number: request.customerInfo.licenseNumber,
      license_date: request.customerInfo.licenseDate,
      address: request.customerInfo.address,
    }

    const vehicle_data = {
      brand: request.vehicleInfo.brand,
      model: request.vehicleInfo.model,
      year: request.vehicleInfo.year,
      registration: request.vehicleInfo.registrationNumber,
      vehicle_type: request.vehicleInfo.vehicleType,
      fuel_type: request.vehicleInfo.fuelType,
      value: request.vehicleInfo.value,
    }

    const coverage_requirements = {
      coverage_type: request.insuranceNeeds.coverageType,
      usage: request.insuranceNeeds.usage,
      annual_km: request.insuranceNeeds.annualKilometers,
      parking_type: request.insuranceNeeds.parkingType,
      history_claims: request.insuranceNeeds.historyClaims,
    }

    const { data: quote, error: quoteErr } = await supabase
      .from('quotes')
      .insert({
        user_id: user.id,
        category_id: categoryId,
        status: 'PENDING',
        personal_data,
        vehicle_data,
        coverage_requirements,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('*')
      .single()
    if (quoteErr || !quote) throw quoteErr || new Error('Erreur lors de la création du devis')

    const { data: offers, error: offersErr } = await supabase
      .from('insurance_offers')
      .select('id, name, insurer_id, price_min, price_max, deductible, contract_type')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .limit(3)
    if (offersErr) throw offersErr

    const inserts: Database['public']['Tables']['quote_offers']['Insert'][] = (offers || []).map(
      (o) => {
        const min = o.price_min ?? 50000
        const max = o.price_max ?? Math.max(min + 30000, min)
        const base = Math.min(Math.max(min, (vehicle_data.value || 1000000) * 0.02), max)
        const price = Math.round(base / 1000) * 1000
        return {
          quote_id: quote.id,
          offer_id: o.id,
          insurer_id: o.insurer_id,
          price,
          status: 'PENDING',
          notes: null,
        }
      }
    )

    if (inserts.length) {
      // Temporairement désactivé car la table quote_offers n'existe pas
      console.warn('Table quote_offers does not exist - skipping quote creation')
      return []
    }

    const { data: result, error: fetchErr } = await supabase
      .from('quotes') // Utiliser quotes à la place
      .select(
        `
        id,
        price,
        status,
        created_at,
        offer:offer_id ( name, deductible, insurer:insurer_id ( name ) ),
        quote:quote_id ( valid_until )
      `
      )
      .eq('quote_id', quote.id)
    if (fetchErr) throw fetchErr

    ;(result || []).forEach((q) => {
      notificationService.notifyQuoteGenerated(q.id, q.offer?.insurer?.name || 'Assureur', q.price)
    })

    return (result || []).map((q) => ({
      id: q.id,
      status: (q.status || 'PENDING').toLowerCase() as any,
      insurer: q.offer?.insurer?.name || 'Assureur',
      offerName: q.offer?.name || 'Offre',
      price: { monthly: q.price, annual: q.price * 12 },
      franchise: q.offer?.deductible || 0,
      features: [],
      guarantees: {},
      createdAt: new Date(q.created_at),
      validUntil: new Date(q.quote?.valid_until || new Date()),
    }))
  }

  // Accepter un devis
  async acceptQuote(quoteOfferId: string): Promise<boolean> {
    const { error } = await supabase
      .from('quote_offers')
      .update({ status: 'APPROVED' })
      .eq('id', quoteOfferId)
    if (error) throw error

    const quote = await this.getQuoteById(quoteOfferId)
    if (quote) notificationService.notifyQuoteApproved(quoteOfferId, quote.insurer)
    return true
  }

  // Obtenir un devis par ID
  async getQuoteById(quoteOfferId: string): Promise<QuoteResponse | null> {
    const { data, error } = await supabase
      .from('quote_offers')
      .select(
        `
        id,
        price,
        status,
        created_at,
        quote:quote_id ( valid_until ),
        offer:offer_id ( name, deductible, insurer:insurer_id ( name ) )
      `
      )
      .eq('id', quoteOfferId)
      .single()
    if (error) throw error
    if (!data) return null

    return {
      id: data.id,
      status: (data.status || 'PENDING').toLowerCase() as any,
      insurer: data.offer?.insurer?.name || 'Assureur',
      offerName: data.offer?.name || 'Offre',
      price: { monthly: data.price, annual: data.price * 12 },
      franchise: data.offer?.deductible || 0,
      features: [],
      guarantees: {},
      createdAt: new Date(data.created_at),
      validUntil: new Date(data.quote?.valid_until || new Date()),
    }
  }

  // Obtenir tous les devis d'un utilisateur
  async getUserQuotes(userId: string): Promise<QuoteResponse[]> {
    const { data, error } = await supabase
      .from('quote_offers')
      .select(
        `
        id,
        price,
        status,
        created_at,
        quote:quote_id ( user_id, valid_until ),
        offer:offer_id ( name, insurer:insurer_id ( name ) )
      `
      )
      .eq('quote.user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map((q) => ({
      id: q.id,
      status: (q.status || 'PENDING').toLowerCase() as any,
      insurer: q.offer?.insurer?.name || 'Assureur',
      offerName: q.offer?.name || 'Offre',
      price: { monthly: q.price, annual: q.price * 12 },
      franchise: 0,
      features: [],
      guarantees: {},
      createdAt: new Date(q.created_at),
      validUntil: new Date(q.quote?.valid_until || new Date()),
    }))
  }

  // Vérifier les devis expirants
  async checkExpiringQuotes(): Promise<void> {
    const quotes = await this.getUserQuotes('current-user')
    const now = new Date()

    quotes.forEach((quote) => {
      const daysUntilExpiry = Math.ceil(
        (quote.validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
        notificationService.notifyQuoteExpiring(quote.id, daysUntilExpiry)
      }
    })
  }

  // Convertir un devis en données pour le PDF
  convertToPDFData(quoteResponse: QuoteResponse, request: QuoteRequest): QuoteData {
    return {
      id: quoteResponse.id,
      createdAt: quoteResponse.createdAt,
      customerInfo: {
        fullName: request.customerInfo.fullName,
        email: request.customerInfo.email,
        phone: request.customerInfo.phone,
        address: request.customerInfo.address,
        birthDate: new Date(request.customerInfo.birthDate),
        licenseNumber: request.customerInfo.licenseNumber,
        licenseDate: new Date(request.customerInfo.licenseDate),
      },
      vehicleInfo: {
        brand: request.vehicleInfo.brand,
        model: request.vehicleInfo.model,
        year: request.vehicleInfo.year,
        registrationNumber: request.vehicleInfo.registrationNumber,
        vehicleType: request.vehicleInfo.vehicleType,
        fuelType: request.vehicleInfo.fuelType,
        value: request.vehicleInfo.value,
      },
      insuranceInfo: {
        insurer: quoteResponse.insurer,
        offerName: quoteResponse.offerName,
        coverageType: request.insuranceNeeds.coverageType,
        price: quoteResponse.price,
        franchise: quoteResponse.franchise,
        features: quoteResponse.features,
        guarantees: quoteResponse.guarantees,
      },
      personalInfo: {
        usage: request.insuranceNeeds.usage,
        annualKilometers: request.insuranceNeeds.annualKilometers,
        parkingType: request.insuranceNeeds.parkingType,
        historyClaims: request.insuranceNeeds.historyClaims,
      },
    }
  }
}

export const quoteService = QuoteService.getInstance()
