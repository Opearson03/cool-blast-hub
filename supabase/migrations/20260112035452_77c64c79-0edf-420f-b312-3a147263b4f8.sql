-- =====================================================
-- SECURITY FIX: Update RLS policies to use helper functions
-- This prevents cross-business data leakage during auth transitions
-- =====================================================

-- First, create helper functions for nested lookups
-- Helper: Get job IDs for current user's business
CREATE OR REPLACE FUNCTION get_user_job_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT j.id FROM jobs j
  WHERE j.business_id = get_user_business_id(_user_id)
$$;

-- Helper: Get crew IDs for current user's business
CREATE OR REPLACE FUNCTION get_user_crew_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT c.id FROM crews c
  WHERE c.business_id = get_user_business_id(_user_id)
$$;

-- Helper: Get pour IDs for current user's business
CREATE OR REPLACE FUNCTION get_user_pour_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jp.id FROM job_pours jp
  JOIN jobs j ON jp.job_id = j.id
  WHERE j.business_id = get_user_business_id(_user_id)
$$;

-- Helper: Get estimate IDs for current user's business
CREATE OR REPLACE FUNCTION get_user_estimate_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT e.id FROM estimates e
  WHERE e.business_id = get_user_business_id(_user_id)
$$;

-- Helper: Get SWMS IDs for current user's business
CREATE OR REPLACE FUNCTION get_user_swms_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT js.id FROM job_swms js
  JOIN jobs j ON js.job_id = j.id
  WHERE j.business_id = get_user_business_id(_user_id)
$$;

-- Helper: Get employee IDs in current user's business
CREATE OR REPLACE FUNCTION get_user_team_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.id FROM profiles p
  WHERE p.business_id = get_user_business_id(_user_id)
$$;

-- =====================================================
-- UPDATE POLICIES: businesses
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own business" ON businesses;
CREATE POLICY "Users can view their own business" ON businesses
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR id = get_user_business_id(auth.uid()));

-- =====================================================
-- UPDATE POLICIES: crews
-- =====================================================
DROP POLICY IF EXISTS "Users can view crews in their business" ON crews;
DROP POLICY IF EXISTS "Admins can manage their business crews" ON crews;

CREATE POLICY "Users can view crews in their business" ON crews
  FOR SELECT TO authenticated
  USING (business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Admins can manage their business crews" ON crews
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND business_id = get_user_business_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin') AND business_id = get_user_business_id(auth.uid()));

-- =====================================================
-- UPDATE POLICIES: crew_members
-- =====================================================
DROP POLICY IF EXISTS "Users can view crew members" ON crew_members;
DROP POLICY IF EXISTS "Admins can manage their business crew members" ON crew_members;

CREATE POLICY "Users can view crew members" ON crew_members
  FOR SELECT TO authenticated
  USING (crew_id IN (SELECT get_user_crew_ids(auth.uid())));

CREATE POLICY "Admins can manage their business crew members" ON crew_members
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND crew_id IN (SELECT get_user_crew_ids(auth.uid())))
  WITH CHECK (has_role(auth.uid(), 'admin') AND crew_id IN (SELECT get_user_crew_ids(auth.uid())));

-- =====================================================
-- UPDATE POLICIES: equipment
-- =====================================================
DROP POLICY IF EXISTS "Users can view equipment in their business" ON equipment;
DROP POLICY IF EXISTS "Admins can manage their business equipment" ON equipment;

