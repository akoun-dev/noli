import { apiClient, ApiResponse } from '../apiClient';

// Types
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

export interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  passwordExpireDays: number;
  forcePasswordChange: boolean;
  emailVerificationRequired: boolean;
  ipWhitelist: string[];
  ipBlacklist: string[];
}

export interface BackupSettings {
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  backupRetention: number;
  backupLocation: 'local' | 'cloud' | 'both';
  cloudProvider?: 'aws' | 'google' | 'azure';
  includeFiles: boolean;
  includeDatabase: boolean;
  encryptionEnabled: boolean;
}

export interface IntegrationSettings {
  paymentGateways: {
    provider: 'stripe' | 'paypal' | 'orange' | 'mtn';
    enabled: boolean;
    apiKey?: string;
    secretKey?: string;
    webhookUrl?: string;
  }[];
  smsProviders: {
    provider: 'twilio' | 'orange' | 'mtn';
    enabled: boolean;
    apiKey?: string;
    secretKey?: string;
    senderId?: string;
  }[];
  emailProviders: {
    provider: 'smtp' | 'sendgrid' | 'aws-ses';
    enabled: boolean;
    config?: Record<string, unknown>;
  }[];
}

export interface AnalyticsSettings {
  googleAnalytics: {
    enabled: boolean;
    trackingId?: string;
  };
  hotjar: {
    enabled: boolean;
    siteId?: string;
  };
  customAnalytics: {
    enabled: boolean;
    endpoint?: string;
  };
}

export interface SettingsExport {
  system: SystemSettings;
  email: EmailSettings;
  notifications: NotificationSettings;
  ui: UISettings;
  security: SecuritySettings;
  backup: BackupSettings;
  integrations: IntegrationSettings;
  analytics: AnalyticsSettings;
  exportedAt: string;
  version: string;
}

export interface SettingsImport {
  settings: SettingsExport;
  overwriteExisting: boolean;
  sections: string[];
}

export interface TestEmailRequest {
  to: string;
  subject?: string;
  template?: 'welcome' | 'password-reset' | 'quote-request' | 'custom';
  customContent?: string;
}

export interface TestSmsRequest {
  to: string;
  message?: string;
  template?: 'verification' | 'alert' | 'custom';
  customMessage?: string;
}

export interface BackupRequest {
  type: 'full' | 'database' | 'files';
  description?: string;
}

export interface Backup {
  id: string;
  filename: string;
  type: string;
  size: number;
  createdAt: string;
  status: 'completed' | 'failed' | 'in-progress';
  description?: string;
  downloadUrl?: string;
}

export class AdminSettingsApi {
  private readonly baseUrl = '/admin/settings';

  // System Settings
  async getSystemSettings(): Promise<ApiResponse<SystemSettings>> {
    return apiClient.get(`${this.baseUrl}/system`);
  }

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<ApiResponse<SystemSettings>> {
    return apiClient.put(`${this.baseUrl}/system`, settings);
  }

  // Email Settings
  async getEmailSettings(): Promise<ApiResponse<EmailSettings>> {
    return apiClient.get(`${this.baseUrl}/email`);
  }

  async updateEmailSettings(settings: Partial<EmailSettings>): Promise<ApiResponse<EmailSettings>> {
    return apiClient.put(`${this.baseUrl}/email`, settings);
  }

