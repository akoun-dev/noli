import { useEffect, useState, createContext, useContext } from 'react'
import { cspManager } from '@/lib/csp'
import { logger } from '@/lib/logger'

interface CSPContextType {
  nonce: string
}

const CSPContext = createContext<CSPContextType>({ nonce: '' })

export const useCSPNonce = () => {
  const context = useContext(CSPContext)
  if (!context) {
    throw new Error('useCSPNonce must be used within a CSPProvider')
  }
  return context
}

interface CSPProviderProps {
  children: React.ReactNode
}

/**
 * Provider qui injecte et gère le Content Security Policy
 * Doit être placé au plus haut niveau de l'application
 */
export const CSPProvider: React.FC<CSPProviderProps> = ({ children }) => {
  const [nonce, setNonce] = useState<string>('')

  useEffect(() => {
    // Injecter le CSP au montage du composant
    try {
      const isProduction = import.meta.env.PROD

      if (isProduction) {
        // En production, générer un nonce et utiliser un CSP plus strict
        const generatedNonce = cspManager.generateNonce()
        setNonce(generatedNonce)

        const cspValue = cspManager.getProductionCSPWithNonce(generatedNonce)
        injectCSPWithNonce(cspValue)

        logger.security('Production CSP with nonce injected successfully')
      } else {
        // En développement, utiliser le CSP permissif
        cspManager.injectCSP()

        logger.security('Development CSP injected')
      }

      // Valider le CSP
      const validation = cspManager.validateCSP()
      if (validation.isValid) {
        logger.security('CSP validated successfully')
      } else {
        logger.warn('CSP validation issues:', validation.issues)
      }

      // Log du CSP actuel en développement
      if (import.meta.env.DEV) {
        const currentCSP = cspManager.inspectCurrentCSP()
        logger.debug('Current CSP configuration:', currentCSP)
      }
    } catch (error) {
      logger.error('Failed to inject CSP:', error)
      // En développement, afficher l'erreur clairement
      if (import.meta.env.DEV) {
        console.error('CSP Injection Failed:', error)
      }
    }
  }, [])

  return <CSPContext.Provider value={{ nonce }}>{children}</CSPContext.Provider>
}

/**
 * Injecte un CSP avec nonce spécifique
 * @param cspValue - Le contenu CSP à injecter
 */
const injectCSPWithNonce = (cspValue: string): void => {
  // Vérifier si le CSP est déjà défini
  if (document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
    return
  }
  const meta = document.createElement('meta')
  meta.setAttribute('http-equiv', 'Content-Security-Policy')
  meta.setAttribute('content', cspValue)
  document.head.appendChild(meta)
}

export default CSPProvider
