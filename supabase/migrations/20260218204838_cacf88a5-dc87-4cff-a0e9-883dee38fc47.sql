ALTER TABLE public.waiting_list
  ADD COLUMN IF NOT EXISTS outreach_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS invited_at timestamptz,
  ADD COLUMN IF NOT EXISTS checkout_url text,
  ADD COLUMN IF NOT EXISTS checkout_tier text,
  ADD COLUMN IF NOT EXISTS staff_notes text,
  ADD COLUMN IF NOT EXISTS stripe_session_id text;