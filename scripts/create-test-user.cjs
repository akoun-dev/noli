const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.example' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Variables d environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  try {
    console.log('Création utilisateur de test...');
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'test.login@noli.com',
      password: 'NoliTest2024!',
      email_confirm: true,
      user_metadata: {
        first_name: 'Test',
        last_name: 'Login',
        role: 'USER',
        phone: '+225000000000'
      }
    });

    if (error) {
      console.error('Erreur création utilisateur:', error);
      return;
    }

    console.log('Utilisateur créé avec succès:', data.user?.email);
    console.log('ID:', data.user?.id);
    
    // Créer le profile manuellement
    if (data.user?.id) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          first_name: 'Test',
          last_name: 'Login',
          role: 'USER',
          is_active: true,
          email_verified: true,
          phone: '+225000000000',
          phone_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Erreur création profile:', profileError);
      } else {
        console.log('Profile créé avec succès');
      }
    }
    
  } catch (error) {
    console.error('Exception:', error);
  }
}

createTestUser();
