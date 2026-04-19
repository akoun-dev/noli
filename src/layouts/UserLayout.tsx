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
        <div className='hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64' style={{ top: '80px' }}>
          <Sidebar userRole='USER' />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className='fixed inset-0 z-50 lg:hidden'>
            <div
              className='fixed inset-0 bg-black/50 backdrop-blur-sm'
              onClick={() => setSidebarOpen(false)}
            />
            <div className='fixed inset-y-0 left-0 w-72 bg-background shadow-xl z-50 overflow-y-auto animate-in slide-in-from-left duration-200'>
              <div className='flex items-center justify-between p-4 border-b'>
                <span className='font-semibold text-lg'>Menu Utilisateur</span>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className='h-5 w-5' />
                </Button>
              </div>
              <Sidebar userRole='USER' />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className='flex-1 lg:pl-64'>
          <div className='min-h-screen w-full max-w-full'>
            {/* Mobile Sidebar Toggle */}
            <div className='lg:hidden bg-card/80 backdrop-blur-sm border-b sticky top-20 z-40 px-4 py-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setSidebarOpen(true)}
                className='w-full justify-start'
              >
                <Menu className='h-4 w-4 mr-2' />
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
