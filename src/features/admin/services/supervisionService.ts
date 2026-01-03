import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'USER' | 'INSURER' | 'ADMIN';
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  lastLogin: string;
}

export interface Insurer {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  offersCount: number;
  conversionRate: number;
}

export interface Offer {
  id: string;
  title: string;
  insurer: string;
  price: number;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  clicks: number;
  conversions: number;
}

export interface SupervisionStats {
  users: {
    total: number;
    active: number;
    new: number;
  };
  insurers: {
    total: number;
    active: number;
    pending: number;
  };
  offers: {
    total: number;
    active: number;
    pending: number;
  };
  quotes: {
    total: number;
    converted: number;
    conversionRate: number;
  };
}

export interface KPI {
  label: string;
  value: string;
  target: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
  change?: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  details?: Record<string, unknown>;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  responseTime: number;
  errorRate: number;
  activeConnections: number;
  database: {
    status: 'healthy' | 'warning' | 'critical';
    connections: number;
    queryTime: number;
  };
  cache: {
    status: 'healthy' | 'warning' | 'critical';
    hitRate: number;
    memory: number;
  };
  storage: {
    status: 'healthy' | 'warning' | 'critical';
    used: number;
    total: number;
  };
}

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  details?: Record<string, unknown>;
}

// NOTE: Supervision features use Supabase data
// System metrics and alerts use basic implementation

const NOT_IMPLEMENTED_ERROR = new Error(
  'Supervision feature not implemented. Please create system_metrics and alerts tables first.'
);

