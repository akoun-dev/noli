import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { auditService } from '../services/auditService';
import { AuditLog, AuditLogFilters, AuditAction, AuditLogExport } from '@/types/admin';
import {
  Search,
  Download,
  Filter,
  Calendar as CalendarIcon,
  AlertTriangle,
  Shield,
  User,
  Activity,
  BarChart3,
  Clock,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const severityColors = {
  LOW: 'bg-green-500/10 text-green-500 border-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30',
  MEDIUM: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30',
  HIGH: 'bg-orange-500/10 text-orange-500 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30',
  CRITICAL: 'bg-red-500/10 text-red-500 border-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30'
};

const severityLabels = {
  LOW: 'Faible',
  MEDIUM: 'Moyen',
  HIGH: 'Élevé',
  CRITICAL: 'Critique'
};

const actionLabels: Record<AuditAction, string> = {
  LOGIN: 'Connexion',
  LOGOUT: 'Déconnexion',
  LOGIN_FAILED: 'Échec de connexion',
  USER_CREATE: 'Création utilisateur',
  USER_UPDATE: 'Mise à jour utilisateur',
  USER_DELETE: 'Suppression utilisateur',
  USER_DEACTIVATE: 'Désactivation utilisateur',
  USER_ACTIVATE: 'Activation utilisateur',
  ROLE_CREATE: 'Création rôle',
  ROLE_UPDATE: 'Mise à jour rôle',
  ROLE_DELETE: 'Suppression rôle',
  ROLE_ASSIGN: 'Attribution rôle',
  ROLE_REVOKE: 'Révocation rôle',
  OFFER_CREATE: 'Création offre',
  OFFER_UPDATE: 'Mise à jour offre',
  OFFER_DELETE: 'Suppression offre',
  OFFER_PUBLISH: 'Publication offre',
  OFFER_UNPUBLISH: 'Dépublication offre',
  QUOTE_CREATE: 'Création devis',
  QUOTE_UPDATE: 'Mise à jour devis',
  QUOTE_DELETE: 'Suppression devis',
  QUOTE_ACCEPT: 'Acceptation devis',
  QUOTE_REJECT: 'Rejet devis',
  POLICY_CREATE: 'Création police',
  POLICY_UPDATE: 'Mise à jour police',
  POLICY_CANCEL: 'Annulation police',
  POLICY_RENEW: 'Renouvellement police',
  PAYMENT_PROCESS: 'Traitement paiement',
  PAYMENT_REFUND: 'Remboursement paiement',
  PAYMENT_FAIL: 'Échec paiement',
  BACKUP_CREATE: 'Création sauvegarde',
  BACKUP_RESTORE: 'Restauration sauvegarde',
  BACKUP_DELETE: 'Suppression sauvegarde',
  SYSTEM_CONFIG_UPDATE: 'Mise à jour config système',
  SYSTEM_MAINTENANCE: 'Maintenance système',
  DATA_EXPORT: 'Export données',
  DATA_IMPORT: 'Import données',
  PERMISSION_GRANT: 'Attribution permission',
  PERMISSION_REVOKE: 'Révocation permission',
  SECURITY_BREACH: 'Breach sécurité',
  SUSPICIOUS_ACTIVITY: 'Activité suspecte',
  API_ACCESS: 'Accès API',
  FILE_DOWNLOAD: 'Téléchargement fichier',
  FILE_UPLOAD: 'Téléversement fichier'
};

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [statistics, setStatistics] = useState<any>(null);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const pageSize = 20;

  useEffect(() => {
    loadLogs();
    loadStatistics();
  }, [filters, currentPage]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * pageSize;
      const result = await auditService.getAuditLogs({
        ...filters,
        limit: pageSize,
        offset
      });
      setLogs(result.logs);
      setTotal(result.total);
    } catch (error) {
      logger.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await auditService.getAuditStatistics();
      setStatistics(stats);
    } catch (error) {
      logger.error('Error loading statistics:', error);
    }
  };

  const handleSearch = () => {
    const newFilters: AuditLogFilters = {
      ...filters,
      userEmail: searchTerm || undefined
    };
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleExport = async (format: 'CSV' | 'JSON' | 'PDF') => {
    try {
      setExporting(true);
      const blob = await auditService.exportAuditLogs({
        format,
        filters
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${format.toLowerCase()}-${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Error exporting logs:', error);
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Journaux d'Audit</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Surveillance complète des activités du système
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('CSV')}
            disabled={exporting}
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('PDF')}
            disabled={exporting}
          >
            <FileText className="w-4 h-4 mr-2" />
            Exporter PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Journaux</TabsTrigger>
          <TabsTrigger value="statistics">Statistiques</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {statistics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total des journaux</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.totalLogs}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Alertes critiques</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500 dark:text-red-400">
                    {statistics.criticalLogs}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Activité récente</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statistics.recentActivity.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Dernières 24h
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Utilisateurs actifs</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statistics.topUsers.length}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Filtres de recherche</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Rechercher par email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch}>
                    <Search className="w-4 h-4" />
                  </Button>
                </div>

                <Select
                  value={filters.action || ''}
                  onValueChange={(value) => {
                    const newFilters = { ...filters, action: value as AuditAction || undefined };
                    setFilters(newFilters);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type d'action" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(actionLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.severity || ''}
                  onValueChange={(value) => {
                    const newFilters = { ...filters, severity: value as any || undefined };
                    setFilters(newFilters);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sévérité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Faible</SelectItem>
                    <SelectItem value="MEDIUM">Moyen</SelectItem>
                    <SelectItem value="HIGH">Élevé</SelectItem>
                    <SelectItem value="CRITICAL">Critique</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Adresse IP..."
                  value={filters.ipAddress || ''}
                  onChange={(e) => {
                    const newFilters = { ...filters, ipAddress: e.target.value || undefined };
                    setFilters(newFilters);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Journal des activités</CardTitle>
              <CardDescription>
                {total} entrées trouvées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="responsive-table-wrapper">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Timestamp</TableHead>
                      <TableHead className="whitespace-nowrap">Utilisateur</TableHead>
                      <TableHead className="whitespace-nowrap">Action</TableHead>
                      <TableHead className="whitespace-nowrap">Ressource</TableHead>
                      <TableHead className="whitespace-nowrap">Adresse IP</TableHead>
                      <TableHead className="whitespace-nowrap">Sévérité</TableHead>
                      <TableHead className="whitespace-nowrap">Détails</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Aucun résultat trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {format(log.timestamp, 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{log.userEmail}</span>
                            <span className="text-sm text-muted-foreground">{log.userId}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {actionLabels[log.action] || log.action}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{log.resource}</span>
                            {log.resourceId && (
                              <span className="text-sm text-muted-foreground">
                                ID: {log.resourceId}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {log.ipAddress}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge className={severityColors[log.severity]}>
                            <Shield className="w-3 h-3 mr-1" />
                            {severityLabels[log.severity]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <details className="text-sm">
                            <summary className="cursor-pointer hover:text-muted-foreground">
                              Voir détails
                            </summary>
                            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-w-xs">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row sm:justify-center sm:items-center items-center mt-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-full sm:w-auto"
                  >
                    Précédent
                  </Button>
                  <span className="flex items-center px-4 text-sm text-muted-foreground">
                    Page {currentPage} sur {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-full sm:w-auto"
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          {statistics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Actions les plus fréquentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {statistics.topActions.map((item: any, index: number) => (
                      <div key={item.action} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground">
                            #{index + 1}
                          </span>
                          <span>{actionLabels[item.action] || item.action}</span>
                        </div>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Utilisateurs les plus actifs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {statistics.topUsers.map((user: any, index: number) => (
                      <div key={user.email} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground">
                            #{index + 1}
                          </span>
                          <span className="text-sm">{user.email}</span>
                        </div>
                        <Badge variant="secondary">{user.count} actions</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribution par sévérité</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(severityLabels).map(([severity, label]) => {
                      const count = statistics[`${severity.toLowerCase()}Logs`];
                      const percentage = (count / statistics.totalLogs * 100).toFixed(1);
                      return (
                        <div key={severity} className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Badge className={severityColors[severity as keyof typeof severityColors]}>
                              {label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground min-w-[3rem]">
                              {count} ({percentage}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activité récente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {statistics.recentActivity.slice(0, 5).map((log: AuditLog) => (
                      <div key={log.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge className={severityColors[log.severity]} variant="outline">
                            {severityLabels[log.severity]}
                          </Badge>
                          <span>{log.userEmail}</span>
                          <span className="text-muted-foreground">
                            {actionLabels[log.action] || log.action}
                          </span>
                        </div>
                        <span className="text-muted-foreground">
                          {format(log.timestamp, 'HH:mm:ss')}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Alert className="responsive-alert">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Alertes de sécurité</AlertTitle>
            <AlertDescription>
              Surveillance des activités suspectes et des tentatives d'intrusion
            </AlertDescription>
          </Alert>

          {statistics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border-red-500/20 bg-red-500/5 dark:border-red-500/30 dark:bg-red-500/10">
                <CardHeader>
                  <CardTitle className="text-red-500 dark:text-red-400">Alertes critiques</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-500 dark:text-red-400">
                    {statistics.criticalLogs}
                  </div>
                  <p className="text-sm text-red-500/80 dark:text-red-400/80 mt-2">
                    Nécessitent une attention immédiate
                  </p>
                </CardContent>
              </Card>

              <Card className="border-orange-500/20 bg-orange-500/5 dark:border-orange-500/30 dark:bg-orange-500/10">
                <CardHeader>
                  <CardTitle className="text-orange-500 dark:text-orange-400">Alertes élevées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-500 dark:text-orange-400">
                    {statistics.highLogs}
                  </div>
                  <p className="text-sm text-orange-500/80 dark:text-orange-400/80 mt-2">
                    À surveiller attentivement
                  </p>
                </CardContent>
              </Card>

              <Card className="border-yellow-500/20 bg-yellow-500/5 dark:border-yellow-500/30 dark:bg-yellow-500/10">
                <CardHeader>
                  <CardTitle className="text-yellow-500 dark:text-yellow-400">Alertes moyennes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-500 dark:text-yellow-400">
                    {statistics.mediumLogs}
                  </div>
                  <p className="text-sm text-yellow-500/80 dark:text-yellow-400/80 mt-2">
                    Vérification recommandée
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Événements de sécurité récents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs
                  .filter(log => log.severity === 'CRITICAL' || log.severity === 'HIGH')
                  .slice(0, 10)
                  .map((log) => (
                    <div
                      key={log.id}
                      className={`p-4 rounded-lg border ${
                        log.severity === 'CRITICAL'
                          ? 'bg-red-500/5 border-red-500/20 dark:bg-red-500/10 dark:border-red-500/30'
                          : 'bg-orange-500/5 border-orange-500/20 dark:bg-orange-500/10 dark:border-orange-500/30'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`w-4 h-4 ${
                            log.severity === 'CRITICAL' ? 'text-red-500 dark:text-red-400' : 'text-orange-500 dark:text-orange-400'
                          }`} />
                          <span className="font-medium">
                            {actionLabels[log.action] || log.action}
                          </span>
                          <Badge className={severityColors[log.severity]}>
                            {severityLabels[log.severity]}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(log.timestamp, 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Utilisateur: {log.userEmail} • IP: {log.ipAddress}
                      </div>
                      <details className="text-sm">
                        <summary className="cursor-pointer hover:text-foreground">
                          Détails de l'événement
                        </summary>
                        <pre className="mt-2 text-xs bg-muted p-2 rounded border">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}