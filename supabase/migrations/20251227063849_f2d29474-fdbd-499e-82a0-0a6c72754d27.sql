-- ============================================
-- PHASE 1: CRITICAL SECURITY FIXES
-- ============================================

-- 1. Fix SWMS Signoff Policy - Users can only sign for themselves
DROP POLICY IF EXISTS "Users can sign swms" ON public.swms_signoffs;

CREATE POLICY "Users can only sign for themselves" 
ON public.swms_signoffs 
FOR INSERT 
WITH CHECK (employee_id = auth.uid());

-- 2. Fix Pending Invites Policy - Remove public access, only admins and the invited user can see
DROP POLICY IF EXISTS "Anyone can check pending invites by email" ON public.pending_invites;

-- Create a security definer function to check if email matches current user
CREATE OR REPLACE FUNCTION public.check_invite_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND LOWER(email) = LOWER(_email)
  )
$$;

-- Users can only see invites for their own email (for signup flow)
CREATE POLICY "Users can check their own pending invite" 
ON public.pending_invites 
FOR SELECT 
USING (
  accepted_at IS NULL 
  AND public.check_invite_email(email::text)
);

-- 3. Restrict Profile Data Access - Create tiered access
-- Drop existing policies first
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a function to get safe profile data (excludes sensitive fields)
CREATE OR REPLACE FUNCTION public.get_team_profiles_safe()
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  "position" text,
  business_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.avatar_url, p."position", p.business_id
  FROM public.profiles p
  WHERE p.business_id = (
    SELECT business_id
    FROM public.profiles
    WHERE id = auth.uid()
  );
$$;

-- Users can always view their own full profile
CREATE POLICY "Users can view their own full profile" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

-- Admins can view all profiles in their business (full access)
CREATE POLICY "Admins can view all profiles in their business" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND business_id IN (
    SELECT business_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Staff can view basic info of teammates (name, avatar, position only via the function)
-- For direct table access, staff can only see their own profile
-- They should use get_team_profiles_safe() function for team data