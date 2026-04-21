import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// Types
export interface ImportJob {
  id: string;
  file_name: string;
  file_size?: number;
  type: 'users' | 'insurers' | 'offers' | 'quotes';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  total_records: number;
  processed_records: number;
  successful_records: number;
  failed_records: number;
  warnings: number;
  error_details?: string[];
  started_by?: string;
  created_at: string;
  completed_at?: string;
}

export interface DataValidation {
  id: string;
  entity_type: 'users' | 'insurers' | 'offers' | 'quotes' | 'all';
  validation_date: string;
  total_records: number;
  valid_records: number;
  invalid_records: number;
  warnings: number;
  critical_issues: number;
  status: 'passed' | 'failed' | 'warning';
  details: string[];
  validation_rules?: Record<string, any>;
  triggered_by?: string;
  created_at: string;
}

export interface UpdateHistory {
  id: string;
  entity_type: string;
  entity_id?: string;
  action: 'create' | 'update' | 'delete' | 'import' | 'export';
  user_id?: string;
  user_name?: string;
  user_email?: string;
  details?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  status: 'success' | 'failed' | 'pending';
  error_message?: string;
  created_at: string;
}

export interface DataQualityMetrics {
  id?: string;
  metric_date: string;
  global_quality: number;
  total_records: number;
  critical_errors: number;
  warnings: number;
  data_completeness: number;
  data_accuracy: number;
  data_consistency: number;
  users_quality?: number;
  insurers_quality?: number;
  offers_quality?: number;
  quotes_quality?: number;
  quality_trend?: 'up' | 'down' | 'stable';
  errors_trend?: 'up' | 'down' | 'stable';
  warnings_trend?: 'up' | 'down' | 'stable';
}

class AdminDataService {
  // Get import jobs
  async getImportJobs(): Promise<ImportJob[]> {
    try {
      const { data, error } = await supabase
        .from('admin_import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching import jobs:', error);
      throw error;
    }
  }

  // Create import job
  async createImportJob(
    fileName: string,
    fileSize: number,
    type: 'users' | 'insurers' | 'offers' | 'quotes'
  ): Promise<ImportJob> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('admin_import_jobs')
        .insert({
          file_name: fileName,
          file_size: fileSize,
          type,
          status: 'pending',
          started_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error creating import job:', error);
      throw error;
    }
  }

  // Update import job progress
  async updateImportJob(
    jobId: string,
    updates: Partial<ImportJob>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_import_jobs')
        .update(updates)
        .eq('id', jobId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error updating import job:', error);
      throw error;
    }
  }

  // Get data validations
  async getDataValidations(): Promise<DataValidation[]> {
    try {
      const { data, error } = await supabase
        .from('admin_data_validations')
        .select('*')
        .order('validation_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching data validations:', error);
      throw error;
    }
  }

  // Create data validation
  async createDataValidation(
    entityType: 'users' | 'insurers' | 'offers' | 'quotes' | 'all',
    validationData: Partial<DataValidation>
  ): Promise<DataValidation> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('admin_data_validations')
        .insert({
          entity_type: entityType,
          triggered_by: user?.id,
          ...validationData
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error creating data validation:', error);
      throw error;
    }
  }

