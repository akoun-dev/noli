#!/usr/bin/env node

/**
 * Script pour créer des comptes utilisateurs de test
 * Ce script utilise l'API Supabase pour créer des utilisateurs authentifiés
 */

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://bcrixajuomtbfjvtgubb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjcml4YWp1b210YmZqdnRndWJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM0NDk1NywiZXhwIjoyMDc1OTIwOTU3fQ.Luqob9FdszoUSCKd7zy-9pTfDGYzJb-dzvFmrv8L6G4'; // À remplacer avec la clé service_role

// Utilisateurs de test à créer
const testUsers = [
  {
    email: 'admin@noli.com',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'Noli',
    role: 'ADMIN',
    metadata: {
      company: 'Noli',
      phone: '+33612345678'
    }
  },
  {
    email: 'assureur1@noli.com',
    password: 'Assureur123!',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'INSURER',
    metadata: {
      company: 'AssurPro',
      phone: '+33612345679',
      license: 'INS-001'
    }
  },
  {
    email: 'assureur2@noli.com',
    password: 'Assureur123!',
    firstName: 'Marie',
    lastName: 'Martin',
    role: 'INSURER',
    metadata: {
      company: 'SecuHome',
      phone: '+33612345680',
      license: 'INS-002'
    }
  },
  {
    email: 'user1@noli.com',
    password: 'User123!',
    firstName: 'Pierre',
    lastName: 'Durand',
    role: 'USER',
    metadata: {
      phone: '+33612345681',
      birth_date: '1985-05-15'
    }
  },
  {
    email: 'user2@noli.com',
    password: 'User123!',
    firstName: 'Sophie',
    lastName: 'Petit',
    role: 'USER',
    metadata: {
      phone: '+33612345682',
      birth_date: '1990-12-20'
    }
  }
];

async function createTestUsers() {
  console.log('🚀 Création des comptes utilisateurs de test...\n');

  // Initialiser le client Supabase avec la clé service_role
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  for (const user of testUsers) {
    try {
      console.log(`📧 Création du compte: ${user.email}`);

      // Créer l'utilisateur dans auth.users
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          first_name: user.firstName,
          last_name: user.lastName,
          role: user.role,
          ...user.metadata
        },
        app_metadata: {
          provider: 'email',
          role: user.role
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`   ✅ L'utilisateur ${user.email} existe déjà`);
        } else {
          console.error(`   ❌ Erreur lors de la création de ${user.email}:`, authError.message);
        }
        continue;
      }

      console.log(`   ✅ Utilisateur ${user.email} créé avec succès (ID: ${authData.user.id})`);

      // Attendre un peu pour éviter les limites de rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`   ❌ Erreur inattendue pour ${user.email}:`, error.message);
    }
  }

  console.log('\n🎉 Création des utilisateurs terminée!');
  console.log('\n📋 Résumé des comptes créés:');
  testUsers.forEach(user => {
    console.log(`   • ${user.email} - Rôle: ${user.role}`);
  });
  console.log('\n🔑 Tous les mots de passe sont: User123! ou Assureur123! ou Admin123!');
  console.log('\n⚠️  Note: Les utilisateurs sont créés avec email_confirm=true');
}

// Vérifier si la clé service_role est configurée
if (supabaseServiceKey === 'VOTRE_SERVICE_ROLE_KEY') {
  console.error('❌ Veuillez configurer la clé service_role dans le script');
  console.log('\n📖 Pour obtenir la clé service_role:');
  console.log('1. Allez sur https://supabase.com/dashboard/project/bcrixajuomtbfjvtgubb');
  console.log('2. Settings → API');
  console.log('3. Copiez la "service_role" key');
  console.log('4. Modifiez ce script et remplacez VOTRE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Exécuter le script
createTestUsers().catch(console.error);