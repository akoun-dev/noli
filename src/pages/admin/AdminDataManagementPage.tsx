import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

interface ImportJob {
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

interface DataValidation {
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

interface UpdateHistory {
  id: string;
  entity: string;
  action: 'create' | 'update' | 'delete' | 'import' | 'export';
  user: string;
  timestamp: string;
  details: string;
  status: 'success' | 'failed' | 'pending';
}

export const AdminDataManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('validation');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState('users');
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Mock data
  const importJobs: ImportJob[] = [
    {
      id: '1',
      fileName: 'utilisateurs_import.csv',
      type: 'users',
      status: 'completed',
      progress: 100,
      totalRecords: 1250,
      processedRecords: 1250,
      errors: 12,
      warnings: 45,
      createdAt: '2024-01-20 10:30',
      completedAt: '2024-01-20 10:45'
    },
    {
      id: '2',
      fileName: 'assureurs_data.xlsx',
      type: 'insurers',
      status: 'processing',
      progress: 65,
      totalRecords: 28,
      processedRecords: 18,
      errors: 0,
      warnings: 3,
      createdAt: '2024-01-20 09:15'
    },
    {
      id: '3',
      fileName: 'offres_janvier.csv',
      type: 'offers',
      status: 'failed',
      progress: 30,
      totalRecords: 156,
      processedRecords: 47,
      errors: 25,
      warnings: 12,
      createdAt: '2024-01-19 14:20',
      errorDetails: ['Format de date invalide', 'Champs obligatoires manquants']
    }
  ];

  const dataValidations: DataValidation[] = [
    {
      id: '1',
      entityType: 'users',
      validationDate: '2024-01-20 08:00',
      totalRecords: 12543,
      validRecords: 12489,
      invalidRecords: 54,
      warnings: 123,
      criticalIssues: 2,
      status: 'warning',
      details: ['54 adresses email invalides', '23 numéros de téléphone mal formatés', '2 utilisateurs sans nom']
    },
    {
      id: '2',
      entityType: 'insurers',
      validationDate: '2024-01-20 08:00',
      totalRecords: 28,
      validRecords: 28,
      invalidRecords: 0,
      warnings: 0,
      criticalIssues: 0,
      status: 'passed',
      details: ['Toutes les données sont valides']
    },
    {
      id: '3',
      entityType: 'offers',
      validationDate: '2024-01-20 08:00',
      totalRecords: 456,
      validRecords: 445,
      invalidRecords: 11,
      warnings: 8,
      criticalIssues: 3,
      status: 'failed',
      details: ['11 offres sans prix', '8 descriptions trop courtes', '3 assureurs inactifs']
    }
  ];

