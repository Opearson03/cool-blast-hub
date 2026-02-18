
## Fix: Missing `waiting_list` Columns Causing Staff Portal Data Failure

### Root Cause

The last migration added new tracking columns to the `waiting_list` table, but those columns were never actually created. The live table is missing:

- `outreach_status`
- `invited_at`
- `checkout_url`
- `checkout_tier`
- `staff_notes`
- `stripe_session_id`

However, the `get_waiting_list_entries` RPC was rewritten to `SELECT` those columns. When the RPC runs, PostgreSQL throws an error because the columns don't exist — so the staff portal sees an error and shows no data at all.

### Fix: One Migration

Add the missing columns with safe defaults so the RPC can execute successfully and existing data is preserved:

```sql
ALTER TABLE public.waiting_list
  ADD COLUMN IF NOT EXISTS outreach_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS invited_at timestamptz,
  ADD COLUMN IF NOT EXISTS checkout_url text,
  ADD COLUMN IF NOT EXISTS checkout_tier text,
  ADD COLUMN IF NOT EXISTS staff_notes text,
  ADD COLUMN IF NOT EXISTS stripe_session_id text;
```

All 47 existing waitlist entries will automatically get `outreach_status = 'pending'`, which is correct — they haven't been contacted yet.

### No Frontend or RPC Changes Needed

The RPC, the `WaitlistTable`, and the `OnboardWaitlistModal` are all already written correctly for these columns. Once the columns exist, everything will work.

### Files to Change

| Target | Change |
|---|---|
| New database migration | Add the 6 missing columns to `waiting_list` |
