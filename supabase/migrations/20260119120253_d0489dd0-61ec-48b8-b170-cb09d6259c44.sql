-- Phase 4: Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_estimates_business_status_created 
  ON public.estimates(business_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_jobs_business_status_created 
  ON public.jobs(business_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_pours_date_job 
  ON public.job_pours(pour_date, job_id);

CREATE INDEX IF NOT EXISTS idx_profiles_business 
  ON public.profiles(business_id);

CREATE INDEX IF NOT EXISTS idx_leave_requests_business_status 
  ON public.leave_requests(business_id, status);

CREATE INDEX IF NOT EXISTS idx_job_itps_job_status 
  ON public.job_itps(job_id, status);

CREATE INDEX IF NOT EXISTS idx_timesheets_business_employee 
  ON public.timesheets(business_id, employee_id, clock_in DESC);

CREATE INDEX IF NOT EXISTS idx_takeoff_markups_takeoff 
  ON public.takeoff_markups(takeoff_id);

CREATE INDEX IF NOT EXISTS idx_takeoff_files_takeoff 
  ON public.takeoff_files(takeoff_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_crew_members_crew 
  ON public.crew_members(crew_id);

CREATE INDEX IF NOT EXISTS idx_crew_members_employee 
  ON public.crew_members(employee_id);

CREATE INDEX IF NOT EXISTS idx_businesses_owner 
  ON public.businesses(owner_id);

CREATE INDEX IF NOT EXISTS idx_business_subscriptions_business 
  ON public.business_subscriptions(business_id);

-- Phase 6: Create optimized dashboard stats function
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_business_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  today_date date := CURRENT_DATE;
  week_end_date date := CURRENT_DATE + INTERVAL '7 days';
BEGIN
  SELECT json_build_object(
    'today_pours', (
      SELECT COUNT(*) FROM job_pours jp
      JOIN jobs j ON jp.job_id = j.id
      WHERE j.business_id = p_business_id AND jp.pour_date = today_date
    ),
    'week_pours', (
      SELECT COUNT(*) FROM job_pours jp
      JOIN jobs j ON jp.job_id = j.id
      WHERE j.business_id = p_business_id 
        AND jp.pour_date >= today_date 
        AND jp.pour_date <= week_end_date
    ),
    'active_crews', (
      SELECT COUNT(*) FROM crews WHERE business_id = p_business_id
    ),
    'pending_leave', (
      SELECT COUNT(*) FROM leave_requests 
      WHERE business_id = p_business_id AND status = 'pending'
    ),
    'pending_itps', (
      SELECT COUNT(*) FROM job_itps ji
      JOIN jobs j ON ji.job_id = j.id
      WHERE j.business_id = p_business_id AND ji.status = 'pending'
    )
  ) INTO result;
  
  RETURN result;
END;
$$;