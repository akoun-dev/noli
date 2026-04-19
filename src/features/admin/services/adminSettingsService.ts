import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

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
}

export interface SecuritySettings {
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

export interface AdminSettings {
  system: SystemSettings;
  security: SecuritySettings;
  email: EmailSettings;
  notifications: NotificationSettings;
  ui: UISettings;
}

class AdminSettingsService {
  private settingsCache: AdminSettings | null = null;

  // Get all settings
  async getSettings(): Promise<AdminSettings> {
    try {
      if (this.settingsCache) {
        return this.settingsCache;
      }

      const [systemData, securityData, emailData, notificationsData, uiData] = await Promise.all([
        supabase.rpc('get_setting', { setting_key: 'system' }),
        supabase.rpc('get_setting', { setting_key: 'security' }),
        supabase.rpc('get_setting', { setting_key: 'email' }),
        supabase.rpc('get_setting', { setting_key: 'notifications' }),
        supabase.rpc('get_setting', { setting_key: 'ui' })
      ]);

      const settings: AdminSettings = {
        system: systemData || {},
        security: securityData || {},
        email: emailData || {},
        notifications: notificationsData || {},
        ui: uiData || {}
      };

      this.settingsCache = settings;
      return settings;
    } catch (error) {
      logger.error('Error fetching settings:', error);
      throw error;
    }
  }

  // Get system settings
  async getSystemSettings(): Promise<SystemSettings> {
    try {
      const { data } = await supabase.rpc('get_setting', { setting_key: 'system' });
      return data || {
        siteName: 'NOLI Assurance',
        siteDescription: 'Plateforme de comparaison d\'assurance auto',
        adminEmail: 'admin@noli.ci',
        contactPhone: '+225 21 25 00 00',
        contactAddress: 'Abidjan, Côte d\'Ivoire',
        maintenanceMode: false,
        debugMode: false,
        registrationEnabled: true,
        emailVerification: true
      };
    } catch (error) {
      logger.error('Error fetching system settings:', error);
      throw error;
    }
  }

  // Get security settings
  async getSecuritySettings(): Promise<SecuritySettings> {
    try {
      const { data } = await supabase.rpc('get_setting', { setting_key: 'security' });
      return data || {
        sessionTimeout: 3600,
        maxLoginAttempts: 5,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
          expireDays: 90
        }
      };
    } catch (error) {
      logger.error('Error fetching security settings:', error);
      throw error;
    }
  }

  // Get email settings
  async getEmailSettings(): Promise<EmailSettings> {
    try {
      const { data } = await supabase.rpc('get_setting', { setting_key: 'email' });
      return data || {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUsername: '',
        senderName: 'NOLI Assurance',
        senderEmail: 'noreply@noli.ci',
        encryption: 'tls'
      };
    } catch (error) {
      logger.error('Error fetching email settings:', error);
      throw error;
    }
  }

