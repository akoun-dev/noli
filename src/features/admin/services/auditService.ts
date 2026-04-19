import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuditLog, AuditLogFilters, AuditLogExport, AuditAction } from '@/types/admin';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

// Fonctions API pour l'audit avec Supabase
const mapSeverityToUi = (severity?: string): AuditLog['severity'] => {
  switch ((severity || '').toLowerCase()) {
    case 'critical':
      return 'CRITICAL';
    case 'error':
      return 'HIGH';
    case 'warning':
      return 'MEDIUM';
    default:
      return 'LOW';
  }
};

const mapSeverityToDb = (severity: AuditLog['severity']): 'debug' | 'info' | 'warning' | 'error' | 'critical' => {
  switch (severity) {
    case 'CRITICAL':
      return 'critical';
    case 'HIGH':
      return 'error';
    case 'MEDIUM':
      return 'warning';
    default:
      return 'info';
  }
};

export const fetchAuditLogs = async (filters: AuditLogFilters = {}): Promise<{ logs: AuditLog[]; total: number }> => {
  try {
    let query = supabase
      .from('audit_logs')
      .select(`
        id,
        user_id,
        action,
        resource_type,
        resource_id,
        metadata,
        old_values,
        new_values,
        ip_address,
        user_agent,
        severity,
        created_at,
        profiles!inner(email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.userEmail) {
      query = query.ilike('profiles.email', `%${filters.userEmail}%`);
    }

    if (filters.action) {
      query = query.eq('action', filters.action);
    }

    if (filters.resource) {
      query = query.ilike('resource_type', `%${filters.resource}%`);
    }

    if (filters.severity) {
      query = query.eq('severity', mapSeverityToDb(filters.severity));
    }

    if (filters.ipAddress) {
      query = query.ilike('ip_address', `%${filters.ipAddress}%`);
    }

    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Error fetching audit logs:', error);
      return await auditService.getAuditLogsFallback(filters);
    }

    const logs: AuditLog[] = (data || []).map(log => ({
      id: log.id,
      userId: log.user_id,
      userEmail: log.profiles?.email || '',
      action: log.action as AuditAction,
      resource: log.resource_type,
      resourceId: log.resource_id,
      details: log.metadata || log.new_values || {},
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      timestamp: new Date(log.created_at),
      severity: mapSeverityToUi(log.severity)
    }));

    return {
      logs,
      total: count || 0
    };

  } catch (error) {
    logger.error('Error in fetchAuditLogs:', error);
    return await auditService.getAuditLogsFallback(filters);
  }
};

export const createAuditLog = async (log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: log.userId,
        action: log.action,
        resource_type: log.resource,
        resource_id: log.resourceId,
        metadata: log.details,
        ip_address: log.ipAddress,
        user_agent: log.userAgent,
        severity: mapSeverityToDb(log.severity),
        success: true
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating audit log:', error);
      throw error;
    }

    return {
      id: data.id,
      userId: data.user_id,
      userEmail: log.userEmail,
      action: data.action as AuditAction,
      resource: data.resource_type,
      resourceId: data.resource_id,
      details: data.metadata || {},
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      timestamp: new Date(data.created_at),
      severity: mapSeverityToUi(data.severity)
    };

  } catch (error) {
    logger.error('Error in createAuditLog:', error);
    throw error;
  }
};

export const auditService = {
  // Fallback : retourne des données vides si la base n'est pas disponible
  async getAuditLogsFallback(filters: AuditLogFilters = {}): Promise<{ logs: AuditLog[]; total: number }> {
    // Retourner des données vides - pas de mocks
    return {
      logs: [],
      total: 0
    };
  },

  async getAuditLogs(filters: AuditLogFilters = {}): Promise<{ logs: AuditLog[]; total: number }> {
    return await fetchAuditLogs(filters);
  },

  async createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    return await createAuditLog(log);
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
    try {
      // Récupérer le nombre total de logs par sévérité
      const { data: logsData, error } = await supabase
        .from('audit_logs')
        .select('severity, created_at, action, profiles!inner(email)');

      if (error) {
        logger.error('Error fetching audit statistics:', error);
        // Retourner des statistiques vides si erreur
        return {
          totalLogs: 0,
          criticalLogs: 0,
          highLogs: 0,
          mediumLogs: 0,
          lowLogs: 0,
          recentActivity: [],
          topUsers: [],
          topActions: []
        };
      }

      const logs = logsData || [];

      // Compter par sévérité
      const criticalLogs = logs.filter(log => log.severity === 'critical').length;
      const highLogs = logs.filter(log => log.severity === 'error').length;
      const mediumLogs = logs.filter(log => log.severity === 'warning').length;
      const lowLogs = logs.filter(log => log.severity === 'info' || log.severity === 'debug').length;

      // Activité récente (dernières 24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const recentActivity = logs
        .filter(log => new Date(log.created_at) >= yesterday)
        .map(log => ({
          id: log.id || '',
          userId: log.user_id || '',
          userEmail: log.profiles?.email || '',
          action: log.action as AuditAction,
          resource: '',
          resourceId: '',
          details: {},
          ipAddress: '',
          userAgent: '',
          timestamp: new Date(log.created_at),
          severity: mapSeverityToUi(log.severity)
        }))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10);

      // Top utilisateurs
      const userCounts = logs.reduce((acc, log) => {
        const email = log.profiles?.email || 'inconnu';
        acc[email] = (acc[email] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topUsers = Object.entries(userCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([email, count]) => ({ email, count }));

      // Top actions
      const actionCounts = logs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topActions = Object.entries(actionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([action, count]) => ({ action, count }));

      return {
        totalLogs: logs.length,
        criticalLogs,
        highLogs,
        mediumLogs,
        lowLogs,
        recentActivity,
        topUsers,
        topActions
      };

    } catch (error) {
      logger.error('Error in getAuditStatistics:', error);
      // Retourner des statistiques vides en cas d'erreur
      return {
        totalLogs: 0,
        criticalLogs: 0,
        highLogs: 0,
        mediumLogs: 0,
        lowLogs: 0,
        recentActivity: [],
        topUsers: [],
        topActions: []
      };
    }
  }
};

// React Query Hooks pour l'audit
export const useAuditLogs = (filters?: AuditLogFilters) => {
  return useQuery({
    queryKey: ['admin-audit-logs', filters],
    queryFn: () => fetchAuditLogs(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateAuditLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAuditLog,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-audit-logs']);
    },
    onError: (error) => {
      logger.error('Error creating audit log:', error);
      toast.error('Erreur lors de la création du log d\'audit');
    },
  });
};

export const useExportAuditLogs = () => {
  return useMutation({
    mutationFn: (exportConfig: AuditLogExport) => auditService.exportAuditLogs(exportConfig),
    onSuccess: (blob, variables) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.${variables.format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Logs d\'audit exportés avec succès');
    },
    onError: (error) => {
      logger.error('Error exporting audit logs:', error);
      toast.error('Erreur lors de l\'export des logs d\'audit');
    },
  });
};

export const useAuditStatistics = () => {
  return useQuery({
    queryKey: ['admin-audit-statistics'],
    queryFn: () => auditService.getAuditStatistics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
