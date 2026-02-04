-- Fix cross-business security vulnerabilities in RLS policies

-- 1. Fix pending_invites - add business_id check via invited_by
DROP POLICY IF EXISTS "Admins can manage invites" ON pending_invites;
CREATE POLICY "Admins can manage invites for their business" ON pending_invites
FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin') AND 
  invited_by IN (SELECT id FROM profiles WHERE business_id = get_user_business_id(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'admin') AND 
  invited_by = auth.uid()
);

-- 2. Fix employee_tickets - add business_id check via employee_id
DROP POLICY IF EXISTS "Admins can manage tickets" ON employee_tickets;
CREATE POLICY "Admins can manage tickets for their business" ON employee_tickets
FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin') AND 
  employee_id IN (SELECT id FROM profiles WHERE business_id = get_user_business_id(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'admin') AND 
  employee_id IN (SELECT id FROM profiles WHERE business_id = get_user_business_id(auth.uid()))
);

-- 3. Fix documents - add business_id check to admin delete policy
DROP POLICY IF EXISTS "Admins can delete documents" ON documents;
CREATE POLICY "Admins can delete documents in their business" ON documents
FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin') AND 
  business_id = get_user_business_id(auth.uid())
);

-- 4. Fix documents - add business_id check to staff upload policy
DROP POLICY IF EXISTS "Staff can upload documents" ON documents;
CREATE POLICY "Staff can upload documents to their business" ON documents
FOR INSERT TO authenticated
WITH CHECK (
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')) AND 
  business_id = get_user_business_id(auth.uid())
);

-- 5. Fix itp_templates - add business_id check (allow NULL for system templates)
DROP POLICY IF EXISTS "Admins can manage itp templates" ON itp_templates;
CREATE POLICY "Admins can manage their business itp templates" ON itp_templates
FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin') AND 
  (business_id IS NULL OR business_id = get_user_business_id(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'admin') AND 
  business_id = get_user_business_id(auth.uid())
);

-- 6. Fix swms_templates - add business_id check (allow NULL for system templates)
DROP POLICY IF EXISTS "Admins can manage swms templates" ON swms_templates;
CREATE POLICY "Admins can manage their business swms templates" ON swms_templates
FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin') AND 
  (business_id IS NULL OR business_id = get_user_business_id(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'admin') AND 
  business_id = get_user_business_id(auth.uid())
);

-- 7. Fix business_subscriptions - add business_id check
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON business_subscriptions;
CREATE POLICY "Admins can manage their own subscription" ON business_subscriptions
FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin') AND 
  business_id = get_user_business_id(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin') AND 
  business_id = get_user_business_id(auth.uid())
);

-- 8. Fix user_roles - add business_id check via user_id
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
CREATE POLICY "Admins can view roles in their business" ON user_roles
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin') AND 
  user_id IN (SELECT id FROM profiles WHERE business_id = get_user_business_id(auth.uid()))
);

-- 9. Fix waiting_list - restrict public access to staff only
DROP POLICY IF EXISTS "Users can view waitlist entries" ON waiting_list;
CREATE POLICY "Staff can view waitlist" ON waiting_list
FOR SELECT TO authenticated
USING (is_pourhub_staff(auth.uid()));