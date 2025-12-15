-- Allow staff to view all profiles in their business for contacts list
CREATE POLICY "Staff can view profiles in their business"
ON public.profiles
FOR SELECT
USING (
  business_id IN (
    SELECT business_id FROM profiles WHERE id = auth.uid()
  )
);