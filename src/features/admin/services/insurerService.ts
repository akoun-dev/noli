import { apiClient } from '@/api/apiClient';

export interface Insurer {
  id: string;
  companyName: string;
  email: string;
  phone?: string;
  address?: string;
  role: 'INSURER';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  createdAt: string;
  lastLogin: string;
  profileCompleted: boolean;
  quotesCount: number;
  offersCount: number;
  conversionRate: number;
  description?: string;
  website?: string;
  licenseNumber?: string;
}

export interface InsurerFormData {
  companyName: string;
  email: string;
  phone?: string;
  address?: string;
  description?: string;
  website?: string;
  licenseNumber?: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
}

export interface InsurerStats {
  total: number;
  active: number;
  pending: number;
  inactive: number;
  suspended: number;
  totalQuotes: number;
  totalOffers: number;
  avgConversionRate: number;
}

class InsurerService {
  private baseURL = '/admin/insurers';

  async getInsurers(): Promise<Insurer[]> {
    const response = await apiClient.get(`${this.baseURL}`);
    return response.data;
  }

  async getInsurerById(id: string): Promise<Insurer> {
    const response = await apiClient.get(`${this.baseURL}/${id}`);
    return response.data;
  }

  async createInsurer(data: InsurerFormData): Promise<Insurer> {
    const response = await apiClient.post(this.baseURL, data);
    return response.data;
  }

  async updateInsurer(id: string, data: Partial<InsurerFormData>): Promise<Insurer> {
    const response = await apiClient.put(`${this.baseURL}/${id}`, data);
    return response.data;
  }

  async deleteInsurer(id: string): Promise<void> {
    await apiClient.delete(`${this.baseURL}/${id}`);
  }

  async updateInsurerStatus(id: string, status: Insurer['status']): Promise<Insurer> {
    const response = await apiClient.patch(`${this.baseURL}/${id}/status`, { status });
    return response.data;
  }

  async approveInsurer(id: string): Promise<Insurer> {
    const response = await apiClient.post(`${this.baseURL}/${id}/approve`);
    return response.data;
  }

  async getInsurerStats(): Promise<InsurerStats> {
    const response = await apiClient.get(`${this.baseURL}/stats`);
    return response.data;
  }

  async exportInsurers(format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const response = await apiClient.get(`${this.baseURL}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  }

  async searchInsurers(query: string): Promise<Insurer[]> {
    const response = await apiClient.get(`${this.baseURL}/search`, {
      params: { q: query }
    });
    return response.data;
  }

  async getInsurersByStatus(status: Insurer['status']): Promise<Insurer[]> {
    const response = await apiClient.get(`${this.baseURL}`, {
      params: { status }
    });
    return response.data;
  }

  async getPendingInsurers(): Promise<Insurer[]> {
    return this.getInsurersByStatus('pending');
  }

  async getActiveInsurers(): Promise<Insurer[]> {
    return this.getInsurersByStatus('active');
  }
}

export const insurerService = new InsurerService();