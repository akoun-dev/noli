import { supabase } from '@/lib/supabase'

export interface Claim {
  id: string
  policy_id: string
  user_id: string
  insurer_id: string
  claim_number: string
  title: string
  description: string
  incident_date: string
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAID' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  estimated_amount: number
  approved_amount: number | null
  paid_amount: number | null
  created_at: string
}

export const claimService = {
  async getMyClaims(insurerId: string) {
    const { data, error } = await supabase
      .from('claims')
      .select(
        `
        *,
        policies!policy_id (policy_number, premium_amount)
      `
      )
      .eq('insurer_id', insurerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Claim[]
  },

  async updateClaimStatus(id: string, status: Claim['status'], approvedAmount?: number) {
    const updateData: any = { status }
    if (approvedAmount !== undefined) {
      updateData.approved_amount = approvedAmount
    }

    const { data, error } = await supabase
      .from('claims')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getClaimDetails(id: string) {
    const { data, error } = await supabase
      .from('claims')
      .select(
        `
        *,
        policies!policy_id (*),
        profiles!user_id (*)
      `
      )
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },
}
