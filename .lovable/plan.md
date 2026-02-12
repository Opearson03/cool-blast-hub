

## Fix: Waitlist "Something went wrong" Error

### Root Cause
When someone joins the waitlist, the insert succeeds, but the code immediately tries to read back the inserted row (`.select('id, referral_code').single()`). The only SELECT policy on `waiting_list` requires `is_pourhub_staff(auth.uid())`, so anonymous/unauthenticated users can't read their own row back. This causes a Supabase error, which triggers the "Something went wrong" toast.

### Solution
Add a new RLS SELECT policy that allows users to read back their own row by matching on email. Since waitlist users are unauthenticated, the better approach is to create a database function (`SECURITY DEFINER`) that handles the insert and returns the `id` and `referral_code`, bypassing RLS for the read-back.

### Changes

**1. Database Migration** -- Create an RPC function `join_waitlist` that:
- Accepts email, full_name, business_name, and referred_by parameters
- Inserts into `waiting_list`
- Returns `id` and `referral_code` from the inserted row
- Uses `SECURITY DEFINER` so it can read back the data regardless of RLS
- Handles duplicate email gracefully (returns error)

**2. Update `WaitlistForm.tsx`** -- Replace the direct `.insert().select().single()` pattern with a call to `supabase.rpc('join_waitlist', { ... })`, which will return the `id` and `referral_code` without needing SELECT permissions.

### Technical Details

```sql
CREATE OR REPLACE FUNCTION public.join_waitlist(
  _email text,
  _full_name text DEFAULT NULL,
  _business_name text DEFAULT NULL,
  _referred_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _row waiting_list;
BEGIN
  INSERT INTO public.waiting_list (email, full_name, business_name, referred_by)
  VALUES (_email, _full_name, _business_name, _referred_by)
  RETURNING * INTO _row;
  
  RETURN jsonb_build_object('id', _row.id, 'referral_code', _row.referral_code);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('error', 'already_exists');
END;
$$;
```

In `WaitlistForm.tsx`, replace the direct insert + select with a single RPC call, and remove the separate duplicate-check query (the function handles it).
