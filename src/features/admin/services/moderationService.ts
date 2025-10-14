import { apiClient } from '@/api/apiClient';

export interface Review {
  id: string;
  user: {
    name: string;
    avatar: string;
    email: string;
  };
  insurer: string;
  rating: number;
  title: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  flagged: boolean;
  flaggedReason?: string;
  createdAt: string;
  helpfulCount: number;
  reportCount: number;
}

export interface Report {
  id: string;
  type: 'review' | 'user' | 'insurer' | 'content';
  target: string;
  reporter: string;
  reason: string;
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  assignedTo?: string;
}

export interface ContentItem {
  id: string;
  type: 'insurer_description' | 'offer_content' | 'blog_post' | 'page_content';
  title: string;
  author: string;
  content: string;
  status: 'published' | 'draft' | 'pending_review' | 'rejected';
  lastModified: string;
  wordCount: number;
  issues?: string[];
}

export interface AuditLog {
  id: string;
  action: string;
  target: string;
  user: string;
  timestamp: string;
  details: string;
  ipAddress: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface ModerationStats {
  pendingReviews: number;
  pendingReports: number;
  pendingContent: number;
  actionsToday: number;
  totalReviews: number;
  approvedReviews: number;
  rejectedReviews: number;
  totalReports: number;
  resolvedReports: number;
  dismissedReports: number;
}

export interface ModerationAction {
  type: 'approve' | 'reject' | 'flag' | 'unflag' | 'delete' | 'investigate' | 'resolve' | 'dismiss';
  reason?: string;
  note?: string;
}

class ModerationService {
  private baseURL = '/admin/moderation';

  // Reviews
  async getReviews(status?: Review['status']): Promise<Review[]> {
    const response = await apiClient.get(`${this.baseURL}/reviews`, {
      params: { status }
    });
    return response.data;
  }

  async getReviewById(id: string): Promise<Review> {
    const response = await apiClient.get(`${this.baseURL}/reviews/${id}`);
    return response.data;
  }

  async moderateReview(id: string, action: ModerationAction): Promise<Review> {
    const response = await apiClient.post(`${this.baseURL}/reviews/${id}/moderate`, action);
    return response.data;
  }

  async approveReview(id: string, note?: string): Promise<Review> {
    return this.moderateReview(id, { type: 'approve', note });
  }

  async rejectReview(id: string, reason: string, note?: string): Promise<Review> {
    return this.moderateReview(id, { type: 'reject', reason, note });
  }

  async flagReview(id: string, reason: string): Promise<Review> {
    return this.moderateReview(id, { type: 'flag', reason });
  }

  async unflagReview(id: string): Promise<Review> {
    return this.moderateReview(id, { type: 'unflag' });
  }

  async deleteReview(id: string): Promise<void> {
    await apiClient.delete(`${this.baseURL}/reviews/${id}`);
  }

  async searchReviews(query: string, filters?: {
    status?: Review['status'];
    flagged?: boolean;
    rating?: number;
  }): Promise<Review[]> {
    const response = await apiClient.get(`${this.baseURL}/reviews/search`, {
      params: { q: query, ...filters }
    });
    return response.data;
  }

  // Reports
  async getReports(status?: Report['status'], priority?: Report['priority']): Promise<Report[]> {
    const response = await apiClient.get(`${this.baseURL}/reports`, {
      params: { status, priority }
    });
    return response.data;
  }

  async getReportById(id: string): Promise<Report> {
    const response = await apiClient.get(`${this.baseURL}/reports/${id}`);
    return response.data;
  }

  async handleReport(id: string, action: ModerationAction): Promise<Report> {
    const response = await apiClient.post(`${this.baseURL}/reports/${id}/handle`, action);
    return response.data;
  }

  async investigateReport(id: string, assignedTo?: string): Promise<Report> {
    return this.handleReport(id, { type: 'investigate', note: assignedTo });
  }

  async resolveReport(id: string, resolution: string): Promise<Report> {
    return this.handleReport(id, { type: 'resolve', reason: resolution });
  }

  async dismissReport(id: string, reason: string): Promise<Report> {
    return this.handleReport(id, { type: 'dismiss', reason });
  }

  async assignReport(id: string, assignedTo: string): Promise<Report> {
    const response = await apiClient.patch(`${this.baseURL}/reports/${id}/assign`, {
      assignedTo
    });
    return response.data;
  }

