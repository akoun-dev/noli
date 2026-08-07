import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { Database } from '@/types/database';

type InsurerRel = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  rating: number | null;
  is_active: boolean;
};
type CategoryRel = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
};
type OfferRow = Database['public']['Tables']['insurance_offers']['Row'] & {
  insurer?: InsurerRel | InsurerRel[] | null;
  category?: CategoryRel | CategoryRel[] | null;
};

function firstJoined<T>(rel: T | T[] | null | undefined): T | undefined {
  if (!rel) return undefined;
  return Array.isArray(rel) ? rel[0] : rel;
}

export interface Offer {
  id: string;
  insurer_id: string;
  category_id?: string;
  name: string;
  description?: string;
  price_min?: number;
  price_max?: number;
  coverage_amount?: number;
  deductible: number;
  is_active: boolean;
  features: string[];
  contract_type?: string;
  created_at: string;
  updated_at: string;
  // Joined insurer info
  insurer?: {
    id: string;
    name: string;
    description?: string;
    logo_url?: string;
    rating?: number;
    is_active: boolean;
  };
  // Joined category info
  category?: {
    id: string;
    name: string;
    description?: string;
    icon?: string;
  };
}

export interface Insurer {
  id: string;
  name: string;
  logo?: string;
  status: 'active' | 'inactive' | 'pending';
}

export interface OfferAnalytics {
  offerId: string;
  period: string;
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number; // Click-through rate
  conversionRate: number;
  averagePosition: number;
}

export interface OfferFormData {
  title: string;
  description: string;
  insurerId: string;
  price: number;
  currency: string;
  category: string;
  status: 'active' | 'inactive' | 'pending' | 'draft';
  visibility: 'public' | 'private';
  priority: 'low' | 'medium' | 'high';
  validUntil?: string;
  coverage: string[];
  features: string[];
  tags: string[];
}

export interface OfferStats {
  total: number;
  active: number;
  pending: number;
  draft: number;
  inactive: number;
  totalClicks: number;
  totalConversions: number;
  avgConversionRate: number;
  totalRevenue: number;
  topPerforming: Offer[];
}

export interface OfferCategory {
  value: string;
  label: string;
}

function mapOffer(row: OfferRow): Offer {
  const insurer = firstJoined(row.insurer);
  const category = firstJoined(row.category);
  return {
    id: row.id,
    insurer_id: row.insurer_id,
    category_id: row.category_id ?? undefined,
    name: row.name,
    description: row.description ?? undefined,
    price_min: row.price_min ?? undefined,
    price_max: row.price_max ?? undefined,
    coverage_amount: row.coverage_amount ?? undefined,
    deductible: row.deductible,
    is_active: row.is_active,
    features: row.features ?? [],
    contract_type: row.contract_type ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
    insurer: insurer
      ? {
          id: insurer.id,
          name: insurer.name,
          description: insurer.description ?? undefined,
          logo_url: insurer.logo_url ?? undefined,
          rating: insurer.rating ?? undefined,
          is_active: insurer.is_active,
        }
      : undefined,
    category: category
      ? {
          id: category.id,
          name: category.name,
          description: category.description ?? undefined,
          icon: category.icon ?? undefined,
        }
      : undefined,
  };
}

class OfferService {
  async getOffers(): Promise<Offer[]> {
    try {
      const { data, error } = await supabase
        .from('insurance_offers')
        .select(`
          *,
          insurer:insurers(id, name, description, logo_url, rating, is_active),
          category:insurance_categories(id, name, description, icon)
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        logger.error('Error fetching offers:', error);
        throw new Error(`Erreur lors du chargement des offres: ${error.message}`);
      }

      return (data || []).map(mapOffer);
    } catch (error) {
      logger.error('Unexpected error in getOffers:', error);
      throw error;
    }
  }

  async getOfferById(id: string): Promise<Offer | null> {
    try {
      const { data, error } = await supabase
        .from('insurance_offers')
        .select(`
          *,
          insurer:insurers(id, name, description, logo_url, rating, is_active),
          category:insurance_categories(id, name, description, icon)
        `)
        .eq('id', id)
        .single();

      if (error) {
        logger.error(`Error fetching offer ${id}:`, error);
        throw new Error(`Erreur lors du chargement de l'offre: ${error.message}`);
      }

      return data ? mapOffer(data) : null;
    } catch (error) {
      logger.error(`Unexpected error in getOfferById(${id}):`, error);
      throw error;
    }
  }

