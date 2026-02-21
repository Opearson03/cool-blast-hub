

## Fix: Route `hello@pourhub.au` Emails to CRM Inbox

### The Problem

The logs reveal that emails sent to `hello@pourhub.au` are being received by the **`receive-test-email`** function (the business inbox handler), not by `receive-crm-reply`. This is because Resend has a single inbound webhook configured for all `*@pourhub.au` addresses, and it points to `receive-test-email`.

When `receive-test-email` receives an email to `hello@pourhub.au`, it extracts the alias `hello`, tries to look up a business with that alias, finds none, and returns a 404 error. The email is silently dropped.

Meanwhile, `receive-crm-reply` never receives any requests at all.

### The Fix

Update `receive-test-email` to detect when the recipient is `hello@pourhub.au` (or any non-business alias) and forward those emails into the `crm_inbox` table -- the same logic currently in `receive-crm-reply`.

### Changes

| File | What Changes |
|---|---|
| `supabase/functions/receive-test-email/index.ts` | After extracting the alias and before the business lookup fails, check if the alias is `hello`. If so, insert the email into `crm_inbox` (with campaign matching) and return success instead of a 404 error. |

### Technical Details

In `receive-test-email/index.ts`, around line 810-825 (after extracting the alias and before the business lookup), add a handler:

```
if (alias === 'hello') {
  // Route to CRM inbox instead of business inbox
  // Parse sender, insert into crm_inbox, match to campaign
  return Response with success
}
```

This will:
- Parse the `from` field to extract `from_email` and `from_name`
- Try to match the sender to a recent CRM campaign via `crm_email_recipients`
- Insert the email into the `crm_inbox` table
- Return a success response

No changes to `receive-crm-reply` are needed -- it can remain as a fallback if you later add a separate Resend webhook for it.

### Why This Approach

- Only **one file** needs to change
- No external Resend configuration changes required
- The existing business inbox routing continues to work exactly as before for all other aliases
- Both inboxes (business and CRM) work side-by-side through the same webhook endpoint
