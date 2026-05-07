
CREATE TABLE public.landing_page_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant TEXT NOT NULL,
  event_type TEXT NOT NULL,
  session_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer TEXT,
  user_agent TEXT,
  path TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lp_events_variant ON public.landing_page_events(variant);
CREATE INDEX idx_lp_events_event_type ON public.landing_page_events(event_type);
CREATE INDEX idx_lp_events_created_at ON public.landing_page_events(created_at DESC);
CREATE INDEX idx_lp_events_session ON public.landing_page_events(session_id);

ALTER TABLE public.landing_page_events ENABLE ROW LEVEL SECURITY;

-- Anyone (anonymous included) can insert tracking events
CREATE POLICY "Anyone can insert landing events"
ON public.landing_page_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only PourHub staff can read events
CREATE POLICY "Staff can view landing events"
ON public.landing_page_events
FOR SELECT
TO authenticated
USING (public.is_pourhub_staff(auth.uid()));
