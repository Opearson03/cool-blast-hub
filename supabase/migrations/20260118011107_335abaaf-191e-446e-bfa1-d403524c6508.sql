-- Add referral columns to waiting_list table
ALTER TABLE public.waiting_list ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.waiting_list ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.waiting_list(id);
ALTER TABLE public.waiting_list ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

-- Create function to generate unique referral codes
CREATE OR REPLACE FUNCTION public.generate_waitlist_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate code like POUR-A7X3
    new_code := 'POUR-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
    SELECT EXISTS(SELECT 1 FROM public.waiting_list WHERE referral_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  NEW.referral_code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-generate referral codes
DROP TRIGGER IF EXISTS set_waitlist_referral_code ON public.waiting_list;
CREATE TRIGGER set_waitlist_referral_code
  BEFORE INSERT ON public.waiting_list
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_waitlist_referral_code();

-- Create function to increment referrer's count
CREATE OR REPLACE FUNCTION public.increment_waitlist_referral_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referred_by IS NOT NULL THEN
    UPDATE public.waiting_list 
    SET referral_count = referral_count + 1 
    WHERE id = NEW.referred_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update referral count
DROP TRIGGER IF EXISTS update_waitlist_referral_count ON public.waiting_list;
CREATE TRIGGER update_waitlist_referral_count
  AFTER INSERT ON public.waiting_list
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_waitlist_referral_count();

-- Create function to lookup referrer by code (for frontend use)
CREATE OR REPLACE FUNCTION public.get_referrer_by_code(code TEXT)
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.waiting_list WHERE referral_code = code LIMIT 1;
$$;