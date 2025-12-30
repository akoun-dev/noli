import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

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
    is_active: boolean;
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

class OfferService {
  async getOffers(): Promise<Offer[]> {
    try {
      const { data, error } = await supabase
        .from('insurance_offers')
        .select(`
          *,
          insurer:insurers(id, name, description, logo_url, rating, is_active),
          category:insurance_categories(id, name, description, is_active)
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        logger.error('Error fetching offers:', error);
        throw new Error(`Erreur lors du chargement des offres: ${error.message}`);
      }

      return data || [];
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
          category:insurance_categories(id, name, description, is_active)
        `)
        .eq('id', id)
        .single();

      if (error) {
        logger.error(`Error fetching offer ${id}:`, error);
        throw new Error(`Erreur lors du chargement de l'offre: ${error.message}`);
      }

      return data;
    } catch (error) {
      logger.error(`Unexpected error in getOfferById(${id}):`, error);
      throw error;
    }
  }

  async createOffer(data: Partial<Offer>): Promise<Offer> {
    try {
      const { data: offer, error } = await supabase
        .from('insurance_offers')
        .insert({
          insurer_id: data.insurer_id,
          category_id: data.category_id,
          name: data.name,
          description: data.description,
          price_min: data.price_min,
          price_max: data.price_max,
          coverage_amount: data.coverage_amount,
          deductible: data.deductible || 0,
          is_active: data.is_active ?? true,
          features: data.features || [],
          contract_type: data.contract_type
        })
        .select(`
          *,
          insurer:insurers(id, name, description, logo_url, rating, is_active),
          category:insurance_categories(id, name, description, is_active)
        `)
        .single();

      if (error) {
        logger.error('Error creating offer:', error);
        throw new Error(`Erreur lors de la création de l'offre: ${error.message}`);
      }

      return offer;
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
          category:insurance_categories(id, name, description, is_active)
        `)
        .single();

      if (error) {
        logger.error(`Error updating offer ${id}:`, error);
        throw new Error(`Erreur lors de la mise à jour de l'offre: ${error.message}`);
      }

      return offer;
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

      return data || [];
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
          category:insurance_categories(id, name, description, is_active)
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

      return data || [];
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
          category:insurance_categories(id, name, description, is_active)
        `)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) {
        logger.error('Error fetching active offers:', error);
        throw new Error(`Erreur lors du chargement des offres actives: ${error.message}`);
      }

      return data || [];
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
          category:insurance_categories(id, name, description, is_active)
        `)
        .eq('insurer_id', insurerId)
        .order('updated_at', { ascending: false });

      if (error) {
        logger.error(`Error fetching offers for insurer ${insurerId}:`, error);
        throw new Error(`Erreur lors du chargement des offres de l'assureur: ${error.message}`);
      }

      return data || [];
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
          category:insurance_categories(id, name, description, is_active)
        `)
        .eq('category_id', categoryId)
        .order('updated_at', { ascending: false });

      if (error) {
        logger.error(`Error fetching offers for category ${categoryId}:`, error);
        throw new Error(`Erreur lors du chargement des offres de la catégorie: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error(`Unexpected error in getOffersByCategory(${categoryId}):`, error);
      throw error;
    }
  }

  async getAllOffersAnalytics(): Promise<OfferAnalytics[]> {
    try {
      // Get all offers
      const { data: offers, error: offersError } = await supabase
        .from('insurance_offers')
        .select('id, name')
        .eq('is_active', true);

      if (offersError) {
        logger.error('Error fetching offers for analytics:', offersError);
        throw new Error(`Erreur lors du chargement des analytics: ${offersError.message}`);
      }

      // Return mock analytics data for each offer
      // In production, this would come from an analytics table
      const analytics: OfferAnalytics[] = (offers || []).map(offer => ({
        offerId: offer.id,
        period: '30d',
        views: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        ctr: 0,
        conversionRate: 0,
        averagePosition: 0
      }));

      return analytics;
    } catch (error) {
      logger.error('Unexpected error in getAllOffersAnalytics:', error);
      throw error;
    }
  }

  async exportOffers(format: 'csv' | 'xlsx' | 'json' = 'csv'): Promise<Blob> {
    try {
      const offers = await this.getOffers();

      if (format === 'csv') {
        const headers = ['ID', 'Nom', 'Assureur', 'Catégorie', 'Prix Min', 'Prix Max', 'Statut', 'Date de création'];
        const rows = offers.map(offer => [
          offer.id,
          offer.name,
          offer.insurer?.name || 'N/A',
          offer.category?.name || 'N/A',
          offer.price_min?.toString() || 'N/A',
          offer.price_max?.toString() || 'N/A',
          offer.is_active ? 'Actif' : 'Inactif',
          new Date(offer.created_at).toLocaleDateString('fr-FR')
        ]);

        const csvContent = [headers, ...rows]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n');

        return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      }

      if (format === 'json') {
        const jsonContent = JSON.stringify(offers, null, 2);
        return new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      }

      // For xlsx, we would need a library like xlsx - return CSV as fallback
      const headers = ['ID', 'Nom', 'Assureur', 'Catégorie', 'Prix Min', 'Prix Max', 'Statut'];
      const rows = offers.map(offer => [
        offer.id,
        offer.name,
        offer.insurer?.name || 'N/A',
        offer.category?.name || 'N/A',
        offer.price_min?.toString() || 'N/A',
        offer.price_max?.toString() || 'N/A',
        offer.is_active ? 'Actif' : 'Inactif'
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    } catch (error) {
      logger.error('Unexpected error in exportOffers:', error);
      throw error;
    }
  }

  async importOffers(file: File): Promise<{ success: number; errors: string[] }> {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        throw new Error('Fichier vide ou invalide');
      }

      // Skip header row
      const dataLines = lines.slice(1);
      let success = 0;
      const errors: string[] = [];

      for (let i = 0; i < dataLines.length; i++) {
        try {
          const values = dataLines[i].split(',').map(v => v.replace(/^"|"$/g, '').trim());

          if (values.length < 4) {
            errors.push(`Ligne ${i + 2}: Données insuffisantes`);
            continue;
          }

          const [name, insurerId, categoryId, priceMin, priceMax] = values;

          if (!name || !insurerId) {
            errors.push(`Ligne ${i + 2}: Nom ou assureur manquant`);
            continue;
          }

          await this.createOffer({
            insurer_id: insurerId,
            category_id: categoryId || undefined,
            name,
            price_min: priceMin ? parseFloat(priceMin) : undefined,
            price_max: priceMax ? parseFloat(priceMax) : undefined,
            deductible: 0,
            is_active: true,
            features: []
          });

          success++;
        } catch (err) {
          errors.push(`Ligne ${i + 2}: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
        }
      }

      return { success, errors };
    } catch (error) {
      logger.error('Unexpected error in importOffers:', error);
      throw error;
    }
  }
}

export const offerService = new OfferService();