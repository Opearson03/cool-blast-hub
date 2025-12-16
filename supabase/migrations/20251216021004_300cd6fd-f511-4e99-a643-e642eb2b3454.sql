-- Update test-documents bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'test-documents';