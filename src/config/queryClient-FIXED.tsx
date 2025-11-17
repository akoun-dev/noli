import { QueryClient } from '@tanstack/react-query'

export const createOptimizedQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // ⚡ staleTime réduit à 30 secondes au lieu de 5 minutes
        staleTime: 30 * 1000, // 30 secondes

        // Refetch immédiat au focus (pour récupérer les données fraîches)
        refetchOnWindowFocus: true,

        // Réduire le nombre de retries
        retry: (failureCount, error) => {
          // Ne pas réessayer pour les erreurs 401/403
          if (error && typeof error === 'object' && 'status' in error) {
            if (error.status === 401 || error.status === 403) return false
          }

          // Maximum 2 retries
          return failureCount < 2
        },

        // Délai de retry plus court
        retryDelay: attemptIndex => Math.min(1000 * attemptIndex, 5000), // 1s, 2s max

        // Cache time réduit
        gcTime: 5 * 60 * 1000, // 5 minutes au lieu de 24h par défaut

        // Activer le mode background pour les rafraîchissements
        refetchOnReconnect: true,

        // Ne pas suspendre en cas d'erreur (permet aux Error Boundaries de fonctionner)
        throwOnError: false,

        // Désactiver le refetch automatique excessif
        refetchInterval: false,

        // Timeout plus court pour les requêtes
        queryFnTimeout: 10000, // 10 secondes max par requête
      },
      mutations: {
        // Moins de retries pour les mutations
        retry: 1,

        // Timeout plus court pour les mutations
        mutationFnTimeout: 15000, // 15 secondes max
      },
    },
  })
}

// Export pour utilisation dans App.tsx
export const queryClient = createOptimizedQueryClient()