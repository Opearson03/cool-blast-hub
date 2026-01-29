-- Drop existing policies on job_dates
DROP POLICY IF EXISTS "Users can create job dates for their business" ON public.job_dates;
DROP POLICY IF EXISTS "Users can view job dates for their business" ON public.job_dates;
DROP POLICY IF EXISTS "Users can update job dates for their business" ON public.job_dates;
DROP POLICY IF EXISTS "Users can delete job dates for their business" ON public.job_dates;

-- Recreate policies using the safe get_user_business_id helper function
CREATE POLICY "Users can view job dates for their business" 
ON public.job_dates 
FOR SELECT 
USING (business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Staff can manage job dates for their business" 
ON public.job_dates 
FOR ALL 
USING (
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')) 
  AND business_id = get_user_business_id(auth.uid())
)
WITH CHECK (
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')) 
  AND business_id = get_user_business_id(auth.uid())
);