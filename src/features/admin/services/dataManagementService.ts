import { apiClient } from '@/api/apiClient';

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

class DataManagementService {
  private baseURL = '/admin/data-management';

  // Import/Export operations
  async importData(file: File, type: ImportJob['type']): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await apiClient.post(`${this.baseURL}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getImportJobs(): Promise<ImportJob[]> {
    const response = await apiClient.get(`${this.baseURL}/import/jobs`);
    return response.data;
  }

  async getImportJobById(id: string): Promise<ImportJob> {
    const response = await apiClient.get(`${this.baseURL}/import/jobs/${id}`);
    return response.data;
  }

  async cancelImportJob(id: string): Promise<void> {
    await apiClient.delete(`${this.baseURL}/import/jobs/${id}`);
  }

  async retryImportJob(id: string): Promise<ImportJob> {
    const response = await apiClient.post(`${this.baseURL}/import/jobs/${id}/retry`);
    return response.data;
  }

  async exportData(options: ExportOptions): Promise<Blob> {
    const response = await apiClient.post(`${this.baseURL}/export`, options, {
      responseType: 'blob'
    });
    return response.data;
  }

  async getExportHistory(): Promise<UpdateHistory[]> {
    const response = await apiClient.get(`${this.baseURL}/export/history`);
    return response.data;
  }

  // Data validation
  async validateData(entityType?: DataValidation['entityType']): Promise<DataValidation[]> {
    const response = await apiClient.get(`${this.baseURL}/validation`, {
      params: { entityType }
    });
    return response.data;
  }

  async runValidation(entityType: DataValidation['entityType']): Promise<DataValidation> {
    const response = await apiClient.post(`${this.baseURL}/validation/run`, {
      entityType
    });
    return response.data;
  }

  async runFullValidation(): Promise<DataValidation[]> {
    const response = await apiClient.post(`${this.baseURL}/validation/run-all`);
    return response.data;
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
    const response = await apiClient.get(`${this.baseURL}/validation/${id}/details`);
    return response.data;
  }

  async fixValidationIssues(
    validationId: string,
    fixes: Array<{
      recordId: string;
      field: string;
      value: string;
    }>
  ): Promise<{ fixed: number; failed: number }> {
    const response = await apiClient.post(`${this.baseURL}/validation/${validationId}/fix`, {
      fixes
    });
    return response.data;
  }

  // Data quality metrics
  async getDataQualityMetrics(): Promise<DataQualityMetrics> {
    const response = await apiClient.get(`${this.baseURL}/quality/metrics`);
    return response.data;
  }

  async getQualityHistory(days: number = 30): Promise<Array<{
    date: string;
    quality: number;
    errors: number;
    warnings: number;
  }>> {
    const response = await apiClient.get(`${this.baseURL}/quality/history`, {
      params: { days }
    });
    return response.data;
  }

  async getQualityRecommendations(): Promise<Array<{
    type: 'error' | 'warning' | 'improvement';
    category: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    estimatedEffort: 'low' | 'medium' | 'high';
    action?: string;
  }>> {
    const response = await apiClient.get(`${this.baseURL}/quality/recommendations`);
    return response.data;
  }

  // Update history
  async getUpdateHistory(
    entityType?: string,
    limit?: number,
    offset?: number
  ): Promise<UpdateHistory[]> {
    const response = await apiClient.get(`${this.baseURL}/history`, {
      params: { entityType, limit, offset }
    });
    return response.data;
  }

  async getUpdateHistoryCount(entityType?: string): Promise<number> {
    const response = await apiClient.get(`${this.baseURL}/history/count`, {
      params: { entityType }
    });
    return response.data;
  }

  // Data cleanup operations
  async cleanupDuplicateRecords(entityType: DataValidation['entityType']): Promise<{
    duplicatesFound: number;
    duplicatesRemoved: number;
    errors: string[];
  }> {
    const response = await apiClient.post(`${this.baseURL}/cleanup/duplicates`, {
      entityType
    });
    return response.data;
  }

  async cleanupInvalidEmails(): Promise<{
    invalidFound: number;
    invalidRemoved: number;
    errors: string[];
  }> {
    const response = await apiClient.post(`${this.baseURL}/cleanup/emails`);
    return response.data;
  }

  async cleanupOrphanedRecords(): Promise<{
    orphansFound: number;
    orphansRemoved: number;
    errors: string[];
  }> {
    const response = await apiClient.post(`${this.baseURL}/cleanup/orphans`);
    return response.data;
  }

  // Data backup and restore
  async createBackup(description?: string): Promise<{
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
    const response = await apiClient.post(`${this.baseURL}/sync/external`);
    return response.data;
  }

  async getSyncStatus(): Promise<{
    lastSync: string;
    status: 'idle' | 'running' | 'completed' | 'failed';
    progress?: number;
    errors?: string[];
  }> {
    const response = await apiClient.get(`${this.baseURL}/sync/status`);
    return response.data;
  }
}

export const dataManagementService = new DataManagementService();