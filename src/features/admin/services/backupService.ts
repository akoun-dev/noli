import { Backup, BackupConfig, BackupInclude, BackupSchedule, RestoreJob } from '@/types/admin';

const mockBackups: Backup[] = [
  {
    id: 'backup-1',
    name: 'Sauvegarde Complète - Janvier 2024',
    description: 'Sauvegarde mensuelle complète du système',
    type: 'FULL',
    size: 2_584_761_344,
    status: 'COMPLETED',
    location: 's3://noli-backups/2024/01/backup-full-20240115.tar.gz',
    includes: ['USERS', 'ROLES', 'OFFERS', 'QUOTES', 'POLICIES', 'PAYMENTS', 'AUDIT_LOGS', 'SYSTEM_CONFIG'],
    createdBy: 'admin-1',
    createdAt: new Date('2024-01-15T02:00:00Z'),
    completedAt: new Date('2024-01-15T02:45:00Z'),
    expiresAt: new Date('2024-04-15T02:00:00Z'),
    metadata: {
      compressionLevel: 6,
      encryptionEnabled: true,
      checksum: 'sha256:a1b2c3d4e5f6...',
      version: '1.0.0'
    }
  },
  {
    id: 'backup-2',
    name: 'Sauvegarde Incrémentielle - 15 Janvier',
    description: 'Sauvegarde incrémentielle quotidienne',
    type: 'INCREMENTAL',
    size: 125_847_392,
    status: 'COMPLETED',
    location: 's3://noli-backups/2024/01/backup-inc-20240115.tar.gz',
    includes: ['OFFERS', 'QUOTES', 'POLICIES'],
    createdBy: 'system',
    createdAt: new Date('2024-01-15T14:00:00Z'),
    completedAt: new Date('2024-01-15T14:12:00Z'),
    expiresAt: new Date('2024-02-15T14:00:00Z'),
    metadata: {
      basedOnBackup: 'backup-1',
      compressionLevel: 6,
      encryptionEnabled: true,
      changedFiles: 147
    }
  },
  {
    id: 'backup-3',
    name: 'Sauvegarde Complète - Décembre 2023',
    description: 'Dernière sauvegarde mensuelle de 2023',
    type: 'FULL',
    size: 2_234_567_890,
    status: 'COMPLETED',
    location: 's3://noli-backups/2023/12/backup-full-20231215.tar.gz',
    includes: ['USERS', 'ROLES', 'OFFERS', 'QUOTES', 'POLICIES', 'PAYMENTS', 'AUDIT_LOGS', 'SYSTEM_CONFIG', 'NOTIFICATIONS'],
    createdBy: 'admin-1',
    createdAt: new Date('2023-12-15T02:00:00Z'),
    completedAt: new Date('2023-12-15T02:38:00Z'),
    expiresAt: new Date('2024-03-15T02:00:00Z'),
    metadata: {
      compressionLevel: 6,
      encryptionEnabled: true,
      checksum: 'sha256:f6e5d4c3b2a1...',
      version: '1.0.0'
    }
  },
  {
    id: 'backup-4',
    name: 'Sauvegarde en cours',
    description: 'Sauvegarde complète planifiée',
    type: 'FULL',
    size: 0,
    status: 'IN_PROGRESS',
    location: 's3://noli-backups/temp/backup-full-20240116.tar.gz',
    includes: ['USERS', 'ROLES', 'OFFERS', 'QUOTES', 'POLICIES', 'PAYMENTS', 'AUDIT_LOGS', 'SYSTEM_CONFIG'],
    createdBy: 'system',
    createdAt: new Date('2024-01-16T02:00:00Z'),
    metadata: {
      compressionLevel: 6,
      encryptionEnabled: true,
      progress: 45,
      estimatedCompletion: new Date('2024-01-16T02:40:00Z')
    }
  },
  {
    id: 'backup-5',
    name: 'Sauvegarde Échouée',
    description: 'Sauvegarde incrémentielle avec erreur',
    type: 'INCREMENTAL',
    size: 0,
    status: 'FAILED',
    location: 's3://noli-backups/failed/backup-inc-20240114.tar.gz',
    includes: ['OFFERS', 'QUOTES'],
    createdBy: 'system',
    createdAt: new Date('2024-01-14T14:00:00Z'),
    metadata: {
      error: 'Connection timeout to database server',
      retryCount: 3,
      lastRetry: new Date('2024-01-14T14:15:00Z')
    }
  }
];

