/**
 * Utilitaires de sécurité pour la gestion des données sensibles
 * Nettoyage complet et vérification du stockage
 */

import { logger } from './logger'

export class SecurityUtils {
  /**
   * Vérifie si le stockage local contient encore des données sensibles après déconnexion
   */
  static checkForSensitiveData(): {
    hasSensitiveData: boolean
    sensitiveKeys: string[]
    totalItems: number
    details: string[]
  } {
    const sensitiveKeys: string[] = []
    const details: string[] = []
    const sensitivePatterns = [
      'noli_',
      'supabase.',
      'sb-',
      'auth',
      'token',
      'user',
      'permission',
      'role'
    ]

    try {
      // Vérifier localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue

        const keyLower = key.toLowerCase()
        const isSensitive = sensitivePatterns.some(pattern =>
          keyLower.includes(pattern.toLowerCase())
        )

        if (isSensitive) {
          sensitiveKeys.push(key)

          try {
            const value = localStorage.getItem(key)
            if (value) {
              details.push(`localStorage[${key}]: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`)
            }
          } catch (e) {
            details.push(`localStorage[${key}]: [erreur lecture]`)
          }
        }
      }

      // Vérifier sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (!key) continue

        const keyLower = key.toLowerCase()
        const isSensitive = sensitivePatterns.some(pattern =>
          keyLower.includes(pattern.toLowerCase())
        )

        if (isSensitive) {
          sensitiveKeys.push(`session:${key}`)

          try {
            const value = sessionStorage.getItem(key)
            if (value) {
              details.push(`sessionStorage[${key}]: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`)
            }
          } catch (e) {
            details.push(`sessionStorage[${key}]: [erreur lecture]`)
          }
        }
      }

