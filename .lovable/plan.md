

## Fix: Sub-Contractor Invite Link 404

### Root Cause
The `APP_URL` secret contains an incorrect value (includes `/xero` or a full path instead of just the base domain). All edge functions build invite links as `${APP_URL}/i/${token}`, so the generated URLs end up as `pourhub.com.au/xero/i/{token}` instead of `pourhub.com.au/i/{token}`, which doesn't match any route.

### Fix
Update the `APP_URL` secret to `https://pourhub.com.au` (no trailing path or slash).

No code changes are needed -- the edge functions (`send-subtrade-invite`, `send-batch-subtrade-invite`, `notify-subtrade-reschedule`) already strip trailing slashes via `.replace(/\/+$/, "")`. The only issue is the secret value itself.

### Affected Links
All invite types use `APP_URL`:
- Single sub-trade invites
- Batch sub-trade invites
- Reschedule notifications

Once updated, new invite links will be correct. Previously sent broken links will remain broken -- those subbies will need a resend.

