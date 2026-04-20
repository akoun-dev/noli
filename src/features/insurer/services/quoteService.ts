import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface Quote {
  id: string
  user_id: string
  category_id: string
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  personal_data: any
  vehicle_data: any
  created_at: string
  updated_at: string
}

export const useInsurerQuotes = (insurerId: string) => {
  return useQuery({
    queryKey: ['insurer-quotes', insurerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_offers')
        .select(
          `
          id,
          status,
          price,
          notes,
          quotes:quote_id (
            id,
            user_id,
            category_id,
            status,
            personal_data,
            vehicle_data,
            created_at,
            updated_at
          ),
          profiles:insurer_id (id)
        `
        )
        .eq('insurer_id', insurerId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform to a flatter structure for the UI
      return data.map((qo) => ({
        id: qo.id,
        status: qo.status,
        amount: qo.price,
        notes: qo.notes,
        customer: qo.quotes?.personal_data || {},
        vehicle: qo.quotes?.vehicle_data || {},
        submittedAt: qo.quotes?.created_at,
        quoteId: qo.quotes?.id,
      }))
    },
    enabled: !!insurerId,
  })
}

export const useUpdateQuoteStatus = () => {
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('quote_offers')
        .update({ status })
        .eq('id', id)
        .select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurer-quotes'] })
      toast.success('Statut du devis mis à jour')
    },
  })
}
