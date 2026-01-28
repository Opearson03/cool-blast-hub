-- Add batch support columns to external_invites
ALTER TABLE external_invites
  ADD COLUMN IF NOT EXISTS batch_id UUID DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS batch_token_hash TEXT DEFAULT NULL;

-- Index for efficient batch lookups
CREATE INDEX IF NOT EXISTS idx_external_invites_batch_id ON external_invites(batch_id);
CREATE INDEX IF NOT EXISTS idx_external_invites_batch_token_hash ON external_invites(batch_token_hash);