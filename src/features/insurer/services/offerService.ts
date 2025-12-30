import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export type InsurerOfferInput = {
  name: string;
  type: 'tiers_simple' | 'tiers_plus' | 'tous_risques';
  price: number; // monthly price baseline
  coverage: string;
  description: string;
  deductible: number;
  maxCoverage: number;
  duration: number;
  features: string[];
  conditions?: string;
  isActive?: boolean;
};

const typeToContract: Record<string, string> = {
  'tiers_simple': 'basic',
  'tiers_plus': 'third_party_plus',
  'tous_risques': 'all_risks',
};

const contractToType: Record<string, string> = {
  'basic': 'tiers_simple',
  'third_party_plus': 'tiers_plus',
  'all_risks': 'tous_risques',
};

async function getCurrentInsurerId(): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('get_current_insurer_id');
    if (error) throw error;
    return (data as any) || null;
  } catch (e) {
    logger.error('getCurrentInsurerId error', e);
    return null;
  }
}

export async function fetchInsurerOffers() {
  const insurerId = await getCurrentInsurerId();
  if (!insurerId) return [];

  const { data, error } = await supabase
    .from('insurance_offers')
    .select('*')
    .eq('insurer_id', insurerId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createInsurerOffer(input: InsurerOfferInput) {
  const insurerId = await getCurrentInsurerId();
  if (!insurerId) throw new Error("Insurer introuvable pour le compte en cours");

  const id = `offer-${Date.now()}`;
  const { data, error } = await supabase
    .from('insurance_offers')
    .insert({
      id,
      insurer_id: insurerId,
      category_id: 'auto',
      name: input.name,
      description: input.description,
      price_min: input.price,
      price_max: input.price,
      coverage_amount: input.maxCoverage,
      deductible: input.deductible,
      is_active: input.isActive ?? true,
      features: input.features,
      contract_type: typeToContract[input.type] || 'basic',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateInsurerOffer(offerId: string, input: Partial<InsurerOfferInput>) {
  const updates: any = {
    name: input.name,
    description: input.description,
    price_min: input.price,
    price_max: input.price,
    coverage_amount: input.maxCoverage,
    deductible: input.deductible,
    is_active: input.isActive,
    features: input.features,
    contract_type: input.type ? (typeToContract[input.type] || 'basic') : undefined,
    updated_at: new Date().toISOString(),
  };

  Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

  const { data, error } = await supabase
    .from('insurance_offers')
    .update(updates)
    .eq('id', offerId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteInsurerOffer(offerId: string) {
  const { error } = await supabase
    .from('insurance_offers')
    .delete()
    .eq('id', offerId);
  if (error) throw error;
}

// React Query hooks
export function useInsurerOffers() {
  return useQuery({
    queryKey: ['insurer-offers'],
    queryFn: fetchInsurerOffers,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateInsurerOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createInsurerOffer,
    onSuccess: () => {
      toast.success('Offre créée avec succès');
      qc.invalidateQueries({ queryKey: ['insurer-offers'] });
    },
    onError: () => toast.error("Erreur lors de la création de l'offre"),
  });
}

export function useUpdateInsurerOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<InsurerOfferInput> }) => updateInsurerOffer(id, input),
    onSuccess: () => {
      toast.success('Offre mise à jour');
      qc.invalidateQueries({ queryKey: ['insurer-offers'] });
    },
    onError: () => toast.error("Erreur lors de la mise à jour de l'offre"),
  });
}

export function useDeleteInsurerOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteInsurerOffer,
    onSuccess: () => {
      toast.success('Offre supprimée');
      qc.invalidateQueries({ queryKey: ['insurer-offers'] });
    },
    onError: () => toast.error("Erreur lors de la suppression de l'offre"),
  });
}

