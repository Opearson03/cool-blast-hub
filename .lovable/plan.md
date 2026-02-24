

## Fix: Subcontractor Role Not Being Assigned on Signup

### Root Cause
The `user_roles` table has Row-Level Security enabled but **no INSERT policy**. When the signup code runs:
```tsx
await supabase.from("user_roles").insert({ user_id: data.user.id, role: "subcontractor" });
```
RLS silently blocks the insert. The user account is created, but has no `subcontractor` role. When they try to log in, the `is_subcontractor` check returns false, showing "this account does not have subcontractor access".

### Solution
Create a database function that assigns the subcontractor role using `SECURITY DEFINER` (bypasses RLS safely), and call it from the signup code instead of a direct table insert.

### Changes

**1. Database Migration -- Create a secure role-assignment function**
```sql
CREATE OR REPLACE FUNCTION public.assign_subcontractor_role(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'subcontractor')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;
```

**2. `src/pages/subcontractors/SubcontractorSignup.tsx`**
Replace the direct `user_roles` insert (lines 109-113) with an RPC call:
```tsx
await supabase.rpc("assign_subcontractor_role", { _user_id: data.user.id });
```

This mirrors the pattern used elsewhere in the app (e.g., `has_role` is already a SECURITY DEFINER function).

