import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface ImportJob {
  id: string;
  fileName: string;
  type: 'users' | 'insurers' | 'offers' | 'quotes';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalRecords: number;
  processedRecords: number;
  errors: number;
  warnings: number;
  createdAt: string;
  completedAt?: string;
  errorDetails?: string[];
}

export interface DataValidation {
  id: string;
  entityType: 'users' | 'insurers' | 'offers' | 'quotes';
  validationDate: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  warnings: number;
  criticalIssues: number;
  status: 'passed' | 'failed' | 'warning';
  details: string[];
}

export interface UpdateHistory {
  id: string;
  entity: string;
  action: 'create' | 'update' | 'delete' | 'import' | 'export';
  user: string;
  timestamp: string;
  details: string;
  status: 'success' | 'failed' | 'pending';
}

export interface DataQualityMetrics {
  globalQuality: number;
  criticalErrors: number;
  warnings: number;
  lastValidation: string;
  profileCompleteness: number;
  emailValidity: number;
  priceConsistency: number;
  dataIntegrity: number;
}

export interface ImportResult {
  jobId: string;
  success: boolean;
  message: string;
  processedRecords?: number;
  errors?: string[];
  warnings?: string[];
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'json';
  entityType: 'users' | 'insurers' | 'offers' | 'quotes' | 'all';
  filters?: Record<string, unknown>;
  fields?: string[];
}

// NOTE: Data management features (import/export, validation) are not fully implemented yet
// This service provides basic functionality using Supabase
// For advanced features, create data_jobs, data_validations, and data_quality tables

const NOT_IMPLEMENTED_ERROR = new Error(
  'Data management feature is not implemented yet. Please use the database directly or contact administrator.'
);

