-- Allow users to select waitlist entries (needed for returning referral_code after insert)
CREATE POLICY "Users can view waitlist entries"
  ON public.waiting_list
  FOR SELECT
  TO anon, authenticated
  USING (true);