
-- Channel types
DO $$ BEGIN
  CREATE TYPE public.chat_channel_type AS ENUM ('team','crew','dm');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Channels
CREATE TABLE IF NOT EXISTS public.chat_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  type public.chat_channel_type NOT NULL,
  crew_id uuid REFERENCES public.crews(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, type, crew_id)
);
CREATE INDEX IF NOT EXISTS idx_chat_channels_business ON public.chat_channels(business_id);

-- Members
CREATE TABLE IF NOT EXISTS public.chat_channel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_chat_members_user ON public.chat_channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_channel ON public.chat_channel_members(channel_id);

-- Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text,
  attachment_url text,
  attachment_type text,
  mentions uuid[] DEFAULT '{}',
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created ON public.chat_messages(channel_id, created_at DESC);

-- Helper: is user a member of channel
CREATE OR REPLACE FUNCTION public.is_channel_member(_user_id uuid, _channel_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_channel_members
    WHERE channel_id = _channel_id AND user_id = _user_id
  );
$$;

-- Helper: get channel business
CREATE OR REPLACE FUNCTION public.get_channel_business(_channel_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT business_id FROM public.chat_channels WHERE id = _channel_id;
$$;

-- RLS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view channels"
  ON public.chat_channels FOR SELECT TO authenticated
  USING (public.is_channel_member(auth.uid(), id) OR (has_role(auth.uid(),'admin') AND business_id = get_user_business_id(auth.uid())));

CREATE POLICY "Admins manage channels"
  ON public.chat_channels FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') AND business_id = get_user_business_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(),'admin') AND business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Users can view their memberships"
  ON public.chat_channel_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_channel_member(auth.uid(), channel_id)
    OR (has_role(auth.uid(),'admin') AND public.get_channel_business(channel_id) = get_user_business_id(auth.uid()))
  );

CREATE POLICY "Users update own membership"
  ON public.chat_channel_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins manage members"
  ON public.chat_channel_members FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') AND public.get_channel_business(channel_id) = get_user_business_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(),'admin') AND public.get_channel_business(channel_id) = get_user_business_id(auth.uid()));

CREATE POLICY "Members read messages"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (public.is_channel_member(auth.uid(), channel_id));

CREATE POLICY "Members send messages"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_channel_member(auth.uid(), channel_id));

CREATE POLICY "Sender edits own messages"
  ON public.chat_messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid()) WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Sender or admin deletes message"
  ON public.chat_messages FOR DELETE TO authenticated
  USING (
    sender_id = auth.uid()
    OR (has_role(auth.uid(),'admin') AND public.get_channel_business(channel_id) = get_user_business_id(auth.uid()))
  );

