import React from 'react';
import { Outlet } from 'react-router-dom';
import { GlobalSearchProvider } from '@/hooks/useGlobalSearch';
import { GlobalSearch } from '@/components/common/GlobalSearch';
import { Footer } from '@/components/common/Footer';

interface MainLayoutProps {
  children?: React.ReactNode;
  showFooter?: boolean;
  className?: string;
}

export function MainLayout({
  children,
  showFooter = true,
  className = ''
}: MainLayoutProps) {
  return (
    <GlobalSearchProvider>
      <div className={`min-h-screen bg-background ${className}`}>
        <GlobalSearch />
        <main className="flex-1">
          {children || <Outlet />}
        </main>
        {showFooter && <Footer />}
      </div>
    </GlobalSearchProvider>
  );
}

export default MainLayout;