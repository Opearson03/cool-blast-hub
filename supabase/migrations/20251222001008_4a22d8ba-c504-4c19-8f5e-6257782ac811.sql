-- Add crew_mentions column to feed_posts for team-specific posts
ALTER TABLE public.feed_posts 
ADD COLUMN crew_mentions uuid[] DEFAULT '{}'::uuid[];

-- Add index for crew mentions filtering
CREATE INDEX idx_feed_posts_crew_mentions ON public.feed_posts USING GIN(crew_mentions);