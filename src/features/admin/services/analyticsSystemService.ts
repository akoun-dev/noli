import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// Types pour les données analytiques
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newThisMonth: number;
  newThisWeek: number;
  activeThisMonth: number;
  growthRatePercent: number;
  role?: string;
}

export interface QuoteStats {
  status: string;
  totalQuotes: number;
  quotesThisMonth: number;
  quotesThisWeek: number;
  validQuotes: number;
  averagePrice: number;
  totalValue: number;
  categoryName?: string;
  uniqueUsers: number;
}

export interface PolicyStats {
  status: string;
  totalPolicies: number;
  activePolicies: number;
  expiredPolicies: number;
  policiesThisMonth: number;
  totalPremiumAmount: number;
  averagePremium: number;
  paymentFrequency?: string;
  insurerName?: string;
  uniqueCustomers: number;
}

export interface PaymentStats {
  status: string;
  totalPayments: number;
  totalAmount: number;
  averageAmount: number;
  paymentsThisMonth: number;
  paymentsThisWeek: number;
  paymentMethod?: string;
  uniquePayers: number;
}

export interface InsurerPerformance {
  insurerId: string;
  insurerName: string;
  rating: number;
  totalOffers: number;
  activeOffers: number;
  totalQuoteOffers: number;
  approvedOffers: number;
  totalPolicies: number;
  activePremiumRevenue: number;
  averageApprovedPrice: number;
  approvalRatePercent: number;
  uniqueCustomers: number;
}

export interface DailyActivity {
  activityDate: string;
  newUsers: number;
  newQuotes: number;
  newPolicies: number;
  newPayments: number;
}

export interface ConversionFunnel {
  usersCreated: number;
  usersWithQuotes: number;
  quotesCreated: number;
  offersMade: number;
  offersApproved: number;
  policiesIssued: number;
}

export interface CategoryTrend {
  categoryId: string;
  categoryName: string;
  icon: string;
  totalQuotes: number;
  quotesThisMonth: number;
  totalOffersReceived: number;
  approvedOffers: number;
  totalPolicies: number;
  averageQuotePrice: number;
  averageApprovedPrice: number;
  conversionRatePercent: number;
}

export interface PlatformOverview {
  totalUsers: number;
  totalInsurers: number;
  totalQuotes: number;
  totalPolicies: number;
  totalRevenue: number;
  conversionRate: number;
  monthlyGrowth: number;
}

// API Functions pour utiliser les vues analytiques