CREATE POLICY "Users can view equipment in their business" ON equipment
  FOR SELECT TO authenticated
  USING (business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Admins can manage their business equipment" ON equipment
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND business_id = get_user_business_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin') AND business_id = get_user_business_id(auth.uid()));

-- =====================================================
-- UPDATE POLICIES: estimates
-- =====================================================
DROP POLICY IF EXISTS "Staff can view business estimates" ON estimates;
DROP POLICY IF EXISTS "Admins can manage their business estimates" ON estimates;

CREATE POLICY "Staff can view business estimates" ON estimates
  FOR SELECT TO authenticated
  USING (business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Admins can manage their business estimates" ON estimates
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND business_id = get_user_business_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin') AND business_id = get_user_business_id(auth.uid()));

-- =====================================================
-- UPDATE POLICIES: estimate_items
-- =====================================================
DROP POLICY IF EXISTS "Staff can view estimate items" ON estimate_items;
DROP POLICY IF EXISTS "Users can manage estimate items via estimate access" ON estimate_items;

CREATE POLICY "Staff can view estimate items" ON estimate_items
  FOR SELECT TO authenticated
  USING (estimate_id IN (SELECT get_user_estimate_ids(auth.uid())));

CREATE POLICY "Users can manage estimate items via estimate access" ON estimate_items
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND estimate_id IN (SELECT get_user_estimate_ids(auth.uid())))
  WITH CHECK (has_role(auth.uid(), 'admin') AND estimate_id IN (SELECT get_user_estimate_ids(auth.uid())));

-- =====================================================
-- UPDATE POLICIES: jobs
-- =====================================================
DROP POLICY IF EXISTS "Users can view jobs in their business" ON jobs;
DROP POLICY IF EXISTS "Admins can manage their business jobs" ON jobs;

CREATE POLICY "Users can view jobs in their business" ON jobs
  FOR SELECT TO authenticated
  USING (business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Admins can manage their business jobs" ON jobs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND business_id = get_user_business_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin') AND business_id = get_user_business_id(auth.uid()));

-- =====================================================
-- UPDATE POLICIES: job_pours
-- =====================================================
DROP POLICY IF EXISTS "Users can view pours in their business" ON job_pours;
DROP POLICY IF EXISTS "Staff can manage their business pours" ON job_pours;

CREATE POLICY "Users can view pours in their business" ON job_pours
  FOR SELECT TO authenticated
  USING (job_id IN (SELECT get_user_job_ids(auth.uid())));

CREATE POLICY "Staff can manage their business pours" ON job_pours
  FOR ALL TO authenticated
  USING ((has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')) AND job_id IN (SELECT get_user_job_ids(auth.uid())))
  WITH CHECK ((has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')) AND job_id IN (SELECT get_user_job_ids(auth.uid())));

-- =====================================================
-- UPDATE POLICIES: job_equipment
-- =====================================================
DROP POLICY IF EXISTS "Users can view job equipment" ON job_equipment;
DROP POLICY IF EXISTS "Admins can manage their business job equipment" ON job_equipment;

CREATE POLICY "Users can view job equipment" ON job_equipment
  FOR SELECT TO authenticated
  USING (job_id IN (SELECT get_user_job_ids(auth.uid())));

CREATE POLICY "Admins can manage their business job equipment" ON job_equipment
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND job_id IN (SELECT get_user_job_ids(auth.uid())))
  WITH CHECK (has_role(auth.uid(), 'admin') AND job_id IN (SELECT get_user_job_ids(auth.uid())));

-- =====================================================
-- UPDATE POLICIES: job_itps
-- =====================================================
DROP POLICY IF EXISTS "Users can view job ITPs" ON job_itps;
DROP POLICY IF EXISTS "Staff can manage their business job ITPs" ON job_itps;

CREATE POLICY "Users can view job ITPs" ON job_itps
  FOR SELECT TO authenticated
  USING (job_id IN (SELECT get_user_job_ids(auth.uid())));

CREATE POLICY "Staff can manage their business job ITPs" ON job_itps
  FOR ALL TO authenticated
  USING ((has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')) AND job_id IN (SELECT get_user_job_ids(auth.uid())))
  WITH CHECK ((has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')) AND job_id IN (SELECT get_user_job_ids(auth.uid())));

-- =====================================================
-- UPDATE POLICIES: job_swms
-- =====================================================
DROP POLICY IF EXISTS "Users can view job SWMS" ON job_swms;
DROP POLICY IF EXISTS "Staff can manage their business job SWMS" ON job_swms;

CREATE POLICY "Users can view job SWMS" ON job_swms
  FOR SELECT TO authenticated
  USING (job_id IN (SELECT get_user_job_ids(auth.uid())));

CREATE POLICY "Staff can manage their business job SWMS" ON job_swms
  FOR ALL TO authenticated
  USING ((has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')) AND job_id IN (SELECT get_user_job_ids(auth.uid())))
  WITH CHECK ((has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')) AND job_id IN (SELECT get_user_job_ids(auth.uid())));

-- =====================================================
-- UPDATE POLICIES: concrete_tests
-- =====================================================
DROP POLICY IF EXISTS "Users can view concrete tests" ON concrete_tests;
DROP POLICY IF EXISTS "Staff can manage their business concrete tests" ON concrete_tests;

CREATE POLICY "Users can view concrete tests" ON concrete_tests
  FOR SELECT TO authenticated
  USING (job_id IN (SELECT get_user_job_ids(auth.uid())));

CREATE POLICY "Staff can manage their business concrete tests" ON concrete_tests
  FOR ALL TO authenticated
  USING ((has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')) AND job_id IN (SELECT get_user_job_ids(auth.uid())))
  WITH CHECK ((has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')) AND job_id IN (SELECT get_user_job_ids(auth.uid())));

-- =====================================================
-- UPDATE POLICIES: project_startup
-- =====================================================
DROP POLICY IF EXISTS "Users can view project startup" ON project_startup;
DROP POLICY IF EXISTS "Admins can manage their business project startup" ON project_startup;

CREATE POLICY "Users can view project startup" ON project_startup
  FOR SELECT TO authenticated
  USING (job_id IN (SELECT get_user_job_ids(auth.uid())));

CREATE POLICY "Admins can manage their business project startup" ON project_startup
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND job_id IN (SELECT get_user_job_ids(auth.uid())))
  WITH CHECK (has_role(auth.uid(), 'admin') AND job_id IN (SELECT get_user_job_ids(auth.uid())));

-- =====================================================
-- UPDATE POLICIES: pour_employees
-- =====================================================
DROP POLICY IF EXISTS "Users can view pour employees" ON pour_employees;
DROP POLICY IF EXISTS "Staff can manage their business pour employees" ON pour_employees;

CREATE POLICY "Users can view pour employees" ON pour_employees
  FOR SELECT TO authenticated
  USING (pour_id IN (SELECT get_user_pour_ids(auth.uid())));

CREATE POLICY "Staff can manage their business pour employees" ON pour_employees
  FOR ALL TO authenticated
  USING ((has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')) AND pour_id IN (SELECT get_user_pour_ids(auth.uid())))
  WITH CHECK ((has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')) AND pour_id IN (SELECT get_user_pour_ids(auth.uid())));

-- =====================================================
-- UPDATE POLICIES: pour_equipment
-- =====================================================
DROP POLICY IF EXISTS "Users can view pour equipment" ON pour_equipment;
DROP POLICY IF EXISTS "Staff can manage their business pour equipment" ON pour_equipment;

CREATE POLICY "Users can view pour equipment" ON pour_equipment
  FOR SELECT TO authenticated
  USING (pour_id IN (SELECT get_user_pour_ids(auth.uid())));

CREATE POLICY "Staff can manage their business pour equipment" ON pour_equipment
  FOR ALL TO authenticated
  USING ((has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')) AND pour_id IN (SELECT get_user_pour_ids(auth.uid())))
  WITH CHECK ((has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')) AND pour_id IN (SELECT get_user_pour_ids(auth.uid())));

-- =====================================================
-- UPDATE POLICIES: documents
-- =====================================================
DROP POLICY IF EXISTS "Users can view documents in their business" ON documents;

CREATE POLICY "Users can view documents in their business" ON documents
  FOR SELECT TO authenticated
  USING (business_id = get_user_business_id(auth.uid()));

-- =====================================================
-- UPDATE POLICIES: feed_posts
-- =====================================================
DROP POLICY IF EXISTS "Users can view feed posts in their business" ON feed_posts;

CREATE POLICY "Users can view feed posts in their business" ON feed_posts
  FOR SELECT TO authenticated
  USING (business_id = get_user_business_id(auth.uid()));

-- =====================================================
-- UPDATE POLICIES: employee_tickets
-- =====================================================
DROP POLICY IF EXISTS "Users can view tickets in their business" ON employee_tickets;

CREATE POLICY "Users can view tickets in their business" ON employee_tickets
  FOR SELECT TO authenticated
  USING (employee_id IN (SELECT get_user_team_ids(auth.uid())));

-- =====================================================
-- UPDATE POLICIES: price_list_items
-- =====================================================
DROP POLICY IF EXISTS "Staff can view business price list" ON price_list_items;
DROP POLICY IF EXISTS "Admins can manage their business price list" ON price_list_items;

CREATE POLICY "Staff can view business price list" ON price_list_items
  FOR SELECT TO authenticated
  USING (business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Admins can manage their business price list" ON price_list_items
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND business_id = get_user_business_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin') AND business_id = get_user_business_id(auth.uid()));

-- =====================================================
-- UPDATE POLICIES: leave_requests
-- =====================================================
DROP POLICY IF EXISTS "Admins can view business leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Admins can update leave requests" ON leave_requests;

CREATE POLICY "Admins can view business leave requests" ON leave_requests
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') AND business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Admins can update leave requests" ON leave_requests
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND business_id = get_user_business_id(auth.uid()));

-- =====================================================
-- UPDATE POLICIES: timesheets
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage business timesheets" ON timesheets;

CREATE POLICY "Admins can manage business timesheets" ON timesheets
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND business_id = get_user_business_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin') AND business_id = get_user_business_id(auth.uid()));

-- =====================================================
-- UPDATE POLICIES: swms_signoffs
-- =====================================================
DROP POLICY IF EXISTS "Users can view swms signoffs" ON swms_signoffs;

CREATE POLICY "Users can view swms signoffs" ON swms_signoffs
  FOR SELECT TO authenticated
  USING (swms_id IN (SELECT get_user_swms_ids(auth.uid())));

-- =====================================================
-- UPDATE POLICIES: itp_templates
-- =====================================================
DROP POLICY IF EXISTS "Users can view itp templates" ON itp_templates;

CREATE POLICY "Users can view itp templates" ON itp_templates
  FOR SELECT TO authenticated
  USING (business_id IS NULL OR business_id = get_user_business_id(auth.uid()));

-- =====================================================
-- UPDATE POLICIES: swms_templates
-- =====================================================
DROP POLICY IF EXISTS "Users can view swms templates" ON swms_templates;

CREATE POLICY "Users can view swms templates" ON swms_templates
  FOR SELECT TO authenticated
  USING (business_id IS NULL OR business_id = get_user_business_id(auth.uid()));