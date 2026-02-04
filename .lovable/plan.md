
# Plan: Fix Cross-Business Security Vulnerabilities

## Overview

This plan addresses security issues that could allow one business to access or modify another business's data. I've identified vulnerabilities in both RLS policies and edge functions.

---

## Issues Identified

### Critical RLS Policy Gaps

| Table | Policy Name | Issue |
|-------|-------------|-------|
| `pending_invites` | Admins can manage invites | Checks for admin role but **no business_id check** - an admin from Business A could modify invites for Business B |
| `employee_tickets` | Admins can manage tickets | Checks for admin role but **no business_id check** - cross-business access possible |
| `documents` | Admins can delete documents | Checks for admin role but **no business_id check** |
| `documents` | Staff can upload documents | Checks for staff/admin role but **no business_id check** |
| `itp_templates` | Admins can manage itp templates | Checks for admin role but **no business_id check** - admin could modify another business's templates |
| `swms_templates` | Admins can manage swms templates | Checks for admin role but **no business_id check** |
| `business_subscriptions` | Admins can manage subscriptions | Checks for admin role but **no business_id check** - admin could modify other businesses' subscriptions |
| `user_roles` | Admins can view all roles | Checks for admin role but **no business_id check** - could view roles from other businesses |
| `waiting_list` | Users can view waitlist entries | Public SELECT with `USING (true)` exposes all email addresses to anyone |

### Edge Function Authentication Gaps

| Function | Issue |
|----------|-------|
| `send-estimate-email` | No JWT validation - anyone with an estimate ID could trigger emails and modify estimate status |
| `scan-test-document` | No authentication - allows unauthorized AI credit consumption |

---

## Changes Required

### 1. Database Migration: Fix RLS Policies

Update all vulnerable policies to include proper `business_id` validation.

#### Fix `pending_invites` Policy
```sql
DROP POLICY "Admins can manage invites" ON pending_invites;
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
```

#### Fix `employee_tickets` Policy
```sql
DROP POLICY "Admins can manage tickets" ON employee_tickets;
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
```

#### Fix `documents` Policies
```sql
DROP POLICY "Admins can delete documents" ON documents;
CREATE POLICY "Admins can delete documents in their business" ON documents
FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin') AND 
  business_id = get_user_business_id(auth.uid())
);

DROP POLICY "Staff can upload documents" ON documents;
CREATE POLICY "Staff can upload documents to their business" ON documents
FOR INSERT TO authenticated
WITH CHECK (
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')) AND 
  business_id = get_user_business_id(auth.uid())
);
```

#### Fix `itp_templates` Policy
```sql
DROP POLICY "Admins can manage itp templates" ON itp_templates;
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
```

#### Fix `swms_templates` Policy
```sql
DROP POLICY "Admins can manage swms templates" ON swms_templates;
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
```

#### Fix `business_subscriptions` Policy
```sql
DROP POLICY "Admins can manage subscriptions" ON business_subscriptions;
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
```

#### Fix `user_roles` Policy
```sql
DROP POLICY "Admins can view all roles" ON user_roles;
CREATE POLICY "Admins can view roles in their business" ON user_roles
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin') AND 
  user_id IN (SELECT id FROM profiles WHERE business_id = get_user_business_id(auth.uid()))
);
```

#### Fix `waiting_list` Policy (Restrict Public Access)
```sql
DROP POLICY "Users can view waitlist entries" ON waiting_list;
-- Only PourHub staff can view the full waitlist
CREATE POLICY "Staff can view waitlist" ON waiting_list
FOR SELECT TO authenticated
USING (is_pourhub_staff(auth.uid()));
```

---

### 2. Edge Function: Add Authentication to `send-estimate-email`

**File:** `supabase/functions/send-estimate-email/index.ts`

Add JWT validation and verify the estimate belongs to the caller's business:

```typescript
// Add at the start of the handler after CORS check
const authHeader = req.headers.get("Authorization");
if (!authHeader?.startsWith("Bearer ")) {
  return new Response(
    JSON.stringify({ error: "Missing authorization" }),
    { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
}

const token = authHeader.replace("Bearer ", "");

// Create user-scoped client to validate JWT
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: authHeader } },
});

const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
if (authError || !user) {
  return new Response(
    JSON.stringify({ error: "Invalid authentication" }),
    { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
}

// Verify estimate belongs to user's business
const { data: estimate } = await supabase
  .from("estimates")
  .select("id, business_id")
  .eq("id", estimateId)
  .single();

const { data: profile } = await supabase
  .from("profiles")
  .select("business_id")
  .eq("id", user.id)
  .single();

if (!estimate || !profile || estimate.business_id !== profile.business_id) {
  return new Response(
    JSON.stringify({ error: "Estimate not found or access denied" }),
    { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
}
```

---

### 3. Edge Function: Add Authentication to `scan-test-document`

**File:** `supabase/functions/scan-test-document/index.ts`

Add JWT validation to prevent unauthorized AI credit consumption:

```typescript
// Add after CORS check
const authHeader = req.headers.get("Authorization");
if (!authHeader?.startsWith("Bearer ")) {
  return new Response(
    JSON.stringify({ success: false, error: "Missing authorization" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

const token = authHeader.replace("Bearer ", "");

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: authHeader } },
});

const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
if (authError || !user) {
  return new Response(
    JSON.stringify({ success: false, error: "Invalid authentication" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

console.log(`User ${user.id} scanning document:`, pdfUrl);
```

---

## Summary of Changes

| File | Change |
|------|--------|
| **New Migration** | Fix 9 vulnerable RLS policies to add `business_id` checks |
| `send-estimate-email/index.ts` | Add JWT validation + business ownership verification |
| `scan-test-document/index.ts` | Add JWT validation to prevent unauthorized access |

---

## Security Impact

After implementing these changes:

- Admins from Business A can no longer modify invites, tickets, documents, or templates belonging to Business B
- Subscription manipulation attacks will be blocked
- Email enumeration via waiting_list will be prevented
- Unauthorized API credit consumption will be blocked
- Estimate email sending will require proper authentication and ownership

