-- Remove the public profile display policy that allows anyone to view all profiles
-- This policy was exposing user display names, author names, avatar URLs, account creation dates, 
-- last login times, and suspension status to anonymous users
DROP POLICY IF EXISTS "Public profile display" ON public.profiles;

-- After this change, only the following policies remain:
-- 1. "Users can view own profile" - allows users to view their own profile data
-- 2. "Admins can view all profiles" - allows admins to view all user profiles
-- This restricts profile data access to authenticated users viewing their own data or admins