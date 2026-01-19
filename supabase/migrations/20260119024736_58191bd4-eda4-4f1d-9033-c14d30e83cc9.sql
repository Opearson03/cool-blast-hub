-- Add new columns for referral tracking
ALTER TABLE public.waiting_list 
ADD COLUMN IF NOT EXISTS vip_status boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bonus_estimates integer DEFAULT 0;

-- Create function to calculate queue position
CREATE OR REPLACE FUNCTION public.calculate_queue_position(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH user_data AS (
    SELECT 
      id,
      created_at,
      COALESCE(referral_count, 0) as referral_count
    FROM public.waiting_list
    WHERE id = _user_id
  ),
  base_position AS (
    SELECT COUNT(*) as pos
    FROM public.waiting_list w, user_data u
    WHERE w.created_at <= u.created_at
  )
  SELECT GREATEST(1, (SELECT pos FROM base_position)::integer - ((SELECT referral_count FROM user_data) * 50));
$$;

-- Create function to get user's waitlist status
CREATE OR REPLACE FUNCTION public.get_waitlist_status(_user_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
  user_record RECORD;
  base_pos integer;
  effective_pos integer;
BEGIN
  SELECT * INTO user_record
  FROM public.waiting_list
  WHERE id = _user_id;
  
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
    'referral_count', COALESCE(user_record.referral_count, 0),
    'referral_code', user_record.referral_code,
    'vip_status', COALESCE(user_record.vip_status, false),
    'bonus_estimates', COALESCE(user_record.bonus_estimates, 0),
    'base_position', base_pos,
    'effective_position', effective_pos,
    'spots_jumped', base_pos - effective_pos
  );
END;
$$;

-- Update the increment trigger to also set VIP status
CREATE OR REPLACE FUNCTION public.increment_waitlist_referral_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_count integer;
BEGIN
  IF NEW.referred_by IS NOT NULL THEN
    -- Increment referral count and get new value
    UPDATE public.waiting_list 
    SET referral_count = COALESCE(referral_count, 0) + 1
    WHERE id = NEW.referred_by
    RETURNING referral_count INTO new_count;
    
    -- If they've reached 3 referrals, grant VIP status and bonus estimates
    IF new_count >= 3 THEN
      UPDATE public.waiting_list
      SET vip_status = true,
          bonus_estimates = GREATEST(COALESCE(bonus_estimates, 0), 5)
      WHERE id = NEW.referred_by;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;