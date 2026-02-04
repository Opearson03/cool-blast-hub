
# Plan: Business Alias Email Addresses for Outbound Communications

## Overview

Change outbound business emails from using a generic `Hello@pourhub.au` address to using each business's unique alias email address (e.g., `jefconptyltd@pourhub.au`). This makes emails appear more personalized and allows for reply routing.

## Current vs Proposed

| Current | Proposed |
|---------|----------|
| `Jefcon Pty Ltd via Pourhub <Hello@pourhub.au>` | `Jefcon Pty Ltd <jefconptyltd@pourhub.au>` |

## Scope

### Edge Functions to Update (Business Communications)

| Function | Purpose | Change |
|----------|---------|--------|
| `send-estimate-email` | Quotes to clients | Use business alias |
| `send-variation-email` | Variations to clients | Use business alias |
| `send-purchase-order` | POs/RFQs to suppliers | Use business alias |
| `send-subtrade-invite` | Subbie invites | Use business alias |
| `send-batch-subtrade-invite` | Batch subbie invites | Use business alias |
| `notify-subtrade-reschedule` | Reschedule notifications | Use business alias |
| `respond-subtrade-invite` | Response confirmations | Use business alias |
| `send-site-visit-email` | Site visit scheduling | Use business alias |
| `submit-signature` | Signed quote confirmations | Use business alias |

### Edge Functions to Leave Unchanged (System Emails)

These will continue using `Hello@pourhub.au` as they are PourHub system communications:

- `send-invite-email` (employee invites)
- `send-password-reset` (password reset)
- `send-waitlist-welcome` (waitlist)
- `send-position-update` (waitlist position)
- `send-referral-invite` (referrals)
- `notify-referral-success` (referrals)
- `send-feedback` (feedback submissions)

## Implementation Details

### Pattern for Each Function

Each updated function will:

1. **Fetch the business's `inbound_email_alias`** when querying business data
2. **Construct the from address** as: `${businessName} <${alias}@pourhub.au>`
3. **Fallback** to `Hello@pourhub.au` if no alias exists (edge case)

### Code Change Example

```typescript
// Before
from: `${businessName} via Pourhub <Hello@pourhub.au>`,

// After
const fromEmail = business.inbound_email_alias 
  ? `${business.inbound_email_alias}@pourhub.au`
  : 'Hello@pourhub.au';
from: `${businessName} <${fromEmail}>`,
```

### Database Query Updates

Each function that queries businesses will need to include `inbound_email_alias` in the select:

```typescript
// Before
.select("name, logo_url, email")

// After  
.select("name, logo_url, email, inbound_email_alias")
```

## Technical Considerations

### Resend Domain Configuration

For this to work, the `pourhub.au` domain in Resend must be configured to accept wildcard sending (any `*@pourhub.au` address). This is typically already configured when setting up a verified domain.

### Reply Handling

With business-specific from addresses, replies from clients will go to `jefconptyltd@pourhub.au`. The existing `receive-test-email` function already routes inbound emails by matching the alias to a business, so replies should work automatically.

## Files to Modify

1. `supabase/functions/send-estimate-email/index.ts`
2. `supabase/functions/send-variation-email/index.ts`
3. `supabase/functions/send-purchase-order/index.ts`
4. `supabase/functions/send-subtrade-invite/index.ts`
5. `supabase/functions/send-batch-subtrade-invite/index.ts`
6. `supabase/functions/notify-subtrade-reschedule/index.ts`
7. `supabase/functions/respond-subtrade-invite/index.ts`
8. `supabase/functions/send-site-visit-email/index.ts`
9. `supabase/functions/submit-signature/index.ts`

## Expected Outcome

After implementation:
- Client receives quote from: `Jefcon Pty Ltd <jefconptyltd@pourhub.au>`
- If client replies, it routes to that business's inbox
- Each business has their own unique, professional email identity
- System emails (password reset, invites, etc.) remain as PourHub-branded

## Rollout Considerations

This change applies immediately to all businesses. Since aliases are auto-generated on business creation and backfilled for existing businesses, all businesses should already have an alias ready.
