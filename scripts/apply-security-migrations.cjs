#!/usr/bin/env node

/**
 * Script pour appliquer les migrations de sécurité Supabase (version CommonJS)
 * Usage: npm run security:apply-migrations
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

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
  },
  {
    name: 'Admin Audit Enhancements',
    file: '20251104162000_admin_audit_enhancements.sql',
    description: 'Complete audit logging system for admin operations'
  },
  {
    name: 'Admin RPC Functions',
    file: '20251104163000_admin_rpc_functions.sql',
    description: 'Enhanced RPC functions for admin operations with security'
  }
];

async function executeMigrationFile(migration) {
  try {
    console.log(`📦 Application de la migration: ${migration.name}`);
    console.log(`📄 Fichier: ${migration.file}`);
    console.log(`📝 Description: ${migration.description}`);

    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migration.file);

    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Fichier de migration introuvable: ${migrationPath}`);
      return false;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Exécuter la migration SQL via Supabase SQL client
    // Note: Ceci est une simulation. En production, vous devriez utiliser
    // les vraies commandes Supabase CLI: supabase db push
    console.log(`📝 Migration lue (${migrationSQL.length} caractères)`);
    console.log(`⚠️  Note: En production, utilisez 'supabase db push' pour appliquer les migrations`);

    // Simulation d'exécution réussie
    console.log(`✅ Migration ${migration.name} lue avec succès`);
    return true;

  } catch (error) {
    console.error(`❌ Erreur lors du traitement de ${migration.name}:`, error.message);
    return false;
  }
}

async function validateMigrationFiles() {
  console.log('🔍 Validation des fichiers de migration...');

  let allValid = true;

  for (const migration of securityMigrations) {
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migration.file);

    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Fichier manquant: ${migration.file}`);
      allValid = false;
    } else {
      const stats = fs.statSync(migrationPath);
      console.log(`✅ ${migration.file} (${stats.size} bytes)`);
    }
  }

  return allValid;
}

async function main() {
  console.log('🔒 DÉBUT DES MIGRATIONS DE SÉCURITÉ NOLI Assurance');
  console.log('='.repeat(60));

  // Valider d'abord les fichiers
  const filesValid = await validateMigrationFiles();

  if (!filesValid) {
    console.log('');
    console.log('❌ Certains fichiers de migration sont manquants');
    process.exit(1);
  }

  let successCount = 0;
  const totalCount = securityMigrations.length;

  for (const migration of securityMigrations) {
    const success = await executeMigrationFile(migration);
    if (success) {
      successCount++;
    }
    console.log(''); // Ligne vide pour la lisibilité
  }

  console.log('='.repeat(60));
  console.log(`📊 RÉSULTAT: ${successCount}/${totalCount} migrations validées avec succès`);

  if (successCount === totalCount) {
    console.log('🎉 Toutes les migrations de sécurité sont prêtes !');
    console.log('');
    console.log('🚀 Prochaines étapes REQUISES:');
    console.log('1. Appliquez les migrations avec: supabase db push');
    console.log('2. Ou via le dashboard Supabase: copiez/collez le contenu SQL');
    console.log('3. Testez les nouvelles fonctionnalités de sécurité');
    console.log('4. Exécutez: npm run security:check pour valider la sécurité');

    return true;
  } else {
    console.log(`⚠️  ${totalCount - successCount} migrations ont des problèmes`);
    console.log('Veuillez vérifier les erreurs ci-dessus');

    return false;
  }
}

// Gestion des erreurs
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Rejet non géré:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Exception non capturée:', error);
  process.exit(1);
});

// Exécuter le programme principal
main().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Erreur critique:', error);
  process.exit(1);
});