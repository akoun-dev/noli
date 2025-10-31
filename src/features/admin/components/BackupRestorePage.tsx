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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { backupService } from '../services/backupService';
import { Backup, RestoreJob, BackupConfig, BackupInclude } from '@/types/admin';
import {
  Database,
  Download,
  Upload,
  Play,
  Pause,
  Square,
  Settings,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Calendar,
  HardDrive,
  Shield,
  FileText,
  Activity,
  TestTube,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const backupTypeLabels = {
  FULL: 'Complète',
  INCREMENTAL: 'Incrémentielle',
  DIFFERENTIAL: 'Différentielle'
};

const statusColors = {
  PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-500 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30',
  COMPLETED: 'bg-green-500/10 text-green-500 border-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30',
  FAILED: 'bg-red-500/10 text-red-500 border-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30',
  DELETED: 'bg-gray-500/10 text-gray-500 border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30'
};

const statusLabels = {
  PENDING: 'En attente',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  FAILED: 'Échoué',
  DELETED: 'Supprimé',
  CANCELLED: 'Annulé'
};

const backupIncludeOptions: { value: BackupInclude; label: string }[] = [
  { value: 'USERS', label: 'Utilisateurs' },
  { value: 'ROLES', label: 'Rôles et permissions' },
  { value: 'OFFERS', label: 'Offres d\'assurance' },
  { value: 'QUOTES', label: 'Devis' },
  { value: 'POLICIES', label: 'Polices d\'assurance' },
  { value: 'PAYMENTS', label: 'Paiements' },
  { value: 'AUDIT_LOGS', label: 'Journaux d\'audit' },
  { value: 'SYSTEM_CONFIG', label: 'Configuration système' },
  { value: 'NOTIFICATIONS', label: 'Notifications' }
];

export function BackupRestorePage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [restoreJobs, setRestoreJobs] = useState<RestoreJob[]>([]);
  const [backupConfig, setBackupConfig] = useState<BackupConfig | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateBackupDialogOpen, setIsCreateBackupDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [connectionTest, setConnectionTest] = useState<any>(null);

  const [newBackup, setNewBackup] = useState({
    name: '',
    description: '',
    type: 'FULL' as 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL',
    includes: [] as BackupInclude[]
  });

  const [newRestore, setNewRestore] = useState({
    backupId: '',
    includes: [] as BackupInclude[],
    conflictsResolution: 'MERGE' as 'OVERWRITE' | 'SKIP' | 'MERGE'
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [backupsData, restoreJobsData, configData, statsData] = await Promise.all([
        backupService.getBackups(),
        backupService.getRestoreJobs(),
        backupService.getBackupConfig(),
        backupService.getBackupStatistics()
      ]);

      setBackups(backupsData);
      setRestoreJobs(restoreJobsData);
      setBackupConfig(configData);
      setStatistics(statsData);
    } catch (error) {
      logger.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      if (!newBackup.name || newBackup.includes.length === 0) {
        return;
      }

      await backupService.createBackup({
        name: newBackup.name,
        description: newBackup.description,
        type: newBackup.type,
        includes: newBackup.includes
      });

      setIsCreateBackupDialogOpen(false);
      setNewBackup({ name: '', description: '', type: 'FULL', includes: [] });
      loadData();
    } catch (error) {
      logger.error('Error creating backup:', error);
    }
  };

  const handleRestore = async () => {
    try {
      if (!newRestore.backupId || newRestore.includes.length === 0) {
        return;
      }

      await backupService.createRestoreJob({
        backupId: newRestore.backupId,
        includes: newRestore.includes,
        conflictsResolution: newRestore.conflictsResolution
      });

      setIsRestoreDialogOpen(false);
      setNewRestore({ backupId: '', includes: [], conflictsResolution: 'MERGE' });
      loadData();
    } catch (error) {
      logger.error('Error starting restore:', error);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette sauvegarde ?')) {
      return;
    }

    try {
      await backupService.deleteBackup(backupId);
      loadData();
    } catch (error) {
      logger.error('Error deleting backup:', error);
    }
  };

  const handleDownloadBackup = async (backupId: string) => {
    try {
      const blob = await backupService.downloadBackup(backupId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-${backupId}.tar.gz`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Error downloading backup:', error);
    }
  };

  const handleCancelRestore = async (jobId: string) => {
    try {
      await backupService.cancelRestoreJob(jobId);
      loadData();
    } catch (error) {
      logger.error('Error cancelling restore:', error);
    }
  };

  const handleUpdateConfig = async () => {
    if (!backupConfig) return;

    try {
      await backupService.updateBackupConfig(backupConfig);
      setIsConfigDialogOpen(false);
      loadData();
    } catch (error) {
      logger.error('Error updating config:', error);
    }
  };

  const testConnection = async () => {
    try {
      setConnectionTest(null);
      const result = await backupService.testBackupConnection();
      setConnectionTest(result);
    } catch (error) {
      logger.error('Error testing connection:', error);
      setConnectionTest({
        success: false,
        message: 'Erreur lors du test de connexion'
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Sauvegarde et Restauration</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gestion des sauvegardes et restauration du système
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={isCreateBackupDialogOpen} onOpenChange={setIsCreateBackupDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Database className="w-4 h-4 mr-2" />
                Nouvelle Sauvegarde
              </Button>
            </DialogTrigger>
            <DialogContent className="responsive-modal-lg">
              <DialogHeader>
                <DialogTitle>Créer une sauvegarde</DialogTitle>
                <DialogDescription>
                  Configurez et lancez une nouvelle sauvegarde du système
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="backup-name">Nom de la sauvegarde</Label>
                  <Input
                    id="backup-name"
                    value={newBackup.name}
                    onChange={(e) => setNewBackup(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Sauvegarde Complète - Janvier 2024"
                  />
                </div>

                <div>
                  <Label htmlFor="backup-description">Description</Label>
                  <Textarea
                    id="backup-description"
                    value={newBackup.description}
                    onChange={(e) => setNewBackup(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description optionnelle de la sauvegarde"
                  />
                </div>

                <div>
                  <Label>Type de sauvegarde</Label>
                  <Select
                    value={newBackup.type}
                    onValueChange={(value: any) => setNewBackup(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL">Complète</SelectItem>
                      <SelectItem value="INCREMENTAL">Incrémentielle</SelectItem>
                      <SelectItem value="DIFFERENTIAL">Différentielle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Données à inclure</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {backupIncludeOptions.map(option => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`backup-${option.value}`}
                          checked={newBackup.includes.includes(option.value)}
                          onCheckedChange={(checked) =>
                            setNewBackup(prev => ({
                              ...prev,
                              includes: checked
                                ? [...prev.includes, option.value]
                                : prev.includes.filter(i => i !== option.value)
                            }))
                          }
                        />
                        <Label htmlFor={`backup-${option.value}`} className="text-sm">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateBackupDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateBackup}>
                  Créer la sauvegarde
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Configuration
              </Button>
            </DialogTrigger>
            <DialogContent className="responsive-modal-lg">
              <DialogHeader>
                <DialogTitle>Configuration des sauvegardes</DialogTitle>
                <DialogDescription>
                  Configurez les paramètres automatiques de sauvegarde
                </DialogDescription>
              </DialogHeader>
              {backupConfig && (
                <div className="space-y-4">
                  <div>
                    <Label>Planification</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <Select
                        value={backupConfig.schedule?.frequency || 'DAILY'}
                        onValueChange={(value: any) =>
                          setBackupConfig(prev => prev ? ({
                            ...prev,
                            schedule: { ...prev.schedule!, frequency: value }
                          }) : null)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DAILY">Quotidienne</SelectItem>
                          <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                          <SelectItem value="MONTHLY">Mensuelle</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        type="time"
                        value={backupConfig.schedule?.time || '02:00'}
                        onChange={(e) =>
                          setBackupConfig(prev => prev ? ({
                            ...prev,
                            schedule: { ...prev.schedule!, time: e.target.value }
                          }) : null)
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="retention-days">Période de rétention (jours)</Label>
                    <Input
                      id="retention-days"
                      type="number"
                      value={backupConfig.retentionDays}
                      onChange={(e) =>
                        setBackupConfig(prev => prev ? ({
                          ...prev,
                          retentionDays: parseInt(e.target.value) || 90
                        }) : null)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="backup-location">Emplacement de stockage</Label>
                    <Input
                      id="backup-location"
                      value={backupConfig.location}
                      onChange={(e) =>
                        setBackupConfig(prev => prev ? ({
                          ...prev,
                          location: e.target.value
                        }) : null)
                      }
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="compression-enabled"
                      checked={backupConfig.compressionEnabled}
                      onCheckedChange={(checked) =>
                        setBackupConfig(prev => prev ? ({
                          ...prev,
                          compressionEnabled: checked as boolean
                        }) : null)
                      }
                    />
                    <Label htmlFor="compression-enabled">Activer la compression</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="encryption-enabled"
                      checked={backupConfig.encryptionEnabled}
                      onCheckedChange={(checked) =>
                        setBackupConfig(prev => prev ? ({
                          ...prev,
                          encryptionEnabled: checked as boolean
                        }) : null)
                      }
                    />
                    <Label htmlFor="encryption-enabled">Activer le chiffrement</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="schedule-enabled"
                      checked={backupConfig.schedule?.enabled || false}
                      onCheckedChange={(checked) =>
                        setBackupConfig(prev => prev ? ({
                          ...prev,
                          schedule: { ...prev.schedule!, enabled: checked as boolean }
                        }) : null)
                      }
                    />
                    <Label htmlFor="schedule-enabled">Activer la planification automatique</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={testConnection}
                      disabled={!connectionTest?.success && connectionTest !== null}
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      Tester la connexion
                    </Button>
                    {connectionTest && (
                      <Badge className={connectionTest.success ? 'bg-green-500/10 text-green-500 border-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30'}>
                        {connectionTest.success ? 'Connexion réussie' : 'Échec de connexion'}
                      </Badge>
                    )}
                  </div>

                  {connectionTest?.details && (
                    <Alert>
                      <AlertDescription>
                        {Object.entries(connectionTest.details).map(([key, value]) => (
                          <div key={key}>
                            <strong>{key}:</strong> {String(value)}
                          </div>
                        ))}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleUpdateConfig}>
                  Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {statistics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total des sauvegardes</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalBackups}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.successfulBackups} réussies
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Espace utilisé</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFileSize(statistics.storageUsed)}</div>
              <p className="text-xs text-muted-foreground">
                sur {formatFileSize(statistics.storageQuota)} disponibles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dernière sauvegarde</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.lastBackup
                  ? format(statistics.lastBackup, 'dd/MM', { locale: fr })
                  : 'Jamais'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {statistics.nextScheduledBackup
                  ? `Prochaine: ${format(statistics.nextScheduledBackup, 'dd/MM HH:mm', { locale: fr })}`
                  : 'Non planifié'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conformité rétention</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.retentionCompliance.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                des sauvegardes conformes
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="backups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="backups">Sauvegardes</TabsTrigger>
          <TabsTrigger value="restore">Restauration</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="backups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sauvegardes disponibles</CardTitle>
              <CardDescription>
                Liste de toutes les sauvegardes du système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="responsive-table-wrapper">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Créée le</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{backup.name}</div>
                          {backup.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {backup.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {backupTypeLabels[backup.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {backup.size > 0 ? formatFileSize(backup.size) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[backup.status]}>
                            {statusLabels[backup.status]}
                          </Badge>
                          {backup.status === 'IN_PROGRESS' && backup.metadata?.progress && (
                            <Progress value={backup.metadata.progress} className="w-16" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{format(backup.createdAt, 'dd/MM/yyyy HH:mm', { locale: fr })}</div>
                          {backup.completedAt && (
                            <div className="text-xs text-muted-foreground">
                              Terminé: {format(backup.completedAt, 'HH:mm', { locale: fr })}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {backup.status === 'COMPLETED' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadBackup(backup.id)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Dialog open={isRestoreDialogOpen && selectedBackup?.id === backup.id} onOpenChange={(open) => {
                                setIsRestoreDialogOpen(open);
                                if (open) {
                                  setSelectedBackup(backup);
                                  setNewRestore({ backupId: backup.id, includes: backup.includes, conflictsResolution: 'MERGE' });
                                } else {
                                  setSelectedBackup(null);
                                }
                              }}>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Upload className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Restaurer depuis cette sauvegarde</DialogTitle>
                                    <DialogDescription>
                                      Sélectionnez les données à restaurer
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Données à restaurer</Label>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                        {backupIncludeOptions
                                          .filter(option => backup.includes.includes(option.value))
                                          .map(option => (
                                            <div key={option.value} className="flex items-center space-x-2">
                                              <Checkbox
                                                id={`restore-${option.value}`}
                                                checked={newRestore.includes.includes(option.value)}
                                                onCheckedChange={(checked) =>
                                                  setNewRestore(prev => ({
                                                    ...prev,
                                                    includes: checked
                                                      ? [...prev.includes, option.value]
                                                      : prev.includes.filter(i => i !== option.value)
                                                  }))
                                                }
                                              />
                                              <Label htmlFor={`restore-${option.value}`} className="text-sm">
                                                {option.label}
                                              </Label>
                                            </div>
                                          ))}
                                      </div>
                                    </div>

                                    <div>
                                      <Label>Résolution des conflits</Label>
                                      <Select
                                        value={newRestore.conflictsResolution}
                                        onValueChange={(value: any) =>
                                          setNewRestore(prev => ({ ...prev, conflictsResolution: value }))
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="OVERWRITE">Écraser les données existantes</SelectItem>
                                          <SelectItem value="SKIP">Ignorer les données existantes</SelectItem>
                                          <SelectItem value="MERGE">Fusionner avec les données existantes</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsRestoreDialogOpen(false)}>
                                      Annuler
                                    </Button>
                                    <Button onClick={handleRestore}>
                                      Lancer la restauration
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteBackup(backup.id)}
                            disabled={backup.status === 'IN_PROGRESS'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restore" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tâches de restauration</CardTitle>
              <CardDescription>
                Suivi des opérations de restauration en cours et terminées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="responsive-table-wrapper">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sauvegarde</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Progression</TableHead>
                    <TableHead>Résolution</TableHead>
                    <TableHead>Démarrée le</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {restoreJobs.map((job) => {
                    const backup = backups.find(b => b.id === job.backupId);
                    return (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{backup?.name || 'Sauvegarde inconnue'}</div>
                            <div className="text-sm text-muted-foreground">
                              {backup?.type && backupTypeLabels[backup.type]}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            job.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500 border-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30' :
                            job.status === 'FAILED' ? 'bg-red-500/10 text-red-500 border-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30' :
                            job.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30' :
                            job.status === 'CANCELLED' ? 'bg-gray-500/10 text-gray-500 border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30' :
                            'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30'
                          }>
                            {statusLabels[job.status] || job.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={job.progress} className="w-16" />
                            <span className="text-sm">{job.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {job.conflictsResolution === 'OVERWRITE' ? 'Écraser' :
                             job.conflictsResolution === 'SKIP' ? 'Ignorer' : 'Fusionner'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{format(job.createdAt, 'dd/MM/yyyy HH:mm', { locale: fr })}</div>
                            {job.completedAt && (
                              <div className="text-xs text-muted-foreground">
                                Terminé: {format(job.completedAt, 'HH:mm', { locale: fr })}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {job.status === 'IN_PROGRESS' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelRestore(job.id)}
                              >
                                <Square className="w-4 h-4" />
                              </Button>
                            )}
                            {job.status === 'FAILED' && job.errorMessage && (
                              <div title={job.errorMessage}>
                                <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Activité récente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {backups.slice(0, 5).map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Database className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">{backup.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {backupTypeLabels[backup.type]} • {formatFileSize(backup.size || 0)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={statusColors[backup.status]} variant="outline">
                          {statusLabels[backup.status]}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(backup.createdAt, 'dd/MM HH:mm', { locale: fr })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistiques de sauvegarde</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Sauvegardes réussies</span>
                    <span className="font-medium">{statistics?.successfulBackups || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Sauvegardes échouées</span>
                    <span className="font-medium text-red-600 dark:text-red-400">{statistics?.failedBackups || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Taille moyenne</span>
                    <span className="font-medium">
                      {statistics ? formatFileSize(statistics.averageBackupSize) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Epace utilisé</span>
                    <span className="font-medium">
                      {statistics ? formatFileSize(statistics.storageUsed) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Conformité rétention</span>
                    <span className="font-medium">
                      {statistics ? `${statistics.retentionCompliance.toFixed(1)}%` : '-'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}