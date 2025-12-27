-- ============================================
-- PHASE 2: SUBSCRIPTION ENFORCEMENT
-- ============================================

-- 1. Add exemption flag to businesses table for demo/test accounts
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS subscription_exempt boolean DEFAULT false;

-- 2. Update handle_new_user to create business_subscriptions record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
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
  
  -- Handle invited employee signup (existing logic)
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

-- 3. Create function to check if business has active subscription or is exempt
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.businesses b ON p.business_id = b.id
    LEFT JOIN public.business_subscriptions bs ON b.id = bs.business_id
    WHERE p.id = _user_id
    AND (
      b.subscription_exempt = true
      OR (bs.status = 'active' AND (bs.current_period_end IS NULL OR bs.current_period_end > NOW()))
    )
  )
$$;

-- 4. Create function to check employee limit
CREATE OR REPLACE FUNCTION public.check_employee_limit(_business_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
  employee_limit integer;
  is_exempt boolean;
BEGIN
  -- Check if business is exempt
  SELECT subscription_exempt INTO is_exempt
  FROM public.businesses
  WHERE id = _business_id;
  
  IF is_exempt = true THEN
    RETURN json_build_object(
      'can_add', true,
      'current_count', 0,
      'limit', 999,
      'is_exempt', true
    );
  END IF;
  
  -- Get current employee count
  SELECT COUNT(*) INTO current_count
  FROM public.profiles
  WHERE business_id = _business_id;
  
  -- Get employee limit from subscription
  SELECT COALESCE(bs.employee_limit, 5) INTO employee_limit
  FROM public.business_subscriptions bs
  WHERE bs.business_id = _business_id;
  
  IF employee_limit IS NULL THEN
    employee_limit := 5;
  END IF;
  
  RETURN json_build_object(
    'can_add', current_count < employee_limit,
    'current_count', current_count,
    'limit', employee_limit,
    'is_exempt', false
  );
END;
$$;

-- 5. Mark the demo business as exempt (admin@pourhub.com.au)
UPDATE public.businesses
SET subscription_exempt = true
WHERE owner_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@pourhub.com.au'
);