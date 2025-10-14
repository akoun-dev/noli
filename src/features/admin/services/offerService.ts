import { apiClient } from '@/api/apiClient';

export interface Offer {
  id: string;
  title: string;
  description: string;
  insurer: string;
  insurerId: string;
  price: number;
  currency: string;
  category: string;
  coverage: string[];
  features: string[];
  status: 'active' | 'inactive' | 'pending' | 'draft';
  visibility: 'public' | 'private';
  createdAt: string;
  updatedAt: string;
  validUntil?: string;
  clicks: number;
  conversions: number;
  conversionRate: number;
  averageRating: number;
  reviewCount: number;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
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
  private baseURL = '/admin/offers';

  async getOffers(): Promise<Offer[]> {
    const response = await apiClient.get(`${this.baseURL}`);
    return response.data;
  }

  async getOfferById(id: string): Promise<Offer> {
    const response = await apiClient.get(`${this.baseURL}/${id}`);
    return response.data;
  }

  async createOffer(data: OfferFormData): Promise<Offer> {
    const response = await apiClient.post(this.baseURL, data);
    return response.data;
  }

  async updateOffer(id: string, data: Partial<OfferFormData>): Promise<Offer> {
    const response = await apiClient.put(`${this.baseURL}/${id}`, data);
    return response.data;
  }

  async deleteOffer(id: string): Promise<void> {
    await apiClient.delete(`${this.baseURL}/${id}`);
  }

  async duplicateOffer(id: string): Promise<Offer> {
    const response = await apiClient.post(`${this.baseURL}/${id}/duplicate`);
    return response.data;
  }

  async updateOfferStatus(id: string, status: Offer['status']): Promise<Offer> {
    const response = await apiClient.patch(`${this.baseURL}/${id}/status`, { status });
    return response.data;
  }

  async getOfferAnalytics(id: string, period: string = '30d'): Promise<OfferAnalytics> {
    const response = await apiClient.get(`${this.baseURL}/${id}/analytics`, {
      params: { period }
    });
    return response.data;
  }

  async getAllOffersAnalytics(period: string = '30d'): Promise<OfferAnalytics[]> {
    const response = await apiClient.get(`${this.baseURL}/analytics`, {
      params: { period }
    });
    return response.data;
  }

  async getOfferStats(): Promise<OfferStats> {
    const response = await apiClient.get(`${this.baseURL}/stats`);
    return response.data;
  }

  async getInsurers(): Promise<Insurer[]> {
    const response = await apiClient.get(`${this.baseURL}/insurers`);
    return response.data;
  }

  async getCategories(): Promise<OfferCategory[]> {
    const response = await apiClient.get(`${this.baseURL}/categories`);
    return response.data;
  }

  async exportOffers(format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const response = await apiClient.get(`${this.baseURL}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  }

  async importOffers(file: File): Promise<{ success: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(`${this.baseURL}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async searchOffers(query: string, filters?: {
    status?: Offer['status'];
    insurerId?: string;
    category?: string;
  }): Promise<Offer[]> {
    const response = await apiClient.get(`${this.baseURL}/search`, {
      params: { q: query, ...filters }
    });
    return response.data;
  }

  async getOffersByStatus(status: Offer['status']): Promise<Offer[]> {
    const response = await apiClient.get(`${this.baseURL}`, {
      params: { status }
    });
    return response.data;
  }

  async getOffersByInsurer(insurerId: string): Promise<Offer[]> {
    const response = await apiClient.get(`${this.baseURL}`, {
      params: { insurerId }
    });
    return response.data;
  }

  async getOffersByCategory(category: string): Promise<Offer[]> {
    const response = await apiClient.get(`${this.baseURL}`, {
      params: { category }
    });
    return response.data;
  }

  async getActiveOffers(): Promise<Offer[]> {
    return this.getOffersByStatus('active');
  }

  async getPendingOffers(): Promise<Offer[]> {
    return this.getOffersByStatus('pending');
  }

  async getTopPerformingOffers(limit: number = 5): Promise<Offer[]> {
    const response = await apiClient.get(`${this.baseURL}/top-performing`, {
      params: { limit }
    });
    return response.data;
  }
}

export const offerService = new OfferService();