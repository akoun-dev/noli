-- Créer des utilisateurs de test avec la méthode Supabase
-- Supprimer d'abord les utilisateurs existants pour éviter les conflits

DELETE FROM auth.users WHERE email IN ('admin@noli.com', 'user@noli.com', 'insurer@noli.com');

-- Créer les utilisateurs avec signup (cela va automatiquement hasher le password)
-- Note: Cette approche utilise la méthode signup de Supabase

-- 1. Créer l'administrateur
SELECT auth.sign_up(
  'admin@noli.com',
  'NoliTest2024!',
  jsonb_build_object(
    'first_name', 'Admin',
    'last_name', 'Système',
    'role', 'ADMIN',
    'is_active', true
  )
);

-- 2. Créer l'utilisateur test
SELECT auth.sign_up(
  'user@noli.com',
  'NoliTest2024!',
  jsonb_build_object(
    'first_name', 'Utilisateur',
    'last_name', 'Test',
    'role', 'USER',
    'is_active', true
  )
);

-- 3. Créer l'assureur test
SELECT auth.sign_up(
  'insurer@noli.com',
  'NoliTest2024!',
  jsonb_build_object(
    'first_name', 'Assureur',
    'last_name', 'Test',
    'role', 'INSURER',
    'is_active', true
  )
);

-- Mettre à jour manuellement les profils si nécessaire
UPDATE public.profiles SET
  email_verified = true,
  updated_at = NOW()
WHERE email IN ('admin@noli.com', 'user@noli.com', 'insurer@noli.com');

RAISE NOTICE '✅ Utilisateurs créés avec succès!';
RAISE NOTICE '📋 Comptes disponibles:';
RAISE NOTICE '🔹 ADMIN: admin@noli.com / NoliTest2024!';
RAISE NOTICE '🔹 USER:  user@noli.com / NoliTest2024!';
RAISE NOTICE '🔹 INSURER: insurer@noli.com / NoliTest2024!';