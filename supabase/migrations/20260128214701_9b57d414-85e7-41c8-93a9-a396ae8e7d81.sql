-- Add match_status columns to pending_test_results for auto-matching
ALTER TABLE pending_test_results 
  ADD COLUMN match_status TEXT DEFAULT 'pending',
  ADD COLUMN matched_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  ADD COLUMN matched_pour_id UUID REFERENCES job_pours(id) ON DELETE SET NULL,
  ADD COLUMN match_confidence NUMERIC;

-- Add match_status columns to pending_documents for auto-matching
ALTER TABLE pending_documents 
  ADD COLUMN match_status TEXT DEFAULT 'pending',
  ADD COLUMN match_confidence NUMERIC;

-- Note: linked_job_id and linked_pour_id already exist on pending_documents

-- Create indexes for faster lookups by match_status
CREATE INDEX idx_pending_test_results_match_status ON pending_test_results(match_status);
CREATE INDEX idx_pending_documents_match_status ON pending_documents(match_status);
CREATE INDEX idx_pending_test_results_matched_job ON pending_test_results(matched_job_id);
CREATE INDEX idx_pending_documents_matched_job ON pending_documents(linked_job_id);

-- Comment: match_status can be:
-- 'pending' - No match found, needs manual assignment
-- 'job_matched' - Address matched to a job, but date didn't match any pour
-- 'auto_matched' - Both address and date matched, can be auto-approved