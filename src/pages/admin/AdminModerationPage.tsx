import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Flag,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  MoreHorizontal,
  FileText,
  Users,
  Shield,
  BarChart3,
  Activity,
  Calendar,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { moderationService, type Review, type Report, type ContentItem, type AuditLog, type ModerationStats } from '@/features/admin/services/moderationService';
import { toast } from 'sonner';

export const AdminModerationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('reviews');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showReviewDetails, setShowReviewDetails] = useState(false);
  const [showReportDetails, setShowReportDetails] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Data states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [moderationStats, setModerationStats] = useState<ModerationStats | null>(null);

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [reviewsData, reportsData, statsData] = await Promise.all([
        moderationService.getReviews(),
        moderationService.getReports(),
        moderationService.getModerationStats()
      ]);
      
      setReviews(reviewsData);
      setReports(reportsData);
      setModerationStats(statsData);
    } catch (err) {
      logger.error('Error loading moderation data:', err);
      setError('Erreur lors du chargement des données. Veuillez réessayer.');
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  // Load audit logs
  const loadAuditLogs = async () => {
    try {
      const logsData = await moderationService.getAuditLogs();
      setAuditLogs(logsData);
    } catch (err) {
      logger.error('Error loading audit logs:', err);
      toast.error('Erreur lors du chargement des journaux d\'audit');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit' && auditLogs.length === 0) {
      loadAuditLogs();
    }
  }, [activeTab]);

  const handleReportAction = async (action: string, reportId: string) => {
    try {
      switch (action) {
        case 'investigate':
          await moderationService.investigateReport(reportId);
          toast.success('Rapport marqué comme en cours d\'investigation');
          break;
        case 'resolve':
          await moderationService.resolveReport(reportId, 'Résolu par le modérateur');
          toast.success('Rapport résolu avec succès');
          break;
        case 'dismiss':
          await moderationService.dismissReport(reportId, 'Rejeté par le modérateur');
          toast.success('Rapport rejeté avec succès');
          break;
        default:
          logger.info(`Unknown action: ${action} for report ${reportId}`);
      }
      loadData(); // Refresh data
    } catch (err) {
      logger.error(`Error ${action} report:`, err);
      toast.error(`Erreur lors de l'action: ${action}`);
    }
  };

  const handleContentAction = async (action: string, contentId: string) => {
    try {
      switch (action) {
        case 'approve':
          await moderationService.approveContent(contentId);
          toast.success('Contenu approuvé avec succès');
          break;
        case 'reject':
          await moderationService.rejectContent(contentId, 'Rejeté par le modérateur');
          toast.success('Contenu rejeté avec succès');
          break;
        case 'validate':
          await moderationService.validateContent(contentId);
          toast.success('Validation du contenu terminée');
          break;
        default:
          logger.info(`Unknown action: ${action} for content ${contentId}`);
      }
      // Reload content items after action
      if (action === 'approve' || action === 'reject') {
        // Reload all data to update counts
        loadData();
      }
    } catch (err) {
      logger.error(`Error ${action} content:`, err);
      toast.error(`Erreur lors de l'action: ${action}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
      case 'published':
      case 'resolved':
        return <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-500/20 dark:text-green-400">Approuvé</Badge>;
      case 'pending':
      case 'investigating':
      case 'pending_review':
        return <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-400">En attente</Badge>;
      case 'rejected':
      case 'inactive':
      case 'draft':
      case 'dismissed':
        return <Badge variant="outline" className="border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/20 dark:text-red-400">Rejeté</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="outline" className="border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/20 dark:text-red-400">Urgent</Badge>;
      case 'high':
        return <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-500/30 dark:bg-orange-500/20 dark:text-orange-400">Élevé</Badge>;
      case 'medium':
        return <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-400">Moyen</Badge>;
      case 'low':
        return <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-500/20 dark:text-green-400">Bas</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="outline" className="border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/20 dark:text-red-400">Critique</Badge>;
      case 'error':
        return <Badge variant="outline" className="border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/20 dark:text-red-400">Erreur</Badge>;
      case 'warning':
        return <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-400">Avertissement</Badge>;
      case 'info':
        return <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400">Info</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.insurer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.reporter.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredContentItems = contentItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingReviews = moderationStats?.pendingReviews || 0;
  const pendingReports = moderationStats?.pendingReports || 0;
  const pendingContent = moderationStats?.pendingContent || 0;
  const actionsToday = moderationStats?.actionsToday || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Modération</h1>
          <p className="text-muted-foreground">Gérez les avis, signalements et contenu de la plateforme</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={() => moderationService.exportModerationData('reviews')}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          // Loading skeletons for stats cards
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avis en attente</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingReviews}</p>
                    <p className="text-xs text-muted-foreground">Modération requise</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Signalements</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{pendingReports}</p>
                    <p className="text-xs text-muted-foreground">Requiert attention</p>
                  </div>
                  <Flag className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Contenu en attente</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{pendingContent}</p>
                    <p className="text-xs text-muted-foreground">Validation requise</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Actions aujourd'hui</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{actionsToday}</p>
                    <p className="text-xs text-muted-foreground">Total des actions</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="reviews" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reviews" className="text-xs sm:text-sm">Avis</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs sm:text-sm">Signalements</TabsTrigger>
          <TabsTrigger value="content" className="text-xs sm:text-sm">Contenu</TabsTrigger>
          <TabsTrigger value="audit" className="text-xs sm:text-sm">Audit</TabsTrigger>
        </TabsList>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-lg">Avis des utilisateurs</span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher un avis..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="approved">Approuvés</SelectItem>
                      <SelectItem value="rejected">Rejetés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-4" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                {isLoading ? (
                  // Loading skeletons for reviews
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-6 w-16 rounded" />
                          <Skeleton className="h-6 w-16 rounded" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ))
                ) : (
                  filteredReviews.map((review) => (
                    <div key={review.id} className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center font-medium text-blue-600 dark:text-blue-400">
                            {review.user.avatar}
                          </div>
                          <div>
                            <h4 className="font-medium">{review.user.name}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{review.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(review.status)}
                          {review.flagged && (
                            <Badge variant="outline" className="border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/20 dark:text-red-400">
                              Signalé
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center space-x-1 mb-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <h5 className="font-medium">{review.title}</h5>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{review.content}</p>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-4">
                            <span>{review.insurer}</span>
                            <span>•</span>
                            <span>{review.createdAt}</span>
                          </div>
                          {review.reportCount > 0 && (
                            <div className="flex items-center space-x-1 text-red-600">
                              <Flag className="h-4 w-4" />
                              <span>{review.reportCount} signalements</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Button variant="outline" size="sm" onClick={() => {
                            setSelectedReview(review);
                            setShowReviewDetails(true);
                          }}>
                            <Eye className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">Détails</span>
                          </Button>
                          {review.status === 'pending' && (
                            <>
                              <Button variant="outline" size="sm" className="text-green-600" onClick={() => moderationService.approveReview(review.id)}>
                                <CheckCircle className="h-3 w-3 sm:mr-1" />
                                <span className="hidden sm:inline">Approuver</span>
                              </Button>
                              <Button variant="outline" size="sm" className="text-red-600" onClick={() => moderationService.rejectReview(review.id, 'Rejeté par le modérateur')}>
                                <XCircle className="h-3 w-3 sm:mr-1" />
                                <span className="hidden sm:inline">Rejeter</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-lg">Signalements</span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher un signalement..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="investigating">En cours</SelectItem>
                      <SelectItem value="resolved">Résolu</SelectItem>
                      <SelectItem value="dismissed">Rejeté</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  // Loading skeletons for reports
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Skeleton className="w-2 h-2 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-6 w-16 rounded" />
                          <Skeleton className="h-6 w-16 rounded" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ))
                ) : (
                  filteredReports.map((report) => (
                    <div key={report.id} className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            report.priority === 'urgent' ? 'bg-red-500' :
                            report.priority === 'high' ? 'bg-orange-500' :
                            report.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`} />
                          <div>
                            <h4 className="font-medium">{report.reason}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Signalé par {report.reporter} • {report.createdAt}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getPriorityBadge(report.priority)}
                          {getStatusBadge(report.status)}
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{report.description}</p>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="capitalize">
                            {report.type}
                          </Badge>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Cible: {report.target}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Button variant="outline" size="sm" onClick={() => {
                            setSelectedReport(report);
                            setShowReportDetails(true);
                          }}>
                            <Eye className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">Détails</span>
                          </Button>
                          {report.status === 'pending' && (
                            <Button variant="outline" size="sm" onClick={() => handleReportAction('investigate', report.id)}>
                              <Search className="h-3 w-3 sm:mr-1" />
                              <span className="hidden sm:inline">Investiguer</span>
                            </Button>
                          )}
                          {report.status === 'investigating' && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleReportAction('resolve', report.id)}>
                                <CheckCircle className="h-3 w-3 sm:mr-1" />
                                <span className="hidden sm:inline">Résoudre</span>
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleReportAction('dismiss', report.id)}>
                                <XCircle className="h-3 w-3 sm:mr-1" />
                                <span className="hidden sm:inline">Rejeter</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-lg">Contenu à modérer</span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher du contenu..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="published">Publié</SelectItem>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="pending_review">En attente</SelectItem>
                      <SelectItem value="rejected">Rejeté</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  // Loading skeletons for content items
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="space-y-2 w-full">
                          <Skeleton className="h-4 w-32" />
                          <div className="flex items-center space-x-2">
                            <Skeleton className="h-6 w-16 rounded" />
                            <Skeleton className="h-6 w-16 rounded" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ))
                ) : (
                  filteredContentItems.map((item) => (
                    <div key={item.id} className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{item.title}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="capitalize">
                              {item.type.replace('_', ' ')}
                            </Badge>
                            {getStatusBadge(item.status)}
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">{item.content}</p>

                      <div className="flex items-center justify-between mt-3">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-4">
                            <span>Par {item.author}</span>
                            <span>•</span>
                            <span>Modifié le {item.lastModified}</span>
                            <span>•</span>
                            <span>{item.wordCount} mots</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">Aperçu</span>
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">Modifier</span>
                          </Button>
                          {item.status === 'pending_review' && (
                            <>
                              <Button size="sm" onClick={() => handleContentAction('approve', item.id)}>
                                <CheckCircle className="h-3 w-3 sm:mr-1" />
                                <span className="hidden sm:inline">Approuver</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">Journal d'audit</span>
                <Button variant="outline" size="sm" onClick={loadAuditLogs}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditLogs.length === 0 && !isLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    Aucun journal d'audit disponible
                  </div>
                ) : (
                  <>
                    {isLoading ? (
                      // Loading skeletons for audit logs
                      Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                          <Skeleton className="w-6 h-6 rounded mt-1" />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-20" />
                            </div>
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-3/4" />
                          </div>
                        </div>
                      ))
                    ) : (
                      auditLogs.map((log) => (
                        <div key={log.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <div className="flex-shrink-0 mt-1">
                            {getSeverityBadge(log.severity)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{log.action}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{log.timestamp}</span>
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">{log.details}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Cible: {log.target} • Par {log.user} • IP: {log.ipAddress}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Details Dialog */}
      <Dialog open={showReportDetails} onOpenChange={setShowReportDetails}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du signalement</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Raison</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedReport.reason}</p>
                </div>
                <div>
                  <h4 className="font-medium">Type</h4>
                  <Badge variant="outline" className="capitalize">{selectedReport.type}</Badge>
                </div>
                <div>
                  <h4 className="font-medium">Statut</h4>
                  {getStatusBadge(selectedReport.status)}
                </div>
                <div>
                  <h4 className="font-medium">Priorité</h4>
                  {getPriorityBadge(selectedReport.priority)}
                </div>
                <div>
                  <h4 className="font-medium">Signalé par</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedReport.reporter}</p>
                </div>
                <div>
                  <h4 className="font-medium">Date</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedReport.createdAt}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium">Description</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedReport.description}</p>
              </div>
              <div>
                <h4 className="font-medium">Cible</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedReport.target}</p>
              </div>
              {selectedReport.assignedTo && (
                <div>
                  <h4 className="font-medium">Assigné à</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedReport.assignedTo}</p>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowReportDetails(false)}>
                  Fermer
                </Button>
                {selectedReport.status === 'pending' && (
                  <Button onClick={() => handleReportAction('investigate', selectedReport.id)}>
                    <Search className="h-4 w-4 mr-2" />
                    Investiguer
                  </Button>
                )}
                {selectedReport.status === 'investigating' && (
                  <>
                    <Button onClick={() => handleReportAction('resolve', selectedReport.id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Résoudre
                    </Button>
                    <Button variant="outline" onClick={() => handleReportAction('dismiss', selectedReport.id)}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeter
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Details Dialog */}
      <Dialog open={showReviewDetails} onOpenChange={setShowReviewDetails}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de l'avis</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <ReviewDetails review={selectedReview} onClose={() => setShowReviewDetails(false)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Review Details Component
const ReviewDetails: React.FC<{ review: Review; onClose: () => void }> = ({ review, onClose }) => {
  const handleApprove = async () => {
    try {
      await moderationService.approveReview(review.id);
      toast.success('Avis approuvé avec succès');
      onClose();
      // Parent component will handle data refresh
    } catch (err) {
      logger.error('Error approving review:', err);
      toast.error('Erreur lors de l\'approbation de l\'avis');
    }
  };

  const handleReject = async () => {
    try {
      await moderationService.rejectReview(review.id, 'Rejeté par le modérateur');
      toast.success('Avis rejeté avec succès');
      onClose();
      // Parent component will handle data refresh
    } catch (err) {
      logger.error('Error rejecting review:', err);
      toast.error('Erreur lors du rejet de l\'avis');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center font-medium text-blue-600 dark:text-blue-400">
          {review.user.avatar}
        </div>
        <div>
          <h3 className="font-medium">{review.user.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{review.user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium">Assureur</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">{review.insurer}</p>
        </div>
        <div>
          <h4 className="font-medium">Date</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">{review.createdAt}</p>
        </div>
        <div>
          <h4 className="font-medium">Statut</h4>
          {getStatusBadge(review.status)}
        </div>
        <div>
          <h4 className="font-medium">Note</h4>
          <div className="flex items-center space-x-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium">Titre</h4>
        <p className="text-sm text-gray-700 dark:text-gray-300">{review.title}</p>
      </div>

      <div>
        <h4 className="font-medium">Contenu</h4>
        <p className="text-sm text-gray-700 dark:text-gray-300">{review.content}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium">Votes utiles</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">{review.helpfulCount}</p>
        </div>
        <div>
          <h4 className="font-medium">Signalements</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">{review.reportCount}</p>
        </div>
      </div>

      {review.flagged && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Cet avis a été signalé pour: {review.flaggedReason}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
        {review.status === 'pending' && (
          <>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Approuver
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              <XCircle className="h-4 w-4 mr-2" />
              Rejeter
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

// Helper function for ReviewDetails component
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved':
    case 'active':
    case 'published':
    case 'resolved':
      return <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-500/20 dark:text-green-400">Approuvé</Badge>;
    case 'pending':
    case 'investigating':
    case 'pending_review':
      return <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-400">En attente</Badge>;
    case 'rejected':
    case 'inactive':
    case 'draft':
    case 'dismissed':
      return <Badge variant="outline" className="border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/20 dark:text-red-400">Rejeté</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Star component for rating display
const Star = ({ className }: { className: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

// Download icon for export button
const Download = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
  </svg>
);

export default AdminModerationPage;