  async searchReports(query: string, filters?: {
    type?: Report['type'];
    status?: Report['status'];
    priority?: Report['priority'];
  }): Promise<Report[]> {
    const response = await apiClient.get(`${this.baseURL}/reports/search`, {
      params: { q: query, ...filters }
    });
    return response.data;
  }

  // Content moderation
  async getContent(status?: ContentItem['status']): Promise<ContentItem[]> {
    const response = await apiClient.get(`${this.baseURL}/content`, {
      params: { status }
    });
    return response.data;
  }

  async getContentById(id: string): Promise<ContentItem> {
    const response = await apiClient.get(`${this.baseURL}/content/${id}`);
    return response.data;
  }

  async approveContent(id: string): Promise<ContentItem> {
    const response = await apiClient.post(`${this.baseURL}/content/${id}/approve`);
    return response.data;
  }

  async rejectContent(id: string, reason: string): Promise<ContentItem> {
    const response = await apiClient.post(`${this.baseURL}/content/${id}/reject`, {
      reason
    });
    return response.data;
  }

  async requestContentReview(id: string): Promise<ContentItem> {
    const response = await apiClient.post(`${this.baseURL}/content/${id}/request-review`);
    return response.data;
  }

  async updateContent(id: string, content: string): Promise<ContentItem> {
    const response = await apiClient.put(`${this.baseURL}/content/${id}`, {
      content
    });
    return response.data;
  }

  async validateContent(id: string): Promise<{ issues: string[]; isValid: boolean }> {
    const response = await apiClient.post(`${this.baseURL}/content/${id}/validate`);
    return response.data;
  }

  // Audit logs
  async getAuditLogs(severity?: AuditLog['severity'], limit?: number): Promise<AuditLog[]> {
    const response = await apiClient.get(`${this.baseURL}/audit`, {
      params: { severity, limit }
    });
    return response.data;
  }

  async getAuditLogsByUser(userId: string): Promise<AuditLog[]> {
    const response = await apiClient.get(`${this.baseURL}/audit/user/${userId}`);
    return response.data;
  }

  async getAuditLogsByAction(action: string): Promise<AuditLog[]> {
    const response = await apiClient.get(`${this.baseURL}/audit/action`, {
      params: { action }
    });
    return response.data;
  }

  async createAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const response = await apiClient.post(`${this.baseURL}/audit`, entry);
    return response.data;
  }

  // Statistics
  async getModerationStats(): Promise<ModerationStats> {
    const response = await apiClient.get(`${this.baseURL}/stats`);
    return response.data;
  }

  // Export functionality
  async exportModerationData(
    type: 'reviews' | 'reports' | 'audit',
    format: 'csv' | 'excel' = 'csv',
    filters?: Record<string, unknown>
  ): Promise<Blob> {
    const response = await apiClient.get(`${this.baseURL}/export/${type}`, {
      params: { format, ...filters },
      responseType: 'blob'
    });
    return response.data;
  }

  // Bulk actions
  async bulkModerateReviews(
    ids: string[],
    action: ModerationAction
  ): Promise<{ success: string[]; failed: string[] }> {
    const response = await apiClient.post(`${this.baseURL}/reviews/bulk`, {
      ids,
      action
    });
    return response.data;
  }

  async bulkHandleReports(
    ids: string[],
    action: ModerationAction
  ): Promise<{ success: string[]; failed: string[] }> {
    const response = await apiClient.post(`${this.baseURL}/reports/bulk`, {
      ids,
      action
    });
    return response.data;
  }

  // Auto-moderation settings
  async getAutoModerationSettings(): Promise<{
    enabled: boolean;
    autoFlagKeywords: string[];
    autoRejectThreshold: number;
    autoApproveThreshold: number;
  }> {
    const response = await apiClient.get(`${this.baseURL}/auto-settings`);
    return response.data;
  }

  async updateAutoModerationSettings(settings: {
    enabled: boolean;
    autoFlagKeywords: string[];
    autoRejectThreshold: number;
    autoApproveThreshold: number;
  }): Promise<void> {
    await apiClient.put(`${this.baseURL}/auto-settings`, settings);
  }
}

export const moderationService = new ModerationService();