-- Update handle_new_user function to handle employee invites with metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
  inviter_business_id UUID;
  new_business_id UUID;
  signup_type TEXT;
  business_name TEXT;
  stripe_customer TEXT;
  stripe_subscription TEXT;
  plan_tier_value TEXT;
  invite_role TEXT;
  meta_business_id UUID;
BEGIN
  -- Get signup type from user metadata
  signup_type := NEW.raw_user_meta_data ->> 'signup_type';
  
  -- Handle business owner signup
  IF signup_type = 'business_owner' THEN
    business_name := NEW.raw_user_meta_data ->> 'business_name';
    stripe_customer := NEW.raw_user_meta_data ->> 'stripe_customer_id';
    stripe_subscription := NEW.raw_user_meta_data ->> 'stripe_subscription_id';
    plan_tier_value := COALESCE(NEW.raw_user_meta_data ->> 'plan_tier', 'starter');
    
    -- Create the business first
    INSERT INTO public.businesses (name, owner_id)
    VALUES (COALESCE(business_name, 'My Business'), NEW.id)
    RETURNING id INTO new_business_id;
    
    -- Create the profile linked to the business
    INSERT INTO public.profiles (id, full_name, business_id)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email), new_business_id);
    
    -- Assign admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
    
    -- Create business subscription record immediately
    INSERT INTO public.business_subscriptions (
      business_id,
      stripe_customer_id,
      stripe_subscription_id,
      plan_tier,
      status,
      employee_limit,
      current_period_end
    ) VALUES (
      new_business_id,
      stripe_customer,
      stripe_subscription,
      plan_tier_value,
      CASE WHEN stripe_subscription IS NOT NULL THEN 'active' ELSE 'pending' END,
      CASE 
        WHEN plan_tier_value = 'professional' THEN 15
        WHEN plan_tier_value = 'enterprise' THEN 999
        ELSE 5
      END,
      CASE WHEN stripe_subscription IS NOT NULL THEN (NOW() + INTERVAL '30 days') ELSE NULL END
    );
    
    RETURN NEW;
  END IF;
  
  -- Handle employee invite signup (check metadata first for role/business info)
  IF signup_type = 'employee_invite' THEN
    invite_role := NEW.raw_user_meta_data ->> 'invite_role';
    meta_business_id := (NEW.raw_user_meta_data ->> 'business_id')::UUID;
    
    IF invite_role IS NOT NULL AND meta_business_id IS NOT NULL THEN
      -- Create profile with business_id from metadata
      INSERT INTO public.profiles (id, full_name, business_id)
      VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email), meta_business_id);
      
      -- Assign role from metadata
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, invite_role::app_role);
      
      -- Mark invite as accepted
      UPDATE public.pending_invites
      SET accepted_at = now()
      WHERE LOWER(email::text) = LOWER(NEW.email) AND accepted_at IS NULL;
      
      RETURN NEW;
    END IF;
  END IF;
  
  -- Fallback: Handle invited employee signup by looking up invite (existing logic)
  SELECT * INTO invite_record
  FROM public.pending_invites
  WHERE LOWER(email::text) = LOWER(NEW.email) AND accepted_at IS NULL;
  
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
  
  RETURN NEW;
END;
$$;