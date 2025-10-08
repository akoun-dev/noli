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

export const AdminDashboardPage: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const { data: activityData, isLoading: activityLoading } = useActivityData('7d');
  const { data: topInsurers, isLoading: insurersLoading } = useTopInsurers();
  const { data: systemHealth, isLoading: healthLoading } = useSystemHealth();
  const { data: demographics, isLoading: demographicsLoading } = useUserDemographics();
  const { data: quoteAnalytics, isLoading: quotesLoading } = useQuoteAnalytics();
  const exportReport = useExportAnalyticsReport();

  const platformStats = stats ? [
    { label: 'Utilisateurs', value: stats.totalUsers.toLocaleString(), change: `+${stats.monthlyGrowth}%`, icon: Users, color: 'text-blue-600' },
    { label: 'Assureurs', value: stats.totalInsurers.toLocaleString(), change: '+2', icon: Shield, color: 'text-green-600' },
    { label: 'Devis générés', value: stats.totalQuotes.toLocaleString(), change: '+23%', icon: FileText, color: 'text-purple-600' },
    { label: 'Taux conversion', value: `${stats.conversionRate}%`, change: '+2.3%', icon: TrendingUp, color: 'text-orange-600' },
  ] : [];

  const recentActivities = activityData ? activityData.slice(-5).map((activity, index) => ({
    id: index + 1,
    type: index % 4 === 0 ? 'new_user' : index % 4 === 1 ? 'new_quote' : index % 4 === 2 ? 'new_insurer' : 'approval',
    user: index % 4 === 0 ? `Nouvel utilisateur` : index % 4 === 1 ? `Nouveau devis` : index % 4 === 2 ? `Nouvel assureur` : `Approbation`,
    action: `${activity.newUsers || activity.newQuotes || activity.newPolicies} activités`,
    time: new Date(activity.date).toLocaleDateString('fr-FR')
  })) : [];

  const pendingApprovals = [
    { id: 1, type: 'insurer', name: 'AXA Côte d\'Ivoire', submitted: '2024-01-15', priority: 'high' },
    { id: 2, type: 'user', name: 'Koffi Yao', submitted: '2024-01-14', priority: 'medium' },
    { id: 3, type: 'content', name: 'Mise à jour CGU', submitted: '2024-01-13', priority: 'low' },
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Urgent
        </span>;
      case 'medium':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Moyen
        </span>;
      case 'low':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Bas
        </span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {priority}
        </span>;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_user':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'new_quote':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'new_insurer':
        return <Shield className="h-4 w-4 text-purple-600" />;
      case 'approval':
        return <CheckCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              {recentActivities.map((activity) => (
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
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>En attente d'approbation</span>
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">3</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingApprovals.map((item) => (
                <div key={item.id} className="p-3 border rounded-lg hover:bg-accent">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">{item.name}</p>
                    {getPriorityBadge(item.priority)}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">Soumis le {item.submitted}</p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3 mr-1" />
                      Voir
                    </Button>
                    <Button size="sm">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approuver
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Statistiques de la plateforme</span>
            <Button variant="outline" size="sm" onClick={() => exportReport.mutate({ reportType: 'comprehensive' })}>
              <Download className="h-3 w-3 mr-1" />
              Exporter
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {platformStats.map((stat, index) => (
              <div key={index} className="text-center p-4 border rounded-lg">
                <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xs text-green-600">{stat.change}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {systemHealth && (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Performance système</p>
                    <p className="text-2xl font-bold text-green-600">{systemHealth.uptime}%</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Temps de réponse</span>
                    <span>{systemHealth.responseTime}ms</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(100, 100 - (systemHealth.responseTime - 200) / 2)}%` }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Base de données</p>
                    <p className="text-2xl font-bold text-blue-600">Optimale</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Stockage utilisé</span>
                    <span>{systemHealth.storageUsage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${systemHealth.storageUsage}%` }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-${systemHealth.alerts.length > 0 ? 'orange' : 'green'}-200 bg-${systemHealth.alerts.length > 0 ? 'orange' : 'green'}-50`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-800">Alertes système</p>
                    <p className="text-2xl font-bold text-orange-600">{systemHealth.alerts.length}</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-orange-700">
                  {systemHealth.alerts.slice(0, 2).map((alert, index) => (
                    <p key={index}>• {alert}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