  async testEmailSettings(request: TestEmailRequest): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.post(`${this.baseUrl}/email/test`, request);
  }

  // Notification Settings
  async getNotificationSettings(): Promise<ApiResponse<NotificationSettings>> {
    return apiClient.get(`${this.baseUrl}/notifications`);
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<ApiResponse<NotificationSettings>> {
    return apiClient.put(`${this.baseUrl}/notifications`, settings);
  }

  // UI Settings
  async getUISettings(): Promise<ApiResponse<UISettings>> {
    return apiClient.get(`${this.baseUrl}/ui`);
  }

  async updateUISettings(settings: Partial<UISettings>): Promise<ApiResponse<UISettings>> {
    return apiClient.put(`${this.baseUrl}/ui`, settings);
  }

  // Security Settings
  async getSecuritySettings(): Promise<ApiResponse<SecuritySettings>> {
    return apiClient.get(`${this.baseUrl}/security`);
  }

  async updateSecuritySettings(settings: Partial<SecuritySettings>): Promise<ApiResponse<SecuritySettings>> {
    return apiClient.put(`${this.baseUrl}/security`, settings);
  }

  // Backup Settings
  async getBackupSettings(): Promise<ApiResponse<BackupSettings>> {
    return apiClient.get(`${this.baseUrl}/backup`);
  }

  async updateBackupSettings(settings: Partial<BackupSettings>): Promise<ApiResponse<BackupSettings>> {
    return apiClient.put(`${this.baseUrl}/backup`, settings);
  }

  async createBackup(request: BackupRequest): Promise<ApiResponse<Backup>> {
    return apiClient.post(`${this.baseUrl}/backup/create`, request);
  }

  async getBackups(): Promise<ApiResponse<Backup[]>> {
    return apiClient.get(`${this.baseUrl}/backup/list`);
  }

  async downloadBackup(backupId: string): Promise<ApiResponse<{ downloadUrl: string }>> {
    return apiClient.get(`${this.baseUrl}/backup/${backupId}/download`);
  }

  async deleteBackup(backupId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.baseUrl}/backup/${backupId}`);
  }

  async restoreBackup(backupId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.post(`${this.baseUrl}/backup/${backupId}/restore`);
  }

  // Integration Settings
  async getIntegrationSettings(): Promise<ApiResponse<IntegrationSettings>> {
    return apiClient.get(`${this.baseUrl}/integrations`);
  }

  async updateIntegrationSettings(settings: Partial<IntegrationSettings>): Promise<ApiResponse<IntegrationSettings>> {
    return apiClient.put(`${this.baseUrl}/integrations`, settings);
  }

  async testPaymentGateway(provider: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.post(`${this.baseUrl}/integrations/payment/${provider}/test`);
  }

  async testSmsProvider(provider: string, request: TestSmsRequest): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.post(`${this.baseUrl}/integrations/sms/${provider}/test`, request);
  }

  // Analytics Settings
  async getAnalyticsSettings(): Promise<ApiResponse<AnalyticsSettings>> {
    return apiClient.get(`${this.baseUrl}/analytics`);
  }

  async updateAnalyticsSettings(settings: Partial<AnalyticsSettings>): Promise<ApiResponse<AnalyticsSettings>> {
    return apiClient.put(`${this.baseUrl}/analytics`, settings);
  }

  // Import/Export Settings
  async exportSettings(): Promise<ApiResponse<SettingsExport>> {
    return apiClient.get(`${this.baseUrl}/export`);
  }

  async importSettings(request: SettingsImport): Promise<ApiResponse<{ success: boolean; imported: string[]; errors: string[] }>> {
    return apiClient.post(`${this.baseUrl}/import`, request);
  }

  async resetSettings(section?: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.post(`${this.baseUrl}/reset`, { section });
  }

  // Maintenance
  async enableMaintenance(): Promise<ApiResponse<void>> {
    return apiClient.post(`${this.baseUrl}/maintenance/enable`);
  }

  async disableMaintenance(): Promise<ApiResponse<void>> {
    return apiClient.post(`${this.baseUrl}/maintenance/disable`);
  }

  async getMaintenanceStatus(): Promise<ApiResponse<{ enabled: boolean; message?: string }>> {
    return apiClient.get(`${this.baseUrl}/maintenance/status`);
  }

  // Cache Management
  async clearCache(type?: 'all' | 'views' | 'config' | 'routes'): Promise<ApiResponse<{ success: boolean; cleared: string[] }>> {
    return apiClient.post(`${this.baseUrl}/cache/clear`, { type });
  }

  async getCacheInfo(): Promise<ApiResponse<{
    totalSize: number;
    items: Array<{
      key: string;
      size: number;
      expires: string;
      type: string;
    }>;
  }>> {
    return apiClient.get(`${this.baseUrl}/cache/info`);
  }

  // Logs
  async getSystemLogs(filters?: {
    level?: 'debug' | 'info' | 'warning' | 'error';
    limit?: number;
    offset?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<Array<{
    id: string;
    level: string;
    message: string;
    context?: Record<string, unknown>;
    timestamp: string;
    userId?: string;
    ip?: string;
  }>>> {
    return apiClient.get(`${this.baseUrl}/logs`, { params: filters });
  }

  async downloadLogs(filters?: {
    level?: string;
    dateFrom?: string;
    dateTo?: string;
    format?: 'json' | 'txt';
  }): Promise<ApiResponse<{ downloadUrl: string }>> {
    return apiClient.post(`${this.baseUrl}/logs/download`, filters);
  }

  async clearLogs(): Promise<ApiResponse<{ success: boolean; deleted: number }>> {
    return apiClient.delete(`${this.baseUrl}/logs`);
  }

  // System Info
  async getSystemInfo(): Promise<ApiResponse<{
    version: string;
    environment: string;
    phpVersion: string;
    databaseVersion: string;
    serverSoftware: string;
    diskSpace: {
      total: number;
      used: number;
      free: number;
    };
    memory: {
      total: number;
      used: number;
      free: number;
    };
    uptime: number;
  }>> {
    return apiClient.get(`${this.baseUrl}/system/info`);
  }

  // Health Check
  async performHealthCheck(): Promise<ApiResponse<{
    status: 'healthy' | 'warning' | 'critical';
    checks: Array<{
      name: string;
      status: 'pass' | 'fail' | 'warning';
      message?: string;
      duration: number;
    }>;
    summary: {
      total: number;
      passed: number;
      failed: number;
      warnings: number;
    };
  }>> {
    return apiClient.get(`${this.baseUrl}/health/check`);
  }
}

export const adminSettingsApi = new AdminSettingsApi();
