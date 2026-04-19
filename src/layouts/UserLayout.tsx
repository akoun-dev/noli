import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/common/Header'
import { useAuth } from '@/contexts/AuthContext'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'
import { ChatWidget } from '@/features/chat/components/ChatWidget'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

export const UserLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user } = useAuth()

  const userNavigation = [
    { name: 'Tableau de bord', href: '/tableau-de-bord', icon: 'LayoutDashboard' },
    { name: 'Mes Devis', href: '/mes-devis', icon: 'FileText' },
    { name: 'Mes Contrats', href: '/mes-contrats', icon: 'Shield' },
    { name: 'Mes Documents', href: '/documents', icon: 'FolderOpen' },
    { name: 'Mes Avis', href: '/mes-avis', icon: 'Star' },
    { name: 'Notifications', href: '/notifications', icon: 'Bell' },
    { name: 'Mon Profil', href: '/profil', icon: 'User' },
    { name: 'Paramètres', href: '/parametres', icon: 'Settings' },
  ]

  return (
    <div className='min-h-screen bg-background flex flex-col'>
      {/* Header global */}
      <Header />

      <div className='flex flex-1'>
        {/* Sidebar - Desktop - Fixed */}
        <div className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block transition-all duration-300 ${
          sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-64'
        }`} style={{ top: '80px' }}>
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
            <div className={`fixed inset-y-0 left-0 bg-background shadow-xl z-50 overflow-y-auto animate-in slide-in-from-left duration-200 transition-all duration-300 ${
                sidebarCollapsed ? 'w-[72px] max-w-[72px]' : 'w-full max-w-[280px]'
              }`}>
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
        <main className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
        }`}>
          <div className='min-h-screen w-full max-w-full'>
            {/* Mobile Sidebar Toggle */}
            <div className='lg:hidden bg-card/80 backdrop-blur-sm border-b sticky top-20 z-40 px-4 py-2.5'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setSidebarOpen(true)}
                className='w-full justify-start h-10'
              >
                <Menu className='h-5 w-5 mr-2' />
                Menu Utilisateur
              </Button>
            </div>

            {/* Page Content */}
            <div className='p-4 sm:p-6 w-full max-w-full'>
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Chat Widget - Visible sur toutes les pages utilisateur */}
      <ChatWidget />
    </div>
  )
}

export default UserLayout
