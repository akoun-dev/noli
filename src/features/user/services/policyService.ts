import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

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

      return data || []
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

      return data
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

      // Generate policy number
      const policyNumber = `POL-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

      // Calculate policy dates
      const startDate = new Date()
      const endDate = new Date()
      endDate.setFullYear(endDate.getFullYear() + 1)

      const newPolicy = {
        quote_id: quoteId,
        offer_id: offerId,
        user_id: quote.user_id,
        insurer_id: quote.insurer_id || 'default',
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

      return data
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

      return data || []
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

      return data || []
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
      const { data, error } = await supabase
        .from('payments')
        .insert({
          ...paymentData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      logger.info('Payment recorded successfully', { paymentId: data.id })

      return data
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
