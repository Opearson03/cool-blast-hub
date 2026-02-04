
# Plan: Business Alias Email Addresses for Outbound Communications ✅ COMPLETED

## Overview

Change outbound business emails from using a generic `Hello@pourhub.au` address to using each business's unique alias email address (e.g., `jefconptyltd@pourhub.au`). This makes emails appear more personalized and allows for reply routing.

## Current vs Proposed

| Current | Proposed |
|---------|----------|
| `Jefcon Pty Ltd via Pourhub <Hello@pourhub.au>` | `Jefcon Pty Ltd <jefconptyltd@pourhub.au>` |

## Implementation Summary

All 9 edge functions have been updated to use business-specific email aliases:

### Edge Functions Updated (Business Communications)

| Function | Purpose | Status |
|----------|---------|--------|
| `send-estimate-email` | Quotes to clients | ✅ Done |
| `send-variation-email` | Variations to clients | ✅ Done |
| `send-purchase-order` | POs/RFQs to suppliers | ✅ Done |
| `send-subtrade-invite` | Subbie invites | ✅ Done |
| `send-batch-subtrade-invite` | Batch subbie invites | ✅ Done |
| `notify-subtrade-reschedule` | Reschedule notifications | ✅ Done |
| `respond-subtrade-invite` | Response confirmations | ✅ Done |
| `send-site-visit-email` | Site visit scheduling | ✅ Done |
| `submit-signature` | Signed quote confirmations | ✅ Done |

### Frontend Components Updated

| Component | Change |
|-----------|--------|
| `EstimateDetailSheet.tsx` | Fetches and passes `inbound_email_alias` to email functions |
| `QuickSiteVisitDialog.tsx` | Fetches and passes `inbound_email_alias` to site visit email |

### Edge Functions Unchanged (System Emails)

These continue using `Hello@pourhub.au` as they are PourHub system communications:

- `send-invite-email` (employee invites)
- `send-password-reset` (password reset)
- `send-waitlist-welcome` (waitlist)
- `send-position-update` (waitlist position)
- `send-referral-invite` (referrals)
- `notify-referral-success` (referrals)
- `send-feedback` (feedback submissions)

## Technical Implementation

### Pattern Applied to Each Function

```typescript
// Use business-specific alias if available
const fromEmail = business?.inbound_email_alias 
  ? `${business.inbound_email_alias}@pourhub.au`
  : 'Hello@pourhub.au';

await resend.emails.send({
  from: `${businessName} <${fromEmail}>`,
  // ...
});
```

### Database Queries Updated

Each function now includes `inbound_email_alias` in the business select:

```typescript
.select("name, logo_url, email, inbound_email_alias")
```

## Result

After implementation:
- Client receives quote from: `Jefcon Pty Ltd <jefconptyltd@pourhub.au>`
- If client replies, it routes to that business's inbox
- Each business has their own unique, professional email identity
- System emails (password reset, invites, etc.) remain as PourHub-branded
