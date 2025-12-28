-- ============================================================================
-- Trigger: Sync role from profiles to auth.users.raw_user_meta_data
-- ============================================================================
-- Purpose: Automatically synchronize the role from public.profiles to
--          auth.users.raw_user_meta_data whenever it changes in the profiles table.
--          This ensures the role is always consistent across the application.
--
-- Note: Supabase stores user metadata in raw_user_meta_data column.
-- The client SDK exposes this via user.user_metadata property.
-- ============================================================================

-- Drop the function if it exists (for idempotency)
DROP FUNCTION IF EXISTS public.sync_profile_role_to_auth_metadata() CASCADE;

-- Create the function to sync role from profile to auth metadata
CREATE OR REPLACE FUNCTION public.sync_profile_role_to_auth_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if role has changed
  IF (TG_OP = 'INSERT') OR (OLD.role IS DISTINCT FROM NEW.role) THEN

    -- Update the raw_user_meta_data in auth.users to keep role in sync
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{role}',
      to_jsonb(NEW.role::text)
    ),
    updated_at = NOW()
    WHERE id = NEW.id;

    -- Log the sync for audit purposes
    RAISE NOTICE 'Role synced for user %: % → %', NEW.id, COALESCE(OLD.role, 'NULL'), NEW.role;

  END IF;

  -- Return the appropriate row based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the operation
    RAISE WARNING 'Failed to sync role to auth metadata for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

-- ============================================================================
-- Create Triggers
-- ============================================================================

-- Drop triggers if they exist (for idempotency)
DROP TRIGGER IF EXISTS on_profile_role_change ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_insert ON public.profiles;

-- Create trigger for UPDATE operations on profiles.role
CREATE TRIGGER on_profile_role_change
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_role_to_auth_metadata();

-- Create trigger for INSERT operations on profiles
CREATE TRIGGER on_profile_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_role_to_auth_metadata();

-- ============================================================================
-- Add comment for documentation
-- ============================================================================

COMMENT ON FUNCTION public.sync_profile_role_to_auth_metadata() IS
'Synchronizes the role column from public.profiles to auth.users.raw_user_meta_data.
This trigger ensures that whenever a role is updated in the profiles table,
it is automatically reflected in the auth metadata, keeping the application
state consistent without requiring manual API calls.';

COMMENT ON TRIGGER on_profile_role_change ON public.profiles IS
'Triggers role sync to auth metadata when the role column is updated';

COMMENT ON TRIGGER on_profile_insert ON public.profiles IS
'Triggers role sync to auth metadata when a new profile is created';

-- ============================================================================
-- Initial Sync: Update existing users whose metadata is out of sync
-- ============================================================================

-- Update all existing auth users whose role in metadata differs from profiles
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  to_jsonb(p.role::text)
),
updated_at = NOW()
FROM public.profiles p
WHERE auth.users.id = p.id
  AND (auth.users.raw_user_meta_data->>'role' IS DISTINCT FROM p.role::text
       OR auth.users.raw_user_meta_data->>'role' IS NULL);

-- Log how many users were synced
DO $$
DECLARE
  synced_count integer;
BEGIN
  SELECT COUNT(*) INTO synced_count
  FROM public.profiles p
  INNER JOIN auth.users au ON au.id = p.id
  WHERE au.raw_user_meta_data->>'role' IS DISTINCT FROM p.role::text
     OR (au.raw_user_meta_data->>'role' IS NULL AND p.role IS NOT NULL);

  IF synced_count > 0 THEN
    RAISE NOTICE 'Initial sync completed: % users had their role metadata updated', synced_count;
  ELSE
    RAISE NOTICE 'Initial sync: All users already have consistent role metadata';
  END IF;
END $$;
