import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

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

// NOTE: Settings management is not fully implemented yet
// This service provides default settings and basic functionality
// For persistent settings, create system_settings table in Supabase

const DEFAULT_SETTINGS: AllSettings = {
  system: {
    siteName: 'NOLI Assurance',
    siteDescription: 'Plateforme de comparaison d\'assurances',
    adminEmail: 'admin@noliassurance.ci',
    contactPhone: '+225 01 02 03 04 05',
    contactAddress: 'Abidjan, Côte d\'Ivoire',
    maintenanceMode: false,
    debugMode: false,
    registrationEnabled: true,
    emailVerification: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      expireDays: 90,
    },
  },
  email: {
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    smtpUsername: 'notifications@noliassurance.ci',
    smtpPassword: '',
    senderName: 'NOLI Assurance',
    senderEmail: 'noreply@noliassurance.ci',
    encryption: 'tls',
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
    newUserRegistration: true,
    insurerApproval: true,
    quoteRequests: true,
    systemAlerts: true,
    marketingEmails: false,
  },
  ui: {
    theme: 'light',
    language: 'fr',
    dateFormat: 'DD/MM/YYYY',
    timezone: 'Africa/Abidjan',
    itemsPerPage: 20,
    sidebarCollapsed: false,
    showTooltips: true,
    animationsEnabled: true,
  },
  backup: {
    enabled: false,
    frequency: 'daily',
    retentionDays: 30,
    includeFiles: true,
    autoCleanup: true,
  },
  security: {
    twoFactorAuth: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      expireDays: 90,
    },
    ipWhitelist: [],
    allowedOrigins: [],
  },
};

const NOT_IMPLEMENTED_ERROR = new Error(
  'Settings feature is not implemented yet. Please create the system_settings table in Supabase first.'
);

class SettingsService {
  private currentSettings: AllSettings = DEFAULT_SETTINGS;