  // Run validation (calculates actual data quality)
  async runValidation(
    entityType: 'users' | 'insurers' | 'offers' | 'quotes' | 'all'
  ): Promise<DataValidation> {
    try {
      let totalRecords = 0;
      let validRecords = 0;
      let invalidRecords = 0;
      let warnings = 0;
      let criticalIssues = 0;
      const details: string[] = [];

      // Query based on entity type
      switch (entityType) {
        case 'users':
          const { data: usersData, error: usersError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, phone, avatar_url');

          if (usersError) throw usersError;

          totalRecords = usersData?.length || 0;
          validRecords = usersData?.filter(u => u.email && (u.first_name || u.last_name)).length || 0;
          invalidRecords = totalRecords - validRecords;
          warnings = usersData?.filter(u => !u.phone).length || 0;
          details.push(`${validRecords} profils complets sur ${totalRecords}`);
          if (warnings > 0) {
            details.push(`${warnings} utilisateurs sans téléphone`);
          }
          break;

        case 'insurers':
          const { data: insurersData, error: insurersError } = await supabase
            .from('insurers')
            .select('*');

          if (insurersError) throw insurersError;

          totalRecords = insurersData?.length || 0;
          validRecords = insurersData?.filter(i => i.is_active).length || 0;
          warnings = insurersData?.filter(i => !i.logo_url).length || 0;
          details.push(`${validRecords} assureurs actifs sur ${totalRecords}`);
          if (warnings > 0) {
            details.push(`${warnings} assureurs sans logo`);
          }
          break;

        case 'offers':
          const { data: offersData, error: offersError } = await supabase
            .from('insurance_offers')
            .select('*');

          if (offersError) throw offersError;

          totalRecords = offersData?.length || 0;
          validRecords = offersData?.filter(o => o.price && o.price > 0).length || 0;
          invalidRecords = totalRecords - validRecords;
          details.push(`${validRecords} offres avec prix sur ${totalRecords}`);
          break;

        case 'quotes':
          const { data: quotesData, error: quotesError } = await supabase
            .from('quotes')
            .select('*');

          if (quotesError) throw quotesError;

          totalRecords = quotesData?.length || 0;
          validRecords = quotesData?.filter(q => q.status === 'COMPLETED').length || 0;
          details.push(`${validRecords} devis complétés sur ${totalRecords}`);
          break;

        case 'all':
          // Run all validations and aggregate results
          const results = await Promise.all([
            this.runValidation('users'),
            this.runValidation('insurers'),
            this.runValidation('offers'),
            this.runValidation('quotes')
          ]);

          totalRecords = results.reduce((sum, r) => sum + r.total_records, 0);
          validRecords = results.reduce((sum, r) => sum + r.valid_records, 0);
          invalidRecords = results.reduce((sum, r) => sum + r.invalid_records, 0);
          warnings = results.reduce((sum, r) => sum + r.warnings, 0);
          criticalIssues = results.reduce((sum, r) => sum + r.critical_issues, 0);
          details.push('Validation globale terminée');
          break;
      }

      // Determine status
      let status: 'passed' | 'failed' | 'warning' = 'passed';
      if (criticalIssues > 0) {
        status = 'failed';
      } else if (invalidRecords > totalRecords * 0.1 || warnings > totalRecords * 0.2) {
        status = 'warning';
      }

      // Create validation record
      return await this.createDataValidation(entityType, {
        total_records: totalRecords,
        valid_records: validRecords,
        invalid_records: invalidRecords,
        warnings,
        critical_issues: criticalIssues,
        status,
        details
      });
    } catch (error) {
      logger.error('Error running validation:', error);
      throw error;
    }
  }

  // Get update history
  async getUpdateHistory(): Promise<UpdateHistory[]> {
    try {
      const { data, error } = await supabase
        .from('admin_update_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching update history:', error);
      throw error;
    }
  }

  // Log update to history
  async logUpdate(
    entityType: string,
    entityId: string,
    action: 'create' | 'update' | 'delete' | 'import' | 'export',
    details?: string
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('log_admin_update', {
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_action: action,
        p_details: details
      });

      if (error) throw error;
    } catch (error) {
      logger.error('Error logging update:', error);
      throw error;
    }
  }

  // Get data quality metrics
  async getDataQualityMetrics(): Promise<DataQualityMetrics> {
    try {
      // Get the most recent metrics
      const { data, error } = await supabase
        .from('admin_data_quality_metrics')
        .select('*')
        .order('metric_date', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // If no metrics exist, calculate them
        if (error.code === 'PGRST116') {
          return await this.calculateQualityMetrics();
        }
        throw error;
      }

      // If metrics are older than 1 hour, recalculate
      const metricAge = Date.now() - new Date(data.metric_date).getTime();
      if (metricAge > 60 * 60 * 1000) {
        return await this.calculateQualityMetrics();
      }

      return data;
    } catch (error) {
      logger.error('Error fetching quality metrics:', error);
      throw error;
    }
  }

