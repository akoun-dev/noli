-- =============================================================================
-- Migration: Apply insurer fix to existing data
-- Date: 2025-12-05
-- Purpose: Run the fix_existing_insurer_profiles function to create
--          missing insurer entries for existing insurer profiles
-- =============================================================================

-- Apply the fix to existing insurer profiles
SELECT * FROM public.fix_existing_insurer_profiles();

-- Create a view to verify the fix
CREATE OR REPLACE VIEW public.insurer_sync_status AS
SELECT 
    p.id as profile_id,
    p.email,
    p.company_name,
    p.created_at as profile_created_at,
    ia.insurer_id,
    i.name as insurer_name,
    i.created_at as insurer_created_at,
    CASE 
        WHEN ia.insurer_id IS NOT NULL THEN 'Synced'
        ELSE 'Missing insurer entry'
    END as sync_status
FROM public.profiles p
LEFT JOIN public.insurer_accounts ia ON p.id = ia.profile_id
LEFT JOIN public.insurers i ON ia.insurer_id = i.id
WHERE p.role = 'INSURER'
ORDER BY p.created_at DESC;

GRANT SELECT ON public.insurer_sync_status TO authenticated;