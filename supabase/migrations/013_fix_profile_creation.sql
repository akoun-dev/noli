-- Fix for profile creation during signup
-- This migration adds a policy to allow profile creation via RPC function

-- Drop existing policies that might block profile creation
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create a new policy that allows profile creation for authenticated users
CREATE POLICY "Users can insert own profile during signup" ON public.profiles FOR INSERT WITH CHECK (
  auth.uid() = id OR 
  (auth.role() = 'authenticated' AND id IS NOT NULL)
);

-- Allow the RPC function to bypass RLS for profile creation
-- This ensures the create_user_profile function can work properly
ALTER FUNCTION create_user_profile SECURITY DEFINER;

-- Grant necessary permissions to the service role for profile creation
GRANT ALL ON public.profiles TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Ensure the RPC function has proper permissions
GRANT EXECUTE ON FUNCTION create_user_profile TO service_role;
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile TO anon;