  const updateHistory: UpdateHistory[] = [
    {
      id: '1',
      entity: 'Utilisateurs',
      action: 'import',
      user: 'Admin',
      timestamp: '2024-01-20 10:45',
      details: 'Import de 1250 utilisateurs',
      status: 'success'
    },
    {
      id: '2',
      entity: 'Offres',
      action: 'update',
      user: 'Admin',
      timestamp: '2024-01-20 09:30',
      details: 'Mise à jour des prix des offres',
      status: 'success'
    },
    {
      id: '3',
      entity: 'Assureurs',
      action: 'create',
      user: 'Admin',
      timestamp: '2024-01-20 08:15',
      details: 'Création de l\'assureur NSIA Assurance',
      status: 'pending'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
      case 'passed':
        return <Badge className="bg-green-100 text-green-800">Terminé</Badge>;
      case 'processing':
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Échoué</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Avertissement</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      case 'stable':
        return <Minus className="h-3 w-3 text-gray-600" />;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const startImport = () => {
    if (!selectedFile) return;
    console.log('Starting import:', selectedFile.name, 'Type:', importType);
    setShowImportDialog(false);
    setSelectedFile(null);
  };

  const runValidation = (entityType: string) => {
    console.log('Running validation for:', entityType);
  };

  const exportData = (entityType: string) => {
    console.log('Exporting data for:', entityType);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Données</h1>
          <p className="text-gray-600">Validation, import/export et contrôle qualité des données</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Importer des données
              </Button>
            </DialogTrigger>
            <DialogContent>
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
                  <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                    Annuler
                  </Button>
                  <Button onClick={startImport} disabled={!selectedFile}>
                    Démarrer l'import
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Data Quality Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Qualité globale</p>
                <p className="text-2xl font-bold text-green-600">96.8%</p>
                <div className="flex items-center space-x-1">
                  {getTrendIcon('up')}
                  <span className="text-xs text-green-600">+2.3%</span>
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Erreurs critiques</p>
                <p className="text-2xl font-bold text-red-600">5</p>
                <div className="flex items-center space-x-1">
                  {getTrendIcon('down')}
                  <span className="text-xs text-green-600">-3</span>
                </div>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avertissements</p>
                <p className="text-2xl font-bold text-yellow-600">131</p>
                <div className="flex items-center space-x-1">
                  {getTrendIcon('stable')}
                  <span className="text-xs text-gray-600">0</span>
                </div>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dernière validation</p>
                <p className="text-sm font-bold text-blue-600">Il y a 2h</p>
                <div className="text-xs text-gray-500">20/01/2024 08:00</div>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="validation">Validation des données</TabsTrigger>
          <TabsTrigger value="imports">Imports/Exports</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="quality">Contrôle qualité</TabsTrigger>
        </TabsList>

        {/* Data Validation Tab */}
        <TabsContent value="validation" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Dernières validations</span>
                  <Button variant="outline" size="sm" onClick={() => runValidation('all')}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Tout valider
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dataValidations.map((validation) => (
                    <div key={validation.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(validation.status)}
                          <span className="font-medium capitalize">{validation.entityType}</span>
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

                      <div className="mt-3 flex justify-between">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3 mr-1" />
                          Voir détails
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => runValidation(validation.entityType)}>
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
                  <Button variant="outline" className="h-20 flex-col" onClick={() => runValidation('users')}>
                    <Users className="h-6 w-6 mb-2" />
                    Valider utilisateurs
                  </Button>
                  <Button variant="outline" className="h-20 flex-col" onClick={() => runValidation('insurers')}>
                    <Shield className="h-6 w-6 mb-2" />
                    Valider assureurs
                  </Button>
                  <Button variant="outline" className="h-20 flex-col" onClick={() => runValidation('offers')}>
                    <FileText className="h-6 w-6 mb-2" />
                    Valider offres
                  </Button>
                  <Button variant="outline" className="h-20 flex-col" onClick={() => exportData('all')}>
                    <Download className="h-6 w-6 mb-2" />
                    Exporter tout
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
                  <div key={job.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <div className="font-medium">{job.fileName}</div>
                          <div className="text-sm text-gray-500 capitalize">{job.type}</div>
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

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{job.processedRecords} traités</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span>{job.warnings} avertissements</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span>{job.errors} erreurs</span>
                      </div>
                    </div>

                    {job.errorDetails && job.errorDetails.length > 0 && (
                      <Alert className="mt-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="font-medium mb-1">Erreurs:</div>
                          <ul className="text-sm list-disc list-inside">
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
                  <div key={update.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(update.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{update.entity}</span>
                          <span className="mx-2">•</span>
                          <span className="text-sm text-gray-500 capitalize">{update.action}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(update.status)}
                          <span className="text-xs text-gray-500">{update.timestamp}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{update.details}</div>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Indicateurs de qualité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Complétude des profils</span>
                      <span className="text-green-600 font-bold">94%</span>
                    </div>
                    <Progress value={94} className="h-2" />
                    <div className="text-xs text-gray-500 mt-1">11,784 profils complets sur 12,543</div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Validité des emails</span>
                      <span className="text-yellow-600 font-bold">98%</span>
                    </div>
                    <Progress value={98} className="h-2" />
                    <div className="text-xs text-gray-500 mt-1">12,292 emails valides sur 12,543</div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Cohérence des prix</span>
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
                      <div className="font-medium mb-1">Nettoyer les données utilisateurs</div>
                      <div className="text-sm">54 utilisateurs avec des informations incomplètes</div>
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-1">Valider les offres</div>
                      <div className="text-sm">11 offres sans prix nécessitent une correction</div>
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-1">Données assureurs valides</div>
                      <div className="text-sm">Tous les assureurs ont des données complètes et valides</div>
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