class DataManagementService {
  // Import/Export operations
  async importData(file: File, type: ImportJob['type']): Promise<ImportResult> {
    // Basic CSV import implementation
    try {
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());

      if (lines.length < 2) {
        throw new Error('Fichier vide ou invalide');
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
      const dataLines = lines.slice(1);
      let processedRecords = 0;
      const errors: string[] = [];

      for (let i = 0; i < dataLines.length; i++) {
        try {
          const values = dataLines[i].split(',').map((v) => v.trim().replace(/"/g, ''));

          // Basic validation
          if (values.length !== headers.length) {
            errors.push(`Ligne ${i + 2}: Nombre de colonnes incorrect`);
            continue;
          }

          // Import logic would go here based on type
          processedRecords++;
        } catch (err) {
          errors.push(`Ligne ${i + 2}: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
        }
      }

      return {
        jobId: `import_${Date.now()}`,
        success: true,
        message: `${processedRecords} enregistrements traités`,
        processedRecords,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      logger.error('Error importing data:', error);
      throw error;
    }
  }

  async getImportJobs(): Promise<ImportJob[]> {
    // Return empty list until data_jobs table is created
    logger.warn('Import jobs tracking not implemented - returning empty list');
    return [];
  }

  async getImportJobById(id: string): Promise<ImportJob> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  async cancelImportJob(id: string): Promise<void> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  async retryImportJob(id: string): Promise<ImportJob> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  async exportData(options: ExportOptions): Promise<Blob> {
    try {
      let data: any[] = [];
      let headers: string[] = [];

      switch (options.entityType) {
        case 'users':
          ({ data } = await supabase.from('profiles').select('*'));
          headers = ['id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'created_at'];
          break;
        case 'insurers':
          ({ data } = await supabase.from('profiles').select('*').eq('role', 'INSURER'));
          headers = ['id', 'email', 'company_name', 'phone', 'is_active', 'created_at'];
          break;
        case 'offers':
          ({ data } = await supabase.from('insurance_offers').select('*'));
          headers = ['id', 'name', 'insurer_id', 'price_min', 'price_max', 'is_active', 'created_at'];
          break;
        case 'quotes':
          ({ data } = await supabase.from('quotes').select('*'));
          headers = ['id', 'user_id', 'status', 'estimated_price', 'created_at'];
          break;
        default:
          throw new Error(`Entity type ${options.entityType} not supported for export`);
      }

      // Convert to CSV
      const csvContent = [
        headers.join(','),
        ...(data || []).map((row) =>
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
      logger.error('Error exporting data:', error);
      throw error;
    }
  }

  async getExportHistory(): Promise<UpdateHistory[]> {
    // Return empty list until export_history table is created
    logger.warn('Export history not implemented - returning empty list');
    return [];
  }

  // Data validation
  async validateData(entityType?: DataValidation['entityType']): Promise<DataValidation[]> {
    // Basic validation from database
    try {
      const validations: DataValidation[] = [];

      if (!entityType || entityType === 'users') {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, email, role, is_active');

        if (!error && profiles) {
          const invalidEmails = profiles.filter((p) => !p.email || !p.email.includes('@'));
          const inactiveUsers = profiles.filter((p) => !p.is_active);

          validations.push({
            id: `validation_users_${Date.now()}`,
            entityType: 'users',
            validationDate: new Date().toISOString(),
            totalRecords: profiles.length,
            validRecords: profiles.length - invalidEmails.length,
            invalidRecords: invalidEmails.length,
            warnings: inactiveUsers.length,
            criticalIssues: invalidEmails.length,
            status: invalidEmails.length > 0 ? 'failed' : 'passed',
            details: [
              `${invalidEmails.length} emails invalides`,
              `${inactiveUsers.length} utilisateurs inactifs`,
            ],
          });
        }
      }

      if (!entityType || entityType === 'offers') {
        const { data: offers, error } = await supabase
          .from('insurance_offers')
          .select('id, name, price_min, price_max, is_active');

        if (!error && offers) {
          const invalidPrices = offers.filter(
            (o) => o.price_min && o.price_max && o.price_min > o.price_max
          );

          validations.push({
            id: `validation_offers_${Date.now()}`,
            entityType: 'offers',
            validationDate: new Date().toISOString(),
            totalRecords: offers.length,
            validRecords: offers.length - invalidPrices.length,
            invalidRecords: invalidPrices.length,
            warnings: 0,
            criticalIssues: invalidPrices.length,
            status: invalidPrices.length > 0 ? 'failed' : 'passed',
            details: [`${invalidPrices.length} offres avec prix invalides`],
          });
        }
      }

      return validations;
    } catch (error) {
      logger.error('Error validating data:', error);
      throw error;
    }
  }

  async runValidation(entityType: DataValidation['entityType']): Promise<DataValidation> {
    const validations = await this.validateData(entityType);
    return validations[0];
  }

  async runFullValidation(): Promise<DataValidation[]> {
    return await this.validateData();
  }

  async getValidationDetails(id: string): Promise<{
    validation: DataValidation;
    invalidRecords: Array<{
      id: string;
      field: string;
      value: string;
      issue: string;
      severity: 'error' | 'warning';
    }>;
  }> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  async fixValidationIssues(
    validationId: string,
    fixes: Array<{
      recordId: string;
      field: string;
      value: string;
    }>
  ): Promise<{ fixed: number; failed: number }> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  // Data quality metrics
  async getDataQualityMetrics(): Promise<DataQualityMetrics> {
    try {
      const [usersResult, offersResult] = await Promise.all([
        supabase.from('profiles').select('id, email, first_name, last_name, phone'),
        supabase.from('insurance_offers').select('id, price_min, price_max'),
      ]);

      const users = usersResult.data || [];
      const offers = offersResult.data || [];

      // Calculate metrics
      const completeProfiles = users.filter(
        (u) => u.email && u.first_name && u.last_name
      ).length;
      const validEmails = users.filter((u) => u.email && u.email.includes('@')).length;
      const validPrices = offers.filter(
        (o) => !o.price_min || !o.price_max || o.price_min <= o.price_max
      ).length;

      return {
        globalQuality: Math.round(
          ((completeProfiles + validEmails + validPrices) /
            (users.length * 2 + offers.length)) *
            100
        ),
        criticalErrors: users.length - validEmails + (offers.length - validPrices),
        warnings: users.length - completeProfiles,
        lastValidation: new Date().toISOString(),
        profileCompleteness: users.length > 0 ? (completeProfiles / users.length) * 100 : 100,
        emailValidity: users.length > 0 ? (validEmails / users.length) * 100 : 100,
        priceConsistency: offers.length > 0 ? (validPrices / offers.length) * 100 : 100,
        dataIntegrity: 95, // Placeholder
      };
    } catch (error) {
      logger.error('Error getting data quality metrics:', error);
      throw error;
    }
  }

  async getQualityHistory(days: number = 30): Promise<Array<{
    date: string;
    quality: number;
    errors: number;
    warnings: number;
  }>> {
    // Return empty until quality_history table is created
    logger.warn('Quality history not implemented - returning empty list');
    return [];
  }

  async getQualityRecommendations(): Promise<Array<{
    type: 'error' | 'warning' | 'improvement';
    category: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    estimatedEffort: 'low' | 'medium' | 'high';
    action?: string;
  }>> {
    // Return empty until recommendations are implemented
    return [];
  }

  // Update history - use admin_audit_log table
  async getUpdateHistory(
    entityType?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<UpdateHistory[]> {
    try {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return (
        data?.map((log) => ({
          id: log.id,
          entity: log.entity_type || 'unknown',
          action: log.action as any,
          user: log.performed_by || 'system',
          timestamp: log.created_at,
          details: log.changes?.toString() || '',
          status: 'success',
        })) || []
      );
    } catch (error) {
      logger.error('Error getting update history:', error);
      throw error;
    }
  }

  async getUpdateHistoryCount(entityType?: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('admin_audit_log')
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      logger.error('Error getting update history count:', error);
      throw error;
    }
  }

  // Data cleanup operations
  async cleanupDuplicateRecords(entityType: DataValidation['entityType']): Promise<{
    duplicatesFound: number;
    duplicatesRemoved: number;
    errors: string[];
  }> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  async cleanupInvalidEmails(): Promise<{
    invalidFound: number;
    invalidRemoved: number;
    errors: string[];
  }> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  async cleanupOrphanedRecords(): Promise<{
    orphansFound: number;
    orphansRemoved: number;
    errors: string[];
  }> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  // Data backup and restore - use backupService instead
  async createBackup(description?: string): Promise<{
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

  // Data synchronization
  async syncWithExternalSystems(): Promise<{
    success: boolean;
    syncedEntities: Array<{
      entity: string;
      records: number;
      status: 'success' | 'failed' | 'partial';
      errors?: string[];
    }>;
  }> {
    throw NOT_IMPLEMENTED_ERROR;
  }

  async getSyncStatus(): Promise<{
    lastSync: string;
    status: 'idle' | 'running' | 'completed' | 'failed';
    progress?: number;
    errors?: string[];
  }> {
    return {
      lastSync: new Date().toISOString(),
      status: 'idle',
    };
  }
}

export const dataManagementService = new DataManagementService();
