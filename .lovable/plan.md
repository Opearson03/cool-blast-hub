

## Update Email Domain to @contact.pourhub.com.au

### Overview
Change all email sending and receiving from `@pourhub.au` to `@contact.pourhub.com.au` across the entire codebase, and update the Resend API key to match the new domain's Resend account.

### Step 1: Update Resend API Key
- Use the secret update tool to let you enter the new `RESEND_API_KEY` for the `contact.pourhub.com.au` domain

### Step 2: Update Edge Functions (20 files)
Replace every `@pourhub.au` reference with `@contact.pourhub.com.au` in all edge functions:

| File | What changes |
|------|-------------|
| `send-waitlist-welcome` | `from: "PourHub <hello@pourhub.au>"` |
| `send-waitlist-invite` | `from` and `reply_to` addresses |
| `send-invite-email` | `from: "PourHub <Hello@pourhub.au>"` |
| `send-feedback` | `from: "PourHub Feedback <Hello@pourhub.au>"` |
| `send-password-reset` | `from: "PourHub <Hello@pourhub.au>"` |
| `send-estimate-email` | Business alias pattern + fallback |
| `send-variation-email` | Fallback address + footer link |
| `send-site-visit-email` | Business alias pattern + fallback |
| `send-misc-job-confirmation` | Business alias pattern + fallback |
| `send-purchase-order` | Business alias pattern + fallback |
| `send-subtrade-invite` | Business alias pattern + fallback |
| `send-batch-subtrade-invite` | Business alias pattern + fallback |
| `respond-subtrade-invite` | 4 occurrences of alias pattern + fallback |
| `notify-subtrade-reschedule` | Business alias pattern + fallback |
| `notify-referral-success` | `from` address |
| `send-position-update` | `from` address |
| `send-referral-invite` | `from` address |
| `send-crm-email` | `from` and `reply_to` addresses |
| `receive-test-email` | Inbound routing logic (`hello` alias check) |
| `receive-crm-reply` | Any inbound domain references |

The pattern used across most files is:
```
// Business-specific alias
`${business.inbound_email_alias}@pourhub.au`
// Fallback
'Hello@pourhub.au'
```
Both become `@contact.pourhub.com.au`.

### Step 3: Update Frontend (2 files)
- `src/pages/admin/AdminSettings.tsx` -- update the displayed email address pattern from `@pourhub.au` to `@contact.pourhub.com.au`
- `src/components/settings/TestResultEmailSection.tsx` -- same display update

### Step 4: Deploy All Updated Edge Functions
Redeploy all modified edge functions in one batch.

### Prerequisites (on your side before approving)
- The new domain `contact.pourhub.com.au` must be verified in Resend with DNS records (MX, SPF, DKIM) configured
- You need the new Resend API key ready to paste when prompted
- If using inbound email (document inbox), the Resend inbound webhook must be configured for the new domain

### Technical Notes
- No database schema changes needed -- the `inbound_email_alias` column stores only the prefix (e.g. `jefconptyltd`), the domain suffix is hardcoded in edge functions, so only code changes are required
- The `receive-test-email` function handles inbound routing and needs its domain checks updated for the new domain
- All ~20 edge functions will be redeployed after the changes
