import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useEffect, useState } from 'react'

export const DashboardRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading, isInitializing } = useAuth()
  const [fallbackRoute, setFallbackRoute] = useState<string | null>(null)

  useEffect(() => {
    // Si l'utilisateur est admin et que la route par défaut ne fonctionne pas,
    // rediriger vers une route alternative
    if (isAuthenticated && user?.role === 'ADMIN') {
      // Attendre un peu pour voir si la route par défaut fonctionne
      const timer = setTimeout(() => {
        setFallbackRoute('/admin/devis') // Fallback vers une route qui existe
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, user])

  // Afficher le loader pendant le chargement OU l'initialisation (récupération du rôle depuis la BD)
  if (isLoading || isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Si non authentifié, rediriger vers la connexion
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/connexion" replace />
  }

  // Si on a un fallback, l'utiliser
  if (fallbackRoute) {
    return <Navigate to={fallbackRoute} replace />
  }

  // Redirection selon le rôle de l'utilisateur
  const roleRedirectMap: Record<string, string> = {
    USER: '/tableau-de-bord',
    INSURER: '/assureur/tableau-de-bord',
    ADMIN: '/admin/tableau-de-bord', // Route par défaut pour les admins
  }

  const redirectPath = roleRedirectMap[user.role]

  // Si l'utilisateur est déjà sur la bonne route, éviter la redirection infinie
  if (window.location.pathname === redirectPath) {
    return null
  }

  return <Navigate to={redirectPath} replace />
}
