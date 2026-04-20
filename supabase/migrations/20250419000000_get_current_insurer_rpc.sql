-- =============================================================================
-- Migration: Create RPC function to get insurer_id from profile
-- Date: 2025-04-19
-- Purpose: Allow insurers to get their insurer_id from their profile
-- =============================================================================

-- Drop existing function if any
DROP FUNCTION IF EXISTS public.get_current_insurer_id();

-- Create function to get insurer_id for current user
CREATE OR REPLACE FUNCTION public.get_current_insurer_id()
RETURNS TABLE(insurer_id uuid, insurer_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ia.insurer_id,
    i.name as insurer_name
  FROM public.insurer_accounts ia
  JOIN public.insurers i ON i.id = ia.insurer_id
  WHERE ia.profile_id = auth.uid()
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_current_insurer_id() TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_current_insurer_id() IS 'Get the insurer_id and insurer_name for the currently authenticated insurer user';
