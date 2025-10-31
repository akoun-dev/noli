import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Car,
  BarChart3,
  LogOut,
  Bell,
  Eye,
  Database,
  AlertTriangle,
  CreditCard,
  History,
  UserCog,
  Archive,
  Clock,
  FolderOpen,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

interface SidebarItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

interface SidebarProps {
  userRole?: 'USER' | 'INSURER' | 'ADMIN'
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const currentRole = userRole || user?.role || 'USER'

  const sidebarItems: Record<string, SidebarItem[]> = {
    USER: [
      { name: 'Tableau de bord', href: '/tableau-de-bord', icon: LayoutDashboard },
      { name: 'Mes Devis', href: '/mes-devis', icon: FileText },
      { name: 'Mes Contrats', href: '/mes-contrats', icon: Shield },
      { name: 'Mes Documents', href: '/documents', icon: FolderOpen },
      { name: 'Mes Avis', href: '/mes-avis', icon: Star },
      { name: 'Paiements', href: '/paiements', icon: CreditCard },
      { name: 'Historique', href: '/historique-comparaisons', icon: History },
      { name: 'Notifications', href: '/notifications', icon: Bell, badge: '2' },
      { name: 'Mon Profil', href: '/profil', icon: Users },
    ],
    INSURER: [
      { name: 'Tableau de bord', href: '/assureur/tableau-de-bord', icon: LayoutDashboard },
      { name: 'Offres', href: '/assureur/offres', icon: Car },
      { name: 'Devis Reçus', href: '/assureur/devis', icon: FileText, badge: '3' },
      { name: 'Analytics', href: '/assureur/analytics', icon: BarChart3 },
      { name: 'Paramètres', href: '/assureur/parametres', icon: Settings },
    ],
    ADMIN: [
      { name: 'Tableau de bord', href: '/admin/tableau-de-bord', icon: LayoutDashboard },
      { name: 'Supervision', href: '/admin/supervision', icon: Eye },
      { name: 'Utilisateurs', href: '/admin/utilisateurs', icon: Users },
      { name: 'Assureurs', href: '/admin/assureurs', icon: Shield },
      { name: 'Tarification', href: '/admin/tarification', icon: Database },
      { name: 'Offres', href: '/admin/offres', icon: Car },
      { name: 'Devis', href: '/admin/devis', icon: FileText },
      { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { name: 'Modération', href: '/admin/moderation', icon: AlertTriangle },
      { name: "Journaux d'audit", href: '/admin/audit-logs', icon: Clock },
      { name: 'Rôles et permissions', href: '/admin/roles', icon: UserCog },
      { name: 'Backup et restauration', href: '/admin/backup-restore', icon: Archive },
      { name: 'Données', href: '/admin/donnees', icon: Database },
      { name: 'Paramètres', href: '/admin/parametres', icon: Settings },
    ],
  }

  const items = sidebarItems[currentRole] || []

  const handleLogout = () => {
    logout()
    // La redirection est maintenant gérée dans AuthContext.logout
  }

  return (
    <div
      className={`bg-card shadow-lg border-r transition-all duration-300 h-screen ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className='flex flex-col h-full'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b'>
          {!isCollapsed && (
            <div className='flex items-center space-x-2'>
              <Shield className='h-6 w-6 text-primary' />
              <span className='text-sm font-semibold'>NOLI Assurance</span>
            </div>
          )}
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setIsCollapsed(!isCollapsed)}
            className='p-1 h-8 w-8'
          >
            {isCollapsed ? (
              <ChevronRight className='h-4 w-4' />
            ) : (
              <ChevronLeft className='h-4 w-4' />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className='flex-1 p-4 space-y-2'>
          {items.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <item.icon className={`h-5 w-5 ${isCollapsed ? 'mx-auto' : ''}`} />
                {!isCollapsed && (
                  <>
                    <span className='flex-1 text-sm font-medium'>{item.name}</span>
                    {item.badge && (
                      <span className='bg-red-500 text-white text-xs px-2 py-1 rounded-full'>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className='p-4 border-t'>
          {!isCollapsed && user && (
            <div className='mb-3'>
              <p className='text-sm font-medium text-foreground truncate'>
                {user.firstName} {user.lastName}
              </p>
              <p className='text-xs text-muted-foreground truncate'>{user.email}</p>
            </div>
          )}
          <Button
            variant='ghost'
            className='w-full justify-start text-muted-foreground hover:text-foreground'
            onClick={handleLogout}
          >
            <LogOut className='h-4 w-4 mr-2' />
            {!isCollapsed && 'Déconnexion'}
          </Button>
        </div>
      </div>
    </div>
  )
}
