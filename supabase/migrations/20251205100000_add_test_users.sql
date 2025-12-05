-- =============================================================================
-- Migration: Add test users for development
-- Date: 2025-12-05
-- Purpose: Add sample users for testing authentication
-- =============================================================================

-- Check if we have any users first
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM auth.users;

    IF user_count = 0 THEN
        -- Create test users (these will be created in auth.users by Supabase Auth)
        -- Note: These are placeholders - actual users need to be created via signup
        -- We'll create profiles for potential test users
        INSERT INTO public.profiles (id, email, full_name, company_name, role, is_active, created_at, updated_at) VALUES
          (
            gen_random_uuid(),
            'admin@noli.ci',
            'Admin NOLI',
            'NOLI Assurance',
            'ADMIN',
            true,
            NOW(),
            NOW()
          ),
          (
            gen_random_uuid(),
            'test.insurer@noli.ci',
            'Test Insurer',
            'Assurance Test CI',
            'INSURER',
            true,
            NOW(),
            NOW()
          ),
          (
            gen_random_uuid(),
            'test.user@noli.ci',
            'Test User',
            NULL,
            'USER',
            true,
            NOW(),
            NOW()
          );

        RAISE NOTICE 'Created 3 test profiles for authentication';

        -- Also create insurer account for the test insurer
        INSERT INTO public.insurers (id, name, description, contact_email, phone, website, is_active, created_at, updated_at)
        VALUES
          (
            gen_random_uuid(),
            'Assurance Test CI',
            'Compagnie de test pour le développement',
            'test.insurer@noli.ci',
            '+225 00 00 00 00',
            'https://test.noli.ci',
            true,
            NOW(),
            NOW()
          );

        -- Link insurer profile to insurer company
        INSERT INTO public.insurer_accounts (profile_id, insurer_id, created_at, updated_at)
        SELECT
            p.id as profile_id,
            i.id as insurer_id,
            NOW() as created_at,
            NOW() as updated_at
        FROM public.profiles p
        JOIN public.insurers i ON i.contact_email = p.email
        WHERE p.email = 'test.insurer@noli.ci';

        RAISE NOTICE 'Created test insurer company and linked to profile';
    ELSE
        RAISE NOTICE 'Found % existing users in auth.users', user_count;
    END IF;
END $$;

-- Show current users in auth.users (for verification)
-- Note: This query will show 0 rows in migration since auth.users is managed by Supabase Auth
SELECT 'Auth users must be created via signup or Supabase Studio' as info;