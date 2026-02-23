
## Making Accepted Invites Appear on Registered Subcontractor Schedules

### How It Works Today

The system already supports this! Here is the flow:

1. Business invites a subcontractor to a pour (sends SMS/email with a link)
2. Subcontractor accepts via the public link OR via their authenticated portal ("My Work" tab)
3. The Schedule page fetches accepted invites by matching the subcontractor's **profile email/phone** against the invite's **recipient email/phone**
4. Accepted invites with matching contact details already appear on the schedule

### The Problem

If the business uses a slightly different email or phone number than what the subcontractor registered with (e.g. `john@gmail.com` vs `john.smith@gmail.com`), the invite won't appear on their schedule -- even though they accepted it.

### The Fix

Improve the `subcontractor-get-invites` edge function to also match invites that were **responded to via the authenticated portal**. When a subcontractor accepts via "My Work", the `subcontractor-respond-invite` edge function already verifies ownership. We can tag those invites with the subcontractor's `user_id` so the schedule can find them even if contact details don't match exactly.

### Changes

**1. Database Migration -- Add `responder_user_id` column to `external_invites`**

Add an optional column to track which authenticated user responded to the invite:
```sql
ALTER TABLE external_invites ADD COLUMN responder_user_id uuid;
```

**2. Edge Function: `subcontractor-respond-invite`**

When a subcontractor accepts/declines via the portal, store their `user_id` on the invite:
```sql
UPDATE external_invites
SET status = response, responded_at = now(), responder_user_id = user.id
WHERE id = invite_id;
```

**3. Edge Function: `subcontractor-get-invites`**

Expand the query to also match invites by `responder_user_id`:
- Current: match by `recipient_email` OR `recipient_phone`
- New: match by `recipient_email` OR `recipient_phone` OR `responder_user_id = user.id`

This ensures that any invite a subcontractor accepted through their portal always appears on their schedule, regardless of contact detail mismatches.

### Files Modified

| File | Change |
|---|---|
| New migration | Add `responder_user_id` column to `external_invites` |
| `supabase/functions/subcontractor-respond-invite/index.ts` | Set `responder_user_id` when updating invite status |
| `supabase/functions/subcontractor-get-invites/index.ts` | Add `responder_user_id` match to the query filter |

### What This Means for Users

- If a registered subcontractor accepts a job through their "My Work" portal, it will **always** appear on their Schedule -- guaranteed
- If they accept via the public SMS/email link, it will still appear as long as the email or phone matches (same as today)
- No changes needed to the Schedule page UI -- it already displays accepted invites correctly
