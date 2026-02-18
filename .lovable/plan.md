
## Add Phone Number to Waitlist Signup & Staff Dashboard

### What Needs to Change

The `waiting_list` table has no `phone` column. The `join_waitlist` RPC inserts without phone, and `get_waiting_list_entries` returns without phone. Both the signup form and the staff table need updating.

---

### 1. Database Migration

**Add `phone` column to `waiting_list`:**
```sql
ALTER TABLE public.waiting_list ADD COLUMN phone text NULL;
```

**Update `join_waitlist` RPC** to accept and store the phone number:
```sql
CREATE OR REPLACE FUNCTION public.join_waitlist(
  _email text,
  _full_name text DEFAULT NULL,
  _business_name text DEFAULT NULL,
  _referred_by uuid DEFAULT NULL,
  _phone text DEFAULT NULL
) RETURNS jsonb ...
  INSERT INTO public.waiting_list (email, full_name, business_name, referred_by, phone)
  VALUES (_email, _full_name, _business_name, _referred_by, _phone)
  ...
```

The `_phone` parameter defaults to `NULL` so the existing V1 `join_waitlist` call from `WaitlistForm.tsx` (which currently doesn't pass phone) continues to work without change until we add the field.

**Update `get_waiting_list_entries` RPC** to return phone in the result set:
```sql
-- Add phone to the SELECT
SELECT w.id, w.email, w.full_name, w.business_name, w.phone, w.created_at, COALESCE(w.referral_count, 0)::integer
FROM public.waiting_list w
ORDER BY w.created_at DESC;
```

---

### 2. `src/components/waitlist/WaitlistForm.tsx`

- Add `phone` state variable.
- Add a phone input field between Business Name and the Submit button (optional field, labelled "Mobile Number").
- Pass `_phone: phone.trim() || null` to the `join_waitlist` RPC call.

---

### 3. `src/components/staff/WaitlistTable.tsx`

- Add `phone: string | null` to the `WaitlistEntry` interface.
- Add a **Phone** column header to the table.
- Render the phone value in each row — if present, make it a clickable `tel:` link. If absent, show `−`.
- Update the **CSV export** to include a "Phone" column.

---

### Files to Modify

| File | Change |
|---|---|
| Database migration | Add `phone` column; update `join_waitlist` and `get_waiting_list_entries` RPCs |
| `src/components/waitlist/WaitlistForm.tsx` | Add phone state + input field + pass to RPC |
| `src/components/staff/WaitlistTable.tsx` | Add phone to interface, table column, and CSV export |

No changes needed to `OnboardWaitlistModal`, `WaitlistStatus.tsx`, or any edge functions. The phone field is optional so existing entries without a phone number display gracefully.
