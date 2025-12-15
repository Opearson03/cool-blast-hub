-- Make documents bucket public so ITP photos can be viewed
UPDATE storage.buckets SET public = true WHERE id = 'documents';

-- Add RLS policies for the documents bucket
CREATE POLICY "Staff can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'))
);

CREATE POLICY "Users can view documents in their business"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND auth.uid() IN (
    SELECT p.id FROM profiles p
    WHERE p.business_id IN (
      SELECT p2.business_id FROM profiles p2 WHERE p2.id = auth.uid()
    )
  )
);

CREATE POLICY "Staff can update documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents'
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'))
);

CREATE POLICY "Staff can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'))
);