-- Seed data
-- Insertion des données initiales pour le système

-- Catégories d'assurance
INSERT INTO public.insurance_categories (name, description) VALUES
('Auto', 'Assurance automobile pour véhicules particuliers'),
('Moto', 'Assurance pour motocyclettes et scooters'),
('Habitation', 'Assurance habitation et biens personnels'),
('Santé', 'Assurance santé et mutuelle'),
('Voyage', 'Assurance voyage et assistance'),
('Responsabilité Civile', 'Assurance responsabilité civile professionnelle'),
('Décès', 'Assurance vie et décès')
ON CONFLICT (name) DO NOTHING;

-- Utilisateurs standards (USER)
DO $$
DECLARE
  user_emails TEXT[] := ARRAY[
    'jean.konan@noli.com',
    'marie.toure@noli.com',
    'kouakou.bamba@noli.com',
    'yao.serge@noli.com',
    'kouadio.aisha@noli.com',
    'mamdou.toure@noli.com',
    'test.user@noli.com'
  ];
  user_first_names TEXT[] := ARRAY['Jean', 'Marie', 'Kouakou', 'Yao', 'Aisha', 'Mamadou', 'Test'];
  user_last_names TEXT[] := ARRAY['Konan', 'Touré', 'Bamba', 'Serge', 'Kouadio', 'Konan', 'User'];
  user_phones TEXT[] := ARRAY['+2250789012345', '+2250778901234', '+2250767890123', '+2250745210147', '+2250507123456', '+2250788987654', '+2250999999999'];
  i INTEGER;
BEGIN
  FOR i IN 1..array_length(user_emails, 1) LOOP
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      phone,
      phone_confirmed_at,
      raw_user_meta_data,
      raw_app_meta_data,
      created_at,
      updated_at,
      last_sign_in_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      user_emails[i],
      'NoliTest2024!',
      NOW(),
      user_phones[i],
      CASE WHEN i IN (2, 3, 4, 5) THEN NOW() ELSE NULL END,
      jsonb_build_object(
        'first_name', user_first_names[i],
        'last_name', user_last_names[i],
        'role', 'USER',
        'phone', user_phones[i]
      ),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      NOW(),
      NOW(),
      NOW()
    );
  END LOOP;
END $$;

-- Assureurs (INSURER)
DO $$
DECLARE
  insurer_emails TEXT[] := ARRAY['contact@assurauto.ci', 'admin@sunuassurance.ci', 'commercial@nsia.ci', 'contact@sonafer.ci', 'contact@sga.ci.com', 'contact@allianz.ci'];
  insurer_companies TEXT[] := ARRAY['AssurAuto CI', 'Sunu Assurance CI', 'NSIA Banque Assurance', 'Sonafer CI', 'SGA Assurances', 'Allianz CI'];
  insurer_phones TEXT[] := ARRAY['+22527201234', '+225212345678', '+225202123456', '+2252720345678', '+2252120456789', '+2252034567890'];
  i INTEGER;
BEGIN
  FOR i IN 1..array_length(insurer_emails, 1) LOOP
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      phone,
      phone_confirmed_at,
      raw_user_meta_data,
      raw_app_meta_data,
      created_at,
      updated_at,
      last_sign_in_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      insurer_emails[i],
      'NoliTest2024!',
      NOW(),
      insurer_phones[i],
      NOW(),
      jsonb_build_object(
        'first_name', insurer_companies[i],
        'last_name', 'Contact',
        'role', 'INSURER',
        'phone', insurer_phones[i],
        'company', insurer_companies[i]
      ),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      NOW(),
      NOW(),
      NOW()
    );
  END LOOP;
END $$;

-- Administrateurs (ADMIN)
DO $$
DECLARE
  admin_emails TEXT[] := ARRAY['admin@noliassurance.com', 'super.admin@noliassurance.com', 'admin.tech@noliassurance.com'];
  admin_names TEXT[] := ARRAY['Admin Principal', 'Super Administrateur', 'Admin Technique'];
  admin_phones TEXT[] := ARRAY['+2250707070707', '+2250101010101', '+2250202020202'];
  i INTEGER;
