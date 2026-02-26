
-- Persistent counter table (single row)
CREATE TABLE public.platform_counters (
  id text PRIMARY KEY DEFAULT 'singleton',
  total_quoted_value numeric NOT NULL DEFAULT 0
);

ALTER TABLE public.platform_counters ENABLE ROW LEVEL SECURITY;

-- Anyone can read (it's a single public number)
CREATE POLICY "Anyone can read platform counters"
  ON public.platform_counters FOR SELECT USING (true);

-- Seed with current data
INSERT INTO public.platform_counters (id, total_quoted_value)
VALUES (
  'singleton',
  COALESCE((
    SELECT SUM(total_amount)
    FROM public.estimates
    WHERE status IN ('sent', 'accepted') OR signed_at IS NOT NULL
  ), 0)
);

-- Tracking table: which estimates have already been counted (no user data, just IDs)
CREATE TABLE public.platform_counted_estimates (
  estimate_id uuid PRIMARY KEY
);

ALTER TABLE public.platform_counted_estimates ENABLE ROW LEVEL SECURITY;

-- No public access needed, only trigger (SECURITY DEFINER) touches this
-- Backfill already-counted estimates
INSERT INTO public.platform_counted_estimates (estimate_id)
SELECT id FROM public.estimates
WHERE status IN ('sent', 'accepted') OR signed_at IS NOT NULL;

-- Trigger function: increment counter when estimate qualifies for the first time
CREATE OR REPLACE FUNCTION public.increment_platform_quoted_value()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only proceed if estimate now qualifies
  IF (NEW.status IN ('sent', 'accepted') OR NEW.signed_at IS NOT NULL)
     AND COALESCE(NEW.total_amount, 0) > 0
  THEN
    -- Only count if not already counted
    IF NOT EXISTS (SELECT 1 FROM platform_counted_estimates WHERE estimate_id = NEW.id) THEN
      INSERT INTO platform_counted_estimates (estimate_id) VALUES (NEW.id);
      UPDATE platform_counters
        SET total_quoted_value = total_quoted_value + NEW.total_amount
        WHERE id = 'singleton';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_increment_platform_quoted_value
  AFTER INSERT OR UPDATE ON public.estimates
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_platform_quoted_value();

-- Update the RPC to read from the counter table instead of aggregating
CREATE OR REPLACE FUNCTION public.get_total_quoted_value()
RETURNS numeric
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT total_quoted_value FROM platform_counters WHERE id = 'singleton';
$$;
