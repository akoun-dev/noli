import React, { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { NotificationSystem } from '@/components/insurer/NotificationSystem'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Menu, LogOut, User, Settings, Building2 } from 'lucide-react'

export const InsurerLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Titre de la page actuelle
  const getPageTitle = () => {
    const path = location.pathname
    if (path.includes('tableau-de-bord')) return 'Tableau de bord'
    if (path.includes('offres')) return 'Mes offres'
    if (path.includes('devis')) return 'Devis reçus'
    if (path.includes('analytics')) return 'Analytics'
    if (path.includes('garanties')) return 'Mes Garanties'
    if (path.includes('notifications')) return 'Notifications'
    if (path.includes('clients')) return 'Clients'
    if (path.includes('contrats')) return 'Mes Contrats'
    if (path.includes('sinistres')) return 'Gestion des Sinistres'
    if (path.includes('parametres')) return 'Paramètres'
    return 'Espace Assureur'
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className='min-h-screen bg-background'>
      <div className='flex'>
        {/* Sidebar - Desktop - Fixed */}
        <div
          className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block transition-all duration-300 ${
            sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-64 xl:w-72'
          }`}
        >
          <Sidebar
            userRole='INSURER'
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
            <div
              className={`fixed inset-y-0 left-0 bg-background shadow-xl z-50 overflow-y-auto animate-in slide-in-from-left duration-200 transition-all duration-300 ${
                sidebarCollapsed ? 'w-[72px] max-w-[72px]' : 'w-full max-w-[280px]'
              }`}
            >
              <Sidebar
                userRole='INSURER'
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                onMobileClose={() => setSidebarOpen(false)}
                isMobile={true}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main
          className={`flex-1 min-w-0 transition-all duration-300 ${
            sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64 xl:pl-72'
          }`}
        >
          {/* Insurer Header */}
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
                      Assureur
                    </Badge>
                  </div>
                  <p className='text-xs text-muted-foreground mt-0.5'>
                    {user?.companyName || 'Bienvenue'}
                  </p>
                </div>
              </div>

              {/* Right: Notifications + User menu */}
              <div className='flex items-center gap-2 sm:gap-3'>
                <div className='hidden sm:block'>
                  <NotificationSystem />
                </div>
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='gap-2'
                      aria-label='Menu utilisateur'
                    >
                      <div className='hidden sm:block text-left'>
                        <p className='text-sm font-medium'>
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className='text-xs text-muted-foreground'>Assureur</p>
                      </div>
                      <div className='h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center'>
                        <span className='text-sm font-semibold text-primary'>
                          {user?.firstName?.[0]}
                          {user?.lastName?.[0]}
                        </span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-56'>
                    <DropdownMenuLabel>
                      <div className='flex flex-col space-y-1'>
                        <p className='text-sm font-medium'>Mon compte</p>
                        <p className='text-xs text-muted-foreground'>{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/assureur/parametres')} className='gap-2'>
                      <Building2 className='h-4 w-4' />
                      <span>Entreprise</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/assureur/parametres')} className='gap-2'>
                      <User className='h-4 w-4' />
                      <span>Mon profil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/assureur/parametres')} className='gap-2'>
                      <Settings className='h-4 w-4' />
                      <span>Paramètres</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className='text-destructive gap-2'>
                      <LogOut className='h-4 w-4' />
                      <span>Déconnexion</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className='p-4 sm:p-6 overflow-hidden'>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default InsurerLayout
