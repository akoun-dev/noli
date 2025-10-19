// Script pour tester l'authentification des utilisateurs
import { createClient } from '@supabase/supabase-js'

// Configuration Supabase
const supabaseUrl = 'https://brznmveoycrwlyksffvh.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyem5tdmVveWNyd2x5a3NmZnZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1ODI4MDAsImV4cCI6MjA1MzE1ODgwMH0.-3xLl3T2Q7YlW3X7xYjYhYhYhYhYhYhYhYhYhYhYhYhY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testUsers() {
  console.log("=== TEST D'AUTHENTIFICATION DES UTILISATEURS ===\n")

  const testUsers = [
    { email: 'user@noli.com', password: 'password123', role: 'USER' },
    { email: 'assureur@noli.com', password: 'password123', role: 'INSURER' },
    { email: 'admin@noli.com', password: 'password123', role: 'ADMIN' },
  ]

  for (const user of testUsers) {
    console.log(`Test de l'utilisateur: ${user.email} (${user.role})`)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password,
      })

      if (error) {
        console.error(`❌ Erreur: ${error.message}`)
      } else {
        console.log(`✅ Connexion réussie pour ${user.email}`)
        console.log(`   ID: ${data.user?.id}`)
        console.log(`   Rôle: ${data.user?.user_metadata?.role}`)

        // Déconnexion pour le prochain test
        await supabase.auth.signOut()
      }
    } catch (err) {
      console.error(`❌ Erreur inattendue: ${err.message}`)
    }

    console.log('')
  }

  console.log('=== TEST TERMINÉ ===')
}

testUsers().catch(console.error)
