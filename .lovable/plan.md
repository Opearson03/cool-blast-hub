
## Fix: Remove Duplicate `join_waitlist` Function

### Root Cause

The database has two versions of `join_waitlist` living side by side:

1. Old version (4 params): `_email, _full_name, _business_name, _referred_by`
2. New version (5 params): `_email, _full_name, _business_name, _referred_by, _phone`

Because every parameter after `_email` has a `DEFAULT NULL`, both functions can match a call like `join_waitlist(_email := 'x', _full_name := 'y', ...)`. PostgreSQL raises an **ambiguous function call** error, which hits the catch block and shows "Something went wrong".

This happened because `CREATE OR REPLACE FUNCTION` only replaces a function if the signature matches exactly. Since the new migration added `_phone`, it created a brand new overload instead of replacing the old one.

### Fix: One Migration

Drop the old (4-parameter) overload so only the correct version remains:

```sql
DROP FUNCTION IF EXISTS public.join_waitlist(text, text, text, uuid);
NOTIFY pgrst, 'reload schema';
```

### No Frontend Changes Needed

`WaitlistForm.tsx` is already correct — it calls `join_waitlist` with 4 named parameters (no `_phone`), which will cleanly match the single remaining 5-parameter function (since `_phone` defaults to `NULL`).

### Files to Change

| Target | Change |
|---|---|
| New database migration | Drop the old 4-parameter `join_waitlist` overload |
