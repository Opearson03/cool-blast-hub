-- Create pour_employees junction table for assigning employees to pours
CREATE TABLE public.pour_employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pour_id UUID NOT NULL REFERENCES public.job_pours(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pour_id, employee_id)
);

-- Enable RLS
ALTER TABLE public.pour_employees ENABLE ROW LEVEL SECURITY;

-- Staff can manage pour employees
CREATE POLICY "Staff can manage pour employees"
ON public.pour_employees
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Users can view pour employees in their business
CREATE POLICY "Users can view pour employees"
ON public.pour_employees
FOR SELECT
USING (
  pour_id IN (
    SELECT jp.id FROM job_pours jp
    JOIN jobs j ON jp.job_id = j.id
    WHERE j.business_id IN (
      SELECT business_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Add visit_type to job_pours for non-pour site visits
ALTER TABLE public.job_pours ADD COLUMN visit_type TEXT DEFAULT 'pour';

-- Comment: visit_type can be 'pour', 'earthworks', 'formwork_place', 'formwork_strip', 'cure', 'seal', 'other'