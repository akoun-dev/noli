import { Backup, BackupConfig, BackupInclude, RestoreJob } from '@/types/admin';
import { logger } from '@/lib/logger';

// NOTE: Backup functionality is not implemented yet
// This service returns empty data until the backup tables are created in the database
// To implement: create backups, restore_jobs, and backup_config tables in Supabase

const NOT_IMPLEMENTED_ERROR = new Error(
  'Backup functionality is not implemented yet. Please configure backup storage first.'
);

export const backupService = {
  async getBackups(): Promise<Backup[]> {
    logger.warn('Backup functionality not implemented - returning empty list');
    return [];
  },

  async getBackup(id: string): Promise<Backup | null> {
    logger.warn(`Backup functionality not implemented - requested backup ${id}`);
    return null;
  },

  async createBackup(config: {
    name: string;
    description?: string;
    type: 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL';
    includes: BackupInclude[];
  }): Promise<Backup> {
    throw NOT_IMPLEMENTED_ERROR;
  },

  async deleteBackup(id: string): Promise<void> {
    throw NOT_IMPLEMENTED_ERROR;
  },

  async downloadBackup(id: string): Promise<Blob> {
    throw NOT_IMPLEMENTED_ERROR;
  },

  async getRestoreJobs(): Promise<RestoreJob[]> {
    logger.warn('Backup functionality not implemented - returning empty restore jobs list');
    return [];
  },

  async createRestoreJob(config: {
    backupId: string;
    includes: BackupInclude[];
    conflictsResolution: 'OVERWRITE' | 'SKIP' | 'MERGE';
  }): Promise<RestoreJob> {
    throw NOT_IMPLEMENTED_ERROR;
  },

  async cancelRestoreJob(id: string): Promise<void> {
    throw NOT_IMPLEMENTED_ERROR;
  },

  async getBackupConfig(): Promise<BackupConfig> {
    return {
      schedule: {
        frequency: 'DAILY',
        time: '02:00',
        enabled: false,
        lastRun: undefined,
        nextRun: undefined,
      },
      retentionDays: 90,
      compressionEnabled: true,
      encryptionEnabled: true,
      defaultIncludes: ['USERS', 'ROLES', 'OFFERS', 'QUOTES', 'POLICIES', 'PAYMENTS', 'AUDIT_LOGS'],
      location: 's3://noli-backups',
    };
  },

  async updateBackupConfig(config: Partial<BackupConfig>): Promise<BackupConfig> {
    throw NOT_IMPLEMENTED_ERROR;
  },

  async getBackupStatistics(): Promise<{
    totalBackups: number;
    successfulBackups: number;
    failedBackups: number;
    inProgressBackups: number;
    totalSize: number;
    averageBackupSize: number;
    lastBackup?: Date;
    nextScheduledBackup?: Date;
    retentionCompliance: number;
    storageUsed: number;
    storageQuota: number;
  }> {
    return {
      totalBackups: 0,
      successfulBackups: 0,
      failedBackups: 0,
      inProgressBackups: 0,
      totalSize: 0,
      averageBackupSize: 0,
      lastBackup: undefined,
      nextScheduledBackup: undefined,
      retentionCompliance: 100,
      storageUsed: 0,
      storageQuota: 10 * 1024 * 1024 * 1024, // 10GB
    };
  },

  async testBackupConnection(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    return {
      success: false,
      message: 'Backup storage is not configured. Please contact your administrator.',
      details: {
        error: 'No backup storage configured',
        suggestion: 'Configure S3 or other backup storage in settings',
      },
    };
  },
};