const mockRestoreJobs: RestoreJob[] = [
  {
    id: 'restore-1',
    backupId: 'backup-2',
    status: 'COMPLETED',
    progress: 100,
    includes: ['QUOTES', 'POLICIES'],
    conflictsResolution: 'MERGE',
    createdBy: 'admin-1',
    createdAt: new Date('2024-01-14T10:00:00Z'),
    startedAt: new Date('2024-01-14T10:01:00Z'),
    completedAt: new Date('2024-01-14T10:08:00Z'),
    restoredItems: [
      { resource: 'QUOTES', count: 23 },
      { resource: 'POLICIES', count: 45 }
    ]
  },
  {
    id: 'restore-2',
    backupId: 'backup-1',
    status: 'FAILED',
    progress: 75,
    includes: ['USERS', 'ROLES'],
    conflictsResolution: 'OVERWRITE',
    createdBy: 'admin-2',
    createdAt: new Date('2024-01-13T15:30:00Z'),
    startedAt: new Date('2024-01-13T15:31:00Z'),
    errorMessage: 'Integrity check failed for users table'
  }
];

const mockBackupConfig: BackupConfig = {
  schedule: {
    frequency: 'DAILY',
    time: '02:00',
    enabled: true,
    lastRun: new Date('2024-01-15T02:00:00Z'),
    nextRun: new Date('2024-01-16T02:00:00Z')
  },
  retentionDays: 90,
  compressionEnabled: true,
  encryptionEnabled: true,
  defaultIncludes: ['USERS', 'ROLES', 'OFFERS', 'QUOTES', 'POLICIES', 'PAYMENTS', 'AUDIT_LOGS'],
  location: 's3://noli-backups'
};

