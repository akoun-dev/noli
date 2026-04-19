import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/common/Header';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationSystem } from '@/components/insurer/NotificationSystem';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header global */}
      <Header />

      <div className="flex flex-1">
        {/* Sidebar - Desktop - Fixed */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64" style={{ top: '80px' }}>
          <Sidebar userRole="INSURER" />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-72 bg-background shadow-xl z-50 overflow-y-auto animate-in slide-in-from-left duration-200">
              <Sidebar userRole="INSURER" onMobileClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 lg:pl-64">
          <div className="min-h-screen">
            {/* Mobile Sidebar Toggle */}
            <div className="lg:hidden bg-card/80 backdrop-blur-sm border-b sticky top-[88px] z-40 px-4 py-2 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="flex-1"
              >
                <Menu className="h-4 w-4 mr-2" />
                Menu Assureur
              </Button>
              <NotificationSystem />
            </div>

            {/* Insurer Stats Bar */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold">156</div>
                  <div className="text-blue-100 text-xs sm:text-sm">Devis ce mois</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold">89%</div>
                  <div className="text-blue-100 text-xs sm:text-sm">Taux conversion</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold">2.4M</div>
                  <div className="text-blue-100 text-xs sm:text-sm">CA (FCFA)</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold">4.8</div>
                  <div className="text-blue-100 text-xs sm:text-sm">Note moyenne</div>
                </div>
              </div>
            </div>

            {/* Page Content */}
            <div className="p-4 sm:p-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default InsurerLayout;