      return {
        hasSensitiveData: sensitiveKeys.length > 0,
        sensitiveKeys,
        totalItems: localStorage.length + sessionStorage.length,
        details
      }
    } catch (error) {
      logger.error('Erreur vérification données sensibles:', error)
      return {
        hasSensitiveData: true,
        sensitiveKeys: ['erreur_vérification'],
        totalItems: -1,
        details: ['Erreur lors de la vérification']
      }
    }
  }

  /**
   * Nettoyage de sécurité forcé (utilisé en cas d'urgence)
   */
  static forceCleanAllStorage(): boolean {
    try {
      logger.security('🧹 NETTOYAGE DE SÉCURITÉ FORCÉ')

      // Vider complètement localStorage
      try {
        localStorage.clear()
        logger.security('✅ localStorage vidé')
      } catch (e) {
        logger.error('❌ Erreur vidage localStorage:', e)
        return false
      }

      // Vider complètement sessionStorage
      try {
        sessionStorage.clear()
        logger.security('✅ sessionStorage vidé')
      } catch (e) {
        logger.error('❌ Erreur vidage sessionStorage:', e)
        return false
      }

      // Nettoyer les cookies si possible
      try {
        document.cookie.split(';').forEach(cookie => {
          const eqPos = cookie.indexOf('=')
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()

          // Supprimer le cookie pour tous les domaines possibles
          const domains = [
            window.location.hostname,
            `.${window.location.hostname}`,
            window.location.hostname.split('.').slice(-2).join('.')
          ]

          domains.forEach(domain => {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain};`
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`
          })
        })
        logger.security('✅ Cookies nettoyés')
      } catch (e) {
        logger.warn('⚠️ Erreur nettoyage cookies:', e)
      }

      logger.security('✅ NETTOYAGE FORCÉ TERMINÉ')
      return true
    } catch (error) {
      logger.error('❌ Erreur nettoyage forcé:', error)
      return false
    }
  }

  /**
   * Affiche un rapport de sécurité dans la console (mode debug uniquement)
   */
  static logSecurityReport(): void {
    if (import.meta.env.DEV) {
      const report = this.checkForSensitiveData()

      console.group('🔒 RAPPORT DE SÉCURITÉ - STOCKAGE LOCAL')
      console.log('Items totaux:', report.totalItems)
      console.log('Clés sensibles trouvées:', report.sensitiveKeys.length)

      if (report.hasSensitiveData) {
        console.warn('⚠️ DONNÉES SENSIBLES TROUVÉES:')
        console.warn('Clés:', report.sensitiveKeys)
        console.warn('Détails:', report.details)
        console.warn('⚠️ RISQUE DE SÉCURITÉ - Données non nettoyées après déconnexion!')
      } else {
        console.log('✅ Aucune donnée sensible trouvée - Stockage propre')
      }

      console.groupEnd()
    }
  }

  /**
   * Planifie une vérification de sécurité après déconnexion
   */
  static scheduleSecurityCheck(): void {
    // Vérifier immédiatement
    setTimeout(() => {
      this.logSecurityReport()
    }, 100)

    // Vérifier après 1 seconde (pour s'assurer que tout est bien nettoyé)
    setTimeout(() => {
      const report = this.checkForSensitiveData()
      if (report.hasSensitiveData || report.totalItems > 5) {
        logger.warn('⚠️ Données trouvées 1s après déconnexion - Nettoyage forcé radical')
        this.radicalCleanStorage()
        this.logSecurityReport()
      }
    }, 1000)

    // Vérification finale après 3 secondes
    setTimeout(() => {
      this.logSecurityReport()
      const report = this.checkForSensitiveData()
      if (report.totalItems > 0) {
        logger.error('❌ ERREUR SÉCURITÉ: Des données persistent après nettoyage radical!')
        this.nuclearCleanStorage()
        setTimeout(() => this.logSecurityReport(), 500)
      }
    }, 3000)
  }

  /**
   * Nettoyage radical (préservant seulement le strict minimum)
   */
  static radicalCleanStorage(): void {
    try {
      logger.security('🔥 NETTOYAGE RADICAL - Préserve seulement le minimum')

      // Identifier les clés vraiment essentielles à préserver
      const essentialKeys = ['theme', 'language', 'debug_errors']
      const preservedData: Array<{ key: string; value: string }> = []

      // Sauvegarder les clés essentielles
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i)
          if (!key) continue

          const isEssential = essentialKeys.some(essential =>
            key.toLowerCase().includes(essential.toLowerCase())
          )

          if (isEssential) {
            const value = localStorage.getItem(key)
            if (value) {
              preservedData.push({ key, value })
            }
          }
        }
      } catch (e) {
        logger.warn('Erreur sauvegarde clés essentielles:', e)
      }

      // VIDAGE COMPLET
      localStorage.clear()
      sessionStorage.clear()

      // Restaurer uniquement le strict minimum
      preservedData.forEach(({ key, value }) => {
        try {
          localStorage.setItem(key, value)
        } catch (e) {
          logger.warn('Erreur restauration clé essentielle:', e)
        }
      })

      logger.security(`✅ Nettoyage radical terminé - ${preservedData.length} clés préservées`)
    } catch (error) {
      logger.error('Erreur nettoyage radical:', error)
      this.forceCleanAllStorage()
    }
  }

  /**
   * Nettoyage nucléaire (absolument tout, sans exception)
   */
  static nuclearCleanStorage(): void {
    try {
      logger.security('☢️ NETTOYAGE NUCLÉAIRE - Suppression absolue de tout')

      // Tenter toutes les méthodes possibles de nettoyage
      try {
        localStorage.clear()
      } catch (e) {
        logger.warn('Erreur localStorage.clear():', e)
      }

      try {
        sessionStorage.clear()
      } catch (e) {
        logger.warn('Erreur sessionStorage.clear():', e)
      }

      // Nettoyage manuel de toutes les clés restantes
      try {
        const keys = []
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i)
          if (key) keys.push(key)
        }
        keys.forEach(key => {
          try {
            localStorage.removeItem(key)
          } catch (e) {
            logger.error(`Erreur suppression ${key}:`, e)
          }
        })
      } catch (e) {
        logger.error('Erreur nettoyage manuel localStorage:', e)
      }

      // Nettoyage manuel sessionStorage
      try {
        const keys = []
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const key = sessionStorage.key(i)
          if (key) keys.push(key)
        }
        keys.forEach(key => {
          try {
            sessionStorage.removeItem(key)
          } catch (e) {
            logger.error(`Erreur suppression session ${key}:`, e)
          }
        })
      } catch (e) {
        logger.error('Erreur nettoyage manuel sessionStorage:', e)
      }

      // Test de nettoyage
      try {
        const testKey = 'test_nuclear_' + Date.now()
        localStorage.setItem(testKey, 'test')
        localStorage.removeItem(testKey)
        localStorage.clear()
      } catch (e) {
        logger.warn('Test nettoyage échoué:', e)
      }

      logger.security('☢️ Nettoyage nucléaire terminé')
    } catch (error) {
      logger.error('Erreur nettoyage nucléaire:', error)
    }
  }
}

export const securityUtils = SecurityUtils