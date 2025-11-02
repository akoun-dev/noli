import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Database,
  Upload,
  Download,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  FileText,
  Users,
  Shield,
  BarChart3,
  Activity,
  Settings,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { adminDataApi } from '@/api/services/adminDataApi';
import type {
  ImportJob,
  DataValidation,
  UpdateHistory,
  DataQualityMetrics,
  ImportRequest,
  ValidationRequest,
  ExportRequest
} from '@/api/services/adminDataApi';
import { logger } from '@/lib/logger';

export const AdminDataManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('validation');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState('users');
  const [showImportDialog, setShowImportDialog] = useState(false);

  // États pour les données API
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [dataValidations, setDataValidations] = useState<DataValidation[]>([]);
  const [updateHistory, setUpdateHistory] = useState<UpdateHistory[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<DataQualityMetrics | null>(null);

  // États de chargement
  const [loading, setLoading] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Charger les données au montage du composant
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobsResponse, validationsResponse, historyResponse, metricsResponse] = await Promise.all([
        adminDataApi.getImportJobs(),
        adminDataApi.getDataValidations(),
        adminDataApi.getUpdateHistory(),
        adminDataApi.getDataQualityMetrics()
      ]);

      if (jobsResponse.success) {
        setImportJobs(jobsResponse.data || []);
      }
      if (validationsResponse.success) {
        setDataValidations(validationsResponse.data || []);
      }
      if (historyResponse.success) {
        setUpdateHistory(historyResponse.data || []);
      }
      if (metricsResponse.success) {
        setQualityMetrics(metricsResponse.data);
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
      case 'passed':
        return <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-500/20 dark:text-green-400">Terminé</Badge>;
      case 'processing':
      case 'pending':
        return <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400">En cours</Badge>;
      case 'failed':
        return <Badge variant="outline" className="border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/20 dark:text-red-400">Échoué</Badge>;
      case 'warning':
        return <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-400">Avertissement</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'processing':
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />;
      case 'stable':
        return <Minus className="h-3 w-3 text-gray-600 dark:text-gray-400" />;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const startImport = async () => {
    if (!selectedFile) return;
    
    try {
      setImportLoading(true);
      const request: ImportRequest = {
        file: selectedFile,
        type: importType as 'users' | 'insurers' | 'offers' | 'quotes'
      };
      
      const response = await adminDataApi.startImport(request);
      
      if (response.success) {
        toast.success('Import démarré avec succès');
        setShowImportDialog(false);
        setSelectedFile(null);
        // Recharger les données pour voir le nouvel import
        loadData();
      } else {
        toast.error('Erreur lors du démarrage de l\'import');
      }
    } catch (error) {
      logger.error('Erreur lors de l\'import:', error);
      toast.error('Erreur lors de l\'import');
    } finally {
      setImportLoading(false);
    }
  };

  const runValidation = async (entityType: string) => {
    try {
      setValidationLoading(true);
      const request: ValidationRequest = {
        entityType: entityType as 'users' | 'insurers' | 'offers' | 'quotes' | 'all'
      };
      
      const response = await adminDataApi.runValidation(request);
      
      if (response.success) {
        toast.success(`Validation ${entityType === 'all' ? 'générale' : entityType} démarrée`);
        // Recharger les données pour voir la nouvelle validation
        loadData();
      } else {
        toast.error('Erreur lors du démarrage de la validation');
      }
    } catch (error) {
      logger.error('Erreur lors de la validation:', error);
      toast.error('Erreur lors de la validation');
    } finally {
      setValidationLoading(false);
    }
  };

  const exportData = async (entityType: string) => {
    try {
      setExportLoading(true);
      const request: ExportRequest = {
        entityType: entityType as 'users' | 'insurers' | 'offers' | 'quotes' | 'all',
        format: 'csv'
      };
      
      const response = await adminDataApi.exportData(request);
      
      if (response.success && response.data?.downloadUrl) {
        // Télécharger le fichier
        const link = document.createElement('a');
        link.href = response.data.downloadUrl;
        link.download = `${entityType}_export.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Export réussi');
      } else {
        toast.error('Erreur lors de l\'export');
      }
    } catch (error) {
      logger.error('Erreur lors de l\'export:', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="text-lg">Chargement des données...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
    {/* Header */}
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">Gestion des Données</h1>
        <p className="text-muted-foreground">Validation, import/export et contrôle qualité des données</p>
      </div>
      <div className="flex w-full sm:w-auto">
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" disabled={importLoading}>
              <Upload className="h-4 w-4 mr-2" />
              Importer des données
            </Button>
          </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Importer des données</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Type de données</label>
                  <Select value={importType} onValueChange={setImportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="users">Utilisateurs</SelectItem>
                      <SelectItem value="insurers">Assureurs</SelectItem>
                      <SelectItem value="offers">Offres</SelectItem>
                      <SelectItem value="quotes">Devis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Fichier</label>
                  <Input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={importLoading}
                  />
                </div>
                {selectedFile && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Fichier sélectionné: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowImportDialog(false)} disabled={importLoading}>
                    Annuler
                  </Button>
                  <Button onClick={startImport} disabled={!selectedFile || importLoading}>
                    {importLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Import en cours...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Démarrer l'import
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Data Quality Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Qualité globale</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                  {qualityMetrics?.globalQuality ? `${qualityMetrics.globalQuality}%` : '96.8%'}
                </p>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(qualityMetrics?.trends?.quality || 'up')}
                  <span className="text-xs text-green-600 dark:text-green-400">
                    {qualityMetrics?.globalQuality ? '+2.3%' : '+2.3%'}
                  </span>
                </div>
              </div>
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Erreurs critiques</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                  {qualityMetrics?.criticalErrors || 5}
                </p>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(qualityMetrics?.trends?.errors || 'down')}
                  <span className="text-xs text-green-600 dark:text-green-400">-3</span>
                </div>
              </div>
              <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avertissements</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {qualityMetrics?.warnings || 131}
                </p>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(qualityMetrics?.trends?.warnings || 'stable')}
                  <span className="text-xs text-gray-600 dark:text-gray-400">0</span>
                </div>
              </div>
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Dernière validation</p>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {qualityMetrics?.lastValidation || 'Il y a 2h'}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date().toLocaleDateString('fr-FR')}
                </div>
              </div>
              <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full">
          <TabsTrigger value="validation" className="text-xs sm:text-sm">Validation</TabsTrigger>
          <TabsTrigger value="imports" className="text-xs sm:text-sm">Imports</TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm">Historique</TabsTrigger>
          <TabsTrigger value="quality" className="text-xs sm:text-sm">Qualité</TabsTrigger>
        </TabsList>

        {/* Data Validation Tab */}
        <TabsContent value="validation" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <span className="text-lg">Dernières validations</span>
                  <Button variant="outline" size="sm" onClick={() => runValidation('all')} className="w-full sm:w-auto">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Tout valider
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dataValidations.map((validation) => (
                    <div key={validation.id} className="p-3 sm:p-4 border rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(validation.status)}
                          <span className="font-medium capitalize text-sm">{validation.entityType}</span>
                          {getStatusBadge(validation.status)}
                        </div>
                        <div className="text-xs text-gray-500">{validation.validationDate}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-sm text-gray-600">Total</div>
                          <div className="font-bold">{validation.totalRecords.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Valides</div>
                          <div className="font-bold text-green-600">{validation.validRecords.toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-red-600">Erreurs: {validation.invalidRecords}</span>
                          <span className="text-yellow-600">Avertissements: {validation.warnings}</span>
                        </div>
                        {validation.criticalIssues > 0 && (
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              {validation.criticalIssues} problèmes critiques nécessitent une attention immédiate
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>

                      <div className="mt-3 flex flex-col sm:flex-row justify-between gap-2">
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          <Eye className="h-3 w-3 mr-1" />
                          Voir détails
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => runValidation(validation.entityType)} className="w-full sm:w-auto">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Relancer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-16 sm:h-20 flex-col" onClick={() => runValidation('users')}>
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                    <span className="text-xs sm:text-sm">Valider utilisateurs</span>
                  </Button>
                  <Button variant="outline" className="h-16 sm:h-20 flex-col" onClick={() => runValidation('insurers')}>
                    <Shield className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                    <span className="text-xs sm:text-sm">Valider assureurs</span>
                  </Button>
                  <Button variant="outline" className="h-16 sm:h-20 flex-col" onClick={() => runValidation('offers')}>
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                    <span className="text-xs sm:text-sm">Valider offres</span>
                  </Button>
                  <Button variant="outline" className="h-16 sm:h-20 flex-col" onClick={() => exportData('all')}>
                    <Download className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                    <span className="text-xs sm:text-sm">Exporter tout</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Imports/Exports Tab */}
        <TabsContent value="imports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des imports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {importJobs.map((job) => (
                  <div key={job.id} className="p-3 sm:p-4 border rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <div className="font-medium text-sm">{job.fileName}</div>
                          <div className="text-xs sm:text-sm text-gray-500 capitalize">{job.type}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(job.status)}
                        <span className="text-xs text-gray-500">{job.createdAt}</span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progression</span>
                        <span>{job.processedRecords}/{job.totalRecords}</span>
                      </div>
                      <Progress value={job.progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                        <span>{job.processedRecords} traités</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
                        <span>{job.warnings} avertissements</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                        <span>{job.errors} erreurs</span>
                      </div>
                    </div>

                    {job.errorDetails && job.errorDetails.length > 0 && (
                      <Alert className="mt-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="font-medium mb-1">Erreurs:</div>
                          <ul className="text-xs sm:text-sm list-disc list-inside">
                            {job.errorDetails.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des modifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {updateHistory.map((update) => (
                  <div key={update.id} className="flex items-start space-x-2 sm:space-x-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(update.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <span className="font-medium text-sm">{update.entity}</span>
                          <span className="mx-2">•</span>
                          <span className="text-xs sm:text-sm text-gray-500 capitalize">{update.action}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(update.status)}
                          <span className="text-xs text-gray-500">{update.timestamp}</span>
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1">{update.details}</div>
                      <div className="text-xs text-gray-500 mt-1">Par {update.user}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quality Control Tab */}
        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Indicateurs de qualité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 sm:p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Complétude des profils</span>
                      <span className="text-green-600 font-bold">94%</span>
                    </div>
                    <Progress value={94} className="h-2" />
                    <div className="text-xs text-gray-500 mt-1">11,784 profils complets sur 12,543</div>
                  </div>

                  <div className="p-3 sm:p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Validité des emails</span>
                      <span className="text-yellow-600 font-bold">98%</span>
                    </div>
                    <Progress value={98} className="h-2" />
                    <div className="text-xs text-gray-500 mt-1">12,292 emails valides sur 12,543</div>
                  </div>

                  <div className="p-3 sm:p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Cohérence des prix</span>
                      <span className="text-green-600 font-bold">97%</span>
                    </div>
                    <Progress value={97} className="h-2" />
                    <div className="text-xs text-gray-500 mt-1">442 offres cohérentes sur 456</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommandations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-1 text-sm">Nettoyer les données utilisateurs</div>
                      <div className="text-xs sm:text-sm">54 utilisateurs avec des informations incomplètes</div>
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-1 text-sm">Valider les offres</div>
                      <div className="text-xs sm:text-sm">11 offres sans prix nécessitent une correction</div>
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-1 text-sm">Données assureurs valides</div>
                      <div className="text-xs sm:text-sm">Tous les assureurs ont des données complètes et valides</div>
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDataManagementPage;
