
-- Add canceled_at column to business_subscriptions
ALTER TABLE public.business_subscriptions 
ADD COLUMN IF NOT EXISTS canceled_at timestamptz;

-- Trigger function to auto-set canceled_at when status changes to 'canceled'
CREATE OR REPLACE FUNCTION public.set_canceled_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'canceled' AND OLD.status != 'canceled' THEN
    NEW.canceled_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_set_canceled_at ON public.business_subscriptions;

CREATE TRIGGER trg_set_canceled_at
BEFORE UPDATE ON public.business_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_canceled_at();

-- Create get_churn_stats RPC (staff-only, SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_churn_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_canceled_30d   integer;
  v_canceled_7d    integer;
  v_new_30d        integer;
  v_net_growth_30d integer;
  v_active_start   integer;
  v_churn_rate_pct numeric;
  v_monthly_trend  json;
BEGIN
  -- Only staff can call this
  IF NOT public.is_pourhub_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(*) INTO v_canceled_30d
  FROM public.business_subscriptions
  WHERE canceled_at >= NOW() - INTERVAL '30 days';

  SELECT COUNT(*) INTO v_canceled_7d
  FROM public.business_subscriptions
  WHERE canceled_at >= NOW() - INTERVAL '7 days';

  SELECT COUNT(*) INTO v_new_30d
  FROM public.business_subscriptions
  WHERE created_at >= NOW() - INTERVAL '30 days'
    AND status NOT IN ('canceled');

  v_net_growth_30d := v_new_30d - v_canceled_30d;

  -- Active subscribers at start of current month (approximation: active minus those created this month)
  SELECT COUNT(*) INTO v_active_start
  FROM public.business_subscriptions
  WHERE status = 'active'
    AND created_at < date_trunc('month', NOW());

  IF v_active_start > 0 THEN
    SELECT COUNT(*) INTO v_canceled_30d
    FROM public.business_subscriptions
    WHERE canceled_at >= date_trunc('month', NOW());

    v_churn_rate_pct := ROUND((v_canceled_30d::numeric / v_active_start::numeric) * 100, 2);
  ELSE
    v_churn_rate_pct := 0;
  END IF;

  -- Re-fetch 30d canceled after recalc
  SELECT COUNT(*) INTO v_canceled_30d
  FROM public.business_subscriptions
  WHERE canceled_at >= NOW() - INTERVAL '30 days';

  -- Monthly trend: last 6 months
  SELECT json_agg(row_to_json(t)) INTO v_monthly_trend
  FROM (
    SELECT
      to_char(month_series, 'Mon YYYY') AS month,
      COALESCE((
        SELECT COUNT(*) FROM public.business_subscriptions
        WHERE created_at >= month_series
          AND created_at < month_series + INTERVAL '1 month'
          AND status NOT IN ('canceled')
      ), 0) AS new_count,
      COALESCE((
        SELECT COUNT(*) FROM public.business_subscriptions
        WHERE canceled_at >= month_series
          AND canceled_at < month_series + INTERVAL '1 month'
      ), 0) AS canceled_count
    FROM generate_series(
      date_trunc('month', NOW()) - INTERVAL '5 months',
      date_trunc('month', NOW()),
      INTERVAL '1 month'
    ) AS month_series
    ORDER BY month_series ASC
  ) t;

  RETURN json_build_object(
    'canceled_30d',    v_canceled_30d,
    'canceled_7d',     v_canceled_7d,
    'new_30d',         v_new_30d,
    'net_growth_30d',  v_net_growth_30d,
    'churn_rate_pct',  v_churn_rate_pct,
    'monthly_trend',   v_monthly_trend
  );
END;
$$;
