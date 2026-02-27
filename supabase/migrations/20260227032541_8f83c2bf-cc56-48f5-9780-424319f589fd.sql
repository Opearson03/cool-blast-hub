
-- 1. Update trigger to count all non-draft estimates
CREATE OR REPLACE FUNCTION public.increment_platform_quoted_value()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status != 'draft' AND COALESCE(NEW.total_amount, 0) > 0 THEN
    IF NOT EXISTS (SELECT 1 FROM platform_counted_estimates WHERE estimate_id = NEW.id) THEN
      INSERT INTO platform_counted_estimates (estimate_id) VALUES (NEW.id);
      UPDATE platform_counters
        SET total_quoted_value = total_quoted_value + NEW.total_amount
        WHERE id = 'singleton';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

-- 2. Resync: clear and rebuild from current data
TRUNCATE platform_counted_estimates;
INSERT INTO platform_counted_estimates (estimate_id)
  SELECT id FROM estimates WHERE status != 'draft' AND COALESCE(total_amount, 0) > 0;

UPDATE platform_counters SET total_quoted_value = (
  SELECT COALESCE(SUM(total_amount), 0)
  FROM estimates WHERE status != 'draft' AND COALESCE(total_amount, 0) > 0
) WHERE id = 'singleton';
