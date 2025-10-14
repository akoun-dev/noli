import { apiClient } from '@/api/apiClient';

export interface SystemSettings {
  siteName: string;
  siteDescription: string;
  adminEmail: string;
  contactPhone: string;
  contactAddress: string;
  maintenanceMode: boolean;
  debugMode: boolean;
  registrationEnabled: boolean;
  emailVerification: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    expireDays: number;
  };
}

export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  senderName: string;
  senderEmail: string;
  encryption: 'none' | 'ssl' | 'tls';
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  newUserRegistration: boolean;
  insurerApproval: boolean;
  quoteRequests: boolean;
  systemAlerts: boolean;
  marketingEmails: boolean;
}

export interface UISettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  dateFormat: string;
  timezone: string;
  itemsPerPage: number;
  sidebarCollapsed: boolean;
  showTooltips: boolean;
  animationsEnabled: boolean;
}

export interface BackupSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  retentionDays: number;
  includeFiles: boolean;
  autoCleanup: boolean;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  passwordPolicy: SystemSettings['passwordPolicy'];
  ipWhitelist: string[];
  allowedOrigins: string[];
}

export interface AllSettings {
  system: SystemSettings;
  email: EmailSettings;
  notifications: NotificationSettings;
  ui: UISettings;
  backup: BackupSettings;
  security: SecuritySettings;
}

class SettingsService {
  private baseURL = '/admin/settings';

