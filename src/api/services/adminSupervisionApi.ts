import { apiClient, ApiResponse, PaginatedResponse, PaginationParams } from '../apiClient';

// Types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'USER' | 'INSURER' | 'ADMIN';
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  lastLogin: string;
  phone?: string;
  avatar?: string;
}

export interface Insurer {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  offersCount: number;
  conversionRate: number;
  phone?: string;
  address?: string;
}

export interface Offer {
  id: string;
  title: string;
  insurer: string;
  insurerId: string;
  price: number;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  clicks: number;
  conversions: number;
  description?: string;
}

export interface SupervisionStats {
  users: {
    total: number;
    active: number;
    new: number;
    growth: number;
  };
  insurers: {
    total: number;
    active: number;
    pending: number;
    growth: number;
  };
  offers: {
    total: number;
    active: number;
    pending: number;
    growth: number;
  };
  quotes: {
    total: number;
    converted: number;
    conversionRate: number;
    growth: number;
  };
}

export interface KPI {
  label: string;
  value: string;
  target: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

export interface UserFilters extends PaginationParams {
  search?: string;
  status?: 'all' | 'active' | 'inactive' | 'pending';
  role?: 'all' | 'USER' | 'INSURER' | 'ADMIN';
  dateFrom?: string;
  dateTo?: string;
}

export interface InsurerFilters extends PaginationParams {
  search?: string;
  status?: 'all' | 'active' | 'inactive' | 'pending';
  dateFrom?: string;
  dateTo?: string;
}

export interface OfferFilters extends PaginationParams {
  search?: string;
  status?: 'all' | 'active' | 'inactive' | 'pending';
  insurerId?: string;
  priceMin?: number;
  priceMax?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  role: 'USER' | 'INSURER' | 'ADMIN';
  phone?: string;
  password?: string;
  sendInvitation?: boolean;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: 'USER' | 'INSURER' | 'ADMIN';
  status?: 'active' | 'inactive' | 'pending';
  phone?: string;
}

export interface CreateInsurerRequest {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  description?: string;
}

export interface UpdateInsurerRequest {
  name?: string;
  email?: string;
  status?: 'active' | 'inactive' | 'pending';
  phone?: string;
  address?: string;
  contactPerson?: string;
  description?: string;
}

export interface CreateOfferRequest {
  title: string;
  insurerId: string;
  price: number;
  description?: string;
  status?: 'active' | 'inactive' | 'pending';
}

export interface UpdateOfferRequest {
  title?: string;
  price?: number;
  description?: string;
  status?: 'active' | 'inactive' | 'pending';
}

export class AdminSupervisionApi {
  private readonly baseUrl = '/admin/supervision';

  // Get KPIs
  async getKPIs(): Promise<ApiResponse<KPI[]>> {
    return apiClient.get(`${this.baseUrl}/kpis`);
  }

  // Get supervision statistics
  async getSupervisionStats(): Promise<ApiResponse<SupervisionStats>> {
    return apiClient.get(`${this.baseUrl}/stats`);
  }

  // Get users with pagination and filters
  async getUsers(filters?: UserFilters): Promise<ApiResponse<PaginatedResponse<User>>> {
    return apiClient.getPaginated(`${this.baseUrl}/users`, filters);
  }

  // Get user by ID
  async getUser(userId: string): Promise<ApiResponse<User>> {
    return apiClient.get(`${this.baseUrl}/users/${userId}`);
  }

  // Create user
  async createUser(request: CreateUserRequest): Promise<ApiResponse<User>> {
    return apiClient.post(`${this.baseUrl}/users`, request);
  }

  // Update user
  async updateUser(userId: string, request: UpdateUserRequest): Promise<ApiResponse<User>> {
    return apiClient.put(`${this.baseUrl}/users/${userId}`, request);
  }

