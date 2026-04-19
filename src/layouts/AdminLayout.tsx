import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { usePlatformStats } from '@/features/admin/services/analyticsService';
import { usePendingApprovals } from '@/features/admin/services/approvalsService';
import {
  Users,
  Shield,
  Car,
  FileText,
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Eye,
  Database,
  LayoutDashboard,
  History,
  UserCog,
  Backup
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Récupérer les vraies statistiques depuis la base de données
  const { data: platformStats } = usePlatformStats(isAuthenticated && user?.role === 'ADMIN');

  // Récupérer les approbations en attente
  const { data: pendingApprovals } = usePendingApprovals(isAuthenticated && user?.role === 'ADMIN');

  // Compter les assureurs en attente
  const pendingInsurersCount = pendingApprovals?.filter(a => a.type === 'insurer').length || 0;

  const adminNavigation = [
    { name: 'Tableau de bord', href: '/admin/tableau-de-bord', icon: 'LayoutDashboard' },
    { name: 'Supervision', href: '/admin/supervision', icon: 'Eye' },
    { name: 'Utilisateurs', href: '/admin/utilisateurs', icon: 'Users' },
    { name: 'Assureurs', href: '/admin/assureurs', icon: 'Shield' },
    { name: 'Offres', href: '/admin/offres', icon: 'Car' },
    { name: 'Devis', href: '/admin/devis', icon: 'FileText' },
    { name: 'Analytics', href: '/admin/analytics', icon: 'BarChart3' },
    { name: 'Modération', href: '/admin/moderation', icon: 'AlertTriangle' },
    { name: 'Journaux d\'audit', href: '/admin/audit-logs', icon: 'History' },
    { name: 'Rôles et permissions', href: '/admin/roles', icon: 'UserCog' },
    { name: 'Backup et restauration', href: '/admin/backup-restore', icon: 'Backup' },
    { name: 'Données', href: '/admin/donnees', icon: 'Database' },
    { name: 'Paramètres', href: '/admin/parametres', icon: 'Settings' },
  ];

  // Statistiques rapides avec les vraies données de la base
  const quickStats = [
    {
      label: 'Utilisateurs',
      value: platformStats?.totalUsers?.toLocaleString() || '-',
      change: platformStats?.monthlyGrowth !== undefined ? (platformStats.monthlyGrowth >= 0 ? `+${platformStats.monthlyGrowth}%` : `${platformStats.monthlyGrowth}%`) : '-',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      label: 'Assureurs',
      value: platformStats?.totalInsurers?.toLocaleString() || '-',
      change: platformStats?.insurersMonthlyGrowth !== undefined ? (platformStats.insurersMonthlyGrowth >= 0 ? `+${platformStats.insurersMonthlyGrowth}` : `${platformStats.insurersMonthlyGrowth}`) : '-',
      icon: Shield,
      color: 'text-green-600'
    },
    {
      label: 'Devis générés',
      value: platformStats?.totalQuotes?.toLocaleString() || '-',
      change: platformStats?.quotesMonthlyGrowth !== undefined ? (platformStats.quotesMonthlyGrowth >= 0 ? `+${platformStats.quotesMonthlyGrowth}%` : `${platformStats.quotesMonthlyGrowth}%`) : '-',
      icon: FileText,
      color: 'text-purple-600'
    },
    {
      label: 'Conversion',
      value: platformStats?.conversionRate !== undefined ? `${platformStats.conversionRate}%` : '-',
      change: platformStats?.conversionRate !== undefined ? `${platformStats.conversionRate >= 15 ? 'Excellent' : 'Normal'}` : '-',
      icon: TrendingUp,
      color: 'text-orange-600'
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar - Desktop - Fixed */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64">
          <Sidebar userRole="ADMIN" />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-64 bg-background shadow-lg border-r z-50">
              <Sidebar userRole="ADMIN" />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 lg:pl-64">
          <div className="min-h-screen">
            {/* Mobile Header */}
            <div className="lg:hidden bg-card border-b px-4 py-3 flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center space-x-2">
                <ThemeToggle />
                <span className="text-sm font-medium text-foreground">
                  Admin - {user?.firstName}
                </span>
              </div>
            </div>

            {/* Admin Stats Bar */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
              <div className="mb-4">
                <h1 className="text-2xl font-bold">Tableau de bord Administrateur</h1>
                <p className="text-purple-100">Vue d'ensemble de la plateforme</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickStats.map((stat, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-purple-100 text-sm">{stat.label}</div>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-green-300 text-sm flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {stat.change}
                        </div>
                      </div>
                      <stat.icon className={`h-8 w-8 ${stat.color} bg-white/20 rounded-lg p-2`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alert Banner - affiché uniquement s'il y a des actions requises */}
            {pendingInsurersCount > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-6">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Actions requises
                    </h3>
                    <div className="mt-1 text-sm text-yellow-700">
                      <ul className="list-disc list-inside">
                        <li>{pendingInsurersCount} assureur{pendingInsurersCount > 1 ? 's' : ''} en attente de validation</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Page Content */}
            <div className="p-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
