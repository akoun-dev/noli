import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'
import { ChatWidget } from '@/features/chat/components/ChatWidget'

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
    <div className='min-h-screen bg-background'>
      <div className='flex'>
        {/* Sidebar - Desktop - Fixed */}
        <div className='hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64'>
          <Sidebar userRole='USER' />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className='fixed inset-0 z-40 lg:hidden'>
            <div
              className='fixed inset-0 bg-gray-600 bg-opacity-75'
              onClick={() => setSidebarOpen(false)}
            />
            <div className='fixed inset-y-0 left-0 w-64 bg-background shadow-lg border-r z-50'>
              <Sidebar userRole='USER' />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className='flex-1 lg:pl-64'>
          <div className='min-h-screen'>
            {/* Mobile Header */}
            <div className='lg:hidden bg-card border-b px-4 py-3 flex items-center justify-between'>
              <button
                onClick={() => setSidebarOpen(true)}
                className='p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent'
              >
                <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 6h16M4 12h16M4 18h16'
                  />
                </svg>
              </button>
              <div className='flex items-center space-x-2'>
                <NotificationBell />
                <ThemeToggle />
                <span className='text-sm font-medium text-foreground'>
                  Bienvenue, {user?.firstName}
                </span>
              </div>
            </div>

            {/* Page Content */}
            <div className='p-6'>
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
