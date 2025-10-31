-- Script pour vérifier et corriger les permissions sur la table profiles
-- Ce script doit être exécuté dans Supabase SQL Editor

-- 1. Vérifier si les RLS sont activés sur la table profiles
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 2. Vérifier les politiques RLS existantes sur la table profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 3. Activer RLS sur la table profiles si ce n'est pas déjà fait
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Créer une politique pour permettre aux utilisateurs de lire leur propre profil
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 5. Créer une politique pour permettre aux utilisateurs de mettre à jour leur propre profil
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 6. Créer une politique pour permettre aux utilisateurs d'insérer leur propre profil
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 7. Créer une politique pour permettre aux administrateurs de gérer tous les profils
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- 8. Donner les permissions nécessaires sur la table profiles
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- 9. Donner les permissions sur les séquences si nécessaire
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 10. Vérifier que l'utilisateur service_role a les permissions nécessaires
GRANT ALL ON public.profiles TO service_role;

-- 11. Créer une fonction pour vérifier si un utilisateur est admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'ADMIN' AND is_active = true
  );
END;
$$;

-- 12. Créer une fonction pour vérifier si un utilisateur est assureur
CREATE OR REPLACE FUNCTION is_insurer(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'INSURER' AND is_active = true
  );
END;
$$;

-- 13. Créer une fonction pour vérifier si un utilisateur peut accéder à un profil
CREATE OR REPLACE FUNCTION can_access_profile(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Un utilisateur peut accéder à son propre profil
  IF auth.uid() = target_user_id THEN
    RETURN true;
  END IF;
  
  -- Les administrateurs peuvent accéder à tous les profils
  IF is_admin(auth.uid()) THEN
    RETURN true;
  END IF;
  
  -- Les assureurs peuvent accéder aux profils des utilisateurs de leurs devis
  IF is_insurer(auth.uid()) THEN
    RETURN EXISTS (
      SELECT 1 FROM public.quotes q
      JOIN public.profiles p ON q.user_id = p.id
      WHERE q.user_id = target_user_id 
      AND EXISTS (
        SELECT 1 FROM public.insurer_accounts ia
        WHERE ia.profile_id = auth.uid()
      )
    );
  END IF;
  
  RETURN false;
END;
$$;

-- 14. Mettre à jour les politiques RLS pour utiliser la nouvelle fonction
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (can_access_profile(id));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (can_access_profile(id));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 15. Créer une politique pour les assureurs
DROP POLICY IF EXISTS "Insurers can manage client profiles" ON public.profiles;
CREATE POLICY "Insurers can manage client profiles" ON public.profiles
  FOR ALL USING (
    is_insurer(auth.uid()) AND 
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.user_id = profiles.id
      AND EXISTS (
        SELECT 1 FROM public.insurer_accounts ia
        WHERE ia.profile_id = auth.uid()
      )
    )
  );

-- 16. Créer une politique pour les administrateurs
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (is_admin(auth.uid()));

-- 17. Afficher un résumé des politiques créées
SELECT 
  'Policies created for profiles table' as status,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 18. Test d'insertion (commenté pour éviter les erreurs)
-- INSERT INTO public.profiles (id, email, first_name, last_name, role, is_active, email_verified, phone_verified)
-- VALUES (
--   gen_random_uuid(),
--   'test@example.com',
--   'Test',
--   'User',
--   'USER',
--   true,
--   true,
--   false
-- );