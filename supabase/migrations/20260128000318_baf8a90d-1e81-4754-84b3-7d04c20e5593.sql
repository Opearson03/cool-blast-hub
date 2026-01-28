-- =============================================
-- Sub-Trade Referral & Scheduling System
-- Phase 1: Database Schema
-- =============================================

-- 1. Create external_invites table (Core invite tracking)
CREATE TABLE public.external_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  job_pour_id UUID NOT NULL REFERENCES job_pours(id) ON DELETE CASCADE,
  
  -- Invite details
  invite_type TEXT NOT NULL DEFAULT 'sub_trade',
  role TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT,
  recipient_email TEXT,
  notes TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'drafted' 
    CHECK (status IN ('drafted','sent','viewed','accepted','declined','revoked','expired')),
  
  -- Token security (stored hashed)
  token_hash TEXT NOT NULL UNIQUE,
  token_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  
  -- Delivery tracking
  sent_via TEXT CHECK (sent_via IN ('sms','email','both')),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT require_contact CHECK (recipient_phone IS NOT NULL OR recipient_email IS NOT NULL)
);

-- 2. Create external_invite_events table (Audit trail)
CREATE TABLE public.external_invite_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_invite_id UUID NOT NULL REFERENCES external_invites(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- 3. Enable RLS on both tables
ALTER TABLE public.external_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_invite_events ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for external_invites
CREATE POLICY "Users can manage invites for their business"
  ON public.external_invites FOR ALL
  USING (business_id = get_user_business_id(auth.uid()))
  WITH CHECK (business_id = get_user_business_id(auth.uid()));

-- 5. RLS Policies for external_invite_events
CREATE POLICY "Users can view events for their invites"
  ON public.external_invite_events FOR SELECT
  USING (external_invite_id IN (
    SELECT id FROM external_invites WHERE business_id = get_user_business_id(auth.uid())
  ));

CREATE POLICY "Users can insert events for their invites"
  ON public.external_invite_events FOR INSERT
  WITH CHECK (external_invite_id IN (
    SELECT id FROM external_invites WHERE business_id = get_user_business_id(auth.uid())
  ));

-- 6. Create indexes for performance
CREATE INDEX idx_external_invites_business ON external_invites(business_id);
CREATE INDEX idx_external_invites_pour ON external_invites(job_pour_id);
CREATE INDEX idx_external_invites_token ON external_invites(token_hash);
CREATE INDEX idx_external_invites_status ON external_invites(status);
CREATE INDEX idx_external_invite_events_invite ON external_invite_events(external_invite_id);

-- 7. Create updated_at trigger for external_invites
CREATE TRIGGER update_external_invites_updated_at
  BEFORE UPDATE ON public.external_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();