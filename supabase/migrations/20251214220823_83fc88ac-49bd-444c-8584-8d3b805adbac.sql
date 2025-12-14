-- Create storage bucket for employee ticket documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-tickets', 'employee-tickets', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own ticket documents
CREATE POLICY "Users can upload their own ticket documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'employee-tickets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own ticket documents
CREATE POLICY "Users can view their own ticket documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'employee-tickets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own ticket documents
CREATE POLICY "Users can delete their own ticket documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'employee-tickets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to view all ticket documents in their business
CREATE POLICY "Admins can view all ticket documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'employee-tickets'
  AND has_role(auth.uid(), 'admin'::app_role)
);