import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationSystem } from '@/components/insurer/NotificationSystem';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export const InsurerLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const insurerNavigation = [
    { name: 'Tableau de bord', href: '/assureur/tableau-de-bord', icon: 'LayoutDashboard' },
    { name: 'Mes Offres', href: '/assureur/offres', icon: 'Car' },
    { name: 'Devis Reçus', href: '/assureur/devis', icon: 'FileText', badge: '3' },
    { name: 'Notifications', href: '/assureur/notifications', icon: 'Bell', badge: '2' },
    { name: 'Analytics', href: '/assureur/analytics', icon: 'BarChart3' },
    { name: 'Clients', href: '/assureur/clients', icon: 'Users' },
    { name: 'Paramètres', href: '/assureur/parametres', icon: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar - Desktop - Fixed */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64">
          <Sidebar userRole="INSURER" />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-64 bg-background shadow-lg border-r z-50">
              <Sidebar userRole="INSURER" />
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
                  Espace Assureur - {user?.firstName}
                </span>
                <NotificationSystem />
              </div>
            </div>

            {/* Insurer Stats Bar */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">156</div>
                  <div className="text-blue-100 text-sm">Devis ce mois</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">89%</div>
                  <div className="text-blue-100 text-sm">Taux conversion</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">2.4M</div>
                  <div className="text-blue-100 text-sm">CA (FCFA)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">4.8</div>
                  <div className="text-blue-100 text-sm">Note moyenne</div>
                </div>
              </div>
            </div>

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

export default InsurerLayout;
