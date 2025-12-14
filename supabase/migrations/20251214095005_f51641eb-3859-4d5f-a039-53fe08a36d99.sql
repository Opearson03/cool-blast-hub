-- Create trigger on auth.users to call handle_new_user
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update handle_new_user to also set business_id from the inviting admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  invite_record RECORD;
  inviter_business_id UUID;
BEGIN
  -- Use case-insensitive email comparison
  SELECT * INTO invite_record
  FROM public.pending_invites
  WHERE LOWER(email) = LOWER(NEW.email) AND accepted_at IS NULL;
  
  IF invite_record IS NOT NULL THEN
    -- Get business_id from the inviting admin's profile
    SELECT business_id INTO inviter_business_id
    FROM public.profiles
    WHERE id = invite_record.invited_by;
    
    -- Create profile with business_id
    INSERT INTO public.profiles (id, full_name, business_id)
    VALUES (NEW.id, invite_record.full_name, inviter_business_id);
    
    -- Assign role from invite
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, invite_record.role);
    
    -- Mark invite as accepted
    UPDATE public.pending_invites
    SET accepted_at = now()
    WHERE id = invite_record.id;
  END IF;
  -- If no invite found, do nothing - signup will fail at RLS level
  
  RETURN NEW;
END;
$$;

-- Fix the existing Oliver user who signed up but didn't get profile/role
INSERT INTO public.profiles (id, full_name, business_id)
SELECT 
  '735a6c90-abca-4bb8-bfe0-637c31fd78bf',
  'Oliver',
  (SELECT business_id FROM profiles WHERE id = (SELECT invited_by FROM pending_invites WHERE LOWER(email) = 'opearson@jefcon.com.au' LIMIT 1) LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = '735a6c90-abca-4bb8-bfe0-637c31fd78bf');

INSERT INTO public.user_roles (user_id, role)
SELECT '735a6c90-abca-4bb8-bfe0-637c31fd78bf', 'staff'
WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = '735a6c90-abca-4bb8-bfe0-637c31fd78bf');

-- Mark Oliver's invite as accepted
UPDATE public.pending_invites
SET accepted_at = now()
WHERE LOWER(email) = 'opearson@jefcon.com.au' AND accepted_at IS NULL;