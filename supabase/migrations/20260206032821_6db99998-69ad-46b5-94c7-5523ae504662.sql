-- Update trigger function to regenerate alias when name changes
CREATE OR REPLACE FUNCTION public.set_inbound_email_alias()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On INSERT: always generate if null
  IF TG_OP = 'INSERT' THEN
    IF NEW.inbound_email_alias IS NULL THEN
      NEW.inbound_email_alias := generate_unique_email_alias(NEW.name);
    END IF;
  -- On UPDATE: regenerate if name changed
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.name IS DISTINCT FROM OLD.name THEN
      NEW.inbound_email_alias := generate_unique_email_alias(NEW.name);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Add UPDATE trigger (INSERT trigger already exists)
DROP TRIGGER IF EXISTS trigger_update_inbound_email_alias ON businesses;
CREATE TRIGGER trigger_update_inbound_email_alias
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  WHEN (NEW.name IS DISTINCT FROM OLD.name)
  EXECUTE FUNCTION set_inbound_email_alias();