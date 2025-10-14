import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Shield,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Download,
  BarChart3,
  Activity,
  DollarSign,
  UserPlus,
  UserCheck,
  UserX,
  Calendar,
  MapPin,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { usePlatformStats, useActivityData, useTopInsurers, useSystemHealth, useUserDemographics, useQuoteAnalytics, useExportAnalyticsReport } from '@/features/admin/services/analyticsService';
import { usePendingApprovals, useApproveInsurer, useApproveOffer, useRejectApproval } from '@/features/admin/services/approvalsService';

export const AdminDashboardPage: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const { data: activityData, isLoading: activityLoading } = useActivityData('7d');
  const { data: topInsurers, isLoading: insurersLoading } = useTopInsurers();
  const { data: systemHealth, isLoading: healthLoading } = useSystemHealth();
  const { data: demographics, isLoading: demographicsLoading } = useUserDemographics();
  const { data: quoteAnalytics, isLoading: quotesLoading } = useQuoteAnalytics();
  const { data: pendingApprovals, isLoading: approvalsLoading } = usePendingApprovals();

  const exportReport = useExportAnalyticsReport();
  const approveInsurerMutation = useApproveInsurer();
  const approveOfferMutation = useApproveOffer();
  const rejectApprovalMutation = useRejectApproval();

  const platformStats = stats ? [
    {
      label: 'Utilisateurs',
      value: stats.totalUsers.toLocaleString(),
      change: stats.monthlyGrowth > 0 ? `+${stats.monthlyGrowth}%` : `${stats.monthlyGrowth}%`,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: 'Assureurs',
      value: stats.totalInsurers.toLocaleString(),
      change: stats.totalInsurers > 0 ? '+' + Math.round(stats.totalInsurers * 0.1) : '+0',
      icon: Shield,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      label: 'Devis générés',
      value: stats.totalQuotes.toLocaleString(),
      change: stats.totalQuotes > 0 ? '+' + Math.round(stats.totalQuotes * 0.15) : '+0',
      icon: FileText,
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      label: 'Taux conversion',
      value: `${stats.conversionRate}%`,
      change: stats.conversionRate > 0 ? '+1.2%' : '0%',
      icon: TrendingUp,
      color: 'text-orange-600 dark:text-orange-400'
    },
  ] : [];

  const recentActivities = activityData ? activityData.slice(-5).map((activity, index) => ({
    id: index + 1,
    type: index % 4 === 0 ? 'new_user' : index % 4 === 1 ? 'new_quote' : index % 4 === 2 ? 'new_insurer' : 'approval',
    user: index % 4 === 0 ? `Nouvel utilisateur` : index % 4 === 1 ? `Nouveau devis` : index % 4 === 2 ? `Nouvel assureur` : `Approbation`,
    action: `${activity.newUsers || activity.newQuotes || activity.newPolicies} activités`,
    time: new Date(activity.date).toLocaleDateString('fr-FR')
  })) : [];

  // Gestionnaires d'événements pour les approbations
  const handleApprove = async (approval: any) => {
    if (approval.type === 'insurer') {
      await approveInsurerMutation.mutateAsync(approval.id);
    } else if (approval.type === 'offer') {
      await approveOfferMutation.mutateAsync(approval.id);
    }
  };

  const handleReject = async (approval: any) => {
    await rejectApprovalMutation.mutateAsync({ approval });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400">
          Urgent
        </span>;
      case 'medium':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400">
          Moyen
        </span>;
      case 'low':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400">
          Bas
        </span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400">
          {priority}
        </span>;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_user':
        return <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'new_quote':
        return <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'new_insurer':
        return <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      case 'approval':
        return <CheckCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Button className="h-20 flex-col" variant="outline">
          <Users className="h-6 w-6 mb-2" />
          Gérer utilisateurs
        </Button>
        <Button className="h-20 flex-col" variant="outline">
          <Shield className="h-6 w-6 mb-2" />
          Valider assureurs
        </Button>
        <Button className="h-20 flex-col" variant="outline">
          <FileText className="h-6 w-6 mb-2" />
          Modérer contenu
        </Button>
        <Button className="h-20 flex-col" variant="outline">
          <BarChart3 className="h-6 w-6 mb-2" />
          Voir analytics
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Activités récentes</span>
              <Button variant="outline" size="sm">Voir tout</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Chargement des activités...</p>
                </div>
              ) : recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 hover:bg-accent rounded-lg">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {activity.user}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.action}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground/70">
                      {activity.time}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucune activité récente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>En attente d'approbation</span>
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full dark:bg-red-600">
                {pendingApprovals?.length || 0}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {approvalsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Chargement des approbations...</p>
                </div>
              ) : pendingApprovals && pendingApprovals.length > 0 ? (
                pendingApprovals.slice(0, 5).map((item) => (
                  <div key={item.id} className="p-3 border rounded-lg hover:bg-accent">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {item.type === 'insurer' && <Shield className="h-4 w-4 text-purple-600" />}
                        {item.type === 'offer' && <FileText className="h-4 w-4 text-blue-600" />}
                        {item.type === 'user' && <Users className="h-4 w-4 text-green-600" />}
                        <p className="font-medium text-sm">{item.name}</p>
                      </div>
                      {getPriorityBadge(item.priority)}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                    <p className="text-xs text-muted-foreground mb-2">Soumis le {item.submitted}</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <Eye className="h-3 w-3 mr-1" />
                        Voir
                      </Button>
                      <Button
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => handleApprove(item)}
                        disabled={approveInsurerMutation.isPending || approveOfferMutation.isPending}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approuver
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => handleReject(item)}
                        disabled={rejectApprovalMutation.isPending}
                      >
                        <UserX className="h-3 w-3 mr-1" />
                        Rejeter
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucune approbation en attente</p>
                </div>
              )}
              {pendingApprovals && pendingApprovals.length > 5 && (
                <div className="text-center">
                  <Button variant="outline" size="sm">
                    Voir toutes les approbations ({pendingApprovals.length})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>Statistiques de la plateforme</span>
            <Button variant="outline" size="sm" onClick={() => exportReport.mutate({ reportType: 'comprehensive' })}>
              <Download className="h-3 w-3 mr-1" />
              Exporter
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Chargement des statistiques...</p>
            </div>
          ) : platformStats.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {platformStats.map((stat, index) => (
                <div key={index} className="text-center p-4 border rounded-lg">
                  <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">{stat.change}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Impossible de charger les statistiques</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Health */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {healthLoading ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">Chargement de l'état système...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : systemHealth ? (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Performance système</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{systemHealth.uptime}%</p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg">
                    <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Temps de réponse</span>
                    <span>{systemHealth.responseTime}ms</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(100, 100 - (systemHealth.responseTime - 200) / 2)}%` }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Base de données</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">Optimale</p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Stockage utilisé</span>
                    <span>{systemHealth.storageUsage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${systemHealth.storageUsage}%` }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={systemHealth.alerts.length > 0 ? "border-orange-200 bg-orange-50 dark:border-orange-800/30 dark:bg-orange-900/20" : "border-green-200 bg-green-50 dark:border-green-800/30 dark:bg-green-900/20"}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-400">Alertes système</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{systemHealth.alerts.length}</p>
                  </div>
                  <div className="bg-orange-100 dark:bg-orange-900/20 p-3 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-orange-700 dark:text-orange-300">
                  {systemHealth.alerts.slice(0, 2).map((alert, index) => (
                    <p key={index}>• {alert}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Impossible de charger l'état système</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
