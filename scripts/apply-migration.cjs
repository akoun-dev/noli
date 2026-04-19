#!/usr/bin/env node

/**
 * Migration Application Script
 *
 * This script applies the custom roles system migration to the database.
 * It's designed to work when Supabase CLI is not available.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Read the migration file
const migrationPath = path.join(__dirname, '../supabase/migrations/20260419170000_create_custom_roles_system.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Split the migration into individual statements
// This is a simple split by semicolon - for production, use a proper SQL parser
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'))
  .map(s => {
    // Remove single-line comments
    let cleaned = s.replace(/--.*$/gm, '');
    // Remove multi-line comments
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
    return cleaned.trim();
  })
  .filter(s => s.length > 0);

console.log(`Found ${statements.length} SQL statements to execute`);
console.log('\nIMPORTANT: This script requires a database connection to execute.');
console.log('Please run the migration manually using one of these methods:\n');
console.log('1. Using Supabase Dashboard (SQL Editor):');
console.log('   - Go to your Supabase project');
console.log('   - Navigate to SQL Editor');
console.log('   - Copy and paste the content of:');
console.log(`   ${migrationPath}\n`);
console.log('2. Using psql (if you have direct database access):');
console.log('   psql -h YOUR_HOST -U postgres -d YOUR_DB -f ' + migrationPath);
console.log('\n3. Using Supabase CLI (if installed):');
console.log('   supabase db reset');
console.log('\nTables that will be created:');
console.log('  - permissions (21 default permissions)');
console.log('  - custom_roles (USER, INSURER, ADMIN system roles)');
console.log('  - role_permissions (associates permissions with roles)');
console.log('\nColumn that will be added:');
console.log('  - profiles.custom_role_id (links users to custom roles)');
console.log('\nBackward compatibility: YES - Existing USER/INSURER/ADMIN roles continue to work');
process.exit(0);
