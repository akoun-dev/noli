import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

export interface Contract {
  id: string
  policy_id: string
  quote_id: string
  offer_id: string
  user_id: string
  insurer_id: string
  policy_number: string
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED'
  start_date: string
  end_date: string
  premium_amount: number
  payment_frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
  coverage_details: any
  created_at: string
  updated_at: string
}

export const contractService = {
  async getMyContracts(insurerId: string) {
    const { data, error } = await supabase
      .from('policies')
      .select(`*`)
      .eq('insurer_id', insurerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Contract[]
  },

  async getContractById(id: string) {
    const { data, error } = await supabase
      .from('policies')
      .select(
        `
        *,
        profiles!user_id (id, first_name, last_name, email, phone),
        quotes!quote_id (personal_data, vehicle_data)
      `
      )
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async updateContractStatus(id: string, status: Contract['status']) {
    const { data, error } = await supabase.from('policies').update({ status }).eq('id', id).select()

    if (error) throw error
    return data?.[0]
  },

  async createContractFromOffer(
    offerId: string,
    quoteId: string,
    userId: string,
    insurerId: string,
    premium: number
  ) {
    // This would typically be called when a user accepts an offer
    const { data, error } = await supabase
      .from('policies')
      .insert({
        quote_id: quoteId,
        offer_id: offerId,
        user_id: userId,
        insurer_id: insurerId,
        policy_number: `POL-${Math.random().toString(36).toUpperCase().substring(2, 10)}`,
        status: 'ACTIVE',
        start_date: new Date().toISOString(),
        end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        premium_amount: premium,
        payment_frequency: 'ANNUAL',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },
}
