export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export type AuditAction =
  | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED'
  | 'USER_CREATE' | 'USER_UPDATE' | 'USER_DELETE' | 'USER_DEACTIVATE' | 'USER_ACTIVATE'
  | 'ROLE_CREATE' | 'ROLE_UPDATE' | 'ROLE_DELETE' | 'ROLE_ASSIGN' | 'ROLE_REVOKE'
  | 'OFFER_CREATE' | 'OFFER_UPDATE' | 'OFFER_DELETE' | 'OFFER_PUBLISH' | 'OFFER_UNPUBLISH'
  | 'QUOTE_CREATE' | 'QUOTE_UPDATE' | 'QUOTE_DELETE' | 'QUOTE_ACCEPT' | 'QUOTE_REJECT'
  | 'POLICY_CREATE' | 'POLICY_UPDATE' | 'POLICY_CANCEL' | 'POLICY_RENEW'
  | 'PAYMENT_PROCESS' | 'PAYMENT_REFUND' | 'PAYMENT_FAIL'
  | 'BACKUP_CREATE' | 'BACKUP_RESTORE' | 'BACKUP_DELETE'
  | 'SYSTEM_CONFIG_UPDATE' | 'SYSTEM_MAINTENANCE'
  | 'DATA_EXPORT' | 'DATA_IMPORT'
  | 'PERMISSION_GRANT' | 'PERMISSION_REVOKE'
  | 'SECURITY_BREACH' | 'SUSPICIOUS_ACTIVITY'
  | 'API_ACCESS' | 'FILE_DOWNLOAD' | 'FILE_UPLOAD';

export interface AuditLogFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  userEmail?: string;
  action?: AuditAction;
  resource?: string;
  severity?: AuditLog['severity'];
  ipAddress?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogExport {
  format: 'CSV' | 'JSON' | 'PDF';
  filters: AuditLogFilters;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
  category: PermissionCategory;
}

export type PermissionCategory =
  | 'USER_MANAGEMENT'
  | 'ROLE_MANAGEMENT'
  | 'OFFER_MANAGEMENT'
  | 'QUOTE_MANAGEMENT'
  | 'POLICY_MANAGEMENT'
  | 'PAYMENT_MANAGEMENT'
  | 'ANALYTICS'
  | 'AUDIT_LOGS'
  | 'SYSTEM_CONFIG'
  | 'BACKUP_RESTORE'
  | 'DATA_IMPORT_EXPORT'
  | 'NOTIFICATION_MANAGEMENT';

export interface UserPermission {
  userId: string;
  roleId: string;
  additionalPermissions: Permission[];
  revokedPermissions: string[];
}

export interface Backup {
  id: string;
  name: string;
  description?: string;
  type: 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL';
  size: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'DELETED';
  location: string;
  includes: BackupInclude[];
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export type BackupInclude =
  | 'USERS' | 'ROLES' | 'OFFERS' | 'QUOTES' | 'POLICIES'
  | 'PAYMENTS' | 'AUDIT_LOGS' | 'SYSTEM_CONFIG' | 'NOTIFICATIONS';

export interface BackupConfig {
  schedule?: BackupSchedule;
  retentionDays: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  defaultIncludes: BackupInclude[];
  location: string;
}

export interface BackupSchedule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  time: string; // HH:MM format
  dayOfWeek?: number; // 0-6 (Sunday-Saturday)
  dayOfMonth?: number; // 1-31
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export interface RestoreJob {
  id: string;
  backupId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  includes: BackupInclude[];
  conflictsResolution: 'OVERWRITE' | 'SKIP' | 'MERGE';
  createdBy: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  restoredItems?: {
    resource: string;
    count: number;
  }[];
}

export interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalOffers: number;
  activeOffers: number;
  totalQuotes: number;
  pendingQuotes: number;
  totalPolicies: number;
  activePolicies: number;
  totalRevenue: number;
  monthlyRevenue: number;
  systemHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  lastBackup?: Date;
  backupStatus: 'UP_TO_DATE' | 'OUTDATED' | 'FAILED';
}

export interface AdminNotification {
  id: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  title: string;
  message: string;
  isRead: boolean;
  timestamp: Date;
  actionUrl?: string;
  autoDismiss?: boolean;
}