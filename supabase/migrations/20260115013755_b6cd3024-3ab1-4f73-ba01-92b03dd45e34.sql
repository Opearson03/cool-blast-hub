-- Create estimate_usage table to track monthly quotas
CREATE TABLE public.estimate_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  month_year text NOT NULL,
  estimate_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(business_id, month_year)
);

-- Enable RLS
ALTER TABLE estimate_usage ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view their own business usage
CREATE POLICY "Users can view own business usage"
  ON estimate_usage FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM profiles WHERE id = auth.uid()
  ));

-- Create trigger function to increment usage on estimate insert
CREATE OR REPLACE FUNCTION increment_estimate_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO estimate_usage (business_id, month_year, estimate_count)
  VALUES (NEW.business_id, to_char(now(), 'YYYY-MM'), 1)
  ON CONFLICT (business_id, month_year)
  DO UPDATE SET 
    estimate_count = estimate_usage.estimate_count + 1,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on estimates table
CREATE TRIGGER on_estimate_created
  AFTER INSERT ON estimates
  FOR EACH ROW
  EXECUTE FUNCTION increment_estimate_usage();