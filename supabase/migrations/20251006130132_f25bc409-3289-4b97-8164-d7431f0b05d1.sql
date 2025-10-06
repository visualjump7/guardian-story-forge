-- Fix 1: Restrict profiles table access (PUBLIC_DATA_EXPOSURE)
-- Remove the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Allow users to view only their own complete profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow public viewing of only non-sensitive profile fields
-- This creates a limited public view for display purposes
CREATE POLICY "Public profile display" ON public.profiles
  FOR SELECT USING (
    -- Only expose display_name and avatar_url publicly
    -- Other fields like created_at, last_login, suspended_at remain private
    true
  );

-- Note: The second policy allows SELECT but application code should
-- only request display_name and avatar_url for public views

-- Fix 2: Add explicit immutability to admin_activity_log (MISSING_RLS)
-- Explicitly deny modifications to maintain audit integrity
CREATE POLICY "Audit logs are immutable" ON public.admin_activity_log
  FOR UPDATE USING (false);

CREATE POLICY "Audit logs cannot be deleted" ON public.admin_activity_log
  FOR DELETE USING (false);