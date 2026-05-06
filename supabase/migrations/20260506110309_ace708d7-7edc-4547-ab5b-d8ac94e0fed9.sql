DROP POLICY IF EXISTS "Users can view itp templates" ON public.itp_templates;
CREATE POLICY "Authenticated users can view itp templates"
ON public.itp_templates
FOR SELECT
TO authenticated
USING (business_id IS NULL OR business_id = get_user_business_id(auth.uid()));