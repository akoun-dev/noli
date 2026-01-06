import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
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
  const { isAuthenticated, user, isLoading, isInitializing, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle automatic role-based redirects
  useEffect(() => {
    // Ne pas faire de redirection pendant l'initialisation de l'auth
    if (isInitializing) {
      return
    }

    if (isAuthenticated && user && !isLoading) {
      const currentPath = location.pathname;

      // Redirection automatique selon le rôle pour la route générique /tableau-de-bord
      if (currentPath === '/tableau-de-bord') {
        const roleRedirectMap: Record<string, string> = {
          USER: '/tableau-de-bord',      // Les utilisateurs restent sur /tableau-de-bord
          INSURER: '/assureur/tableau-de-bord',
          ADMIN: '/admin/tableau-de-bord',
        };

        const redirectPath = roleRedirectMap[user.role];

        // Rediriger uniquement si le rôle n'est pas USER
        if (user.role !== 'USER' && redirectPath !== currentPath) {
          navigate(redirectPath, { replace: true });
          return;
        }
      }

      // Si l'utilisateur accède à une route protégée qui ne correspond pas à son rôle
      if (requiredRole && user.role !== requiredRole) {
        const userRedirectMap: Record<string, string> = {
          USER: '/tableau-de-bord',
          INSURER: '/assureur/tableau-de-bord',
          ADMIN: '/admin/tableau-de-bord',
        };
        navigate(userRedirectMap[user.role], { replace: true });
        return;
      }

      // Gérer le cas où l'utilisateur vient de se connecter et a une redirection en attente
      if (location.state?.from) {
        const fromPath = location.state.from as string;

        // Vérifier si la route demandée est appropriée pour son rôle
        const canAccessRoute = () => {
          if (fromPath.startsWith('/admin/') && user.role === 'ADMIN') return true;
          if (fromPath.startsWith('/assureur/') && user.role === 'INSURER') return true;
          if (fromPath.startsWith('/tableau-de-bord') || fromPath.startsWith('/profil') ||
              fromPath.startsWith('/mes-') || fromPath.startsWith('/historique-') ||
              fromPath.startsWith('/notifications') || fromPath.startsWith('/documents') ||
              fromPath.startsWith('/mes-avis') || fromPath.startsWith('/parametres')) {
            return user.role === 'USER';
          }
          return false;
        };

        if (canAccessRoute()) {
          navigate(fromPath, { replace: true });
        } else {
          const userRedirectMap: Record<string, string> = {
            USER: '/tableau-de-bord',
            INSURER: '/assureur/tableau-de-bord',
            ADMIN: '/admin/tableau-de-bord',
          };
          navigate(userRedirectMap[user.role], { replace: true });
        }
      }
    }
  }, [isAuthenticated, user, isLoading, isInitializing, location, requiredRole, navigate]);

  if (isLoading || isInitializing) {
    // Afficher un loader pendant l'initialisation de l'authentification
    // ou pendant la récupération du rôle depuis la BD
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
    return <Navigate to={redirectMap[user.role!]} replace />;
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default AuthGuard;
