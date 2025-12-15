-- Fix RLS policies to enforce business isolation

-- Drop and recreate crews management policy
DROP POLICY IF EXISTS "Admins can manage crews" ON public.crews;
CREATE POLICY "Admins can manage their business crews"
ON public.crews
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);

-- Drop and recreate jobs management policy
DROP POLICY IF EXISTS "Admins can manage jobs" ON public.jobs;
CREATE POLICY "Admins can manage their business jobs"
ON public.jobs
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);

-- Drop and recreate job_pours management policy
DROP POLICY IF EXISTS "Staff can manage pours" ON public.job_pours;
CREATE POLICY "Staff can manage their business pours"
ON public.job_pours
FOR ALL
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  AND job_id IN (
    SELECT id FROM jobs 
    WHERE business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
  )
)
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  AND job_id IN (
    SELECT id FROM jobs 
    WHERE business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
  )
);

-- Drop and recreate crew_members management policy
DROP POLICY IF EXISTS "Admins can manage crew members" ON public.crew_members;
CREATE POLICY "Admins can manage their business crew members"
ON public.crew_members
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND crew_id IN (
    SELECT id FROM crews 
    WHERE business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND crew_id IN (
    SELECT id FROM crews 
    WHERE business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
  )
);

-- Drop and recreate job_equipment management policy
DROP POLICY IF EXISTS "Admins can manage job equipment" ON public.job_equipment;
CREATE POLICY "Admins can manage their business job equipment"
ON public.job_equipment
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND job_id IN (
    SELECT id FROM jobs 
    WHERE business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND job_id IN (
    SELECT id FROM jobs 
    WHERE business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
  )
);

-- Drop and recreate job_itps management policy
DROP POLICY IF EXISTS "Staff can manage job ITPs" ON public.job_itps;
CREATE POLICY "Staff can manage their business job ITPs"
ON public.job_itps
FOR ALL
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  AND job_id IN (
    SELECT id FROM jobs 
    WHERE business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
  )
)
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  AND job_id IN (
    SELECT id FROM jobs 
    WHERE business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
  )
);

-- Drop and recreate job_swms management policy
DROP POLICY IF EXISTS "Staff can manage job SWMS" ON public.job_swms;
CREATE POLICY "Staff can manage their business job SWMS"
ON public.job_swms
FOR ALL
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  AND job_id IN (
    SELECT id FROM jobs 
    WHERE business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
  )
)
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  AND job_id IN (
    SELECT id FROM jobs 
    WHERE business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
  )
);

-- Drop and recreate concrete_tests management policy
DROP POLICY IF EXISTS "Staff can manage concrete tests" ON public.concrete_tests;
CREATE POLICY "Staff can manage their business concrete tests"
ON public.concrete_tests
FOR ALL
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  AND job_id IN (
    SELECT id FROM jobs 
    WHERE business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
  )
)
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  AND job_id IN (
    SELECT id FROM jobs 
    WHERE business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
  )
);

-- Drop and recreate pour_employees management policy
DROP POLICY IF EXISTS "Staff can manage pour employees" ON public.pour_employees;
CREATE POLICY "Staff can manage their business pour employees"
ON public.pour_employees
FOR ALL
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  AND pour_id IN (
    SELECT jp.id FROM job_pours jp
    JOIN jobs j ON jp.job_id = j.id
    WHERE j.business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
  )
)
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  AND pour_id IN (
    SELECT jp.id FROM job_pours jp
    JOIN jobs j ON jp.job_id = j.id
    WHERE j.business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
  )
);

-- Drop and recreate project_startup management policy
DROP POLICY IF EXISTS "Admins can manage project startup" ON public.project_startup;
CREATE POLICY "Admins can manage their business project startup"
ON public.project_startup
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND job_id IN (
    SELECT id FROM jobs 
    WHERE business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND job_id IN (
    SELECT id FROM jobs 
    WHERE business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
  )
);

-- Drop and recreate equipment management policy
DROP POLICY IF EXISTS "Admins can manage equipment" ON public.equipment;
CREATE POLICY "Admins can manage their business equipment"
ON public.equipment
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);