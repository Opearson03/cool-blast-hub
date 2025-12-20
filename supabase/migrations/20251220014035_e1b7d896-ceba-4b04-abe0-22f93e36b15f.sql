-- Create feed_posts table for announcements
CREATE TABLE public.feed_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mentions UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view feed posts in their business"
ON public.feed_posts FOR SELECT
USING (business_id IN (
  SELECT business_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Authenticated users can create posts in their business"
ON public.feed_posts FOR INSERT
WITH CHECK (
  author_id = auth.uid() AND
  business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can update their own posts"
ON public.feed_posts FOR UPDATE
USING (author_id = auth.uid());

CREATE POLICY "Admins can delete any post, users can delete their own"
ON public.feed_posts FOR DELETE
USING (
  author_id = auth.uid() OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Add index for faster queries
CREATE INDEX idx_feed_posts_business_id ON public.feed_posts(business_id);
CREATE INDEX idx_feed_posts_created_at ON public.feed_posts(created_at DESC);