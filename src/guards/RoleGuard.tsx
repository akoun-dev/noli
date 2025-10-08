import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RoleGuardProps {
  allowedRoles: ('USER' | 'INSURER' | 'ADMIN')[];
  redirectTo?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  redirectTo = '/',
}) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};

export default RoleGuard;
