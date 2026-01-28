-- Function to generate unique email alias from business name
CREATE OR REPLACE FUNCTION public.generate_unique_email_alias(business_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_alias TEXT;
  test_alias TEXT;
  counter INTEGER := 1;
BEGIN
  -- Normalize: lowercase, remove special chars, keep alphanumeric only
  base_alias := regexp_replace(
    lower(business_name), 
    '[^a-z0-9]', 
    '', 
    'g'
  );
  
  -- Truncate to 27 chars to leave room for counter suffix
  base_alias := left(base_alias, 27);
  
  -- Ensure minimum length
  IF length(base_alias) < 3 THEN
    base_alias := base_alias || 'biz';
  END IF;
  
  test_alias := base_alias;
  
  -- Check for uniqueness, append counter if needed
  WHILE EXISTS (
    SELECT 1 FROM businesses WHERE inbound_email_alias = test_alias
  ) LOOP
    counter := counter + 1;
    test_alias := base_alias || counter::TEXT;
  END LOOP;
  
  RETURN test_alias;
END;
$$;

-- Trigger function to auto-generate alias on business creation
CREATE OR REPLACE FUNCTION public.set_inbound_email_alias()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.inbound_email_alias IS NULL THEN
    NEW.inbound_email_alias := generate_unique_email_alias(NEW.name);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on businesses table
DROP TRIGGER IF EXISTS trigger_set_inbound_email_alias ON businesses;
CREATE TRIGGER trigger_set_inbound_email_alias
  BEFORE INSERT ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION set_inbound_email_alias();

-- Backfill existing businesses without aliases
UPDATE businesses 
SET inbound_email_alias = generate_unique_email_alias(name)
WHERE inbound_email_alias IS NULL;