import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { Database, Json } from '@/types/database'

type PolicyRow = Database['public']['Tables']['policies']['Row']
type PaymentRow = Database['public']['Tables']['payments']['Row']

export interface Policy {
  id: string
  userId: string
  insurerId: string
  quoteId: string
  offerId: string
  policyNumber: string
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED'
  startDate: string
  endDate: string
  premiumAmount: number
  paymentFrequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
  coverageDetails: Record<string, any>
  termsConditions?: string
  createdAt: string
  updatedAt: string
}

export interface PolicyWithDetails extends Policy {
  insurer?: {
    id: string
    name: string
    logo_url?: string
  }
  offer?: {
    id: string
    name: string
    description?: string
    features?: string[]
    contract_type?: string
  }
  payments?: Payment[]
  documents?: PolicyDocument[]
}

export interface Payment {
  id: string
  policyId: string
  userId: string
  amount: number
  paymentDate: string
  paymentMethod: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'DIRECT_DEBIT' | 'CHECK'
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  transactionId?: string
  createdAt: string
  updatedAt: string
}

export interface PolicyDocument {
  id: string
  name: string
  type: 'contract' | 'certificate' | 'invoice' | 'other'
  url: string
  uploadedAt: string
  size: number
}

function toRecord(value: Json | null | undefined): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function mapRowToPolicy(row: PolicyRow): Policy {
  return {
    id: row.id,
    userId: row.user_id,
    insurerId: row.insurer_id,
    quoteId: row.quote_id,
    offerId: row.offer_id,
    policyNumber: row.policy_number,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    premiumAmount: row.premium_amount,
    paymentFrequency: row.payment_frequency,
    coverageDetails: toRecord(row.coverage_details),
    termsConditions: row.terms_conditions ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapRowToPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    policyId: row.policy_id,
    userId: row.user_id,
    amount: row.amount,
    paymentDate: row.payment_date,
    paymentMethod: row.payment_method,
    status: row.status,
    transactionId: row.transaction_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// Relations telles que renvoyées par les jointures Supabase (objet ou tableau).
type Rel<T> = T | T[] | null
type InsurerRel = { id: string; name: string; logo_url: string | null }
type OfferRel = {
  id: string
  name: string
  description: string | null
  features: string[] | null
  contract_type: string | null
}
type PolicyPaymentRel = {
  id: string
  amount: number
  payment_date: string
  payment_method: Payment['paymentMethod']
  status: Payment['status']
  transaction_id: string | null
}

function firstRel<T>(rel: Rel<T> | undefined): T | undefined {
  if (!rel) return undefined
  return Array.isArray(rel) ? rel[0] : rel
}

function mapInsurerRel(rel: Rel<InsurerRel> | undefined): PolicyWithDetails['insurer'] {
  const insurer = firstRel(rel)
  return insurer
    ? { id: insurer.id, name: insurer.name, logo_url: insurer.logo_url ?? undefined }
    : undefined
}

function mapOfferRel(rel: Rel<OfferRel> | undefined): PolicyWithDetails['offer'] {
  const offer = firstRel(rel)
  return offer
    ? {
        id: offer.id,
        name: offer.name,
        description: offer.description ?? undefined,
        features: offer.features ?? undefined,
        contract_type: offer.contract_type ?? undefined,
      }
    : undefined
}

function mapPolicyPaymentRels(
  rels: PolicyPaymentRel[] | null | undefined,
  policyId: string,
  userId: string
): Payment[] {
  return (rels ?? []).map((p) => ({
    id: p.id,
    policyId,
    userId,
    amount: p.amount,
    paymentDate: p.payment_date,
    paymentMethod: p.payment_method,
    status: p.status,
    transactionId: p.transaction_id ?? undefined,
    createdAt: '',
    updatedAt: '',
  }))
}

class PolicyService {
  private readonly tableName = 'policies'

  /**
   * Get all policies for a user
   */
  async getUserPolicies(userId: string): Promise<PolicyWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          insurers (
            id,
            name,
            logo_url
          ),
          insurance_offers (
            id,
            name,
            description,
            features,
            contract_type
          ),
          payments (
            id,
            amount,
            payment_date,
            payment_method,
            status,
            transaction_id
          )
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map((row) => ({
        ...mapRowToPolicy(row),
        insurer: mapInsurerRel(row.insurers),
        offer: mapOfferRel(row.insurance_offers),
        payments: mapPolicyPaymentRels(row.payments, row.id, row.user_id),
      }))
    } catch (err) {
      logger.error('Error fetching user policies:', err)
      throw err
    }
  }

  /**
   * Get a single policy by ID
   */
  async getPolicyById(policyId: string): Promise<PolicyWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          insurers (
            id,
            name,
            logo_url
          ),
          insurance_offers (
            id,
            name,
            description,
            features,
            contract_type
          ),
          payments (
            id,
            amount,
            payment_date,
            payment_method,
            status,
            transaction_id
          )
        `
        )
        .eq('id', policyId)
        .single()

      if (error) throw error
      if (!data) return null

      return {
        ...mapRowToPolicy(data),
        insurer: mapInsurerRel(data.insurers),
        offer: mapOfferRel(data.insurance_offers),
        payments: mapPolicyPaymentRels(data.payments, data.id, data.user_id),
      }
    } catch (err) {
      logger.error('Error fetching policy by ID:', err)
      throw err
    }
  }

  /**
   * Create a new policy from a quote
   */
  async createPolicyFromQuote(quoteId: string, offerId: string): Promise<Policy> {
    try {
      // First get the quote details
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single()

      if (quoteError) throw quoteError

      // L'assureur est porté par l'offre, pas par le devis
      const { data: offer, error: offerError } = await supabase
        .from('insurance_offers')
        .select('insurer_id')
        .eq('id', offerId)
        .single()

      if (offerError) throw offerError

      // Generate policy number
      const policyNumber = `POL-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

      // Calculate policy dates
      const startDate = new Date()
      const endDate = new Date()
      endDate.setFullYear(endDate.getFullYear() + 1)

      const newPolicy: Database['public']['Tables']['policies']['Insert'] = {
        quote_id: quoteId,
        offer_id: offerId,
        user_id: quote.user_id,
        insurer_id: offer.insurer_id,
        policy_number: policyNumber,
        status: 'ACTIVE',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        premium_amount: quote.estimated_price || 0,
        payment_frequency: 'MONTHLY',
        coverage_details: quote.coverage_requirements || {},
        terms_conditions: 'Standard policy terms and conditions',
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(newPolicy)
        .select()
        .single()

      if (error) throw error

      logger.info('Policy created successfully', { policyId: data.id, policyNumber })

      return mapRowToPolicy(data)
    } catch (err) {
      logger.error('Error creating policy:', err)
      throw err
    }
  }

  /**
   * Update policy status
   */
  async updatePolicyStatus(policyId: string, status: Policy['status']): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', policyId)

      if (error) throw error

      logger.info('Policy status updated', { policyId, status })
    } catch (err) {
      logger.error('Error updating policy status:', err)
      throw err
    }
  }

  /**
   * Get policies expiring soon (within 30 days)
   */
  async getExpiringPolicies(userId: string): Promise<PolicyWithDetails[]> {
    try {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          insurers (
            id,
            name,
            logo_url
          )
        `
        )
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .lte('end_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('end_date', { ascending: true })

      if (error) throw error

      return (data || []).map((row) => ({
        ...mapRowToPolicy(row),
        insurer: mapInsurerRel(row.insurers),
      }))
    } catch (err) {
      logger.error('Error fetching expiring policies:', err)
      throw err
    }
  }

  /**
   * Get payment history for a policy
   */
  async getPolicyPayments(policyId: string): Promise<Payment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('policy_id', policyId)
        .order('payment_date', { ascending: false })

      if (error) throw error

      return (data || []).map(mapRowToPayment)
    } catch (err) {
      logger.error('Error fetching policy payments:', err)
      throw err
    }
  }

  /**
   * Record a new payment
   */
  async recordPayment(
    paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Payment> {
    try {
      const insertPayload: Database['public']['Tables']['payments']['Insert'] = {
        policy_id: paymentData.policyId,
        user_id: paymentData.userId,
        amount: paymentData.amount,
        payment_date: paymentData.paymentDate,
        payment_method: paymentData.paymentMethod,
        status: paymentData.status,
        transaction_id: paymentData.transactionId ?? null,
      }

      const { data, error } = await supabase
        .from('payments')
        .insert(insertPayload)
        .select()
        .single()

      if (error) throw error

      logger.info('Payment recorded successfully', { paymentId: data.id })

      return mapRowToPayment(data)
    } catch (err) {
      logger.error('Error recording payment:', err)
      throw err
    }
  }

  /**
   * Get policy statistics for a user
   */
  async getUserPolicyStats(userId: string): Promise<{
    total: number
    active: number
    expiring: number
    totalPremium: number
  }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('status, premium_amount, end_date')
        .eq('user_id', userId)

      if (error) throw error

      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      const stats = {
        total: data?.length || 0,
        active: data?.filter((p) => p.status === 'ACTIVE').length || 0,
        expiring:
          data?.filter(
            (p) =>
              p.status === 'ACTIVE' &&
              new Date(p.end_date) <= thirtyDaysFromNow &&
              new Date(p.end_date) >= new Date()
          ).length || 0,
        totalPremium:
          data
            ?.filter((p) => p.status === 'ACTIVE')
            .reduce((sum, p) => sum + (p.premium_amount || 0), 0) || 0,
      }

      return stats
    } catch (err) {
      logger.error('Error fetching policy stats:', err)
      throw err
    }
  }
}

export const policyService = new PolicyService()
export default policyService