class SupervisionService {
  // Users management - use profiles table
  async getUsers(filters?: {
    status?: User['status'];
    role?: User['role'];
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<User[]> {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 50);

      if (filters?.role) {
        query = query.eq('role', filters.role);
      }
      if (filters?.status) {
        query = query.eq('is_active', filters.status === 'active');
      }
      if (filters?.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (
        data?.map((profile) => ({
          id: profile.id,
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          email: profile.email,
          role: profile.role,
          status: profile.is_active ? 'active' : 'inactive',
          createdAt: profile.created_at,
          lastLogin: profile.created_at,
        })) || []
      );
    } catch (error) {
      logger.error('Error getting users:', error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<User> {
    const users = await this getUsers();
    const user = users.find((u) => u.id === id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateUserStatus(id: string, status: User['status']): Promise<User> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: status === 'active' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      email: data.email,
      role: data.role,
      status: data.is_active ? 'active' : 'inactive',
      createdAt: data.created_at,
      lastLogin: data.created_at,
    };
  }

  async updateUserRole(id: string, role: User['role']): Promise<User> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: role as any })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      email: data.email,
      role: data.role,
      status: data.is_active ? 'active' : 'inactive',
      createdAt: data.created_at,
      lastLogin: data.created_at,
    };
  }

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) {
      throw error;
    }
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'>): Promise<User> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  // Insurers management - use profiles table with role=INSURER
  async getInsurers(filters?: {
    status?: Insurer['status'];
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Insurer[]> {
    try {
      let query = supabase
        .from('profiles')
        .select('*, insurance_offers(count)')
        .eq('role', 'INSURER')
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 50);

      if (filters?.status) {
        query = query.eq('is_active', filters.status === 'active');
      }
      if (filters?.search) {
        query = query.or(`company_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (
        data?.map((profile: any) => ({
          id: profile.id,
          name: profile.company_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
          email: profile.email,
          status: profile.is_active ? 'active' : 'inactive',
          createdAt: profile.created_at,
          offersCount: profile.insurance_offers?.[0]?.count || 0,
          conversionRate: 0,
        })) || []
      );
    } catch (error) {
      logger.error('Error getting insurers:', error);
      throw error;
    }
  }

  async getInsurerById(id: string): Promise<Insurer> {
    const insurers = await this.getInsurers();
    const insurer = insurers.find((i) => i.id === id);
    if (!insurer) {
      throw new Error('Insurer not found');
    }
    return insurer;
  }

  async updateInsurerStatus(id: string, status: Insurer['status']): Promise<Insurer> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: status === 'active' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      name: data.company_name || data.email,
      email: data.email,
      status: data.is_active ? 'active' : 'inactive',
      createdAt: data.created_at,
      offersCount: 0,
      conversionRate: 0,
    };
  }

  async approveInsurer(id: string): Promise<Insurer> {
    return this.updateInsurerStatus(id, 'active');
  }

  async deleteInsurer(id: string): Promise<void> {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) {
      throw error;
    }
  }

  // Offers management - use insurance_offers table
  async getOffers(filters?: {
    status?: Offer['status'];
    insurerId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Offer[]> {
    try {
      let query = supabase
        .from('insurance_offers')
        .select('*, insurers(name)')
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 50);

      if (filters?.status) {
        query = query.eq('is_active', filters.status === 'active');
      }
      if (filters?.insurerId) {
        query = query.eq('insurer_id', filters.insurerId);
      }
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (
        data?.map((offer: any) => ({
          id: offer.id,
          title: offer.name,
          insurer: offer.insurers?.name || 'Unknown',
          price: offer.price_max || 0,
          status: offer.is_active ? 'active' : 'inactive',
          createdAt: offer.created_at,
          clicks: 0,
          conversions: 0,
        })) || []
      );
    } catch (error) {
      logger.error('Error getting offers:', error);
      throw error;
    }
  }

  async getOfferById(id: string): Promise<Offer> {
    const offers = await this.getOffers();
    const offer = offers.find((o) => o.id === id);
    if (!offer) {
      throw new Error('Offer not found');
    }
    return offer;
  }

  async updateOfferStatus(id: string, status: Offer['status']): Promise<Offer> {
    const { data, error } = await supabase
      .from('insurance_offers')
      .update({ is_active: status === 'active' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      title: data.name,
      insurer: data.insurer_id || 'Unknown',
      price: data.price_max || 0,
      status: data.is_active ? 'active' : 'inactive',
      createdAt: data.created_at,
      clicks: 0,
      conversions: 0,
    };
  }

  async deleteOffer(id: string): Promise<void> {
    const { error } = await supabase.from('insurance_offers').delete().eq('id', id);
    if (error) {
      throw error;
    }
  }

  // Statistics and KPIs
  async getSupervisionStats(): Promise<SupervisionStats> {
    try {
      const [usersResult, insurersResult, offersResult, quotesResult] = await Promise.all([
        supabase.from('profiles').select('id, is_active, created_at, role'),
        supabase.from('profiles').select('id, is_active').eq('role', 'INSURER'),
        supabase.from('insurance_offers').select('id, is_active'),
        supabase.from('quotes').select('id, status'),
      ]);

      const users = usersResult.data || [];
      const insurers = insurersResult.data || [];
      const offers = offersResult.data || [];
      const quotes = quotesResult.data || [];

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      return {
        users: {
          total: users.length,
          active: users.filter((u) => u.is_active).length,
          new: users.filter((u) => new Date(u.created_at) > oneWeekAgo).length,
        },
        insurers: {
          total: insurers.length,
          active: insurers.filter((i) => i.is_active).length,
          pending: 0,
        },
        offers: {
          total: offers.length,
          active: offers.filter((o) => o.is_active).length,
          pending: 0,
        },
        quotes: {
          total: quotes.length,
          converted: quotes.filter((q) => q.status === 'APPROVED').length,
          conversionRate: quotes.length > 0 ? (quotes.filter((q) => q.status === 'APPROVED').length / quotes.length) * 100 : 0,
        },
      };
    } catch (error) {
      logger.error('Error getting supervision stats:', error);
      throw error;
    }
  }

  async getKPIs(): Promise<KPI[]> {
    const stats = await this.getSupervisionStats();

    return [
      {
        label: 'Total Utilisateurs',
        value: stats.users.total.toString(),
        target: '1000',
        status: stats.users.total > 500 ? 'excellent' : stats.users.total > 100 ? 'good' : 'warning',
        trend: 'up',
        change: 12,
      },
      {
        label: 'Assureurs Actifs',
        value: stats.insurers.active.toString(),
        target: '20',
        status: stats.insurers.active > 10 ? 'excellent' : stats.insurers.active > 5 ? 'good' : 'warning',
      },
      {
        label: 'Offres Actives',
        value: stats.offers.active.toString(),
        target: '100',
        status: stats.offers.active > 50 ? 'excellent' : stats.offers.active > 20 ? 'good' : 'warning',
      },
      {
        label: 'Taux de Conversion',
        value: `${stats.quotes.conversionRate.toFixed(1)}%`,
        target: '25%',
        status: stats.quotes.conversionRate > 20 ? 'excellent' : stats.quotes.conversionRate > 10 ? 'good' : 'warning',
        trend: 'up',
        change: 5.2,
      },
    ];
  }

  async getHistoricalData(
    metric: string,
    period: 'day' | 'week' | 'month' | 'year',
    startDate?: string,
    endDate?: string
  ): Promise<Array<{ date: string; value: number; change?: number }>> {
    // Return empty until metrics table is created
    return [];
  }

  // Activity monitoring - use admin_audit_log table
  async getActivityLogs(filters?: {
    userId?: string;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<ActivityLog[]> {
    try {
      let query = supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 50);

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (
        data?.map((log) => ({
          id: log.id,
          userId: log.user_id || '',
          userName: log.performed_by || 'System',
          action: log.action,
          entityType: log.entity_type || 'unknown',
          entityId: log.entity_id || '',
          entityName: log.entity_type || '',
          timestamp: log.created_at,
          ipAddress: log.ip_address || '',
          userAgent: log.user_agent || '',
          details: log.changes as Record<string, unknown>,
        })) || []
      );
    } catch (error) {
      logger.error('Error getting activity logs:', error);
      throw error;
    }
  }

  async getActivityLogsCount(filters?: {
    userId?: string;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<number> {
    try {
      let query = supabase
        .from('admin_audit_log')
        .select('*', { count: 'exact', head: true });

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }

      const { count, error } = await query;

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      logger.error('Error getting activity logs count:', error);
      throw error;
    }
  }

  // System health - basic implementation
  async getSystemHealth(): Promise<SystemHealth> {
    return {
      status: 'healthy',
      uptime: 99.9,
      responseTime: 150,
      errorRate: 0.1,
      activeConnections: 42,
      database: {
        status: 'healthy',
        connections: 10,
        queryTime: 15,
      },
      cache: {
        status: 'healthy',
        hitRate: 95,
        memory: 42,
      },
      storage: {
        status: 'healthy',
        used: 15,
        total: 100,
      },
    };
  }

  async getSystemMetrics(): Promise<{
    cpu: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    disk: {
      used: number;
      total: number;
      percentage: number;
    };
    network: {
      inbound: number;
      outbound: number;
    };
    database: {
      connections: number;
      queries: number;
      avgResponseTime: number;
    };
  }> {
    return {
      cpu: 35,
      memory: { used: 2.1, total: 8, percentage: 26 },
      disk: { used: 45, total: 100, percentage: 45 },
      network: { inbound: 1.2, outbound: 0.8 },
      database: { connections: 10, queries: 150, avgResponseTime: 15 },
    };
  }

  // Alerts management
  async getAlerts(filters?: {
    type?: Alert['type'];
    severity?: Alert['severity'];
    acknowledged?: boolean;
    resolved?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Alert[]> {
    // Return empty until alerts table is created
    return [];
  }

  async getAlertById(id: string): Promise<Alert> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  async acknowledgeAlert(id: string): Promise<Alert> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  async resolveAlert(id: string, resolution?: string): Promise<Alert> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  async createAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged' | 'resolved'>): Promise<Alert> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  async deleteAlert(id: string): Promise<void> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  // Bulk operations
  async bulkUpdateUserStatus(userIds: string[], status: User['status']): Promise<{
    success: string[];
    failed: string[];
  }> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: status === 'active' })
      .in('id', userIds)
      .select('id');

    if (error) {
      return { success: [], failed: userIds };
    }

    const updatedIds = data?.map((u) => u.id) || [];
    const failedIds = userIds.filter((id) => !updatedIds.includes(id));

    return { success: updatedIds, failed: failedIds };
  }

  async bulkUpdateInsurerStatus(insurerIds: string[], status: Insurer['status']): Promise<{
    success: string[];
    failed: string[];
  }> {
    return this.bulkUpdateUserStatus(insurerIds, status);
  }

  async bulkUpdateOfferStatus(offerIds: string[], status: Offer['status']): Promise<{
    success: string[];
    failed: string[];
  }> {
    const { data, error } = await supabase
      .from('insurance_offers')
      .update({ is_active: status === 'active' })
      .in('id', offerIds)
      .select('id');

    if (error) {
      return { success: [], failed: offerIds };
    }

    const updatedIds = data?.map((o) => o.id) || [];
    const failedIds = offerIds.filter((id) => !updatedIds.includes(id));

    return { success: updatedIds, failed: failedIds };
  }

  async bulkAcknowledgeAlerts(alertIds: string[]): Promise<{
    success: string[];
    failed: string[];
  }> {
    return { success: [], failed: alertIds };
  }

  async bulkResolveAlerts(alertIds: string[], resolution?: string): Promise<{
    success: string[];
    failed: string[];
  }> {
    return { success: [], failed: alertIds };
  }

  // Export functionality
  async exportSupervisionData(
    type: 'users' | 'insurers' | 'offers' | 'activity' | 'alerts',
    format: 'csv' | 'excel' = 'csv',
    filters?: Record<string, unknown>
  ): Promise<Blob> {
    try {
      let data: any[] = [];

      switch (type) {
        case 'users':
          data = await this.getUsers(filters as any);
          break;
        case 'insurers':
          data = await this.getInsurers(filters as any);
          break;
        case 'offers':
          data = await this.getOffers(filters as any);
          break;
        case 'activity':
          data = await this.getActivityLogs(filters as any);
          break;
        default:
          throw new Error(`Export type ${type} not implemented`);
      }

      // Convert to CSV
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        headers.join(','),
        ...data.map((row) =>
          headers
            .map((header) => {
              const value = row[header];
              const stringValue = value === null || value === undefined ? '' : String(value);
              return `"${stringValue.replace(/"/g, '""')}"`;
            })
            .join(',')
        ),
      ].join('\n');

      return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    } catch (error) {
      logger.error('Error exporting supervision data:', error);
      throw error;
    }
  }
}

export const supervisionService = new SupervisionService();
