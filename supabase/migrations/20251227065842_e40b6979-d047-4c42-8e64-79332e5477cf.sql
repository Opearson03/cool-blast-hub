-- Fix infinite recursion in profiles RLS
-- The issue is that profiles RLS policies reference profiles table, causing recursion

-- Create a security definer function to get the user's business_id without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_business_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id FROM public.profiles WHERE id = _user_id LIMIT 1
$$;

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles in their business" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own full profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Recreate with non-recursive approach
-- Users can always view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

-- Admins can view all profiles in their business (using security definer function)
CREATE POLICY "Admins can view business profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin') AND 
  business_id = get_user_business_id(auth.uid())
);

-- Staff can view limited profile info of colleagues (using security definer function)
CREATE POLICY "Staff can view team profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'staff') AND
  business_id = get_user_business_id(auth.uid())
);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid());

-- Admins can update all profiles in their business
CREATE POLICY "Admins can update business profiles"
ON public.profiles
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') AND 
  business_id = get_user_business_id(auth.uid())
);