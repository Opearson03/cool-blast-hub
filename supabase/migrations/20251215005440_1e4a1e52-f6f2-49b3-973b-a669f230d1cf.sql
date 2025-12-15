-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Staff can view profiles in their business" ON public.profiles;

-- Create a corrected policy that doesn't cause recursion
-- For staff viewing profiles in their business, we need to avoid self-referential subqueries
CREATE POLICY "Staff can view profiles in their business" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can always see profiles that share the same business_id as their own
  business_id = (SELECT p.business_id FROM profiles p WHERE p.id = auth.uid())
);