  // Delete user
  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.baseUrl}/users/${userId}`);
  }

  // Toggle user status
  async toggleUserStatus(userId: string): Promise<ApiResponse<User>> {
    return apiClient.patch(`${this.baseUrl}/users/${userId}/toggle-status`);
  }

  // Reset user password
  async resetUserPassword(userId: string): Promise<ApiResponse<{ tempPassword: string }>> {
    return apiClient.post(`${this.baseUrl}/users/${userId}/reset-password`);
  }

  // Send user invitation
  async sendUserInvitation(userId: string): Promise<ApiResponse<void>> {
    return apiClient.post(`${this.baseUrl}/users/${userId}/send-invitation`);
  }

  // Get insurers with pagination and filters
  async getInsurers(filters?: InsurerFilters): Promise<ApiResponse<PaginatedResponse<Insurer>>> {
    return apiClient.getPaginated(`${this.baseUrl}/insurers`, filters);
  }

  // Get insurer by ID
  async getInsurer(insurerId: string): Promise<ApiResponse<Insurer>> {
    return apiClient.get(`${this.baseUrl}/insurers/${insurerId}`);
  }

  // Create insurer
  async createInsurer(request: CreateInsurerRequest): Promise<ApiResponse<Insurer>> {
    return apiClient.post(`${this.baseUrl}/insurers`, request);
  }

  // Update insurer
  async updateInsurer(insurerId: string, request: UpdateInsurerRequest): Promise<ApiResponse<Insurer>> {
    return apiClient.put(`${this.baseUrl}/insurers/${insurerId}`, request);
  }

  // Delete insurer
  async deleteInsurer(insurerId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.baseUrl}/insurers/${insurerId}`);
  }

  // Approve insurer
  async approveInsurer(insurerId: string): Promise<ApiResponse<Insurer>> {
    return apiClient.post(`${this.baseUrl}/insurers/${insurerId}/approve`);
  }

  // Reject insurer
  async rejectInsurer(insurerId: string, reason?: string): Promise<ApiResponse<Insurer>> {
    return apiClient.post(`${this.baseUrl}/insurers/${insurerId}/reject`, { reason });
  }

  // Get offers with pagination and filters
  async getOffers(filters?: OfferFilters): Promise<ApiResponse<PaginatedResponse<Offer>>> {
    return apiClient.getPaginated(`${this.baseUrl}/offers`, filters);
  }

  // Get offer by ID
  async getOffer(offerId: string): Promise<ApiResponse<Offer>> {
    return apiClient.get(`${this.baseUrl}/offers/${offerId}`);
  }

  // Create offer
  async createOffer(request: CreateOfferRequest): Promise<ApiResponse<Offer>> {
    return apiClient.post(`${this.baseUrl}/offers`, request);
  }

  // Update offer
  async updateOffer(offerId: string, request: UpdateOfferRequest): Promise<ApiResponse<Offer>> {
    return apiClient.put(`${this.baseUrl}/offers/${offerId}`, request);
  }

  // Delete offer
  async deleteOffer(offerId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.baseUrl}/offers/${offerId}`);
  }

  // Toggle offer status
  async toggleOfferStatus(offerId: string): Promise<ApiResponse<Offer>> {
    return apiClient.patch(`${this.baseUrl}/offers/${offerId}/toggle-status`);
  }

  // Get activity logs
  async getActivityLogs(filters?: {
    page?: number;
    limit?: number;
    entityType?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<PaginatedResponse<{
    id: string;
    entityType: string;
    entityId: string;
    action: string;
    user: string;
    timestamp: string;
    details: string;
    ipAddress?: string;
  }>>> {
    return apiClient.getPaginated(`${this.baseUrl}/activity-logs`, filters);
  }

  // Get system health
  async getSystemHealth(): Promise<ApiResponse<{
    status: 'healthy' | 'warning' | 'critical';
    services: {
      database: 'up' | 'down';
      api: 'up' | 'down';
      storage: 'up' | 'down';
      email: 'up' | 'down';
    };
    metrics: {
      responseTime: number;
      uptime: number;
      memoryUsage: number;
      cpuUsage: number;
    };
    lastCheck: string;
  }>> {
    return apiClient.get(`${this.baseUrl}/health`);
  }

  // Export data
  async exportData(request: {
    entityType: 'users' | 'insurers' | 'offers' | 'activity';
    format: 'csv' | 'xlsx' | 'json';
    filters?: UserFilters | InsurerFilters | OfferFilters | Record<string, unknown>;
  }): Promise<ApiResponse<{ downloadUrl: string }>> {
    return apiClient.post(`${this.baseUrl}/export`, request);
  }

  // Bulk operations
  async bulkUpdateUsers(request: {
    userIds: string[];
    updates: UpdateUserRequest;
  }): Promise<ApiResponse<{ updated: number; failed: string[] }>> {
    return apiClient.post(`${this.baseUrl}/users/bulk-update`, request);
  }

  async bulkUpdateInsurers(request: {
    insurerIds: string[];
    updates: UpdateInsurerRequest;
  }): Promise<ApiResponse<{ updated: number; failed: string[] }>> {
    return apiClient.post(`${this.baseUrl}/insurers/bulk-update`, request);
  }

  async bulkUpdateOffers(request: {
    offerIds: string[];
    updates: UpdateOfferRequest;
  }): Promise<ApiResponse<{ updated: number; failed: string[] }>> {
    return apiClient.post(`${this.baseUrl}/offers/bulk-update`, request);
  }

  async bulkDeleteUsers(request: {
    userIds: string[];
  }): Promise<ApiResponse<{ deleted: number; failed: string[] }>> {
    return apiClient.post(`${this.baseUrl}/users/bulk-delete`, request);
  }

  async bulkDeleteInsurers(request: {
    insurerIds: string[];
  }): Promise<ApiResponse<{ deleted: number; failed: string[] }>> {
    return apiClient.post(`${this.baseUrl}/insurers/bulk-delete`, request);
  }

  async bulkDeleteOffers(request: {
    offerIds: string[];
  }): Promise<ApiResponse<{ deleted: number; failed: string[] }>> {
    return apiClient.post(`${this.baseUrl}/offers/bulk-delete`, request);
  }
}

export const adminSupervisionApi = new AdminSupervisionApi();
