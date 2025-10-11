import { AuditLog, AuditLogFilters, AuditLogExport, AuditAction } from '@/types/admin';

const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    userId: 'admin-1',
    userEmail: 'admin@noli.ci',
    action: 'LOGIN',
    resource: 'AUTH',
    details: { loginMethod: 'email', success: true },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: new Date('2024-01-15T09:00:00Z'),
    severity: 'LOW'
  },
  {
    id: '2',
    userId: 'admin-1',
    userEmail: 'admin@noli.ci',
    action: 'USER_CREATE',
    resource: 'USER',
    resourceId: 'user-123',
    details: {
      newUserEmail: 'jean.dupont@email.ci',
      newUserName: 'Jean Dupont',
      role: 'USER'
    },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: new Date('2024-01-15T09:30:00Z'),
    severity: 'MEDIUM'
  },
  {
    id: '3',
    userId: 'user-456',
    userEmail: 'assureur@saham.ci',
    action: 'OFFER_CREATE',
    resource: 'OFFER',
    resourceId: 'offer-789',
    details: {
      offerName: 'Assurance Auto Premium',
      insuranceType: 'auto',
      price: 250000
    },
    ipAddress: '192.168.1.150',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    timestamp: new Date('2024-01-15T10:15:00Z'),
    severity: 'MEDIUM'
  },
  {
    id: '4',
    userId: 'user-789',
    userEmail: 'client@example.ci',
    action: 'QUOTE_CREATE',
    resource: 'QUOTE',
    resourceId: 'quote-456',
    details: {
      vehicleType: 'voiture',
      vehicleBrand: 'Toyota',
      estimatedValue: 5000000,
      coverageType: 'tous risques'
    },
    ipAddress: '192.168.1.200',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)',
    timestamp: new Date('2024-01-15T11:00:00Z'),
    severity: 'LOW'
  },
  {
    id: '5',
    userId: 'system',
    userEmail: 'system@noli.ci',
    action: 'BACKUP_CREATE',
    resource: 'SYSTEM',
    resourceId: 'backup-001',
    details: {
      backupType: 'FULL',
      size: '2.5GB',
      includes: ['USERS', 'OFFERS', 'QUOTES', 'POLICIES']
    },
    ipAddress: '127.0.0.1',
    userAgent: 'NOLI System',
    timestamp: new Date('2024-01-15T02:00:00Z'),
    severity: 'LOW'
  },
  {
    id: '6',
    userId: 'user-123',
    userEmail: 'admin@noli.ci',
    action: 'SECURITY_BREACH',
    resource: 'SECURITY',
    details: {
      reason: 'Multiple failed login attempts',
      attempts: 5,
      blockedIP: '196.25.1.50'
    },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: new Date('2024-01-15T12:30:00Z'),
    severity: 'CRITICAL'
  }
];

export const auditService = {
  async getAuditLogs(filters: AuditLogFilters = {}): Promise<{ logs: AuditLog[]; total: number }> {
    await new Promise(resolve => setTimeout(resolve, 800));

    let filteredLogs = [...mockAuditLogs];

    if (filters.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
    }

    if (filters.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
    }

    if (filters.userEmail) {
      filteredLogs = filteredLogs.filter(log =>
        log.userEmail.toLowerCase().includes(filters.userEmail!.toLowerCase())
      );
    }

    if (filters.action) {
      filteredLogs = filteredLogs.filter(log => log.action === filters.action);
    }

    if (filters.resource) {
      filteredLogs = filteredLogs.filter(log =>
        log.resource.toLowerCase().includes(filters.resource!.toLowerCase())
      );
    }

    if (filters.severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === filters.severity);
    }

    if (filters.ipAddress) {
      filteredLogs = filteredLogs.filter(log =>
        log.ipAddress.includes(filters.ipAddress!)
      );
    }

    const total = filteredLogs.length;
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;

    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return {
      logs: filteredLogs.slice(offset, offset + limit),
      total
    };
  },

  async createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const newLog: AuditLog = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };

    mockAuditLogs.unshift(newLog);

    return newLog;
  },

  async exportAuditLogs(exportConfig: AuditLogExport): Promise<Blob> {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { logs } = await auditService.getAuditLogs(exportConfig.filters);

    switch (exportConfig.format) {
      case 'CSV':
        return auditService.exportToCSV(logs);
      case 'JSON':
        return auditService.exportToJSON(logs);
      case 'PDF':
        return auditService.exportToPDF(logs);
      default:
        throw new Error(`Unsupported export format: ${exportConfig.format}`);
    }
  },

  // Helper functions for export
  exportToCSV: function(logs: AuditLog[]): Blob {
    const headers = [
      'ID', 'User Email', 'Action', 'Resource', 'Resource ID',
      'IP Address', 'Severity', 'Timestamp', 'Details'
    ];

    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        log.id,
        log.userEmail,
        log.action,
        log.resource,
        log.resourceId || '',
        log.ipAddress,
        log.severity,
        log.timestamp.toISOString(),
        JSON.stringify(log.details).replace(/"/g, '""')
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  },

  exportToJSON: function(logs: AuditLog[]): Blob {
    const jsonContent = JSON.stringify(logs, null, 2);
    return new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  },

  exportToPDF: function(logs: AuditLog[]): Blob {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Audit Logs Export</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .severity-LOW { color: #28a745; }
          .severity-MEDIUM { color: #ffc107; }
          .severity-HIGH { color: #fd7e14; }
          .severity-CRITICAL { color: #dc3545; }
        </style>
      </head>
      <body>
        <h1>Audit Logs Export</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Total logs: ${logs.length}</p>

        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Resource</th>
              <th>IP Address</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(log => `
              <tr>
                <td>${log.timestamp.toLocaleString()}</td>
                <td>${log.userEmail}</td>
                <td>${log.action}</td>
                <td>${log.resource}</td>
                <td>${log.ipAddress}</td>
                <td class="severity-${log.severity}">${log.severity}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    return new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  },

  async getAuditStatistics(): Promise<{
    totalLogs: number;
    criticalLogs: number;
    highLogs: number;
    mediumLogs: number;
    lowLogs: number;
    recentActivity: AuditLog[];
    topUsers: { email: string; count: number }[];
    topActions: { action: string; count: number }[];
  }> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const criticalLogs = mockAuditLogs.filter(log => log.severity === 'CRITICAL').length;
    const highLogs = mockAuditLogs.filter(log => log.severity === 'HIGH').length;
    const mediumLogs = mockAuditLogs.filter(log => log.severity === 'MEDIUM').length;
    const lowLogs = mockAuditLogs.filter(log => log.severity === 'LOW').length;

    const recentActivity = mockAuditLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    const userCounts = mockAuditLogs.reduce((acc, log) => {
      acc[log.userEmail] = (acc[log.userEmail] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topUsers = Object.entries(userCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([email, count]) => ({ email, count }));

    const actionCounts = mockAuditLogs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topActions = Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }));

    return {
      totalLogs: mockAuditLogs.length,
      criticalLogs,
      highLogs,
      mediumLogs,
      lowLogs,
      recentActivity,
      topUsers,
      topActions
    };
  }
};