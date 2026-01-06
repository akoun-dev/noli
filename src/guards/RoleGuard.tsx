import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RoleGuardProps {
  allowedRoles: ('USER' | 'INSURER' | 'ADMIN')[];
  requiredPermissions?: string[];
  redirectTo?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  requiredPermissions,
  redirectTo = '/',
}) => {
  const { user, hasPermission, isLoading, isInitializing } = useAuth();

  // Show loading spinner during initialization or loading
  if (isLoading || isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user exists and has allowed role
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check if user has required permissions
  if (requiredPermissions) {
    const hasAllPermissions = requiredPermissions.every(permission =>
      hasPermission(permission)
    );

    if (!hasAllPermissions) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
};

export default RoleGuard;
