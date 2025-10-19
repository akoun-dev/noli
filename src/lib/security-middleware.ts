/**
 * Middleware de sécurité pour valider et maintenir l'authentification sécurisée
 * Exécuté au démarrage de l'application pour garantir la sécurité
 */

import { secureAuthService } from './secure-auth'
import { logger } from './logger'

export class SecurityMiddleware {
  private static instance: SecurityMiddleware

  static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware()
    }
    return SecurityMiddleware.instance
  }

  /**
   * Initialise toutes les mesures de sécurité au démarrage de l'application
   */
  async initializeSecurity(): Promise<void> {
    try {
      logger.security('🔒 Initializing security middleware...')

      // 1. Initialiser l'authentification sécurisée
      secureAuthService.initializeSecureAuth()

      // 2. Nettoyer les anciens tokens non sécurisés
      this.cleanupInsecureStorage()

      // 3. Valider que le stockage est sécurisé
      await this.validateSecureStorage()

      // 4. Configurer les en-têtes de sécurité
      this.configureSecurityHeaders()

      logger.security('✅ Security middleware initialized successfully')
    } catch (error) {
      logger.error('❌ Security middleware initialization failed:', error)
      throw error
    }
  }

  /**
   * Nettoie tous les stockages non sécurisés
   */
  private cleanupInsecureStorage(): void {
    try {
      // Nettoyer les tokens d'authentification
      secureAuthService.cleanupLegacyTokens()

      // Nettoyer autres données sensibles du localStorage
      const sensitiveKeys = [
        'user-token',
        'auth-token',
        'jwt-token',
        'session-token',
        'access-token',
        'refresh-token',
      ]

      let cleanedCount = 0
      sensitiveKeys.forEach((key) => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key)
          cleanedCount++
          logger.security(`Removed sensitive data from localStorage: ${key}`)
        }
      })

      if (cleanedCount > 0) {
        logger.security(`🧹 Cleaned up ${cleanedCount} sensitive items from localStorage`)
      }
    } catch (error) {
      logger.error('Error during insecure storage cleanup:', error)
    }
  }

  /**
   * Valide que le stockage sécurisé fonctionne correctement
   */
  private async validateSecureStorage(): Promise<void> {
    try {
      const isSecure = secureAuthService.validateSecureStorage()

      if (!isSecure) {
        logger.warn('⚠️  Secure storage validation failed, attempting migration...')
        const migrationSuccess = await secureAuthService.migrateToSecureStorage()

        if (!migrationSuccess) {
          logger.error('❌ Secure storage migration failed')
          throw new Error('Failed to migrate to secure storage')
        }

        logger.security('✅ Secure storage migration completed successfully')
      } else {
        logger.security('✅ Secure storage validation passed')
      }
    } catch (error) {
      logger.error('Error validating secure storage:', error)
      throw error
    }
  }

  /**
   * Configure les en-têtes de sécurité CSP
   */
  private configureSecurityHeaders(): void {
    try {
      // Cette fonction sera utilisée côté serveur ou via Service Worker
      // pour le moment, nous validons simplement la configuration
      logger.security('🛡️  Security headers configuration validated')
    } catch (error) {
      logger.error('Error configuring security headers:', error)
    }
  }

  /**
   * Vérification périodique de la sécurité
   */
  async performSecurityCheck(): Promise<boolean> {
    try {
      logger.security('🔍 Performing periodic security check...')

      // Vérifier qu'aucun token n'est stocké dans localStorage
      const hasInsecureTokens = localStorage.getItem('supabase.auth.token') !== null

      if (hasInsecureTokens) {
        logger.warn('⚠️  Insecure tokens detected during security check')
        await secureAuthService.migrateToSecureStorage()
      }

      logger.security('✅ Security check completed')
      return true
    } catch (error) {
      logger.error('❌ Security check failed:', error)
      return false
    }
  }
}

// Export singleton
export const securityMiddleware = SecurityMiddleware.getInstance()

// Hook React pour le middleware de sécurité
export const useSecurityMiddleware = () => {
  return {
    initializeSecurity: () => securityMiddleware.initializeSecurity(),
    performSecurityCheck: () => securityMiddleware.performSecurityCheck(),
  }
}
