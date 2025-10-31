import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { authDebugger } from '@/debug/auth-debug'
import { logger } from '@/lib/logger'

const AuthDebugPage = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const addLog = (message: string) => {
    setResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const runDiagnostic = async () => {
    setIsRunning(true)
    setResults([])
    setError(null)

    // Intercepter les logs du logger pour les afficher dans l'interface
    const originalError = logger.error
    const originalInfo = logger.info
    const originalWarn = logger.warn

    logger.error = (message: string, ...args: unknown[]) => {
      addLog(`❌ ERROR: ${message}`)
      originalError.call(logger, message, ...args)
    }

    logger.info = (message: string, ...args: unknown[]) => {
      addLog(`ℹ️ INFO: ${message}`)
      originalInfo.call(logger, message, ...args)
    }

    logger.warn = (message: string, ...args: unknown[]) => {
      addLog(`⚠️ WARN: ${message}`)
      originalWarn.call(logger, message, ...args)
    }

    try {
      addLog("🚀 Démarrage du diagnostic d'authentification...")
      await authDebugger.runFullDiagnostic()
      addLog('✅ Diagnostic terminé')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      addLog(`💥 Exception: ${errorMessage}`)
    } finally {
      // Restaurer les fonctions originales
      logger.error = originalError
      logger.info = originalInfo
      logger.warn = originalWarn
      setIsRunning(false)
    }
  }

  const testLogin = async () => {
    setIsRunning(true)
    setResults([])
    setError(null)

    try {
      addLog('🔐 Test de connexion avec utilisateur de démonstration...')

      // Importer dynamiquement pour éviter les problèmes de dépendances circulaires
      const { authService } = await import('@/data/api/authService')

      await authService.login({
        email: 'user@example.com',
        password: 'password123',
      })

      addLog('✅ Connexion réussie avec user@example.com')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      addLog(`❌ Échec de connexion: ${errorMessage}`)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className='container mx-auto p-6 max-w-4xl'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold mb-2'>Debug d'Authentification Supabase</h1>
        <p className='text-muted-foreground'>
          Outil de diagnostic pour identifier les problèmes d'authentification
        </p>
      </div>

      {error && (
        <Alert className='mb-6 border-red-200 bg-red-50'>
          <AlertDescription className='text-red-800'>
            <strong>Erreur:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      <div className='grid gap-6 mb-6'>
        <Card>
          <CardHeader>
            <CardTitle>Tests Disponibles</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex gap-4'>
              <Button onClick={runDiagnostic} disabled={isRunning} className='flex-1'>
                {isRunning ? '⏳ Diagnostic en cours...' : '🔍 Lancer le diagnostic complet'}
              </Button>

              <Button onClick={testLogin} disabled={isRunning} variant='outline' className='flex-1'>
                {isRunning ? '⏳ Test en cours...' : '🔐 Tester la connexion'}
              </Button>
            </div>

            <div className='text-sm text-muted-foreground'>
              <p>
                • Le diagnostic vérifie: connexion Supabase, tables auth.users/profiles, fonctions
                RPC
              </p>
              <p>• Le test de connexion utilise: user@example.com / password123</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Résultats du Diagnostic</CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <p className='text-muted-foreground text-center py-8'>
                Cliquez sur "Lancer le diagnostic" pour commencer
              </p>
            ) : (
              <div className='bg-gray-50 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto'>
                {results.map((result, index) => (
                  <div key={index} className='mb-1'>
                    {result}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions Recommandées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2 text-sm'>
              <p>
                📋 <strong>Si les fonctions RPC échouent:</strong>
              </p>
              <ul className='ml-6 list-disc space-y-1'>
                <li>Vérifiez que les migrations 006, 018, 019 ont été appliquées</li>
                <li>
                  Exécutez <code>supabase db reset</code> pour réinitialiser la base
                </li>
              </ul>

              <p>
                📋 <strong>Si la table auth.users est inaccessible:</strong>
              </p>
              <ul className='ml-6 list-disc space-y-1'>
                <li>Vérifiez les permissions sur le schéma auth</li>
                <li>Assurez-vous que RLS est correctement configuré</li>
              </ul>

              <p>
                📋 <strong>Si la connexion échoue:</strong>
              </p>
              <ul className='ml-6 list-disc space-y-1'>
                <li>
                  Vérifiez les variables d'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
                </li>
                <li>Assurez-vous que l'instance Supabase est en ligne</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AuthDebugPage
