import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  requiredRole?: 'USER' | 'INSURER' | 'ADMIN';
  requiredPermission?: string;
  redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  requiredRole,
  requiredPermission,
  redirectTo = '/auth/connexion',
}) => {
  const { isAuthenticated, user, isLoading, hasPermission } = useAuth();
  const location = useLocation();

  // Handle role-based redirects after login
  useEffect(() => {
    if (isAuthenticated && user && location.state?.from) {
      const fromPath = location.state.from as string;

      // Check if the user is trying to access a route they don't have permission for
      if (requiredRole && user.role !== requiredRole) {
        const redirectMap = {
          USER: '/tableau-de-bord',
          INSURER: '/assureur/tableau-de-bord',
          ADMIN: '/admin/tableau-de-bord',
        };
        // Navigate to appropriate dashboard
        window.location.href = redirectMap[user.role];
      }
    }
  }, [isAuthenticated, user, location.state, requiredRole]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role requirement
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate dashboard based on role
    const redirectMap = {
      USER: '/tableau-de-bord',
      INSURER: '/assureur/tableau-de-bord',
      ADMIN: '/admin/tableau-de-bord',
    };
    return <Navigate to={redirectMap[user.role]} replace />;
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default AuthGuard;