  async createOffer(data: Partial<Offer>): Promise<Offer> {
    try {
      const insertPayload: Database['public']['Tables']['insurance_offers']['Insert'] = {
        insurer_id: data.insurer_id ?? '',
        category_id: data.category_id ?? '',
        name: data.name ?? '',
        description: data.description ?? null,
        price_min: data.price_min ?? null,
        price_max: data.price_max ?? null,
        coverage_amount: data.coverage_amount ?? null,
        deductible: data.deductible ?? 0,
        is_active: data.is_active ?? true,
        features: data.features ?? [],
        contract_type: data.contract_type ?? null,
      };

      const { data: offer, error } = await supabase
        .from('insurance_offers')
        .insert(insertPayload)
        .select(`
          *,
          insurer:insurers(id, name, description, logo_url, rating, is_active),
          category:insurance_categories(id, name, description, icon)
        `)
        .single();

      if (error) {
        logger.error('Error creating offer:', error);
        throw new Error(`Erreur lors de la création de l'offre: ${error.message}`);
      }

      return mapOffer(offer);
    } catch (error) {
      logger.error('Unexpected error in createOffer:', error);
      throw error;
    }
  }

  async updateOffer(id: string, data: Partial<Offer>): Promise<Offer> {
    try {
      const { data: offer, error } = await supabase
        .from('insurance_offers')
        .update({
          category_id: data.category_id,
          name: data.name,
          description: data.description,
          price_min: data.price_min,
          price_max: data.price_max,
          coverage_amount: data.coverage_amount,
          deductible: data.deductible,
          is_active: data.is_active,
          features: data.features,
          contract_type: data.contract_type,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          insurer:insurers(id, name, description, logo_url, rating, is_active),
          category:insurance_categories(id, name, description, icon)
        `)
        .single();

      if (error) {
        logger.error(`Error updating offer ${id}:`, error);
        throw new Error(`Erreur lors de la mise à jour de l'offre: ${error.message}`);
      }

      return mapOffer(offer);
    } catch (error) {
      logger.error(`Unexpected error in updateOffer(${id}):`, error);
      throw error;
    }
  }

  async deleteOffer(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('insurance_offers')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error(`Error deleting offer ${id}:`, error);
        throw new Error(`Erreur lors de la suppression de l'offre: ${error.message}`);
      }
    } catch (error) {
      logger.error(`Unexpected error in deleteOffer(${id}):`, error);
      throw error;
    }
  }

  async duplicateOffer(id: string): Promise<Offer> {
    try {
      // First get the original offer
      const originalOffer = await this.getOfferById(id);
      if (!originalOffer) {
        throw new Error('Offre introuvable');
      }

      // Create a duplicate with a new name
      const duplicatedOffer = await this.createOffer({
        insurer_id: originalOffer.insurer_id,
        category_id: originalOffer.category_id,
        name: `${originalOffer.name} (copie)`,
        description: originalOffer.description,
        price_min: originalOffer.price_min,
        price_max: originalOffer.price_max,
        coverage_amount: originalOffer.coverage_amount,
        deductible: originalOffer.deductible,
        features: originalOffer.features,
        contract_type: originalOffer.contract_type
      });

      return duplicatedOffer;
    } catch (error) {
      logger.error(`Error duplicating offer ${id}:`, error);
      throw error;
    }
  }

  async updateOfferStatus(id: string, isActive: boolean): Promise<Offer> {
    return this.updateOffer(id, { is_active: isActive });
  }

  async getOfferStats(): Promise<OfferStats> {
    try {
      const { data: offers, error: offersError } = await supabase
        .from('insurance_offers')
        .select('is_active');

      if (offersError) {
        logger.error('Error fetching offer stats:', offersError);
        throw new Error(`Erreur lors du chargement des statistiques: ${offersError.message}`);
      }

      const stats: OfferStats = {
        total: offers?.length || 0,
        active: offers?.filter(o => o.is_active).length || 0,
        pending: 0,
        draft: 0,
        inactive: offers?.filter(o => !o.is_active).length || 0,
        totalClicks: 0,
        totalConversions: 0,
        avgConversionRate: 0,
        totalRevenue: 0,
        topPerforming: []
      };

      return stats;
    } catch (error) {
      logger.error('Unexpected error in getOfferStats:', error);
      throw error;
    }
  }

  async getInsurers(): Promise<Insurer[]> {
    try {
      const { data, error } = await supabase
        .from('insurers')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        logger.error('Error fetching insurers:', error);
        throw new Error(`Erreur lors du chargement des assureurs: ${error.message}`);
      }

      return (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        logo: row.logo_url ?? undefined,
        status: row.is_active ? 'active' : 'inactive',
      }));
    } catch (error) {
      logger.error('Unexpected error in getInsurers:', error);
      throw error;
    }
  }

  async getCategories(): Promise<OfferCategory[]> {
    try {
      const { data, error } = await supabase
        .from('insurance_categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        logger.error('Error fetching categories:', error);
        throw new Error(`Erreur lors du chargement des catégories: ${error.message}`);
      }

      return data?.map(cat => ({
        value: cat.id,
        label: cat.name
      })) || [];
    } catch (error) {
      logger.error('Unexpected error in getCategories:', error);
      throw error;
    }
  }

  // Simplified methods that use the main getOffers with filters
  async searchOffers(query: string, filters?: {
    insurerId?: string;
    categoryId?: string;
  }): Promise<Offer[]> {
    try {
      let queryBuilder = supabase
        .from('insurance_offers')
        .select(`
          *,
          insurer:insurers(id, name, description, logo_url, rating, is_active),
          category:insurance_categories(id, name, description, icon)
        `);

      // Apply filters
      if (query) {
        queryBuilder = queryBuilder.ilike('name', `%${query}%`);
      }

      if (filters?.insurerId) {
        queryBuilder = queryBuilder.eq('insurer_id', filters.insurerId);
      }

      if (filters?.categoryId) {
        queryBuilder = queryBuilder.eq('category_id', filters.categoryId);
      }

      const { data, error } = await queryBuilder.order('updated_at', { ascending: false });

      if (error) {
        logger.error('Error searching offers:', error);
        throw new Error(`Erreur lors de la recherche des offres: ${error.message}`);
      }

      return (data || []).map(mapOffer);
    } catch (error) {
      logger.error('Unexpected error in searchOffers:', error);
      throw error;
    }
  }

  async getActiveOffers(): Promise<Offer[]> {
    try {
      const { data, error } = await supabase
        .from('insurance_offers')
        .select(`
          *,
          insurer:insurers(id, name, description, logo_url, rating, is_active),
          category:insurance_categories(id, name, description, icon)
        `)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) {
        logger.error('Error fetching active offers:', error);
        throw new Error(`Erreur lors du chargement des offres actives: ${error.message}`);
      }

      return (data || []).map(mapOffer);
    } catch (error) {
      logger.error('Unexpected error in getActiveOffers:', error);
      throw error;
    }
  }

  async getOffersByInsurer(insurerId: string): Promise<Offer[]> {
    try {
      const { data, error } = await supabase
        .from('insurance_offers')
        .select(`
          *,
          insurer:insurers(id, name, description, logo_url, rating, is_active),
          category:insurance_categories(id, name, description, icon)
        `)
        .eq('insurer_id', insurerId)
        .order('updated_at', { ascending: false });

      if (error) {
        logger.error(`Error fetching offers for insurer ${insurerId}:`, error);
        throw new Error(`Erreur lors du chargement des offres de l'assureur: ${error.message}`);
      }

      return (data || []).map(mapOffer);
    } catch (error) {
      logger.error(`Unexpected error in getOffersByInsurer(${insurerId}):`, error);
      throw error;
    }
  }

  async getOffersByCategory(categoryId: string): Promise<Offer[]> {
    try {
      const { data, error } = await supabase
        .from('insurance_offers')
        .select(`
          *,
          insurer:insurers(id, name, description, logo_url, rating, is_active),
          category:insurance_categories(id, name, description, icon)
        `)
        .eq('category_id', categoryId)
        .order('updated_at', { ascending: false });

      if (error) {
        logger.error(`Error fetching offers for category ${categoryId}:`, error);
        throw new Error(`Erreur lors du chargement des offres de la catégorie: ${error.message}`);
      }

      return (data || []).map(mapOffer);
    } catch (error) {
      logger.error(`Unexpected error in getOffersByCategory(${categoryId}):`, error);
      throw error;
    }
  }
}

export const offerService = new OfferService();