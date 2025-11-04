#!/usr/bin/env node

/**
 * SCRIPT D'AIDE AUX MIGRATIONS ADMIN
 *
 * Ce script aide à appliquer les migrations SQL pour le module Admin.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.log('   VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅' : '❌');
  console.log('   VITE_SUPABASE_SERVICE_KEY:', process.env.VITE_SUPABASE_SERVICE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkTablesExist() {
  const tables = [
    'audit_logs',
    'system_alerts',
    'system_backups',
    'permissions',
    'roles'
  ];

  console.log('🔍 Vérification des tables existantes...');

  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table}: OK`);
      }
    } catch (err) {
      console.log(`❌ Table ${table}: Erreur ${err.message}`);
    }
  }
}

async function checkFunctionsExist() {
  const functions = [
    'admin_get_platform_stats',
    'get_database_size',
    'get_active_connections'
  ];

  console.log('🔍 Vérification des fonctions RPC...');

  for (const func of functions) {
    try {
      const { error } = await supabase.rpc(func);

      if (error) {
        console.log(`❌ Fonction ${func}: ${error.message}`);
      } else {
        console.log(`✅ Fonction ${func}: OK`);
      }
    } catch (err) {
      console.log(`❌ Fonction ${func}: Erreur ${err.message}`);
    }
  }
}

async function main() {
  console.log('🚀 SCRIPT D\'AIDE AUX MIGRATIONS ADMIN');
  console.log('='.repeat(50));

  await checkTablesExist();
  console.log();
  await checkFunctionsExist();

  console.log('\n📋 INSTRUCTIONS MANUELLES:');
  console.log('='.repeat(50));
  console.log('1. Ouvrez la console Supabase: https://supabase.com/dashboard');
  console.log('2. Allez dans SQL Editor');
  console.log('3. Appliquez les fichiers SQL dans l\'ordre:');
  console.log('   👉 migrations/admin_audit_tables.sql');
  console.log('   👉 migrations/admin_rpc_functions.sql');
  console.log('4. Relancez les tests: npm run admin:test');
}

main().catch(console.error);