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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/contexts/AuthContext'

interface SidebarItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

interface SidebarProps {
  userRole?: 'USER' | 'INSURER' | 'ADMIN'
  onMobileClose?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  isMobile?: boolean
}

export const Sidebar: React.FC<SidebarProps> = ({
  userRole,
  onMobileClose,
  isCollapsed: isCollapsedProp = false,
  onToggleCollapse,
  isMobile = false
}) => {
  // Use local state only if not controlled from parent
  const [localIsCollapsed, setLocalIsCollapsed] = useState(false)
  const isCollapsed = isCollapsedProp !== undefined ? isCollapsedProp : localIsCollapsed
  const setIsCollapsed = onToggleCollapse
    ? (value: boolean) => onToggleCollapse()
    : setLocalIsCollapsed
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
    <TooltipProvider>
      <div
        className={`bg-card shadow-lg border-r transition-all duration-300 ease-in-out h-screen overflow-y-auto ${
          isCollapsed ? 'w-[72px] max-w-[72px]' : 'w-full max-w-[280px] sm:max-w-[288px]'
        }`}
      >
        <div className='flex flex-col h-full'>
          {/* Header */}
          <div className='flex items-center justify-between p-3 sm:p-4 border-b'>
            {!isCollapsed && (
              <div className='flex items-center space-x-2'>
                <img
                  src="/img/noli vertical sans fond.png"
                  alt="NOLI Assurance"
                  className="h-6 sm:h-7 w-auto"
                />
                <span className='text-sm sm:text-base font-semibold'>NOLI Assurance</span>
              </div>
            )}
            {isCollapsed && (
              <div className='mx-auto'>
                <img
                  src="/img/noli vertical sans fond.png"
                  alt="NOLI"
                  className="h-7 w-auto"
                />
              </div>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className='p-1 h-9 w-9 sm:h-8 sm:w-8 flex-shrink-0'
                >
                  {isCollapsed ? (
                    <ChevronRight className='h-5 w-5' />
                  ) : (
                    <ChevronLeft className='h-5 w-5' />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side='right'>
                <p>{isCollapsed ? 'Agrandir le menu' : 'Réduire le menu'}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Navigation */}
          <nav className='flex-1 p-2 sm:p-4 space-y-1 sm:space-y-2'>
            {items.map((item) => {
              const isActive = location.pathname === item.href
              const navContent = (
                <>
                  <item.icon className={`h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 ${isCollapsed ? 'mx-auto' : ''}`} />
                  {!isCollapsed && (
                    <>
                      <span className='flex-1 text-sm sm:text-sm font-medium'>{item.name}</span>
                      {item.badge && (
                        <span className='bg-red-500 text-white text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full'>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </>
              )

              if (isCollapsed) {
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.href}
                        onClick={onMobileClose}
                        className={`flex items-center justify-center px-2 py-3 rounded-lg transition-colors duration-200 ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                      >
                        {navContent}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side='right' sideOffset={8}>
                      <p>{item.name}</p>
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onMobileClose}
                  className={`flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 sm:py-2 rounded-md sm:rounded-lg transition-colors duration-200 text-sm sm:text-sm ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  {navContent}
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className='p-3 sm:p-4 border-t'>
            {!isCollapsed && user && (
              <div className='mb-3'>
                <p className='text-sm font-medium text-foreground truncate'>
                  {user.firstName} {user.lastName}
                </p>
                <p className='text-xs text-muted-foreground truncate'>{user.email}</p>
              </div>
            )}
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    className='w-full justify-center text-muted-foreground hover:text-foreground h-10 px-2'
                    onClick={handleLogout}
                  >
                    <LogOut className='h-5 w-5' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='right' sideOffset={8}>
                  <p>Déconnexion</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant='ghost'
                className='w-full justify-start text-muted-foreground hover:text-foreground h-9 sm:h-auto px-2 sm:px-3'
                onClick={handleLogout}
              >
                <LogOut className='h-5 w-5 sm:h-4 sm:w-4' />
                <span className='ml-2 text-sm'>Déconnexion</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
