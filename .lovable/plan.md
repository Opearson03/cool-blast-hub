

## Fix Waitlist "Converted" Status Detection

### Problem
5 waitlist members have signed up and have active subscriptions, but their status still shows "invited" instead of "converted". The conversion was supposed to happen via the Stripe webhook (`checkout.session.completed`), but the webhook either didn't fire or the email match failed. The `stripe_session_id` column is null for all 5.

### Solution (two-part fix)

**1. Immediate data fix -- update the 5 existing entries**

Run an UPDATE that cross-references `waiting_list` emails against `auth.users` who have a business with an active subscription, and set their `outreach_status` to "converted".

**2. Resilient detection -- update the `get_waiting_list_entries` RPC**

Modify the `get_waiting_list_entries` database function so the returned `outreach_status` is computed dynamically: if a waitlist email matches a user who has an active business subscription, return "converted" regardless of the stored status. This makes the staff dashboard self-healing -- it won't rely solely on the webhook having fired correctly.

### Technical Detail

**Migration SQL:**

```sql
-- Part 1: Fix existing data
UPDATE waiting_list w
SET outreach_status = 'converted'
FROM auth.users u
JOIN profiles p ON p.id = u.id
JOIN business_subscriptions bs ON bs.business_id = p.business_id
WHERE LOWER(u.email) = LOWER(w.email)
  AND bs.status IN ('active', 'trialing')
  AND w.outreach_status != 'converted';

-- Part 2: Update the RPC to auto-detect conversions
CREATE OR REPLACE FUNCTION public.get_waiting_list_entries()
RETURNS TABLE(...) -- same signature
AS $$
  -- Add a CASE that overrides outreach_status to 'converted'
  -- when the email exists in auth.users with an active subscription
$$;
```

No frontend changes needed -- the `WaitlistTable` component already reads from this RPC and renders the status badge based on the returned `outreach_status`.