export const backupService = {
  async getBackups(): Promise<Backup[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    return mockBackups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async getBackup(id: string): Promise<Backup | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockBackups.find(backup => backup.id === id) || null;
  },

  async createBackup(config: {
    name: string;
    description?: string;
    type: 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL';
    includes: BackupInclude[];
  }): Promise<Backup> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newBackup: Backup = {
      id: Math.random().toString(36).substr(2, 9),
      name: config.name,
      description: config.description,
      type: config.type,
      size: 0,
      status: 'PENDING',
      location: `s3://noli-backups/temp/backup-${Date.now()}.tar.gz`,
      includes: config.includes,
      createdBy: 'current-user',
      createdAt: new Date(),
      metadata: {
        compressionLevel: 6,
        encryptionEnabled: true
      }
    };

    mockBackups.unshift(newBackup);

    setTimeout(() => {
      const backup = mockBackups.find(b => b.id === newBackup.id);
      if (backup) {
        backup.status = 'IN_PROGRESS';
        backup.metadata = { ...backup.metadata, progress: 25 };

        setTimeout(() => {
          if (backup) {
            backup.status = 'IN_PROGRESS';
            backup.metadata = { ...backup.metadata, progress: 50 };

            setTimeout(() => {
              if (backup) {
                backup.status = 'IN_PROGRESS';
                backup.metadata = { ...backup.metadata, progress: 75 };

                setTimeout(() => {
                  if (backup) {
                    backup.status = 'COMPLETED';
                    backup.size = Math.floor(Math.random() * 1_000_000_000) + 100_000_000;
                    backup.completedAt = new Date();
                    backup.location = `s3://noli-backups/${backup.id}/backup-${backup.id}.tar.gz`;
                    delete backup.metadata?.progress;
                  }
                }, 3000);
              }
            }, 2000);
          }
        }, 2000);
      }
    }, 1000);

    return newBackup;
  },

  async deleteBackup(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const index = mockBackups.findIndex(backup => backup.id === id);
    if (index === -1) {
      throw new Error('Sauvegarde non trouvée');
    }

    mockBackups.splice(index, 1);
  },

  async downloadBackup(id: string): Promise<Blob> {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const backup = mockBackups.find(b => b.id === id);
    if (!backup) {
      throw new Error('Sauvegarde non trouvée');
    }

    const mockData = new ArrayBuffer(backup.size || 1024);
    return new Blob([mockData], { type: 'application/gzip' });
  },

  async getRestoreJobs(): Promise<RestoreJob[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockRestoreJobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async createRestoreJob(config: {
    backupId: string;
    includes: BackupInclude[];
    conflictsResolution: 'OVERWRITE' | 'SKIP' | 'MERGE';
  }): Promise<RestoreJob> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const backup = mockBackups.find(b => b.id === config.backupId);
    if (!backup) {
      throw new Error('Sauvegarde non trouvée');
    }

    const newJob: RestoreJob = {
      id: Math.random().toString(36).substr(2, 9),
      backupId: config.backupId,
      status: 'PENDING',
      progress: 0,
      includes: config.includes,
      conflictsResolution: config.conflictsResolution,
      createdBy: 'current-user',
      createdAt: new Date()
    };

    mockRestoreJobs.unshift(newJob);

    setTimeout(() => {
      const job = mockRestoreJobs.find(j => j.id === newJob.id);
      if (job) {
        job.status = 'IN_PROGRESS';
        job.startedAt = new Date();

        const progressInterval = setInterval(() => {
          if (job && job.status === 'IN_PROGRESS') {
            job.progress = Math.min(job.progress + 10, 90);

            if (job.progress >= 90) {
              clearInterval(progressInterval);
              setTimeout(() => {
                if (job) {
                  job.status = 'COMPLETED';
                  job.progress = 100;
                  job.completedAt = new Date();
                  job.restoredItems = config.includes.map(resource => ({
                    resource,
                    count: Math.floor(Math.random() * 50) + 1
                  }));
                }
              }, 1000);
            }
          } else {
            clearInterval(progressInterval);
          }
        }, 1000);
      }
    }, 2000);

    return newJob;
  },

  async cancelRestoreJob(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const job = mockRestoreJobs.find(j => j.id === id);
    if (job) {
      job.status = 'CANCELLED';
    }
  },

  async getBackupConfig(): Promise<BackupConfig> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { ...mockBackupConfig };
  },

  async updateBackupConfig(config: Partial<BackupConfig>): Promise<BackupConfig> {
    await new Promise(resolve => setTimeout(resolve, 500));

    Object.assign(mockBackupConfig, config);
    return { ...mockBackupConfig };
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
    await new Promise(resolve => setTimeout(resolve, 400));

    const successfulBackups = mockBackups.filter(b => b.status === 'COMPLETED').length;
    const failedBackups = mockBackups.filter(b => b.status === 'FAILED').length;
    const inProgressBackups = mockBackups.filter(b => b.status === 'IN_PROGRESS').length;

    const totalSize = mockBackups
      .filter(b => b.status === 'COMPLETED')
      .reduce((sum, b) => sum + (b.size || 0), 0);

    const averageBackupSize = successfulBackups > 0 ? totalSize / successfulBackups : 0;

    const lastBackup = mockBackups
      .filter(b => b.status === 'COMPLETED')
      .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())[0]?.completedAt;

    const expiredBackups = mockBackups.filter(b =>
      b.status === 'COMPLETED' &&
      b.expiresAt &&
      b.expiresAt < new Date()
    ).length;

    const retentionCompliance = mockBackups.length > 0
      ? ((mockBackups.length - expiredBackups) / mockBackups.length) * 100
      : 100;

    return {
      totalBackups: mockBackups.length,
      successfulBackups,
      failedBackups,
      inProgressBackups,
      totalSize,
      averageBackupSize,
      lastBackup,
      nextScheduledBackup: mockBackupConfig.schedule?.nextRun,
      retentionCompliance,
      storageUsed: totalSize,
      storageQuota: 10 * 1024 * 1024 * 1024 // 10GB
    };
  },

  async testBackupConnection(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const isSuccess = Math.random() > 0.1;

    return {
      success: isSuccess,
      message: isSuccess
        ? 'Connexion au stockage de sauvegarde établie avec succès'
        : 'Échec de connexion au stockage de sauvegarde',
      details: isSuccess
        ? {
            endpoint: 's3://noli-backups',
            latency: '45ms',
            availableSpace: '7.2GB'
          }
        : {
            error: 'Connection timeout',
            retryCount: 3
          }
    };
  }
};