  // System settings
  async getSystemSettings(): Promise<SystemSettings> {
    const response = await apiClient.get(`${this.baseURL}/system`);
    return response.data;
  }

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const response = await apiClient.put(`${this.baseURL}/system`, settings);
    return response.data;
  }

  async resetSystemSettings(): Promise<SystemSettings> {
    const response = await apiClient.post(`${this.baseURL}/system/reset`);
    return response.data;
  }

  // Email settings
  async getEmailSettings(): Promise<EmailSettings> {
    const response = await apiClient.get(`${this.baseURL}/email`);
    return response.data;
  }

  async updateEmailSettings(settings: Partial<EmailSettings>): Promise<EmailSettings> {
    const response = await apiClient.put(`${this.baseURL}/email`, settings);
    return response.data;
  }

  async testEmailConnection(): Promise<{
    success: boolean;
    message: string;
    details?: string;
  }> {
    const response = await apiClient.post(`${this.baseURL}/email/test`);
    return response.data;
  }

  async sendTestEmail(to: string): Promise<{
    success: boolean;
    message: string;
    details?: string;
  }> {
    const response = await apiClient.post(`${this.baseURL}/email/test-send`, { to });
    return response.data;
  }

  // Notification settings
  async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await apiClient.get(`${this.baseURL}/notifications`);
    return response.data;
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const response = await apiClient.put(`${this.baseURL}/notifications`, settings);
    return response.data;
  }

  // UI settings
  async getUISettings(): Promise<UISettings> {
    const response = await apiClient.get(`${this.baseURL}/ui`);
    return response.data;
  }

  async updateUISettings(settings: Partial<UISettings>): Promise<UISettings> {
    const response = await apiClient.put(`${this.baseURL}/ui`, settings);
    return response.data;
  }

  // Backup settings
  async getBackupSettings(): Promise<BackupSettings> {
    const response = await apiClient.get(`${this.baseURL}/backup`);
    return response.data;
  }

  async updateBackupSettings(settings: Partial<BackupSettings>): Promise<BackupSettings> {
    const response = await apiClient.put(`${this.baseURL}/backup`, settings);
    return response.data;
  }

  async createManualBackup(description?: string): Promise<{
    backupId: string;
    filename: string;
    size: number;
    createdAt: string;
  }> {
    const response = await apiClient.post(`${this.baseURL}/backup/create`, {
      description
    });
    return response.data;
  }

  async getBackupList(): Promise<Array<{
    id: string;
    filename: string;
    size: number;
    createdAt: string;
    description?: string;
    type: 'manual' | 'automatic';
  }>> {
    const response = await apiClient.get(`${this.baseURL}/backup/list`);
    return response.data;
  }

  async downloadBackup(backupId: string): Promise<Blob> {
    const response = await apiClient.get(`${this.baseURL}/backup/${backupId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async restoreBackup(backupId: string): Promise<{
    success: boolean;
    message: string;
    restoredRecords: number;
  }> {
    const response = await apiClient.post(`${this.baseURL}/backup/${backupId}/restore`);
    return response.data;
  }

  async deleteBackup(backupId: string): Promise<void> {
    await apiClient.delete(`${this.baseURL}/backup/${backupId}`);
  }

  // Security settings
  async getSecuritySettings(): Promise<SecuritySettings> {
    const response = await apiClient.get(`${this.baseURL}/security`);
    return response.data;
  }

  async updateSecuritySettings(settings: Partial<SecuritySettings>): Promise<SecuritySettings> {
    const response = await apiClient.put(`${this.baseURL}/security`, settings);
    return response.data;
  }

  async getSecurityLogs(limit?: number): Promise<Array<{
    id: string;
    type: 'login' | 'logout' | 'failed_login' | 'password_change' | 'permission_denied';
    userId?: string;
    userEmail?: string;
    ipAddress: string;
    userAgent?: string;
    timestamp: string;
    details?: string;
  }>> {
    const response = await apiClient.get(`${this.baseURL}/security/logs`, {
      params: { limit }
    });
    return response.data;
  }

  async blockIpAddress(ipAddress: string, reason?: string): Promise<void> {
    await apiClient.post(`${this.baseURL}/security/block-ip`, {
      ipAddress,
      reason
    });
  }

  async unblockIpAddress(ipAddress: string): Promise<void> {
    await apiClient.delete(`${this.baseURL}/security/block-ip/${ipAddress}`);
  }

  async getBlockedIPs(): Promise<Array<{
    ipAddress: string;
    reason?: string;
    blockedAt: string;
    blockedBy: string;
  }>> {
    const response = await apiClient.get(`${this.baseURL}/security/blocked-ips`);
    return response.data;
  }

  // All settings
  async getAllSettings(): Promise<AllSettings> {
    const response = await apiClient.get(`${this.baseURL}/all`);
    return response.data;
  }

  async updateAllSettings(settings: Partial<AllSettings>): Promise<AllSettings> {
    const response = await apiClient.put(`${this.baseURL}/all`, settings);
    return response.data;
  }

  // Import/Export settings
  async exportSettings(): Promise<Blob> {
    const response = await apiClient.get(`${this.baseURL}/export`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async importSettings(file: File): Promise<{
    success: boolean;
    message: string;
    imported: string[];
    errors: string[];
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(`${this.baseURL}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Settings validation
  async validateSettings(category?: string): Promise<{
    valid: boolean;
    errors: Array<{
      field: string;
      message: string;
      severity: 'error' | 'warning';
    }>;
  }> {
    const response = await apiClient.post(`${this.baseURL}/validate`, {
      category
    });
    return response.data;
  }

  // Settings history
  async getSettingsHistory(category?: string, limit?: number): Promise<Array<{
    id: string;
    category: string;
    field: string;
    oldValue: unknown;
    newValue: unknown;
    changedBy: string;
    changedAt: string;
    reason?: string;
  }>> {
    const response = await apiClient.get(`${this.baseURL}/history`, {
      params: { category, limit }
    });
    return response.data;
  }

  // Cache management
  async clearCache(type?: 'all' | 'config' | 'templates' | 'assets'): Promise<{
    success: boolean;
    message: string;
    cleared: string[];
  }> {
    const response = await apiClient.delete(`${this.baseURL}/cache`, {
      params: { type }
    });
    return response.data;
  }

  async getCacheInfo(): Promise<{
    config: { size: number; items: number; lastUpdate: string };
    templates: { size: number; items: number; lastUpdate: string };
    assets: { size: number; items: number; lastUpdate: string };
    total: { size: number; items: number };
  }> {
    const response = await apiClient.get(`${this.baseURL}/cache/info`);
    return response.data;
  }
}

export const settingsService = new SettingsService();