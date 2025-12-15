-- Remove recursive staff profiles policy to avoid RLS infinite recursion
DROP POLICY IF EXISTS "Staff can view profiles in their business" ON public.profiles;

-- Helper function to fetch all profiles for the current user's business
CREATE OR REPLACE FUNCTION public.get_team_profiles()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.*
  FROM public.profiles p
  WHERE p.business_id = (
    SELECT business_id
    FROM public.profiles
    WHERE id = auth.uid()
  );
$$;