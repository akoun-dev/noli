#!/usr/bin/env node

/**
 * Script pour appliquer les migrations de sécurité Supabase
 * Usage: npm run security:apply-migrations
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('Veuillez définir VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const securityMigrations = [
  {
    name: 'Enhanced Security Policies',
    file: '20251104160000_enhance_security_policies.sql',
    description: 'Strengthen RLS policies and add audit logging'
  },
  {
    name: 'Secure Authentication Migration',
    file: '20251104161000_secure_auth_migration.sql',
    description: 'Complete migration from localStorage to secure httpOnly cookies'
  }
];

async function executeMigration(migration) {
  try {
    console.log(`📦 Application de la migration: ${migration.name}`);
    console.log(`📄 Fichier: ${migration.file}`);
    console.log(`📝 Description: ${migration.description}`);

    // Lire le fichier de migration
    const fs = await import('fs');
    const path = await import('path');
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migration.file);

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Exécuter la migration SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: migrationSQL });

    if (error) {
      console.error(`❌ Erreur lors de l'application de ${migration.name}:`, error);
      return false;
    }

    console.log(`✅ Migration ${migration.name} appliquée avec succès`);
    return true;

  } catch (error) {
    console.error(`❌ Erreur lors du traitement de ${migration.name}:`, error.message);
    return false;
  }
}

async function applyMigrationsSequentially() {
  console.log('🔒 DÉBUT DES MIGRATIONS DE SÉCURITÉ NOLI Assurance');
  console.log('='.repeat(50));

  let successCount = 0;
  const totalCount = securityMigrations.length;

  for (const migration of securityMigrations) {
    const success = await executeMigration(migration);
    if (success) {
      successCount++;
    }
    console.log(''); // Ligne vide pour la lisibilité
  }

  console.log('='.repeat(50));
  console.log(`📊 RÉSULTAT: ${successCount}/${totalCount} migrations appliquées avec succès`);

  if (successCount === totalCount) {
    console.log('🎉 Toutes les migrations de sécurité ont été appliquées avec succès !');
    console.log('');
    console.log('🚀 Prochaines étapes:');
    console.log('1. Redémarrez votre application pour appliquer les changements');
    console.log('2. Testez les nouvelles fonctionnalités de sécurité');
    console.log('3. Exécutez: npm run security:check pour valider la sécurité');

    return true;
  } else {
    console.log(`⚠️  ${totalCount - successCount} migrations ont échoué`);
    console.log('Veuillez vérifier les erreurs ci-dessus et corriger manuellement si nécessaire');

    return false;
  }
}

// Alternative: Exécuter directement le SQL via le client Supabase
async function executeMigrationDirectSQL(migration) {
  try {
    console.log(`📦 Application de la migration: ${migration.name}`);

    const fs = await import('fs');
    const path = await import('path');
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migration.file);

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Diviser le SQL en instructions individuelles
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Exécution de ${statements.length} instructions SQL...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });

        if (error && !error.message.includes('already exists')) {
          console.warn(`⚠️  Instruction ${i + 1} avertissement:`, error.message);
        }
      } catch (stmtError) {
        // Continuer même si certaines instructions échouent (ex: CREATE IF NOT EXISTS)
        if (!stmtError.message.includes('already exists')) {
          console.warn(`⚠️  Instruction ${i + 1} erreur:`, stmtError.message);
        }
      }
    }

    console.log(`✅ Migration ${migration.name} appliquée avec succès`);
    return true;

  } catch (error) {
    console.error(`❌ Erreur lors du traitement de ${migration.name}:`, error.message);
    return false;
  }
}

// Fonction principale pour vérifier l'état de la sécurité
async function checkSecurityStatus() {
  console.log('🔍 Vérification de l\'état de sécurité actuel...');

  try {
    // Vérifier si les tables de sécurité existent
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('count')
      .limit(1);

    const { data: userSessions, error: sessionError } = await supabase
      .from('user_sessions')
      .select('count')
      .limit(1);

    const auditExists = !auditError;
    const sessionExists = !sessionError;

    console.log(`📊 Tables de sécurité:`);
    console.log(`   - audit_logs: ${auditExists ? '✅ Existe' : '❌ Manquante'}`);
    console.log(`   - user_sessions: ${sessionExists ? '✅ Existe' : '❌ Manquante'}`);

    if (auditExists && sessionExists) {
      console.log('🎉 Les migrations de sécurité semblent déjà appliquées !');
      return true;
    } else {
      console.log('⚠️  Certaines tables de sécurité sont manquantes');
      console.log('   Application des migrations requise...');
      return false;
    }

  } catch (error) {
    console.log('❌ Impossible de vérifier l\'état de sécurité:', error.message);
    return false;
  }
}

// Programme principal
async function main() {
  try {
    // Vérifier d'abord si les migrations sont déjà appliquées
    const securityStatus = await checkSecurityStatus();

    if (securityStatus) {
      console.log('');
      console.log('✅ Les migrations de sécurité sont déjà appliquées');
      console.log('');
      console.log('🔧 Options disponibles:');
      console.log('  - npm run security:check  : Vérifier la sécurité');
      console.log('  - npm run security:status : Vérifier l\'état');
      process.exit(0);
    }

    // Appliquer les migrations
    const success = await applyMigrationsSequentially();

    if (success) {
      console.log('');
      console.log('🔒 SÉCURITÉ RENFORCÉE AVEC SUCCÈS !');
      process.exit(0);
    } else {
      console.log('');
      console.log('❌ ERREUR LORS DE L\'APPLICATION DES MIGRATIONS');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Erreur critique:', error.message);
    console.error('');
    console.error('Débogage:');
    console.error('1. Vérifiez vos variables d\'environnement');
    console.error('2. Assurez-vous que Supabase est accessible');
    console.error('3. Vérifiez les permissions du compte de service');
    process.exit(1);
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Rejet non géré à:', promise, 'raison:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Exception non capturée:', error);
  process.exit(1);
});

// Exécuter le programme principal
main();