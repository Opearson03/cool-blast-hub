-- Fix foreign key constraints on pending_test_results to allow job deletion
ALTER TABLE public.pending_test_results
DROP CONSTRAINT IF EXISTS pending_test_results_linked_job_id_fkey;

ALTER TABLE public.pending_test_results
ADD CONSTRAINT pending_test_results_linked_job_id_fkey
FOREIGN KEY (linked_job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;

-- Fix foreign key constraints on pending_documents to allow job deletion
ALTER TABLE public.pending_documents
DROP CONSTRAINT IF EXISTS pending_documents_linked_job_id_fkey;

ALTER TABLE public.pending_documents
ADD CONSTRAINT pending_documents_linked_job_id_fkey
FOREIGN KEY (linked_job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;