  // Calculate quality metrics
  private async calculateQualityMetrics(): Promise<DataQualityMetrics> {
    try {
      const { data, error } = await supabase.rpc('calculate_data_quality_metrics');

      if (error) throw error;

      // Store the calculated metrics
      if (data && data.length > 0) {
        const metrics = data[0];
        await supabase
          .from('admin_data_quality_metrics')
          .insert({
            metric_date: metrics.metric_date,
            global_quality: metrics.global_quality,
            total_records: metrics.total_records,
            critical_errors: metrics.critical_errors,
            warnings: metrics.warnings,
            data_completeness: metrics.data_completeness,
            data_accuracy: metrics.data_accuracy,
            data_consistency: metrics.data_consistency,
            users_quality: metrics.users_quality,
            insurers_quality: metrics.insurers_quality,
            offers_quality: metrics.offers_quality,
            quotes_quality: metrics.quotes_quality,
            quality_trend: 'stable',
            errors_trend: 'stable',
            warnings_trend: 'stable'
          });
      }

      return data?.[0] || {
        metric_date: new Date().toISOString(),
        global_quality: 95,
        total_records: 0,
        critical_errors: 0,
        warnings: 0,
        data_completeness: 95,
        data_accuracy: 95,
        data_consistency: 95
      };
    } catch (error) {
      logger.error('Error calculating quality metrics:', error);
      throw error;
    }
  }

  // Export data to CSV
  async exportData(
    entityType: 'users' | 'insurers' | 'offers' | 'quotes' | 'all'
  ): Promise<string> {
    try {
      let data: any[] = [];
      let fileName = '';

      switch (entityType) {
        case 'users':
          const { data: usersData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, phone, created_at, avatar_url');
          data = usersData || [];
          fileName = 'users_export';
          break;

        case 'insurers':
          const { data: insurersData } = await supabase
            .from('insurers')
            .select('*');
          data = insurersData || [];
          fileName = 'insurers_export';
          break;

        case 'offers':
          const { data: offersData } = await supabase
            .from('insurance_offers')
            .select('*');
          data = offersData || [];
          fileName = 'offers_export';
          break;

        case 'quotes':
          const { data: quotesData } = await supabase
            .from('quotes')
            .select('*');
          data = quotesData || [];
          fileName = 'quotes_export';
          break;

        case 'all':
          // Export all entities (not recommended for large datasets)
          const [users, insurers, offers, quotes] = await Promise.all([
            supabase.from('profiles').select('id, first_name, last_name, email, created_at, avatar_url'),
            supabase.from('insurers').select('*'),
            supabase.from('insurance_offers').select('*'),
            supabase.from('quotes').select('*')
          ]);
          data = [
            ...((users.data || []).map((u: any) => ({ ...u, _entity: 'user' }))),
            ...((insurers.data || []).map((i: any) => ({ ...i, _entity: 'insurer' }))),
            ...((offers.data || []).map((o: any) => ({ ...o, _entity: 'offer' }))),
            ...((quotes.data || []).map((q: any) => ({ ...q, _entity: 'quote' })))
          ];
          fileName = 'all_data_export';
          break;
      }

      // Convert to CSV
      if (data.length === 0) {
        return '';
      }

      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(','),
        ...data.map(row =>
          headers.map(header => {
            const value = row[header];
            // Escape quotes and wrap values containing commas in quotes
            const stringValue = value === null ? '' : String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(',')
        )
      ];

      // Log the export
      await this.logUpdate(entityType, 'export', 'export', `Exported ${data.length} records`);

      return csvRows.join('\n');
    } catch (error) {
      logger.error('Error exporting data:', error);
      throw error;
    }
  }
}

export const adminDataService = new AdminDataService();
