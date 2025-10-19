-- Create missing profiles for existing users
-- Créer les profiles manquants pour les utilisateurs existants

-- Insérer les profiles pour tous les utilisateurs existants
INSERT INTO public.profiles (
  id,
  email,
  first_name,
  last_name,
  company_name,
  phone,
  role,
  is_active,
  email_verified,
  phone_verified,
  avatar_url,
  created_at,
  updated_at
)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'first_name', ''),
  COALESCE(u.raw_user_meta_data->>'last_name', ''),
  COALESCE(u.raw_user_meta_data->>'company', ''),
  COALESCE(u.raw_user_meta_data->>'phone', u.phone),
  COALESCE(u.raw_user_meta_data->>'role', 'USER'),
  true,
  u.email_confirmed_at IS NOT NULL,
  u.phone_confirmed_at IS NOT NULL,
  COALESCE(u.raw_user_meta_data->>'avatar_url', ''),
  u.created_at,
  u.updated_at
FROM auth.users u
WHERE (u.email LIKE '%@noli.com' OR u.email LIKE '%.ci')
AND NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  company_name = EXCLUDED.company_name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  email_verified = EXCLUDED.email_verified,
  phone_verified = EXCLUDED.phone_verified,
  avatar_url = EXCLUDED.avatar_url,
  updated_at = NOW();

-- Créer les assureurs dans la table insurers pour les utilisateurs de type INSURER
INSERT INTO public.insurers (
  profile_id,
  company_name,
  registration_number,
  license_number,
  address,
  website,
  rating,
  logo_url,
  is_active,
  created_at,
  updated_at
)
SELECT 
  p.id,
  p.company_name,
  'REG' || EXTRACT(YEAR FROM NOW()) || LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0') || LPAD(row_number() OVER ()::TEXT, 4, '0'),
  'LIC' || EXTRACT(YEAR FROM NOW()) || LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0') || LPAD(row_number() OVER ()::TEXT, 4, '0'),
  'Adresse de ' || p.company_name,
  'https://' || REPLACE(REPLACE(p.company_name, ' ', ''), 'CI', 'ci') || '.ci',
  CASE
    WHEN row_number() OVER () <= 2 THEN 5
    WHEN row_number() OVER () <= 4 THEN 4
    ELSE 3
  END,
  NULL,
  true,
  NOW(),
  NOW()
FROM public.profiles p
WHERE p.role = 'INSURER'
AND NOT EXISTS (
  SELECT 1 FROM public.insurers i WHERE i.profile_id = p.id
);

DO $$
BEGIN
  RAISE NOTICE '=== PROFILES MANQUANTS CRÉÉS ===';
  RAISE NOTICE '✅ Profiles créés pour tous les utilisateurs existants';
  RAISE NOTICE '✅ Assureurs créés dans la table insurers';
  RAISE NOTICE '✅ Trigger handle_new_user fonctionnera maintenant correctement';
END $$;
