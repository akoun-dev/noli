import { apiClient, ApiResponse, PaginatedResponse } from '../apiClient';

// Types
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
  trends: {
    quality: 'up' | 'down' | 'stable';
    errors: 'up' | 'down' | 'stable';
    warnings: 'up' | 'down' | 'stable';
  };
}

export interface ImportRequest {
  file: File;
  type: 'users' | 'insurers' | 'offers' | 'quotes';
}

export interface ValidationRequest {
  entityType: 'users' | 'insurers' | 'offers' | 'quotes' | 'all';
}

export interface ExportRequest {
  entityType: 'users' | 'insurers' | 'offers' | 'quotes' | 'all';
  format: 'csv' | 'xlsx' | 'json';
}

export class AdminDataApi {
  private readonly baseUrl = '/admin/data';

  // Get data quality metrics
  async getDataQualityMetrics(): Promise<ApiResponse<DataQualityMetrics>> {
    return apiClient.get(`${this.baseUrl}/quality/metrics`);
  }

  // Get import jobs
  async getImportJobs(): Promise<ApiResponse<ImportJob[]>> {
    return apiClient.get(`${this.baseUrl}/imports`);
  }

  // Get data validations
  async getDataValidations(): Promise<ApiResponse<DataValidation[]>> {
    return apiClient.get(`${this.baseUrl}/validations`);
  }

  // Get update history
  async getUpdateHistory(): Promise<ApiResponse<UpdateHistory[]>> {
    return apiClient.get(`${this.baseUrl}/history`);
  }

  // Start data import
  async startImport(request: ImportRequest): Promise<ApiResponse<ImportJob>> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('type', request.type);

    return apiClient.upload(`${this.baseUrl}/imports`, request.file, { type: request.type });
  }

  // Run data validation
  async runValidation(request: ValidationRequest): Promise<ApiResponse<DataValidation>> {
    return apiClient.post(`${this.baseUrl}/validations`, request);
  }

  // Export data
  async exportData(request: ExportRequest): Promise<ApiResponse<{ downloadUrl: string }>> {
    return apiClient.post(`${this.baseUrl}/exports`, request);
  }

  // Get import job details
  async getImportJob(jobId: string): Promise<ApiResponse<ImportJob>> {
    return apiClient.get(`${this.baseUrl}/imports/${jobId}`);
  }

  // Cancel import job
  async cancelImportJob(jobId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.baseUrl}/imports/${jobId}`);
  }

  // Retry import job
  async retryImportJob(jobId: string): Promise<ApiResponse<ImportJob>> {
    return apiClient.post(`${this.baseUrl}/imports/${jobId}/retry`);
  }

  // Get validation details
  async getValidationDetails(validationId: string): Promise<ApiResponse<DataValidation>> {
    return apiClient.get(`${this.baseUrl}/validations/${validationId}`);
  }

  // Fix validation issues
  async fixValidationIssues(validationId: string): Promise<ApiResponse<void>> {
    return apiClient.post(`${this.baseUrl}/validations/${validationId}/fix`);
  }

  // Get data statistics
  async getDataStatistics(): Promise<ApiResponse<{
    users: { total: number; valid: number; invalid: number };
    insurers: { total: number; valid: number; invalid: number };
    offers: { total: number; valid: number; invalid: number };
    quotes: { total: number; valid: number; invalid: number };
  }>> {
    return apiClient.get(`${this.baseUrl}/statistics`);
  }

  // Clean duplicate data
  async cleanDuplicates(entityType: string): Promise<ApiResponse<{ duplicatesFound: number; duplicatesRemoved: number }>> {
    return apiClient.post(`${this.baseUrl}/clean/duplicates`, { entityType });
  }

  // Archive old data
  async archiveOldData(daysOld: number): Promise<ApiResponse<{ recordsArchived: number }>> {
    return apiClient.post(`${this.baseUrl}/archive`, { daysOld });
  }

  // Restore archived data
  async restoreArchivedData(archiveId: string): Promise<ApiResponse<void>> {
    return apiClient.post(`${this.baseUrl}/archive/${archiveId}/restore`);
  }
}

export const adminDataApi = new AdminDataApi();