  // Get notification settings
  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const { data } = await supabase.rpc('get_setting', { setting_key: 'notifications' });
      return data || {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        newUserRegistration: true,
        insurerApproval: true,
        quoteRequests: true,
        systemAlerts: true,
        marketingEmails: false
      };
    } catch (error) {
      logger.error('Error fetching notification settings:', error);
      throw error;
    }
  }

  // Get UI settings
  async getUISettings(): Promise<UISettings> {
    try {
      const { data } = await supabase.rpc('get_setting', { setting_key: 'ui' });
      return data || {
        theme: 'light' as const,
        language: 'fr',
        dateFormat: 'DD/MM/YYYY',
        timezone: 'Africa/Abidjan',
        itemsPerPage: 20,
        sidebarCollapsed: false,
        showTooltips: true,
        animationsEnabled: true
      };
    } catch (error) {
      logger.error('Error fetching UI settings:', error);
      throw error;
    }
  }

  // Update system settings
  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<void> {
    try {
      // Get current settings
      const current = await this.getSystemSettings();
      const updated = { ...current, ...settings };

      await supabase.rpc('set_setting', {
        setting_key: 'system',
        new_value: updated,
        change_reason: 'Mise à jour des paramètres système'
      });

      this.settingsCache = null; // Clear cache
    } catch (error) {
      logger.error('Error updating system settings:', error);
      throw error;
    }
  }

  // Update security settings
  async updateSecuritySettings(settings: Partial<SecuritySettings>): Promise<void> {
    try {
      // Get current settings
      const current = await this.getSecuritySettings();
      const updated = { ...current, ...settings };

      await supabase.rpc('set_setting', {
        setting_key: 'security',
        new_value: updated,
        change_reason: 'Mise à jour des paramètres de sécurité'
      });

      this.settingsCache = null; // Clear cache
    } catch (error) {
      logger.error('Error updating security settings:', error);
      throw error;
    }
  }

  // Update email settings
  async updateEmailSettings(settings: Partial<EmailSettings>): Promise<void> {
    try {
      // Get current settings
      const current = await this.getEmailSettings();
      const updated = { ...current, ...settings };

      await supabase.rpc('set_setting', {
        setting_key: 'email',
        new_value: updated,
        change_reason: 'Mise à jour de la configuration email'
      });

      this.settingsCache = null; // Clear cache
    } catch (error) {
      logger.error('Error updating email settings:', error);
      throw error;
    }
  }

  // Update notification settings
  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      // Get current settings
      const current = await this.getNotificationSettings();
      const updated = { ...current, ...settings };

      await supabase.rpc('set_setting', {
        setting_key: 'notifications',
        new_value: updated,
        change_reason: 'Mise à jour des préférences de notification'
      });

      this.settingsCache = null; // Clear cache
    } catch (error) {
      logger.error('Error updating notification settings:', error);
      throw error;
    }
  }

  // Update UI settings
  async updateUISettings(settings: Partial<UISettings>): Promise<void> {
    try {
      // Get current settings
      const current = await this.getUISettings();
      const updated = { ...current, ...settings };

      await supabase.rpc('set_setting', {
        setting_key: 'ui',
        new_value: updated,
        change_reason: 'Mise à jour des paramètres interface'
      });

      this.settingsCache = null; // Clear cache
    } catch (error) {
      logger.error('Error updating UI settings:', error);
      throw error;
    }
  }

  // Reset all settings to defaults
  async resetSettings(): Promise<void> {
    try {
      // Reset is handled by re-inserting default values
      await supabase.rpc('set_setting', {
        setting_key: 'system',
        new_value: {
          siteName: 'NOLI Assurance',
          siteDescription: 'Plateforme de comparaison d\'assurance auto',
          adminEmail: 'admin@noli.ci',
          contactPhone: '+225 21 25 00 00',
          contactAddress: 'Abidjan, Côte d\'Ivoire',
          maintenanceMode: false,
          debugMode: false,
          registrationEnabled: true,
          emailVerification: true
        },
        change_reason: 'Réinitialisation des paramètres'
      });

      this.settingsCache = null; // Clear cache
    } catch (error) {
      logger.error('Error resetting settings:', error);
      throw error;
    }
  }

  // Get settings change history
  async getSettingsHistory(limit: number = 50): Promise<any[]> {
    try {
      const { data } = await supabase
        .from('admin_settings_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      return data || [];
    } catch (error) {
      logger.error('Error fetching settings history:', error);
      throw error;
    }
  }

  // Export settings
  async exportSettings(): Promise<any> {
    try {
      const settings = await this.getSettings();
      return {
        settings,
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      };
    } catch (error) {
      logger.error('Error exporting settings:', error);
      throw error;
    }
  }

  // Import settings
  async importSettings(importData: {
    settings: Partial<AdminSettings>;
    overwriteExisting: boolean;
    sections: string[];
  }): Promise<{ imported: string[]; errors: string[] }> {
    const imported: string[] = [];
    const errors: string[] = [];

    for (const section of importData.sections) {
      try {
        switch (section) {
          case 'system':
            await this.updateSystemSettings(importData.settings.system || {});
            imported.push('system');
            break;
          case 'security':
            await this.updateSecuritySettings(importData.settings.security || {});
            imported.push('security');
            break;
          case 'email':
            await this.updateEmailSettings(importData.settings.email || {});
            imported.push('email');
            break;
          case 'notifications':
            await this.updateNotificationSettings(importData.settings.notifications || {});
            imported.push('notifications');
            break;
          case 'ui':
            await this.updateUISettings(importData.settings.ui || {});
            imported.push('ui');
            break;
          default:
            errors.push(`Section inconnue: ${section}`);
        }
      } catch (error) {
        logger.error(`Error importing section ${section}:`, error);
        errors.push(section);
      }
    }

    return { imported, errors };
  }
}

export const adminSettingsService = new AdminSettingsService();
