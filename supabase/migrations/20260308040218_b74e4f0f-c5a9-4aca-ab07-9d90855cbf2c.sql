
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT NOT NULL,
  quotes_per_week TEXT,
  booking_time TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Australia/Sydney',
  status TEXT NOT NULL DEFAULT 'booked',
  zoom_link TEXT,
  zoom_meeting_id TEXT,
  staff_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert bookings" ON public.bookings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can read booking times" ON public.bookings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff can update bookings" ON public.bookings FOR UPDATE TO authenticated USING (public.is_pourhub_staff(auth.uid()));
CREATE POLICY "Staff can delete bookings" ON public.bookings FOR DELETE TO authenticated USING (public.is_pourhub_staff(auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
