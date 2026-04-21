import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { usePendingApprovals } from '@/features/admin/services/approvalsService'
import {
  Settings,
  AlertTriangle,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user, logout, isAuthenticated } = useAuth()
  const location = useLocation()

  // Récupérer les approbations en attente
  const { data: pendingApprovals } = usePendingApprovals(isAuthenticated && user?.role === 'ADMIN')

  // Compter les assureurs en attente
  const pendingInsurersCount = pendingApprovals?.filter((a) => a.type === 'insurer').length || 0

  // Titre de la page actuelle
  const getPageTitle = () => {
    const path = location.pathname
    if (path.includes('tableau-de-bord')) return 'Tableau de bord'
    if (path.includes('supervision')) return 'Supervision'
    if (path.includes('utilisateurs')) return 'Gestion des utilisateurs'
    if (path.includes('assureurs')) return "Gestion des assureurs"
    if (path.includes('offres')) return 'Gestion des offres'
    if (path.includes('devis')) return 'Gestion des devis'
    if (path.includes('tarification')) return 'Tarification'
    if (path.includes('analytics')) return 'Analytics'
    if (path.includes('moderation')) return 'Modération'
    if (path.includes('audit-logs')) return "Journaux d'audit"
    if (path.includes('roles')) return 'Rôles et permissions'
    if (path.includes('backup-restore')) return 'Backup et restauration'
    if (path.includes('donnees')) return 'Gestion des données'
    if (path.includes('parametres')) return 'Paramètres'
    return 'Administration'
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className='min-h-screen bg-background'>
      <div className='flex'>
        {/* Sidebar - Desktop - Fixed */}
        <div className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block transition-all duration-300 ${
          sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-64 xl:w-72'
        }`}>
          <Sidebar
            userRole='ADMIN'
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className='fixed inset-0 z-50 lg:hidden overflow-hidden'>
            <div
              className='fixed inset-0 bg-black/50 backdrop-blur-sm'
              onClick={() => setSidebarOpen(false)}
            />
            <div className={`fixed inset-y-0 left-0 bg-background shadow-xl z-50 overflow-y-auto animate-in slide-in-from-left duration-200 transition-all duration-300 ${
              sidebarCollapsed ? 'w-[72px] max-w-[72px]' : 'w-full max-w-[280px]'
            }`}>
              <Sidebar
                userRole='ADMIN'
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                onMobileClose={() => setSidebarOpen(false)}
                isMobile={true}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className={`flex-1 min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64 xl:pl-72'
        }`}>
          {/* Admin Header */}
          <header className='sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b'>
            <div className='flex items-center justify-between px-4 sm:px-6 py-3'>
              {/* Left: Mobile menu toggle + Page title */}
              <div className='flex items-center gap-3'>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className='lg:hidden p-2.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent'
                  aria-label='Ouvrir le menu'
                >
                  <Menu className='h-6 w-6' />
                </button>
                <div>
                  <div className='flex items-center gap-2'>
                    <h1 className='text-lg sm:text-xl font-bold text-foreground'>
                      {getPageTitle()}
                    </h1>
                    <Badge variant='outline' className='hidden sm:inline-flex'>
                      Admin
                    </Badge>
                  </div>
                  {pendingInsurersCount > 0 && (
                    <p className='text-xs text-muted-foreground mt-0.5 flex items-center gap-1'>
                      <AlertTriangle className='h-3 w-3 text-yellow-500' />
                      {pendingInsurersCount} action{pendingInsurersCount > 1 ? 's' : ''} requise{pendingInsurersCount > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Notifications + User menu */}
              <div className='flex items-center gap-2 sm:gap-3'>
                {pendingInsurersCount > 0 && (
                  <button
                    onClick={() => {/* Navigate to insurers */}}
                    className='relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent'
                    aria-label={`Notifications: ${pendingInsurersCount} nouvelles actions`}
                  >
                    <Bell className='h-5 w-5' />
                    <span className='absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full' />
                  </button>
                )}
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='gap-2 h-10 px-2'
                      aria-label='Menu utilisateur'
                    >
                      <div className='hidden sm:block text-left'>
                        <p className='text-sm font-medium'>{user?.firstName} {user?.lastName}</p>
                        <p className='text-xs text-muted-foreground'>Administrateur</p>
                      </div>
                      <Avatar className='h-8 w-8'>
                        {user?.avatar && (
                          <AvatarImage src={user.avatar} alt={`${user?.firstName} ${user?.lastName}`} />
                        )}
                        <AvatarFallback className='bg-primary/10 text-primary text-xs font-semibold'>
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-56'>
                    <DropdownMenuItem onClick={() => {/* Navigate to profile */}}>
                      Mon profil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {/* Navigate to settings */}}>
                      Paramètres
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className='text-destructive'>
                      <LogOut className='h-4 w-4 mr-2' />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Alert Banner - affiché uniquement s'il y a des actions requises */}
          {pendingInsurersCount > 0 && (
            <div className='bg-yellow-50 dark:bg-yellow-950/20 border-b border-yellow-200 dark:border-yellow-900/50 px-4 sm:px-6 py-3'>
              <div className='flex items-center gap-3'>
                <AlertTriangle className='h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0' />
                <div className='flex-1'>
                  <p className='text-sm font-medium text-yellow-800 dark:text-yellow-200'>
                    {pendingInsurersCount} assureur{pendingInsurersCount > 1 ? 's' : ''} en attente de validation
                  </p>
                </div>
                <button
                  onClick={() => {/* Navigate to insurers */}}
                  className='text-sm font-medium text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100 flex items-center gap-1'
                >
                  Voir
                  <ChevronRight className='h-4 w-4' />
                </button>
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
