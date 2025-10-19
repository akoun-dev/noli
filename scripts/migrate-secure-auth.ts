#!/usr/bin/env tsx

/**
 * Script de migration vers l'authentification sécurisée
 * À exécuter une fois pour migrer tous les utilisateurs existants
 */

import { secureAuthService } from '../src/lib/secure-auth';
import { logger } from '../src/lib/logger';

async function main() {
  console.log('🔐 Migration vers l\'authentification sécurisée...\n');

  try {
    // 1. Initialiser l'authentification sécurisée
    console.log('📋 Étape 1: Initialisation de la configuration sécurisée...');
    secureAuthService.initializeSecureAuth();
    console.log('✅ Configuration sécurisée initialisée\n');

    // 2. Nettoyer les anciens tokens
    console.log('🧹 Étape 2: Nettoyage des tokens legacy...');
    secureAuthService.cleanupLegacyTokens();
    console.log('✅ Tokens legacy nettoyés\n');

    // 3. Valider la migration
    console.log('🔍 Étape 3: Validation de la configuration sécurisée...');
    const isValid = secureAuthService.validateSecureStorage();
    console.log(isValid ? '✅ Configuration sécurisée validée' : '⚠️ Configuration sécurisée invalide');
    console.log('');

    // 4. Exécuter la migration
    console.log('🔄 Étape 4: Migration vers les cookies sécurisés...');
    const migrationSuccess = await secureAuthService.migrateToSecureStorage();

    if (migrationSuccess) {
      console.log('✅ Migration terminée avec succès!\n');

      console.log('🎉 Actions effectuées:');
      console.log('  - Configuration sécurisée initialisée');
      console.log('  - Tokens localStorage supprimés');
      console.log('  - Migration vers cookies httpOnly complétée');
      console.log('  - Session existante préservée (si applicable)');

      console.log('\n🔒 Sécurité améliorée:');
      console.log('  - Protection contre les attaques XSS');
      console.log('  - Tokens stockés dans des cookies httpOnly');
      console.log('  - Configuration de sécurité renforcée');

    } else {
      console.log('❌ La migration a échoué');
      console.log('Vérifiez les logs d\'erreur pour plus de détails');
      process.exit(1);
    }

  } catch (error) {
    logger.error('Erreur lors de la migration:', error);
    console.error('❌ Erreur critique lors de la migration:', error);
    process.exit(1);
  }
}

// Exécuter uniquement si le script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}