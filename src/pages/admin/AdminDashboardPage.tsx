import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Server,
  Database,
  MoreHorizontal,
} from 'lucide-react'
import {
  usePlatformStats,
  useTopInsurers,
  useSystemHealth,
  useExportAnalyticsReport,
} from '@/features/admin/services/analyticsService'
import {
  usePendingApprovals,
  useApproveInsurer,
  useApproveOffer,
  useRejectApproval,
} from '@/features/admin/services/approvalsService'
import { useRealtimeActivity } from '@/features/admin/services/realtimeService'
import { useAuth } from '@/contexts/AuthContext'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ElementType
  color: string
  trend?: 'up' | 'down' | 'neutral'
  loading?: boolean
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  trend = 'neutral',
  loading = false,
}) => {
  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-12 w-12 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400'
      case 'down':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4" style={{ borderLeftColor: color.replace('text-', '').replace('dark:', '') }}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 text-sm">
                {getTrendIcon()}
                <span className={getTrendColor()}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
                <span className="text-muted-foreground text-xs">vs mois dernier</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ApprovalItemProps {
  item: any
  onApprove: (item: any) => void
  onReject: (item: any) => void
  isProcessing: boolean
}

const ApprovalItem: React.FC<ApprovalItemProps> = ({ item, onApprove, onReject, isProcessing }) => {
  const getIcon = () => {
    switch (item.type) {
      case 'insurer':
        return <Shield className="h-5 w-5 text-purple-600" />
      case 'offer':
        return <FileText className="h-5 w-5 text-blue-600" />
      case 'user':
        return <Users className="h-5 w-5 text-green-600" />
      default:
        return <AlertTriangle className="h-5 w-5 text-orange-600" />
    }
  }

  const getPriorityColor = () => {
    switch (item.priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50 dark:bg-red-950/20'
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
      default:
        return 'border-l-gray-300'
    }
  }

  return (
    <div className={`p-4 rounded-lg border-l-4 hover:shadow-md transition-all duration-200 ${getPriorityColor()}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <p className="font-semibold text-sm truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
            </div>
            <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'} className="flex-shrink-0">
              {item.priority === 'high' ? 'Urgent' : item.priority === 'medium' ? 'Moyen' : 'Normal'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Soumis le {item.submitted}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Eye className="h-3 w-3 mr-1" />
              Détails
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onApprove(item)}
              disabled={isProcessing}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Approuver
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReject(item)}
              disabled={isProcessing}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Rejeter
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ActivityFeedProps {
  activities: any[]
  formatTime: (timestamp: string) => string
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, formatTime }) => {
  const getIcon = (action: string) => {
    if (action === 'ACCOUNT_CREATED') return <Users className="h-4 w-4 text-blue-600" />
    if (action.includes('QUOTE')) return <FileText className="h-4 w-4 text-green-600" />
    if (action.includes('POLICY')) return <CheckCircle className="h-4 w-4 text-purple-600" />
    return <Activity className="h-4 w-4 text-muted-foreground" />
  }

  return (
    <div className="space-y-3">
      {activities.length > 0 ? (
        activities.map((activity, index) => (
          <div
            key={activity.id || index}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background border flex items-center justify-center">
              {getIcon(activity.action)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {activity.action === 'ACCOUNT_CREATED'
                  ? `Nouveau compte: ${activity.details?.role || 'Utilisateur'}`
                  : activity.action}
              </p>
              <p className="text-xs text-muted-foreground truncate">{activity.user_email || 'Système'}</p>
            </div>
            <div className="flex-shrink-0 text-xs text-muted-foreground flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {formatTime(activity.timestamp)}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucune activité récente</p>
        </div>
      )}
    </div>
  )
}

export const AdminDashboardPage: React.FC = () => {
  const { isLoading: authLoading, isAuthenticated, user } = useAuth()
  const shouldFetch = !authLoading && isAuthenticated && user?.role === 'ADMIN'

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = usePlatformStats(shouldFetch)

  const { data: systemHealth, isLoading: healthLoading } = useSystemHealth(shouldFetch)
  const { data: pendingApprovals, isLoading: approvalsLoading } = usePendingApprovals(shouldFetch)
  const { data: topInsurers, isLoading: insurersLoading } = useTopInsurers(shouldFetch)
  const realtimeActivities = useRealtimeActivity(10)

  const approveInsurerMutation = useApproveInsurer()
  const approveOfferMutation = useApproveOffer()
  const rejectApprovalMutation = useRejectApproval()

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "À l'instant"
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`
    if (diffInMinutes < 24 * 60) return `Il y a ${Math.floor(diffInMinutes / 60)}h`
    return `Il y a ${Math.floor(diffInMinutes / (24 * 60))}j`
  }

  const handleApprove = async (approval: any) => {
    if (approval.type === 'insurer') {
      await approveInsurerMutation.mutateAsync(approval.id)
    } else if (approval.type === 'offer') {
      await approveOfferMutation.mutateAsync(approval.id)
    }
  }

  const handleReject = async (approval: any) => {
    await rejectApprovalMutation.mutate({ approval })
  }

  const isProcessing = approveInsurerMutation.isPending || approveOfferMutation.isPending || rejectApprovalMutation.isPending

  return (
    <div className="space-y-6">
      {/* Hero Section - KPIs */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Vue d'ensemble</h2>
            <p className="text-muted-foreground">Métriques clés de la plateforme</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetchStats()}>
              <Activity className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Utilisateurs"
            value={stats?.totalUsers?.toLocaleString() || '-'}
            change={stats?.monthlyGrowth}
            icon={Users}
            color="text-blue-600 dark:text-blue-400"
            trend={stats?.monthlyGrowth > 0 ? 'up' : stats?.monthlyGrowth < 0 ? 'down' : 'neutral'}
            loading={statsLoading}
          />
          <StatCard
            title="Devis générés"
            value={stats?.totalQuotes?.toLocaleString() || '-'}
            change={stats?.quotesMonthlyGrowth}
            icon={FileText}
            color="text-green-600 dark:text-green-400"
            trend={stats?.quotesMonthlyGrowth > 0 ? 'up' : stats?.quotesMonthlyGrowth < 0 ? 'down' : 'neutral'}
            loading={statsLoading}
          />
          <StatCard
            title="Taux de conversion"
            value={`${stats?.conversionRate || 0}%`}
            icon={TrendingUp}
            color="text-purple-600 dark:text-purple-400"
            loading={statsLoading}
          />
          <StatCard
            title="Assureurs actifs"
            value={stats?.totalInsurers?.toLocaleString() || '-'}
            change={stats?.insurersMonthlyGrowth}
            icon={Shield}
            color="text-orange-600 dark:text-orange-400"
            trend={stats?.insurersMonthlyGrowth > 0 ? 'up' : stats?.insurersMonthlyGrowth < 0 ? 'down' : 'neutral'}
            loading={statsLoading}
          />
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Approvals - Prominent */}
          {(pendingApprovals?.length ?? 0) > 0 && (
            <Card className="border-orange-200 dark:border-orange-900/50 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Actions requises</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {pendingApprovals?.length || 0} élément{pendingApprovals?.length > 1 ? 's' : ''} en attente
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Voir tout
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {approvalsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : (
                  pendingApprovals?.slice(0, 3).map((item) => (
                    <ApprovalItem
                      key={item.id}
                      item={item}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      isProcessing={isProcessing}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Activité en temps réel
                </CardTitle>
                <Badge variant="secondary">{realtimeActivities.length} activités</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ActivityFeed activities={realtimeActivities} formatTime={formatTime} />
            </CardContent>
          </Card>

          {/* Quick Charts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Performance mensuelle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Graphique de performance</p>
                  <p className="text-xs text-muted-foreground">Intégrez Recharts ici</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="h-4 w-4 text-green-600" />
                Santé système
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {healthLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : systemHealth ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Disponibilité</span>
                      <span className="font-semibold text-green-600">{systemHealth.uptime}%</span>
                    </div>
                    <Progress value={systemHealth.uptime} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Temps de réponse</span>
                      <span className="font-semibold">{systemHealth.responseTime}ms</span>
                    </div>
                    <Progress value={Math.min(100, (500 - systemHealth.responseTime) / 3)} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Stockage</span>
                      <span className="font-semibold text-blue-600">{systemHealth.storageUsage}%</span>
                    </div>
                    <Progress value={systemHealth.storageUsage} className="h-2" />
                  </div>
                  {systemHealth.alerts.length > 0 && (
                    <div className="pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm text-orange-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">{systemHealth.alerts.length} alerte{systemHealth.alerts.length > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Indisponible</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4 text-yellow-600" />
                Actions rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="h-auto flex-col py-3 gap-1">
                <Users className="h-4 w-4" />
                <span className="text-xs">Utilisateurs</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto flex-col py-3 gap-1">
                <Shield className="h-4 w-4" />
                <span className="text-xs">Assureurs</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto flex-col py-3 gap-1">
                <FileText className="h-4 w-4" />
                <span className="text-xs">Devis</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto flex-col py-3 gap-1">
                <Database className="h-4 w-4" />
                <span className="text-xs">Données</span>
              </Button>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Top assureurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insurersLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : topInsurers && topInsurers.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {topInsurers.slice(0, 5).map((insurer, index) => (
                      <div key={insurer.id} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                          {index + 1}
                        </div>
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={insurer.logoUrl} alt={insurer.name} />
                          <AvatarFallback className="bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400 text-xs">
                            {insurer.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{insurer.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {insurer.policies || 0} offre{insurer.policies > 1 ? 's' : ''}
                          </p>
                        </div>
                        {insurer.policies > 0 && (
                          <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                  {topInsurers.length > 5 && (
                    <Button variant="ghost" size="sm" className="w-full mt-4">
                      Voir le classement complet
                      <ArrowUpRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <Shield className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Aucun assureur pour le moment</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage
