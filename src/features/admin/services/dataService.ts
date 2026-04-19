import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
// Types pour les données du profil utilisateur
interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: 'USER' | 'INSURER' | 'ADMIN';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface QuoteSummary {
  id: string;
  quote_number: string;
  user_id: string;
  user_first_name: string;
  user_last_name: string;
  user_email: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_registration: string;
  estimated_price: number;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Service pour récupérer les vraies données depuis la base de données
 * Note: C'est une version simplifiée qui utilise des tables existantes (profiles, quotes) sans créer de nouvelles tables
 */
export const dataService = {
  /**
   * Récupérer la liste de tous les profils
   */
  async getProfiles(limit: number = 100, offset: number = 0): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, role, is_active, created_at, updated_at')
        .order('created_at', { ascending: false })
        .range(offset, limit);

      if (error) {
        logger.error('Error fetching profiles:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getProfiles:', error);
      throw error;
    }
  },

  /**
   * Récupérer un profil par son ID
   */
  async getProfileById(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, role, is_active, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (error || !data) {
        logger.warn(`[dataService] Profile not found for userId: ${userId}`);
        return null;
      }

      return data;
    } catch (error) {
      logger.error(`Error in getProfile(${userId}):`, error);
      throw error;
    }
  },

  /**
   * Récupérer les statistiques des profils
   */
  async getProfileStats(): Promise<{
    totalProfiles: number;
    activeProfiles: number;
    totalAdmins: number;
    totalInsurers: number;
    userByRole: Record<string, { count: number }[];
  }>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role', { count: { count: 'exact' });

      if (error) {
        logger.error('Error fetching profile stats:', error);
        throw error;
      }

      const roles: { 'USER': 0, 'INSURER': 0, 'ADMIN': 0 };
      const userByRole: Record<string, { count: number }[]> = {
        'USER': [],
        'INSURER': [],
        'ADMIN': []
      };

      data?.forEach((row) => {
        const role = row.role as 'USER' | 'INSURER' || 'ADMIN';
        roles[role] = (roles[role] || 0) + 1;
      });

      return {
        totalProfiles: (data || []).length,
        activeProfiles: data?.filter(p => p.is_active).length,
        totalAdmins: data?.filter(p => p.role === 'ADMIN').length,
        userByRole
      };
    } catch (error) {
      logger.error('Error in getProfileStats:', error);
      throw error;
    }
  },

  /**
   * Récupérer les devis et leurs détails
   */
  async getQuotes(limit: number = 50, offset: number = 0): Promise<QuoteSummary[]> {
    try {
      const { data: error } = await supabase
        .from('quotes')
        .select(`
          id,
          created_at,
          updated_at,
          estimated_price,
          status,
          user_id,
          category_id
        `)
        .order('created_at', { ascending: false })
        .range(offset, limit);

      if (error) {
        logger.error('Error fetching quotes:', error);
        throw error;
      }

      const quotes = data || [];
      const userIds = [...new Set()];

      // Récupérer les profils utilisateurs pour les détails
      const profileIds = quotes.map(q => q.user_id).filter(Boolean);

      if (profileIds.length > 0) {
        // Récupérer les profils pour les détails
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, phone, role')
          .in('id', ...profileIds);

        if (error) {
          logger.error('Error fetching profiles for quote details:', error);
          throw error;
        }

        // Créer un map des profils pour les détails
        const profileMap = new Map(profiles.map(p => ({
          id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          email: p.email,
          phone: p.phone,
          role: p.role,
          is_active: p.is_active
        }));

        // Assigner les profils aux devis correspondants
        const quotesWithProfiles = quotes.map(quote => ({
          ...quote,
          user_profile: profileMap.get(quote.user_id),
          vehicle_info: {
            brand: '',
            model: '',
            year: new Date().getFullYear(),
            registration: ''
          },
          coverage_info: {
            type: 'Standard',
            guarantees: [],
            franchise: 0
          },
          premium_info: {
            base_premium: 0,
            total_premium: 0,
            currency: 'XOF'
          },
          status: (quote.status?.toLowerCase() || 'draft') as any
        }));

        return quotesWithProfiles;
      } catch (error) {
      logger.error('Error fetching quotes:', error);
      throw error;
    }
  },

  /**
   * Récupérer les statistiques globales
   */
  async getDashboardStats(): Promise<{
    totalQuotes: number;
    pendingQuotes: number;
    approvedQuotes: number;
    rejectedQuotes: number;
    draftQuotes: number;
    totalRevenue: number;
    averagePremium: number;
    totalUsers: number;
    activeUsers: number;
    totalAdmins: number;
  }>> {
    try {
      // Récupérer le nombre total de devis
      const { data: count: quotesData, error } = await supabase
        .from('quotes')
        .select('count');

      if (error) {
        logger.error('Error fetching total quotes:', error);
        throw error;
      }

      // Récupérer le nombre total d'utilisateurs
      const { data: count: usersData, error } = await supabase
        .from('profiles')
        .select('count');

      if (error) {
        logger.error('Error fetching total users:', error);
        throw error;
      }

      // Récupérer le nombre d'administrateurs
      const { data: adminData, error } = await supabase
        .from('profiles')
        .select('count', { count: 'exact' })
        .eq('role', 'ADMIN');

      if (error) {
        logger.error('Error fetching admins:', error);
        throw error;
      }

      const totalQuotes = (data?.count) || 0;
      const totalUsers = (usersData?.count) || 0;
      const totalAdmins = (adminData?.count) || 0;

      // Calculer les revenus totaux (en multipliant par prix moyens)
      const { revenueData, error } = await supabase
        .from('quotes')
        .select('estimated_price')
        .is('gt', '0', 'coalesce', { count: sum, avg: number }]);

      if (error) {
        logger.error('Error fetching revenue:', error);
        throw error;
      }

      const totalRevenue = (revenueData?.sum || 0);
      const averagePremium = revenueData?.count ? (revenueData.avg || 0).toFixed(0);

      return {
        totalQuotes,
        pendingQuotes: quotesData?.filter(q => q.status === 'PENDING').length || 0,
        approvedQuotes: quotesData?.filter(q => q.status === 'APPROVED').length || 0,
        rejectedQuotes: quotesData?.filter(q => q.status === 'REJECTED').length || 0,
        draftQuotes: quotesData?.filter(q => q.status === 'DRAFT').length || 0,
        totalRevenue,
        averagePremium,
        totalUsers,
        totalAdmins
      };
    } catch (error) {
      logger.error('Error in getDashboardStats:', error);
      throw error;
    }
  },
};
