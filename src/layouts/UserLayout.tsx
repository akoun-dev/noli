import React, { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'
import { ChatWidget } from '@/features/chat/components/ChatWidget'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Menu, LogOut, User, Settings, FileText, Shield } from 'lucide-react'

export const UserLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Titre de la page actuelle
  const getPageTitle = () => {
    const path = location.pathname
    if (path.includes('tableau-de-bord')) return 'Tableau de bord'
    if (path.includes('mes-devis')) return 'Mes Devis'
    if (path.includes('mes-contrats')) return 'Mes Contrats'
    if (path.includes('documents')) return 'Mes Documents'
    if (path.includes('mes-avis')) return 'Mes Avis'
    if (path.includes('notifications')) return 'Notifications'
    if (path.includes('profil')) return 'Mon Profil'
    if (path.includes('parametres')) return 'Paramètres'
    if (path.includes('comparer')) return 'Comparateur'
    return 'Espace Client'
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
            userRole='USER'
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
                userRole='USER'
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
          {/* User Header */}
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
                      Client
                    </Badge>
                  </div>
                  <p className='text-xs text-muted-foreground mt-0.5'>
                    {user?.firstName ? `Bonjour, ${user.firstName}` : 'Bienvenue'}
                  </p>
                </div>
              </div>

              {/* Right: Notifications + User menu */}
              <div className='flex items-center gap-2 sm:gap-3'>
                <NotificationBell />
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
                        <p className='text-sm font-medium'>
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className='text-xs text-muted-foreground'>Client</p>
                      </div>
                      <Avatar className='h-8 w-8'>
                        {user?.avatar && (
                          <AvatarImage src={user.avatar} alt={`${user?.firstName} ${user?.lastName}`} />
                        )}
                        <AvatarFallback className='bg-primary/10 text-primary text-xs font-semibold'>
                          {user?.firstName?.[0]}
                          {user?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
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
                    <DropdownMenuItem onClick={() => navigate('/profil')} className='gap-2'>
                      <User className='h-4 w-4' />
                      <span>Mon profil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/mes-devis')} className='gap-2'>
                      <FileText className='h-4 w-4' />
                      <span>Mes Devis</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/mes-contrats')} className='gap-2'>
                      <Shield className='h-4 w-4' />
                      <span>Mes Contrats</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/parametres')} className='gap-2'>
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

      {/* Chat Widget - Visible sur toutes les pages utilisateur */}
      <ChatWidget />
    </div>
  )
}

export default UserLayout
