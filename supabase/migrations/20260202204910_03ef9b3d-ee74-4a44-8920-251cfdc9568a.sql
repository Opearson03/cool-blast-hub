-- Fix foreign key constraints on pending_test_results for linked_pour_id to allow pour deletion
ALTER TABLE public.pending_test_results
DROP CONSTRAINT IF EXISTS pending_test_results_linked_pour_id_fkey;

ALTER TABLE public.pending_test_results
ADD CONSTRAINT pending_test_results_linked_pour_id_fkey
FOREIGN KEY (linked_pour_id) REFERENCES public.job_pours(id) ON DELETE SET NULL;

-- Fix foreign key constraints on pending_documents for linked_pour_id to allow pour deletion
ALTER TABLE public.pending_documents
DROP CONSTRAINT IF EXISTS pending_documents_linked_pour_id_fkey;

ALTER TABLE public.pending_documents
ADD CONSTRAINT pending_documents_linked_pour_id_fkey
FOREIGN KEY (linked_pour_id) REFERENCES public.job_pours(id) ON DELETE SET NULL;