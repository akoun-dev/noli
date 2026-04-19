/**
 * Composant d'initialisation de la sécurité
 * Exécute le middleware de sécurité au démarrage de l'application
 */

import { useEffect, useState } from 'react'
import { securityMiddleware } from '@/lib/security-middleware'
import { logger } from '@/lib/logger'

interface SecurityInitializerProps {
  children: React.ReactNode
}

export const SecurityInitializer: React.FC<SecurityInitializerProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeSecurity = async () => {
      try {
        logger.security('🚀 Starting security initialization...')

        // Initialiser toutes les mesures de sécurité
        await securityMiddleware.initializeSecurity()

        setIsInitialized(true)
        logger.security('✅ Security initialization completed successfully')
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        logger.error('❌ Security initialization failed:', err)
      }
    }

    initializeSecurity()
  }, [])

  // Effectuer des vérifications de sécurité périodiques
  useEffect(() => {
    if (!isInitialized) return

    const interval = setInterval(
      async () => {
        try {
          await securityMiddleware.performSecurityCheck()
        } catch (err) {
          logger.warn('⚠️  Periodic security check failed:', err)
        }
      },
      5 * 60 * 1000
    ) // Toutes les 5 minutes

    return () => clearInterval(interval)
  }, [isInitialized])

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-red-50'>
        <div className='max-w-md w-full bg-white rounded-lg shadow-lg p-6'>
          <div className='flex items-center mb-4'>
            <div className='flex-shrink-0'>
              <svg
                className='h-6 w-6 text-red-400'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
            </div>
            <div className='ml-3'>
              <h3 className='text-sm font-medium text-red-800'>Erreur de Sécurité</h3>
            </div>
          </div>
          <div className='text-sm text-red-700'>
            <p>Une erreur est survenue lors de l'initialisation des mesures de sécurité.</p>
            <p className='mt-2'>Erreur: {error}</p>
            <p className='mt-3'>Veuillez actualiser la page ou contacter l'administrateur.</p>
          </div>
          <div className='mt-4'>
            <button
              onClick={() => window.location.reload()}
              className='w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors'
            >
              Actualiser la page
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!isInitialized) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Initialisation des mesures de sécurité...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
