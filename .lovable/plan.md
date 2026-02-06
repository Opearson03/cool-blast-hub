
# Fix: Inbound Email Webhook Not Reaching Business Inbox

## Problem Identified

Emails sent to `jefconptyltd@pourhub.au` are arriving in the Resend received inbox but never reaching the PourHub business inbox. Investigation of the backend logs revealed the root cause:

```
POST | 404 | receive-test-email
```

The Resend webhook is correctly forwarding inbound emails to your backend, but the `receive-test-email` function (which processes all inbound emails) is returning a **404 Not Found** error. This means the function is not currently deployed, despite the code and configuration being present.

## Evidence

- **Jefcon business exists** with alias `jefconptyltd` -- routing would work if the function was live
- **No records** in any inbox tables (pending_plans, pending_documents, pending_general) for Jefcon
- **No function execution logs** -- confirming the function never ran
- **Edge logs show 404** -- the webhook request reaches the server but the function isn't found
- **All existing inbox records** (from the demo PourHub business) were created when the function was previously deployed and working

## Fix

### Step 1: Redeploy the `receive-test-email` edge function

The function code is complete and correct (1,002 lines covering plan detection, test results, delivery dockets, quote responses, and general emails). It simply needs to be redeployed to make it live again.

No code changes are needed -- just a redeployment.

### Step 2: Verify deployment with a test

After redeployment, send a test webhook call to confirm the function responds with a 200 status instead of 404.

### Step 3: Re-send the plans

Once the function is live, the client will need to re-send their plans to `jefconptyltd@pourhub.au` since the original email was lost (Resend received it but the webhook failed, so the data was never stored).

---

## Technical Details

| Item | Detail |
|------|--------|
| Function | `supabase/functions/receive-test-email/index.ts` |
| Config | `supabase/config.toml` -- already has `verify_jwt = false` |
| Business alias | `jefconptyltd` maps to business ID `b68994a9-...` |
| Action required | Redeploy edge function (no code changes) |

## Why This Happened

Edge functions can become undeployed if a previous build/deploy cycle failed or if the function was accidentally excluded from a deployment batch. The code and config have been intact the whole time, but the live deployment was missing.
