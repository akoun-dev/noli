import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { usePlatformStats } from '@/features/admin/services/analyticsService'
import { usePendingApprovals } from '@/features/admin/services/approvalsService'
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
  Backup,
  Menu,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, isAuthenticated } = useAuth()

  // Récupérer les vraies statistiques depuis la base de données
  const { data: platformStats } = usePlatformStats(isAuthenticated && user?.role === 'ADMIN')

  // Récupérer les approbations en attente
  const { data: pendingApprovals } = usePendingApprovals(isAuthenticated && user?.role === 'ADMIN')

  // Compter les assureurs en attente
  const pendingInsurersCount = pendingApprovals?.filter((a) => a.type === 'insurer').length || 0

  const adminNavigation = [
    { name: 'Tableau de bord', href: '/admin/tableau-de-bord', icon: 'LayoutDashboard' },
    { name: 'Supervision', href: '/admin/supervision', icon: 'Eye' },
    { name: 'Utilisateurs', href: '/admin/utilisateurs', icon: 'Users' },
    { name: 'Assureurs', href: '/admin/assureurs', icon: 'Shield' },
    { name: 'Offres', href: '/admin/offres', icon: 'Car' },
    { name: 'Devis', href: '/admin/devis', icon: 'FileText' },
    { name: 'Analytics', href: '/admin/analytics', icon: 'BarChart3' },
    { name: 'Modération', href: '/admin/moderation', icon: 'AlertTriangle' },
    { name: "Journaux d'audit", href: '/admin/audit-logs', icon: 'History' },
    { name: 'Rôles et permissions', href: '/admin/roles', icon: 'UserCog' },
    { name: 'Backup et restauration', href: '/admin/backup-restore', icon: 'Backup' },
    { name: 'Données', href: '/admin/donnees', icon: 'Database' },
    { name: 'Paramètres', href: '/admin/parametres', icon: 'Settings' },
  ]

  // Statistiques rapides avec les vraies données de la base
  const quickStats = [
    {
      label: 'Utilisateurs',
      value: platformStats?.totalUsers?.toLocaleString() || '-',
      change:
        platformStats?.monthlyGrowth !== undefined
          ? platformStats.monthlyGrowth >= 0
            ? `+${platformStats.monthlyGrowth}%`
            : `${platformStats.monthlyGrowth}%`
          : '-',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      label: 'Assureurs',
      value: platformStats?.totalInsurers?.toLocaleString() || '-',
      change:
        platformStats?.insurersMonthlyGrowth !== undefined
          ? platformStats.insurersMonthlyGrowth >= 0
            ? `+${platformStats.insurersMonthlyGrowth}`
            : `${platformStats.insurersMonthlyGrowth}`
          : '-',
      icon: Shield,
      color: 'text-green-600',
    },
    {
      label: 'Devis générés',
      value: platformStats?.totalQuotes?.toLocaleString() || '-',
      change:
        platformStats?.quotesMonthlyGrowth !== undefined
          ? platformStats.quotesMonthlyGrowth >= 0
            ? `+${platformStats.quotesMonthlyGrowth}%`
            : `${platformStats.quotesMonthlyGrowth}%`
          : '-',
      icon: FileText,
      color: 'text-purple-600',
    },
    {
      label: 'Conversion',
      value: platformStats?.conversionRate !== undefined ? `${platformStats.conversionRate}%` : '-',
      change:
        platformStats?.conversionRate !== undefined
          ? `${platformStats.conversionRate >= 15 ? 'Excellent' : 'Normal'}`
          : '-',
      icon: TrendingUp,
      color: 'text-orange-600',
    },
  ]

  return (
    <div className='min-h-screen bg-background'>
      <div className='flex'>
        {/* Sidebar - Desktop - Fixed */}
        <div className='hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 xl:w-72'>
          <Sidebar userRole='ADMIN' />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className='fixed inset-0 z-50 lg:hidden'>
            <div
              className='fixed inset-0 bg-black/50 backdrop-blur-sm'
              onClick={() => setSidebarOpen(false)}
            />
            <div className='fixed inset-y-0 left-0 w-72 bg-background shadow-xl z-50 overflow-y-auto animate-in slide-in-from-left duration-200'>
              <Sidebar userRole='ADMIN' onMobileClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className='fixed inset-0 z-50 lg:hidden'>
            <div
              className='fixed inset-0 bg-black/50 backdrop-blur-sm'
              onClick={() => setSidebarOpen(false)}
            />
            <div className='fixed inset-y-0 left-0 w-72 bg-background shadow-xl z-50 overflow-y-auto animate-in slide-in-from-left duration-200'>
              <Sidebar userRole='ADMIN' />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className='flex-1 min-w-0 lg:pl-64 xl:pl-72'>
          {/* Mobile Header with Sidebar Toggle */}
          <div className='lg:hidden bg-card border-b sticky top-0 z-40'>
            <div className='flex items-center justify-between px-4 py-3'>
              <button
                onClick={() => setSidebarOpen(true)}
                className='p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent'
              >
                <Menu className='h-6 w-6' />
              </button>
              <div className='flex items-center space-x-2'>
                <span className='text-sm font-medium text-foreground'>Admin Dashboard</span>
              </div>
            </div>
          </div>

          {/* Admin Stats Bar */}
          <div className='bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 sm:p-6'>
            <div className='mb-3'>
              <h1 className='text-lg sm:text-xl font-bold truncate'>
                Tableau de bord Administrateur
              </h1>
              <p className='text-purple-100 text-xs sm:text-sm truncate'>
                Vue d'ensemble de la plateforme
              </p>
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 overflow-x-auto pb-2'>
              {quickStats.map((stat, index) => (
                <div
                  key={index}
                  className='bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 min-w-[150px]'
                >
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='text-purple-100 text-xs sm:text-sm truncate'>
                        {stat.label}
                      </div>
                      <div className='text-lg sm:text-xl font-bold truncate'>{stat.value}</div>
                      <div className='text-green-300 text-xs sm:text-sm flex items-center'>
                        <TrendingUp className='h-2 w-2 sm:h-3 sm:w-3 mr-1' />
                        <span className='truncate'>{stat.change}</span>
                      </div>
                    </div>
                    <stat.icon
                      className={`h-6 w-6 sm:h-8 sm:w-8 ${stat.color} bg-white/20 rounded-lg p-1 sm:p-2`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alert Banner - affiché uniquement s'il y a des actions requises */}
          {pendingInsurersCount > 0 && (
            <div className='bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4 mx-3 sm:mx-6 mt-4'>
              <div className='flex items-start sm:items-center'>
                <AlertTriangle className='h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 mr-2 flex-shrink-0' />
                <div className='flex-1 min-w-0'>
                  <h3 className='text-xs sm:text-sm font-medium text-yellow-800 truncate'>
                    Actions requises
                  </h3>
                  <div className='mt-1 text-xs sm:text-sm text-yellow-700'>
                    <ul className='list-disc list-inside'>
                      <li className='truncate'>
                        {pendingInsurersCount} assureur{pendingInsurersCount > 1 ? 's' : ''} en
                        attente de validation
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Page Content */}
          <div className='p-4 sm:p-6 overflow-hidden'>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
