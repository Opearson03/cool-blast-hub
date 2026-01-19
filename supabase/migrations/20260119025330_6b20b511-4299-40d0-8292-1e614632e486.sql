-- Add founder and position tracking columns to waiting_list
ALTER TABLE public.waiting_list
ADD COLUMN IF NOT EXISTS founder_status boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS founder_reward text,
ADD COLUMN IF NOT EXISTS last_position_notified integer,
ADD COLUMN IF NOT EXISTS last_position_email_at timestamp with time zone;

-- Create function to set founder status for first 10 signups
CREATE OR REPLACE FUNCTION public.set_founder_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
BEGIN
  -- Count existing entries (excluding current)
  SELECT COUNT(*) INTO current_count FROM public.waiting_list;
  
  -- If this is one of the first 10, set founder status
  IF current_count <= 10 THEN
    NEW.founder_status := true;
    NEW.founder_reward := '1_year_free';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically set founder status on insert
DROP TRIGGER IF EXISTS set_founder_status_trigger ON public.waiting_list;
CREATE TRIGGER set_founder_status_trigger
BEFORE INSERT ON public.waiting_list
FOR EACH ROW
EXECUTE FUNCTION public.set_founder_status();

-- Update existing first 10 entries to have founder status
WITH first_ten AS (
  SELECT id FROM public.waiting_list
  ORDER BY created_at ASC
  LIMIT 10
)
UPDATE public.waiting_list
SET founder_status = true, founder_reward = '1_year_free'
WHERE id IN (SELECT id FROM first_ten);

-- Create function to get waitlist entry by email (for status lookup)
CREATE OR REPLACE FUNCTION public.get_waitlist_by_email(_email text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  user_record RECORD;
  base_pos integer;
  effective_pos integer;
BEGIN
  SELECT * INTO user_record
  FROM public.waiting_list
  WHERE LOWER(email) = LOWER(_email);
  
  IF user_record IS NULL THEN
    RETURN json_build_object('found', false);
  END IF;
  
  -- Calculate base position
  SELECT COUNT(*) INTO base_pos
  FROM public.waiting_list
  WHERE created_at <= user_record.created_at;
  
  -- Calculate effective position (with referral bonus)
  effective_pos := GREATEST(1, base_pos - (COALESCE(user_record.referral_count, 0) * 50));
  
  RETURN json_build_object(
    'found', true,
    'id', user_record.id,
    'full_name', user_record.full_name,
    'referral_count', COALESCE(user_record.referral_count, 0),
    'referral_code', user_record.referral_code,
    'vip_status', COALESCE(user_record.vip_status, false),
    'founder_status', COALESCE(user_record.founder_status, false),
    'founder_reward', user_record.founder_reward,
    'bonus_estimates', COALESCE(user_record.bonus_estimates, 0),
    'base_position', base_pos,
    'effective_position', effective_pos,
    'spots_jumped', base_pos - effective_pos,
    'created_at', user_record.created_at
  );
END;
$$;