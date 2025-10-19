import { useEffect } from 'react';
import { cspManager } from '@/lib/csp';
import { logger } from '@/lib/logger';

interface CSPProviderProps {
  children: React.ReactNode;
}

/**
 * Provider qui injecte et gère le Content Security Policy
 * Doit être placé au plus haut niveau de l'application
 */
export const CSPProvider: React.FC<CSPProviderProps> = ({ children }) => {
  useEffect(() => {
    // Injecter le CSP au montage du composant
    try {
      cspManager.injectCSP();

      // Valider le CSP
      const validation = cspManager.validateCSP();

      if (validation.isValid) {
        logger.auth('CSP injected and validated successfully');
      } else {
        logger.warn('CSP validation issues found:', validation.issues);

        // En développement, afficher un avertissement clair
        if (import.meta.env.DEV) {
          console.warn('⚠️ CSP Validation Issues:', validation.issues);
        }
      }

      // Log du CSP actuel en développement
      if (import.meta.env.DEV) {
        const currentCSP = cspManager.inspectCurrentCSP();
        logger.debug('Current CSP configuration:', currentCSP);
      }

    } catch (error) {
      logger.error('Failed to inject CSP:', error);

      // En développement, afficher l'erreur clairement
      if (import.meta.env.DEV) {
        console.error('❌ CSP Injection Failed:', error);
      }
    }

    // Nettoyer si nécessaire (optionnel)
    return () => {
      // Le CSP reste généralement en place, mais on peut nettoyer si nécessaire
    };
  }, []);

  // Le composant ne rend rien de spécial, il gère juste le CSP
  return <>{children}</>;
};

export default CSPProvider;