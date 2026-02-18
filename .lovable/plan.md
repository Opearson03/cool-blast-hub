
## Fix: Update `join_waitlist` RPC to Accept Phone Number

### Root Cause

The `WaitlistForm.tsx` was updated to pass `_phone` to the `join_waitlist` RPC:
```typescript
_phone: phone.trim() || null,
```

But the database function was never updated to accept this parameter. PostgreSQL rejects any call with an unrecognised argument, causing the RPC to fail — which is why the form spins forever.

The `phone` column was correctly added to the `waiting_list` table in the last migration, but the `join_waitlist` function body still only inserts into `(email, full_name, business_name, referred_by)` — missing `phone`.

---

### Fix: One Migration

Update `join_waitlist` to add the `_phone` parameter and include it in the INSERT:

```sql
CREATE OR REPLACE FUNCTION public.join_waitlist(
  _email text,
  _full_name text DEFAULT NULL,
  _business_name text DEFAULT NULL,
  _referred_by uuid DEFAULT NULL,
  _phone text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _row waiting_list;
BEGIN
  INSERT INTO public.waiting_list (email, full_name, business_name, referred_by, phone)
  VALUES (_email, _full_name, _business_name, _referred_by, _phone)
  RETURNING * INTO _row;

  RETURN jsonb_build_object('id', _row.id, 'referral_code', _row.referral_code);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('error', 'already_exists');
END;
$$;

NOTIFY pgrst, 'reload schema';
```

---

### No Frontend Changes Needed

`WaitlistForm.tsx` is already passing `_phone` correctly. Once the database function is updated, signups will work immediately.

---

### Files to Change

| Target | Change |
|---|---|
| New database migration | Replace `join_waitlist` function with `_phone` parameter included in signature and INSERT |
