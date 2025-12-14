-- Create business_subscriptions table to track Stripe subscriptions
CREATE TABLE public.business_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_tier TEXT NOT NULL DEFAULT 'starter',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  employee_limit INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id)
);

-- Enable RLS
ALTER TABLE public.business_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Business owners can view their subscription"
ON public.business_subscriptions
FOR SELECT
USING (business_id IN (
  SELECT id FROM businesses WHERE owner_id = auth.uid()
));

CREATE POLICY "Admins can manage subscriptions"
ON public.business_subscriptions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add onboarding columns to businesses table
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

-- Create trigger for updated_at
CREATE TRIGGER update_business_subscriptions_updated_at
BEFORE UPDATE ON public.business_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();