import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { UserLayout } from '@/layouts/UserLayout'
import { InsurerLayout } from '@/layouts/InsurerLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import {
  UserDashboardPage,
  InsurerDashboardPage,
  AdminDashboardPage
} from '@/routes/LazyRoutes'

export const DashboardRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Chargement de l'authentification...</p>
        </div>
      </div>
    )
  }

  // Si non authentifié, rediriger vers la connexion
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/connexion" replace />
  }

  // Rendre directement le bon layout selon le rôle
  switch (user.role) {
    case 'USER':
      return (
        <UserLayout>
          <UserDashboardPage />
        </UserLayout>
      )

    case 'INSURER':
      return (
        <InsurerLayout>
          <InsurerDashboardPage />
        </InsurerLayout>
      )

    case 'ADMIN':
      return (
        <AdminLayout>
          <AdminDashboardPage />
        </AdminLayout>
      )

    default:
      return <Navigate to="/auth/connexion" replace />
  }
}