BEGIN
  FOR i IN 1..array_length(admin_emails, 1) LOOP
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      phone,
      phone_confirmed_at,
      raw_user_meta_data,
      raw_app_meta_data,
      created_at,
      updated_at,
      last_sign_in_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      admin_emails[i],
      'NoliTest2024!',
      NOW(),
      admin_phones[i],
      NOW(),
      jsonb_build_object(
        'first_name', SPLIT_PART(admin_names[i], ' ', 1),
        'last_name', SPLIT_PART(admin_names[i], ' ', 2),
        'role', 'ADMIN',
        'phone', admin_phones[i],
        'company', 'NOLI Assurance'
      ),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      NOW(),
      NOW(),
      NOW()
    );
  END LOOP;
END $$;

-- Créer les assureurs dans la table insurers
INSERT INTO public.insurers (profile_id, company_name, registration_number, rating, is_active)
SELECT
  p.id,
  p.company_name,
  'REG' || EXTRACT(YEAR FROM NOW()) || LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0') || LPAD(row_number() OVER ()::TEXT, 4, '0'),
  CASE
    WHEN row_number() OVER () <= 2 THEN 5
    WHEN row_number() OVER () <= 4 THEN 4
    ELSE 3
  END,
  true
FROM public.profiles p
WHERE p.role = 'INSURER';

-- Créer quelques offres d'assurance pour chaque assureur
DO $$
DECLARE
  insurer_record RECORD;
BEGIN
  FOR insurer_record IN SELECT * FROM public.insurers LOOP
    INSERT INTO public.insurance_offers (insurer_id, category_id, name, description, premium_amount, coverage_amount, deductible, is_active)
    SELECT
      insurer_record.id,
      ic.id,
      insurer_record.company_name || ' - ' || ic.name,
      'Offre ' || ic.name || ' par ' || insurer_record.company_name,
      CASE ic.name
        WHEN 'Auto' THEN 50000
        WHEN 'Moto' THEN 25000
        WHEN 'Habitation' THEN 30000
        WHEN 'Santé' THEN 80000
        ELSE 40000
      END,
      CASE ic.name
        WHEN 'Auto' THEN 5000000
        WHEN 'Moto' THEN 2000000
        WHEN 'Habitation' THEN 10000000
        WHEN 'Santé' THEN 20000000
        ELSE 5000000
      END,
      CASE ic.name
        WHEN 'Auto' THEN 50000
        WHEN 'Moto' THEN 25000
        WHEN 'Habitation' THEN 100000
        WHEN 'Santé' THEN 200000
        ELSE 75000
      END,
      true
    FROM public.insurance_categories ic
    WHERE ic.name IN ('Auto', 'Moto', 'Habitation', 'Santé')
    LIMIT 3;
  END LOOP;
END $$;

-- Mettre à jour la colonne updated_at pour tous les enregistrements
UPDATE public.profiles SET updated_at = NOW();
UPDATE public.insurance_categories SET updated_at = NOW();
UPDATE public.insurers SET updated_at = NOW();
UPDATE public.insurance_offers SET updated_at = NOW();

DO $$
BEGIN
  RAISE NOTICE '=== DONNÉES DE SEED INSÉRÉES ===';
  RAISE NOTICE '✅ 7 catégories d''assurance créées';
  RAISE NOTICE '✅ 7 utilisateurs standards créés';
  RAISE NOTICE '✅ 6 assureurs créés';
  RAISE NOTICE '✅ 3 administrateurs créés';
  RAISE NOTICE '✅ Offres d''assurance créées pour chaque assureur';
  RAISE NOTICE '';
  RAISE NOTICE '=== COMPTES DE TEST DISPONIBLES ===';
  RAISE NOTICE 'Mot de passe universel: NoliTest2024!';
  RAISE NOTICE '';
  RAISE NOTICE 'Utilisateurs standards:';
  RAISE NOTICE '- jean.konan@noli.com';
  RAISE NOTICE '- marie.toure@noli.com';
  RAISE NOTICE '- kouakou.bamba@noli.com';
  RAISE NOTICE '';
  RAISE NOTICE 'Assureurs:';
  RAISE NOTICE '- contact@assurauto.ci';
  RAISE NOTICE '- admin@sunuassurance.ci';
  RAISE NOTICE '';
  RAISE NOTICE 'Administrateurs:';
  RAISE NOTICE '- admin@noliassurance.com';
  RAISE NOTICE '- super.admin@noliassurance.com';
END $$;