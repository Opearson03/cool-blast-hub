
-- ============================================================
-- AFFILIATE PROGRAM TABLES
-- ============================================================

-- 1. Affiliates table
CREATE TABLE public.affiliates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  instagram_handle TEXT,
  affiliate_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended')),
  payout_method TEXT CHECK (payout_method IN ('bank', 'paypal')),
  payout_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Affiliate referrals table
CREATE TABLE public.affiliate_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  stripe_subscription_id TEXT,
  subscription_tier TEXT,
  monthly_amount INTEGER NOT NULL DEFAULT 0, -- in cents
  commission_rate NUMERIC(4,2) NOT NULL DEFAULT 0.10,
  months_remaining INTEGER NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'canceled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Affiliate commissions table
CREATE TABLE public.affiliate_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID NOT NULL REFERENCES public.affiliate_referrals(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  month_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- Affiliates: own row read
CREATE POLICY "Affiliates can view own profile"
  ON public.affiliates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Affiliates can update own profile"
  ON public.affiliates FOR UPDATE
  USING (auth.uid() = user_id);

-- Staff can manage all affiliates
CREATE POLICY "Staff can view all affiliates"
  ON public.affiliates FOR SELECT
  USING (public.is_pourhub_staff(auth.uid()));

CREATE POLICY "Staff can update all affiliates"
  ON public.affiliates FOR UPDATE
  USING (public.is_pourhub_staff(auth.uid()));

CREATE POLICY "Staff can insert affiliates"
  ON public.affiliates FOR INSERT
  WITH CHECK (public.is_pourhub_staff(auth.uid()));

-- Referrals: own read + staff all
CREATE POLICY "Affiliates can view own referrals"
  ON public.affiliate_referrals FOR SELECT
  USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Staff can view all referrals"
  ON public.affiliate_referrals FOR SELECT
  USING (public.is_pourhub_staff(auth.uid()));

CREATE POLICY "Staff can manage referrals"
  ON public.affiliate_referrals FOR ALL
  USING (public.is_pourhub_staff(auth.uid()));

-- Commissions: own read + staff all
CREATE POLICY "Affiliates can view own commissions"
  ON public.affiliate_commissions FOR SELECT
  USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Staff can view all commissions"
  ON public.affiliate_commissions FOR SELECT
  USING (public.is_pourhub_staff(auth.uid()));

CREATE POLICY "Staff can manage commissions"
  ON public.affiliate_commissions FOR ALL
  USING (public.is_pourhub_staff(auth.uid()));

-- ============================================================
-- RPC: Anonymous affiliate registration (like waitlist pattern)
-- ============================================================

CREATE OR REPLACE FUNCTION public.register_affiliate(
  _email TEXT,
  _full_name TEXT,
  _instagram_handle TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _row affiliates;
  _code TEXT;
  _exists BOOLEAN;
BEGIN
  -- Generate unique affiliate code
  LOOP
    _code := 'PH-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM affiliates WHERE affiliate_code = _code) INTO _exists;
    EXIT WHEN NOT _exists;
  END LOOP;

  INSERT INTO public.affiliates (email, full_name, instagram_handle, affiliate_code)
  VALUES (_email, _full_name, _instagram_handle, _code)
  RETURNING * INTO _row;

  RETURN jsonb_build_object(
    'id', _row.id,
    'affiliate_code', _row.affiliate_code,
    'status', _row.status
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('error', 'already_registered');
END;
$$;

-- ============================================================
-- RPC: Staff get all affiliates
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_all_affiliates()
RETURNS TABLE(
  id UUID, email TEXT, full_name TEXT, instagram_handle TEXT,
  affiliate_code TEXT, status TEXT, payout_method TEXT,
  created_at TIMESTAMPTZ, referral_count BIGINT, total_earned BIGINT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_pourhub_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    a.id, a.email, a.full_name, a.instagram_handle,
    a.affiliate_code, a.status, a.payout_method,
    a.created_at,
    COALESCE((SELECT COUNT(*) FROM affiliate_referrals ar WHERE ar.affiliate_id = a.id), 0) AS referral_count,
    COALESCE((SELECT SUM(ac.amount_cents) FROM affiliate_commissions ac WHERE ac.affiliate_id = a.id), 0) AS total_earned
  FROM public.affiliates a
  ORDER BY a.created_at DESC;
END;
$$;

-- Indexes
CREATE INDEX idx_affiliate_referrals_affiliate_id ON public.affiliate_referrals(affiliate_id);
CREATE INDEX idx_affiliate_referrals_stripe_sub ON public.affiliate_referrals(stripe_subscription_id);
CREATE INDEX idx_affiliate_commissions_affiliate_id ON public.affiliate_commissions(affiliate_id);
CREATE INDEX idx_affiliate_commissions_referral_id ON public.affiliate_commissions(referral_id);
CREATE INDEX idx_affiliates_code ON public.affiliates(affiliate_code);

-- Updated_at triggers
CREATE TRIGGER update_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_referrals_updated_at
  BEFORE UPDATE ON public.affiliate_referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