export const fetchUserStats = async (role?: string): Promise<UserStats[]> => {
  try {
    let query = supabase
      .from('user_stats_view')
      .select('*');

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;

    if (error) {
      logger.warn('user_stats_view non disponible');
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Error in fetchUserStats:', error);
    return [];
  }
};

export const fetchQuoteStats = async (): Promise<QuoteStats[]> => {
  try {
    const { data, error } = await supabase
      .from('quote_stats_view')
      .select('*');

    if (error) {
      logger.warn('quote_stats_view non disponible');
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Error in fetchQuoteStats:', error);
    return [];
  }
};

export const fetchPolicyStats = async (): Promise<PolicyStats[]> => {
  try {
    const { data, error } = await supabase
      .from('policy_stats_view')
      .select('*');

    if (error) {
      logger.warn('policy_stats_view non disponible');
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Error in fetchPolicyStats:', error);
    return [];
  }
};

export const fetchPaymentStats = async (): Promise<PaymentStats[]> => {
  try {
    const { data, error } = await supabase
      .from('payment_stats_view')
      .select('*');

    if (error) {
      logger.warn('payment_stats_view non disponible');
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Error in fetchPaymentStats:', error);
    return [];
  }
};

export const fetchInsurerPerformance = async (): Promise<InsurerPerformance[]> => {
  try {
    const { data, error } = await supabase
      .from('insurer_performance_view')
      .select('*')
      .order('active_premium_revenue', { ascending: false });

    if (error) {
      logger.warn('insurer_performance_view non disponible');
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Error in fetchInsurerPerformance:', error);
    return [];
  }
};

export const fetchDailyActivity = async (days = 30): Promise<DailyActivity[]> => {
  try {
    const { data, error } = await supabase
      .from('daily_activity_view')
      .select('*')
      .order('activity_date', { ascending: false })
      .limit(days);

    // Si la vue n'existe pas (404 ou PGRST116), utiliser un fallback avec audit_logs
    if (error) {
      logger.warn('daily_activity_view non disponible, utilisation de audit_logs comme fallback');

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('action, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      // Agréger les logs par jour
      const groupedData: Record<string, DailyActivity> = {};
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        groupedData[dateKey] = {
          activity_date: dateKey,
          new_users: 0,
          new_quotes: 0,
          new_policies: 0,
          new_payments: 0,
        };
      }

      if (auditLogs) {
        for (const log of auditLogs) {
          const dateKey = log.created_at?.split('T')[0];
          if (dateKey && groupedData[dateKey]) {
            if (log.action === 'ACCOUNT_CREATED') {
              groupedData[dateKey].new_users++;
            } else if (log.action === 'QUOTE_CREATED') {
              groupedData[dateKey].new_quotes++;
            } else if (log.action === 'POLICY_CREATED') {
              groupedData[dateKey].new_policies++;
            } else if (log.action === 'PAYMENT_COMPLETED') {
              groupedData[dateKey].new_payments++;
            }
          }
        }
      }

      return Object.values(groupedData).sort((a, b) =>
        b.activity_date.localeCompare(a.activity_date)
      );
    }

    return data || [];
  } catch (error) {
    logger.error('Error in fetchDailyActivity:', error);
    return [];
  }
};

export const fetchConversionFunnel = async (): Promise<ConversionFunnel> => {
  try {
    const { data, error } = await supabase
      .from('conversion_funnel_view')
      .select('*')
      .single();

    // Si la vue n'existe pas, utiliser un fallback avec audit_logs
    if (error) {
      logger.warn('conversion_funnel_view non disponible, utilisation de audit_logs comme fallback');

      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('action');

      const funnel: ConversionFunnel = {
        usersCreated: 0,
        usersWithQuotes: 0,
        quotesCreated: 0,
        offersMade: 0,
        offersApproved: 0,
        policiesIssued: 0,
      };

      if (auditLogs) {
        for (const log of auditLogs) {
          if (log.action === 'ACCOUNT_CREATED') {
            funnel.usersCreated++;
          } else if (log.action === 'QUOTE_CREATED') {
            funnel.quotesCreated++;
          } else if (log.action === 'OFFER_MADE') {
            funnel.offersMade++;
          } else if (log.action === 'OFFER_APPROVED') {
            funnel.offersApproved++;
          } else if (log.action === 'POLICY_CREATED') {
            funnel.policiesIssued++;
          }
        }
        // Estimer usersWithQuotes comme un pourcentage de usersCreated
        funnel.usersWithQuotes = Math.floor(funnel.quotesCreated > 0
          ? Math.min(funnel.usersCreated, funnel.quotesCreated)
          : Math.floor(funnel.usersCreated * 0.5));
      }

      return funnel;
    }

    return data || {
      usersCreated: 0,
      usersWithQuotes: 0,
      quotesCreated: 0,
      offersMade: 0,
      offersApproved: 0,
      policiesIssued: 0,
    };
  } catch (error) {
    logger.error('Error in fetchConversionFunnel:', error);
    return {
      usersCreated: 0,
      usersWithQuotes: 0,
      quotesCreated: 0,
      offersMade: 0,
      offersApproved: 0,
      policiesIssued: 0,
    };
  }
};

export const fetchCategoryTrends = async (): Promise<CategoryTrend[]> => {
  try {
    const { data, error } = await supabase
      .from('category_trends_view')
      .select('*')
      .order('total_quotes', { ascending: false });

    // Si la vue n'existe pas, retourner un tableau vide
    if (error) {
      logger.warn('category_trends_view non disponible, retour tableau vide');
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Error in fetchCategoryTrends:', error);
    return [];
  }
};

export const fetchPlatformOverview = async (): Promise<PlatformOverview> => {
  try {
    // Utiliser la vue analytique pour les statistiques utilisateur
    const { data: userStats, error: userStatsError } = await supabase
      .from('user_stats_view')
      .select('*');

    const totalUsers = !userStatsError && userStats ? userStats.reduce((sum, stat) => sum + stat.total_users, 0) : 0;
    const totalInsurers = !userStatsError && userStats ? userStats.filter(stat => stat.role === 'INSURER').reduce((sum, stat) => sum + stat.total_users, 0) : 0;
    const newThisMonth = !userStatsError && userStats ? userStats.reduce((sum, stat) => sum + stat.new_this_month, 0) : 0;
    const avgGrowthRate = !userStatsError && userStats && userStats.length > 0
      ? userStats.reduce((sum, stat) => sum + (stat.growth_rate_percent || 0), 0) / userStats.length
      : 0;

    // Utiliser la vue analytique pour les quotes
    const { data: quoteStats, error: quoteStatsError } = await supabase
      .from('quote_stats_view')
      .select('*');

    const totalQuotes = !quoteStatsError && quoteStats ? quoteStats.reduce((sum, stat) => sum + stat.total_quotes, 0) : 0;

    // Utiliser la vue analytique pour les polices
    const { data: policyStats, error: policyStatsError } = await supabase
      .from('policy_stats_view')
      .select('*');

    const totalPolicies = !policyStatsError && policyStats ? policyStats.reduce((sum, stat) => sum + stat.total_policies, 0) : 0;
    const activePolicies = !policyStatsError && policyStats ? policyStats.reduce((sum, stat) => sum + stat.active_policies, 0) : 0;

    // Utiliser la vue analytique pour les assureurs
    const insurerStats = await fetchInsurerPerformance();
    const totalInsurersFromView = insurerStats?.length || 0;

    // Utiliser la vue analytique pour le funnel
    const funnel = await fetchConversionFunnel();
    const conversionRate = funnel?.usersCreated > 0
      ? Math.round((funnel.policiesIssued / funnel.usersCreated) * 10000) / 100
      : 0;

    // Calculer le revenu total à partir des polices actives
    const totalRevenue = !policyStatsError && policyStats ? policyStats.reduce((sum, stat) => sum + (stat.total_premium_amount || 0), 0) : 0;

    // Log warnings if views are not available
    if (userStatsError) {
      logger.warn('user_stats_view non disponible');
    }
    if (quoteStatsError) {
      logger.warn('quote_stats_view non disponible');
    }
    if (policyStatsError) {
      logger.warn('policy_stats_view non disponible');
    }

    return {
      totalUsers,
      totalInsurers: totalInsurersFromView > 0 ? totalInsurersFromView : totalInsurers,
      totalQuotes,
      totalPolicies,
      totalRevenue,
      conversionRate,
      monthlyGrowth: Math.round(avgGrowthRate * 100) / 100,
    };
  } catch (error) {
    logger.error('Error in fetchPlatformOverview:', error);
    // Return default values instead of throwing
    return {
      totalUsers: 0,
      totalInsurers: 0,
      totalQuotes: 0,
      totalPolicies: 0,
      totalRevenue: 0,
      conversionRate: 0,
      monthlyGrowth: 0,
    };
  }
};

// React Query Hooks

export const useUserStats = (role?: string) => {
  return useQuery({
    queryKey: ['analytics', 'user-stats', role],
    queryFn: () => fetchUserStats(role),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useQuoteStats = () => {
  return useQuery({
    queryKey: ['analytics', 'quote-stats'],
    queryFn: fetchQuoteStats,
    staleTime: 5 * 60 * 1000,
  });
};

export const usePolicyStats = () => {
  return useQuery({
    queryKey: ['analytics', 'policy-stats'],
    queryFn: fetchPolicyStats,
    staleTime: 5 * 60 * 1000,
  });
};

export const usePaymentStats = () => {
  return useQuery({
    queryKey: ['analytics', 'payment-stats'],
    queryFn: fetchPaymentStats,
    staleTime: 5 * 60 * 1000,
  });
};

export const useInsurerPerformance = () => {
  return useQuery({
    queryKey: ['analytics', 'insurer-performance'],
    queryFn: fetchInsurerPerformance,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useDailyActivity = (days = 30) => {
  return useQuery({
    queryKey: ['analytics', 'daily-activity', days],
    queryFn: () => fetchDailyActivity(days),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

export const useConversionFunnel = () => {
  return useQuery({
    queryKey: ['analytics', 'conversion-funnel'],
    queryFn: fetchConversionFunnel,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCategoryTrends = () => {
  return useQuery({
    queryKey: ['analytics', 'category-trends'],
    queryFn: fetchCategoryTrends,
    staleTime: 10 * 60 * 1000,
  });
};

export const usePlatformOverview = () => {
  return useQuery({
    queryKey: ['analytics', 'platform-overview'],
    queryFn: fetchPlatformOverview,
    staleTime: 5 * 60 * 1000,
  });
};

// Helper functions

export const calculateConversionRates = (funnel: ConversionFunnel) => {
  const { usersCreated, usersWithQuotes, quotesCreated, offersMade, offersApproved, policiesIssued } = funnel;

  return {
    quoteCreationRate: usersCreated > 0 ? Math.round((usersWithQuotes / usersCreated) * 10000) / 100 : 0,
    offerResponseRate: quotesCreated > 0 ? Math.round((offersMade / quotesCreated) * 10000) / 100 : 0,
    offerApprovalRate: offersMade > 0 ? Math.round((offersApproved / offersMade) * 10000) / 100 : 0,
    policyConversionRate: offersApproved > 0 ? Math.round((policiesIssued / offersApproved) * 10000) / 100 : 0,
    overallConversionRate: usersCreated > 0 ? Math.round((policiesIssued / usersCreated) * 10000) / 100 : 0,
  };
};

export const formatCurrency = (amount: number, currency = 'XOF'): string => {
  return new Intl.NumberFormat('fr-CI', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPercent = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const getGrowthIndicator = (current: number, previous: number): { value: number; isPositive: boolean } => {
  if (previous === 0) return { value: 0, isPositive: true };

  const growth = ((current - previous) / previous) * 100;
  return {
    value: Math.round(Math.abs(growth) * 10) / 10,
    isPositive: growth >= 0,
  };
};

export const getTopPerformers = <T extends Record<string, any>>(
  data: T[],
  metric: keyof T,
  limit = 5
): T[] => {
  return data
    .filter(item => item[metric] !== null && item[metric] !== undefined)
    .sort((a, b) => {
      const aValue = Number(a[metric]);
      const bValue = Number(b[metric]);
      return bValue - aValue;
    })
    .slice(0, limit);
};

export const aggregateStatsByPeriod = (
  data: DailyActivity[],
  period: 'week' | 'month' = 'week'
): DailyActivity[] => {
  const grouped = data.reduce((acc, day) => {
    const date = new Date(day.activityDate);
    let key: string;

    if (period === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!acc[key]) {
      acc[key] = {
        activityDate: key,
        newUsers: 0,
        newQuotes: 0,
        newPolicies: 0,
        newPayments: 0,
      };
    }

    acc[key].newUsers += day.newUsers;
    acc[key].newQuotes += day.newQuotes;
    acc[key].newPolicies += day.newPolicies;
    acc[key].newPayments += day.newPayments;

    return acc;
  }, {} as Record<string, DailyActivity>);

  return Object.values(grouped).sort((a, b) =>
    new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime()
  );
};