-- Trigger: ensure team channel exists for a business and add a profile to it
CREATE OR REPLACE FUNCTION public.ensure_team_channel(_business_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  SELECT id INTO _id FROM public.chat_channels
    WHERE business_id = _business_id AND type = 'team' LIMIT 1;
  IF _id IS NULL THEN
    INSERT INTO public.chat_channels (business_id, type, name)
    VALUES (_business_id, 'team', 'Team') RETURNING id INTO _id;
  END IF;
  RETURN _id;
END $$;

-- When a profile is created/updated with a business_id, add to team channel
CREATE OR REPLACE FUNCTION public.add_profile_to_team_channel()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _channel uuid;
BEGIN
  IF NEW.business_id IS NULL THEN RETURN NEW; END IF;
  _channel := public.ensure_team_channel(NEW.business_id);
  INSERT INTO public.chat_channel_members (channel_id, user_id)
  VALUES (_channel, NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_profile_team_channel ON public.profiles;
CREATE TRIGGER trg_profile_team_channel
AFTER INSERT OR UPDATE OF business_id ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.add_profile_to_team_channel();

-- When a crew is created, create matching channel
CREATE OR REPLACE FUNCTION public.create_crew_channel()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.chat_channels (business_id, type, crew_id, name)
  VALUES (NEW.business_id, 'crew', NEW.id, NEW.name)
  ON CONFLICT (business_id, type, crew_id) DO UPDATE SET name = EXCLUDED.name;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_crew_channel ON public.crews;
CREATE TRIGGER trg_crew_channel
AFTER INSERT OR UPDATE OF name ON public.crews
FOR EACH ROW EXECUTE FUNCTION public.create_crew_channel();

-- When crew member added/removed, sync chat membership
CREATE OR REPLACE FUNCTION public.sync_crew_chat_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _channel uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT id INTO _channel FROM public.chat_channels WHERE crew_id = NEW.crew_id;
    IF _channel IS NOT NULL THEN
      INSERT INTO public.chat_channel_members (channel_id, user_id)
      VALUES (_channel, NEW.employee_id) ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT id INTO _channel FROM public.chat_channels WHERE crew_id = OLD.crew_id;
    IF _channel IS NOT NULL THEN
      DELETE FROM public.chat_channel_members
        WHERE channel_id = _channel AND user_id = OLD.employee_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_crew_member_chat_sync ON public.crew_members;
CREATE TRIGGER trg_crew_member_chat_sync
AFTER INSERT OR DELETE ON public.crew_members
FOR EACH ROW EXECUTE FUNCTION public.sync_crew_chat_member();

-- Backfill: team channel for every business + add all existing profiles
DO $$
DECLARE b RECORD; ch uuid;
BEGIN
  FOR b IN SELECT id FROM public.businesses LOOP
    ch := public.ensure_team_channel(b.id);
    INSERT INTO public.chat_channel_members (channel_id, user_id)
    SELECT ch, p.id FROM public.profiles p WHERE p.business_id = b.id
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Backfill: crew channels + members
DO $$
DECLARE c RECORD; ch uuid;
BEGIN
  FOR c IN SELECT * FROM public.crews LOOP
    INSERT INTO public.chat_channels (business_id, type, crew_id, name)
    VALUES (c.business_id, 'crew', c.id, c.name)
    ON CONFLICT (business_id, type, crew_id) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO ch;
    INSERT INTO public.chat_channel_members (channel_id, user_id)
    SELECT ch, cm.employee_id FROM public.crew_members cm WHERE cm.crew_id = c.id
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Mark channel as read
CREATE OR REPLACE FUNCTION public.mark_channel_read(_channel_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.chat_channel_members
  SET last_read_at = now()
  WHERE channel_id = _channel_id AND user_id = auth.uid();
$$;

-- Get or create DM channel between current user and other user (same business)
CREATE OR REPLACE FUNCTION public.get_or_create_dm(_other_user uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _me uuid := auth.uid();
  _biz uuid;
  _other_biz uuid;
  _channel uuid;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT business_id INTO _biz FROM public.profiles WHERE id = _me;
  SELECT business_id INTO _other_biz FROM public.profiles WHERE id = _other_user;
  IF _biz IS NULL OR _biz <> _other_biz THEN
    RAISE EXCEPTION 'Users not in same business';
  END IF;

  -- Find existing DM where both are members
  SELECT c.id INTO _channel
  FROM public.chat_channels c
  WHERE c.type = 'dm' AND c.business_id = _biz
    AND EXISTS (SELECT 1 FROM public.chat_channel_members WHERE channel_id = c.id AND user_id = _me)
    AND EXISTS (SELECT 1 FROM public.chat_channel_members WHERE channel_id = c.id AND user_id = _other_user)
    AND (SELECT COUNT(*) FROM public.chat_channel_members WHERE channel_id = c.id) = 2
  LIMIT 1;

  IF _channel IS NULL THEN
    INSERT INTO public.chat_channels (business_id, type, name, created_by)
    VALUES (_biz, 'dm', 'Direct Message', _me) RETURNING id INTO _channel;
    INSERT INTO public.chat_channel_members (channel_id, user_id) VALUES (_channel, _me);
    INSERT INTO public.chat_channel_members (channel_id, user_id) VALUES (_channel, _other_user);
  END IF;
  RETURN _channel;
END $$;

-- updated_at triggers
DROP TRIGGER IF EXISTS trg_chat_channels_updated_at ON public.chat_channels;
CREATE TRIGGER trg_chat_channels_updated_at BEFORE UPDATE ON public.chat_channels
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_channel_members REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channel_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channels;

-- Storage bucket for chat attachments (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated can upload to chat-attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated can read chat-attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'chat-attachments');

CREATE POLICY "Owner can delete chat-attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
