import { apiClient } from '@/api/apiClient';

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

class SupervisionService {
  private baseURL = '/admin/supervision';

  // Users management
  async getUsers(filters?: {
    status?: User['status'];
    role?: User['role'];
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<User[]> {
    const response = await apiClient.get(`${this.baseURL}/users`, {
      params: filters
    });
    return response.data;
  }

  async getUserById(id: string): Promise<User> {
    const response = await apiClient.get(`${this.baseURL}/users/${id}`);
    return response.data;
  }

  async updateUserStatus(id: string, status: User['status']): Promise<User> {
    const response = await apiClient.patch(`${this.baseURL}/users/${id}/status`, {
      status
    });
    return response.data;
  }

  async updateUserRole(id: string, role: User['role']): Promise<User> {
    const response = await apiClient.patch(`${this.baseURL}/users/${id}/role`, {
      role
    });
    return response.data;
  }

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`${this.baseURL}/users/${id}`);
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'>): Promise<User> {
    const response = await apiClient.post(`${this.baseURL}/users`, userData);
    return response.data;
  }

  // Insurers management
  async getInsurers(filters?: {
    status?: Insurer['status'];
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Insurer[]> {
    const response = await apiClient.get(`${this.baseURL}/insurers`, {
      params: filters
    });
    return response.data;
  }

  async getInsurerById(id: string): Promise<Insurer> {
    const response = await apiClient.get(`${this.baseURL}/insurers/${id}`);
    return response.data;
  }

  async updateInsurerStatus(id: string, status: Insurer['status']): Promise<Insurer> {
    const response = await apiClient.patch(`${this.baseURL}/insurers/${id}/status`, {
      status
    });
    return response.data;
  }

  async approveInsurer(id: string): Promise<Insurer> {
    const response = await apiClient.post(`${this.baseURL}/insurers/${id}/approve`);
    return response.data;
  }

  async deleteInsurer(id: string): Promise<void> {
    await apiClient.delete(`${this.baseURL}/insurers/${id}`);
  }

  // Offers management
  async getOffers(filters?: {
    status?: Offer['status'];
    insurerId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Offer[]> {
    const response = await apiClient.get(`${this.baseURL}/offers`, {
      params: filters
    });
    return response.data;
  }

  async getOfferById(id: string): Promise<Offer> {
    const response = await apiClient.get(`${this.baseURL}/offers/${id}`);
    return response.data;
  }

  async updateOfferStatus(id: string, status: Offer['status']): Promise<Offer> {
    const response = await apiClient.patch(`${this.baseURL}/offers/${id}/status`, {
      status
    });
    return response.data;
  }

  async deleteOffer(id: string): Promise<void> {
    await apiClient.delete(`${this.baseURL}/offers/${id}`);
  }

  // Statistics and KPIs
  async getSupervisionStats(): Promise<SupervisionStats> {
    const response = await apiClient.get(`${this.baseURL}/stats`);
    return response.data;
  }

  async getKPIs(): Promise<KPI[]> {
    const response = await apiClient.get(`${this.baseURL}/kpis`);
    return response.data;
  }

  async getHistoricalData(
    metric: string,
    period: 'day' | 'week' | 'month' | 'year',
    startDate?: string,
    endDate?: string
  ): Promise<Array<{
    date: string;
    value: number;
    change?: number;
  }>> {
    const response = await apiClient.get(`${this.baseURL}/metrics/${metric}`, {
      params: { period, startDate, endDate }
    });
    return response.data;
  }

  // Activity monitoring
  async getActivityLogs(filters?: {
    userId?: string;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<ActivityLog[]> {
    const response = await apiClient.get(`${this.baseURL}/activity`, {
      params: filters
    });
    return response.data;
  }

  async getActivityLogsCount(filters?: {
    userId?: string;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<number> {
    const response = await apiClient.get(`${this.baseURL}/activity/count`, {
      params: filters
    });
    return response.data;
  }

  // System health
  async getSystemHealth(): Promise<SystemHealth> {
    const response = await apiClient.get(`${this.baseURL}/health`);
    return response.data;
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
    const response = await apiClient.get(`${this.baseURL}/metrics`);
    return response.data;
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
    const response = await apiClient.get(`${this.baseURL}/alerts`, {
      params: filters
    });
    return response.data;
  }

  async getAlertById(id: string): Promise<Alert> {
    const response = await apiClient.get(`${this.baseURL}/alerts/${id}`);
    return response.data;
  }

  async acknowledgeAlert(id: string): Promise<Alert> {
    const response = await apiClient.post(`${this.baseURL}/alerts/${id}/acknowledge`);
    return response.data;
  }

  async resolveAlert(id: string, resolution?: string): Promise<Alert> {
    const response = await apiClient.post(`${this.baseURL}/alerts/${id}/resolve`, {
      resolution
    });
    return response.data;
  }

  async createAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged' | 'resolved'>): Promise<Alert> {
    const response = await apiClient.post(`${this.baseURL}/alerts`, alert);
    return response.data;
  }

  async deleteAlert(id: string): Promise<void> {
    await apiClient.delete(`${this.baseURL}/alerts/${id}`);
  }

  // Bulk operations
  async bulkUpdateUserStatus(userIds: string[], status: User['status']): Promise<{
    success: string[];
    failed: string[];
  }> {
    const response = await apiClient.post(`${this.baseURL}/users/bulk-status`, {
      userIds,
      status
    });
    return response.data;
  }

  async bulkUpdateInsurerStatus(insurerIds: string[], status: Insurer['status']): Promise<{
    success: string[];
    failed: string[];
  }> {
    const response = await apiClient.post(`${this.baseURL}/insurers/bulk-status`, {
      insurerIds,
      status
    });
    return response.data;
  }

  async bulkUpdateOfferStatus(offerIds: string[], status: Offer['status']): Promise<{
    success: string[];
    failed: string[];
  }> {
    const response = await apiClient.post(`${this.baseURL}/offers/bulk-status`, {
      offerIds,
      status
    });
    return response.data;
  }

  async bulkAcknowledgeAlerts(alertIds: string[]): Promise<{
    success: string[];
    failed: string[];
  }> {
    const response = await apiClient.post(`${this.baseURL}/alerts/bulk-acknowledge`, {
      alertIds
    });
    return response.data;
  }

  async bulkResolveAlerts(alertIds: string[], resolution?: string): Promise<{
    success: string[];
    failed: string[];
  }> {
    const response = await apiClient.post(`${this.baseURL}/alerts/bulk-resolve`, {
      alertIds,
      resolution
    });
    return response.data;
  }

  // Export functionality
  async exportSupervisionData(
    type: 'users' | 'insurers' | 'offers' | 'activity' | 'alerts',
    format: 'csv' | 'excel' = 'csv',
    filters?: Record<string, unknown>
  ): Promise<Blob> {
    const response = await apiClient.get(`${this.baseURL}/export/${type}`, {
      params: { format, ...filters },
      responseType: 'blob'
    });
    return response.data;
  }
}

export const supervisionService = new SupervisionService();