  // System settings
  async getSystemSettings(): Promise<SystemSettings> {
    return this.currentSettings.system;
  }

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    this.currentSettings.system = { ...this.currentSettings.system, ...settings };
    return this.currentSettings.system;
  }

  async resetSystemSettings(): Promise<SystemSettings> {
    this.currentSettings.system = DEFAULT_SETTINGS.system;
    return this.currentSettings.system;
  }

  // Email settings
  async getEmailSettings(): Promise<EmailSettings> {
    return this.currentSettings.email;
  }

  async updateEmailSettings(settings: Partial<EmailSettings>): Promise<EmailSettings> {
    this.currentSettings.email = { ...this.currentSettings.email, ...settings };
    return this.currentSettings.email;
  }

  async testEmailConnection(): Promise<{
    success: boolean;
    message: string;
    details?: string;
  }> {
    return {
      success: false,
      message: 'Email test not implemented. Please configure SMTP settings first.',
      details: 'Create system_settings table to enable this feature',
    };
  }

  async sendTestEmail(to: string): Promise<{
    success: boolean;
    message: string;
    details?: string;
  }> {
    return {
      success: false,
      message: 'Email test not implemented.',
      details: 'Create system_settings table to enable this feature',
    };
  }

  // Notification settings
  async getNotificationSettings(): Promise<NotificationSettings> {
    return this.currentSettings.notifications;
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    this.currentSettings.notifications = { ...this.currentSettings.notifications, ...settings };
    return this.currentSettings.notifications;
  }

  // UI settings
  async getUISettings(): Promise<UISettings> {
    return this.currentSettings.ui;
  }

  async updateUISettings(settings: Partial<UISettings>): Promise<UISettings> {
    this.currentSettings.ui = { ...this.currentSettings.ui, ...settings };
    return this.currentSettings.ui;
  }

  // Backup settings - use backupService instead
  async getBackupSettings(): Promise<BackupSettings> {
    return this.currentSettings.backup;
  }

  async updateBackupSettings(settings: Partial<BackupSettings>): Promise<BackupSettings> {
    this.currentSettings.backup = { ...this.currentSettings.backup, ...settings };
    return this.currentSettings.backup;
  }

  async createManualBackup(description?: string): Promise<{
    backupId: string;
    filename: string;
    size: number;
    createdAt: string;
  }> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  async getBackupList(): Promise<Array<{
    id: string;
    filename: string;
    size: number;
    createdAt: string;
    description?: string;
    type: 'manual' | 'automatic';
  }>> {
    return [];
  }

  async downloadBackup(backupId: string): Promise<Blob> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  async restoreBackup(backupId: string): Promise<{
    success: boolean;
    message: string;
    restoredRecords: number;
  }> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  async deleteBackup(backupId: string): Promise<void> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  // Security settings
  async getSecuritySettings(): Promise<SecuritySettings> {
    return this.currentSettings.security;
  }

  async updateSecuritySettings(settings: Partial<SecuritySettings>): Promise<SecuritySettings> {
    this.currentSettings.security = { ...this.currentSettings.security, ...settings };
    return this.currentSettings.security;
  }

  async getSecurityLogs(limit: number = 50): Promise<Array<{
    id: string;
    type: 'login' | 'logout' | 'failed_login' | 'password_change' | 'permission_denied';
    userId?: string;
    userEmail?: string;
    ipAddress: string;
    userAgent?: string;
    timestamp: string;
    details?: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .in('action', ['LOGIN', 'LOGOUT', 'FAILED_LOGIN', 'PASSWORD_CHANGE', 'PERMISSION_DENIED'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return (
        data?.map((log) => ({
          id: log.id,
          type: log.action.toLowerCase() as any,
          userId: log.user_id,
          userEmail: log.performed_by,
          ipAddress: log.ip_address || '',
          userAgent: log.user_agent,
          timestamp: log.created_at,
          details: log.changes?.toString(),
        })) || []
      );
    } catch (error) {
      logger.error('Error getting security logs:', error);
      throw error;
    }
  }

  async blockIpAddress(ipAddress: string, reason?: string): Promise<void> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  async unblockIpAddress(ipAddress: string): Promise<void> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  async getBlockedIPs(): Promise<Array<{
    ipAddress: string;
    reason?: string;
    blockedAt: string;
    blockedBy: string;
  }>> {
    return [];
  }

  // All settings
  async getAllSettings(): Promise<AllSettings> {
    return this.currentSettings;
  }

  async updateAllSettings(settings: Partial<AllSettings>): Promise<AllSettings> {
    this.currentSettings = {
      ...this.currentSettings,
      ...settings,
      system: { ...this.currentSettings.system, ...settings.system },
      email: { ...this.currentSettings.email, ...settings.email },
      notifications: { ...this.currentSettings.notifications, ...settings.notifications },
      ui: { ...this.currentSettings.ui, ...settings.ui },
      backup: { ...this.currentSettings.backup, ...settings.backup },
      security: { ...this.currentSettings.security, ...settings.security },
    };
    return this.currentSettings;
  }

  // Import/Export settings
  async exportSettings(): Promise<Blob> {
    const settingsJson = JSON.stringify(this.currentSettings, null, 2);
    return new Blob([settingsJson], { type: 'application/json' });
  }

  async importSettings(file: File): Promise<{
    success: boolean;
    message: string;
    imported: string[];
    errors: string[];
  }> {
    try {
      const text = await file.text();
      const imported = JSON.parse(text);

      this.currentSettings = {
        ...this.currentSettings,
        ...imported,
      };

      return {
        success: true,
        message: 'Settings imported successfully',
        imported: Object.keys(imported),
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to import settings',
        imported: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
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
    return {
      valid: true,
      errors: [],
    };
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
    try {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .eq('entity_type', 'SETTINGS')
        .order('created_at', { ascending: false })
        .limit(limit || 50);

      if (error) {
        throw error;
      }

      return (
        data?.map((log) => ({
          id: log.id,
          category: log.action,
          field: log.changes ? Object.keys(log.changes)[0] : '',
          oldValue: null,
          newValue: log.changes,
          changedBy: log.performed_by || 'system',
          changedAt: log.created_at,
          reason: log.notes,
        })) || []
      );
    } catch (error) {
      logger.error('Error getting settings history:', error);
      throw error;
    }
  }

  // Cache management
  async clearCache(type: 'all' | 'config' | 'templates' | 'assets' = 'all'): Promise<{
    success: boolean;
    message: string;
    cleared: string[];
  }> {
    // Clear browser cache for settings
    this.currentSettings = DEFAULT_SETTINGS;
    return {
      success: true,
      message: 'Cache cleared',
      cleared: type === 'all' ? ['config', 'templates', 'assets'] : [type],
    };
  }

  async getCacheInfo(): Promise<{
    config: { size: number; items: number; lastUpdate: string };
    templates: { size: number; items: number; lastUpdate: string };
    assets: { size: number; items: number; lastUpdate: string };
    total: { size: number; items: number };
  }> {
    return {
      config: { size: 0, items: 1, lastUpdate: new Date().toISOString() },
      templates: { size: 0, items: 0, lastUpdate: new Date().toISOString() },
      assets: { size: 0, items: 0, lastUpdate: new Date().toISOString() },
      total: { size: 0, items: 1 },
    };
  }
}

export const settingsService = new SettingsService();
