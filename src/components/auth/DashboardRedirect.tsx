import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export const DashboardRedirect: React.FC = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth/connexion" replace />
  }

  // Redirection selon le rôle de l'utilisateur
  const roleRedirectMap: Record<string, string> = {
    USER: '/tableau-de-bord',
    INSURER: '/assureur/tableau-de-bord',
    ADMIN: '/admin/tableau-de-bord',
  }

  const redirectPath = roleRedirectMap[user.role]

  // Si l'utilisateur est déjà sur la bonne route, éviter la redirection infinie
  if (window.location.pathname === redirectPath) {
    return null
  }

  return <Navigate to={redirectPath} replace />
}