-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view business profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update business profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view team profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins can view business profiles" ON public.profiles
FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin') AND business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Admins can update business profiles" ON public.profiles
FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin') AND business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Staff can view team profiles" ON public.profiles
FOR SELECT TO authenticated USING (has_role(auth.uid(),'staff') AND business_id = get_user_business_id(auth.uid()));

-- timesheets
DROP POLICY IF EXISTS "Employees can view own timesheets" ON public.timesheets;
DROP POLICY IF EXISTS "Employees can insert own timesheets" ON public.timesheets;
DROP POLICY IF EXISTS "Employees can update own active timesheets" ON public.timesheets;
DROP POLICY IF EXISTS "Admins can manage business timesheets" ON public.timesheets;

CREATE POLICY "Employees can view own timesheets" ON public.timesheets
FOR SELECT TO authenticated USING (employee_id = auth.uid());
CREATE POLICY "Employees can insert own timesheets" ON public.timesheets
FOR INSERT TO authenticated WITH CHECK (employee_id = auth.uid());
CREATE POLICY "Employees can update own active timesheets" ON public.timesheets
FOR UPDATE TO authenticated USING (employee_id = auth.uid() AND status='active') WITH CHECK (employee_id = auth.uid());
CREATE POLICY "Admins can manage business timesheets" ON public.timesheets
FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin') AND business_id = get_user_business_id(auth.uid()))
WITH CHECK (has_role(auth.uid(),'admin') AND business_id = get_user_business_id(auth.uid()));

-- job_variations
DROP POLICY IF EXISTS "Users can view variations in their business" ON public.job_variations;
DROP POLICY IF EXISTS "Admins can manage their business variations" ON public.job_variations;

CREATE POLICY "Users can view variations in their business" ON public.job_variations
FOR SELECT TO authenticated USING (business_id = get_user_business_id(auth.uid()));
CREATE POLICY "Admins can manage their business variations" ON public.job_variations
FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin') AND business_id = get_user_business_id(auth.uid()))
WITH CHECK (has_role(auth.uid(),'admin') AND business_id = get_user_business_id(auth.uid()));