/**
 * Script de debug pour l'authentification Supabase
 * Permet de tester les fonctions RPC et identifier les problèmes
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export class AuthDebugger {
  static async testSupabaseConnection(): Promise<boolean> {
    try {
      logger.info('Test de connexion à Supabase...')

      // Test simple de connexion
      const { data, error } = await supabase.from('profiles').select('count').limit(1)

      if (error) {
        logger.error('Erreur de connexion Supabase:', error)
        return false
      }

      logger.info('✅ Connexion Supabase réussie')
      return true
    } catch (err) {
      logger.error('Exception lors du test de connexion:', err)
      return false
    }
  }

  static async testAuthUsersTable(): Promise<boolean> {
    try {
      logger.info('Test de la table auth.users...')

      // Vérifier si on peut accéder à auth.users
      const { data, error } = await supabase.rpc('test_auth_users_access')

      if (error) {
        logger.error('Erreur accès auth.users:', error)
        return false
      }

      logger.info('✅ Table auth.users accessible')
      return true
    } catch (err) {
      logger.error('Exception lors du test auth.users:', err)
      return false
    }
  }

  static async testRPCFunctions(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {}

    const functions = [
      'get_user_profile',
      'get_user_permissions',
      'user_has_permission',
      'log_user_action',
    ]

    for (const funcName of functions) {
      try {
        logger.info(`Test de la fonction RPC: ${funcName}`)

        // Tester avec des paramètres vides pour voir si la fonction existe.
        // `funcName` est un nom dynamique (debug) : cast requis car .rpc() est
        // désormais typé strictement sur les noms de fonctions connus.
        const { data, error } = await supabase.rpc(funcName as never)

        if (error) {
          logger.error(`❌ Fonction ${funcName} erreur:`, error)
          results[funcName] = false
        } else {
          logger.info(`✅ Fonction ${funcName} accessible`)
          results[funcName] = true
        }
      } catch (err) {
        logger.error(`❌ Exception fonction ${funcName}:`, err)
        results[funcName] = false
      }
    }

    return results
  }

  static async testProfilesTable(): Promise<boolean> {
    try {
      logger.info('Test de la table profiles...')

      const { data, error } = await supabase.from('profiles').select('*').limit(1)

      if (error) {
        logger.error('Erreur table profiles:', error)
        return false
      }

      logger.info('✅ Table profiles accessible')
      return true
    } catch (err) {
      logger.error('Exception table profiles:', err)
      return false
    }
  }

  static async runFullDiagnostic(): Promise<void> {
    logger.info("=== DÉBUT DU DIAGNOSTIC D'AUTHENTIFICATION ===")

    const results = {
      supabaseConnection: await this.testSupabaseConnection(),
      authUsersTable: await this.testAuthUsersTable(),
      profilesTable: await this.testProfilesTable(),
      rpcFunctions: await this.testRPCFunctions(),
    }

    logger.info('=== RÉSULTATS DU DIAGNOSTIC ===')
    logger.info('Connexion Supabase:', results.supabaseConnection ? '✅' : '❌')
    logger.info('Table auth.users:', results.authUsersTable ? '✅' : '❌')
    logger.info('Table profiles:', results.profilesTable ? '✅' : '❌')

    logger.info('Fonctions RPC:')
    Object.entries(results.rpcFunctions).forEach(([func, success]) => {
      logger.info(`  ${func}: ${success ? '✅' : '❌'}`)
    })

    // Identifier le problème principal
    if (!results.supabaseConnection) {
      logger.error('🔴 PROBLÈME PRINCIPAL: Connexion Supabase échouée')
    } else if (!results.authUsersTable) {
      logger.error('🔴 PROBLÈME PRINCIPAL: Table auth.users inaccessible')
    } else if (!results.profilesTable) {
      logger.error('🔴 PROBLÈME PRINCIPAL: Table profiles inaccessible')
    } else {
      const failedFunctions = Object.entries(results.rpcFunctions)
        .filter(([_, success]) => !success)
        .map(([name]) => name)

      if (failedFunctions.length > 0) {
        logger.error('🔴 PROBLÈME PRINCIPAL: Fonctions RPC défaillantes:', failedFunctions)
      } else {
        logger.info('🟢 Tous les tests de base sont passés')
      }
    }

    logger.info('=== FIN DU DIAGNOSTIC ===')
  }
}

// Export pour utilisation dans la console ou les tests
export const authDebugger = AuthDebugger
