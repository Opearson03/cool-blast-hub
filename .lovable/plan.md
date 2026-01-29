
# Plan: Update Email Domain from `contact.pourhub.au` to `pourhub.au`

## Overview
Replace all instances of the email domain `contact.pourhub.au` with `pourhub.au` across the codebase. This affects outbound email sender addresses and inbound email parsing.

---

## Files to Modify

### Frontend (1 file)

**1. `src/components/settings/TestResultEmailSection.tsx`**
- Line 19: Change inbound email display from `${currentAlias}@contact.pourhub.au` to `${currentAlias}@pourhub.au`

---

### Edge Functions (16 files)

**2. `supabase/functions/send-feedback/index.ts`**
- Line 39: `Hello@contact.pourhub.au` → `Hello@pourhub.au`

**3. `supabase/functions/send-password-reset/index.ts`**
- Line 78: `Hello@contact.pourhub.au` → `Hello@pourhub.au`

**4. `supabase/functions/send-subtrade-invite/index.ts`**
- Line 415: `Hello@contact.pourhub.au` → `Hello@pourhub.au`

**5. `supabase/functions/send-site-visit-email/index.ts`**
- Line 94: `Hello@contact.pourhub.au` → `Hello@pourhub.au`

**6. `supabase/functions/respond-subtrade-invite/index.ts`**
- Line 496: `Hello@contact.pourhub.au` → `Hello@pourhub.au`
- Line 525: `Hello@contact.pourhub.au` → `Hello@pourhub.au`
- Line 602: `Hello@contact.pourhub.au` → `Hello@pourhub.au`
- Line 653: `Hello@contact.pourhub.au` → `Hello@pourhub.au`

**7. `supabase/functions/receive-test-email/index.ts`**
- Line 399-401: Update comment and regex pattern from `@contact.pourhub.au` to `@pourhub.au`

**8. `supabase/functions/send-estimate-email/index.ts`**
- Line 785: `Hello@contact.pourhub.au` → `Hello@pourhub.au`

**9. `supabase/functions/send-batch-subtrade-invite/index.ts`**
- Line 458: `Hello@contact.pourhub.au` → `Hello@pourhub.au`

**10. `supabase/functions/notify-referral-success/index.ts`**
- Line 78: `hello@contact.pourhub.au` → `hello@pourhub.au`

**11. `supabase/functions/send-waitlist-welcome/index.ts`**
- Line 41: `hello@contact.pourhub.au` → `hello@pourhub.au`

**12. `supabase/functions/send-referral-invite/index.ts`**
- Line 41: `hello@contact.pourhub.au` → `hello@pourhub.au`

**13. `supabase/functions/send-position-update/index.ts`**
- Line 151: `Hello@contact.pourhub.au` → `Hello@pourhub.au`

**14. `supabase/functions/send-invite-email/index.ts`**
- Line 39: `Hello@contact.pourhub.au` → `Hello@pourhub.au`

**15. `supabase/functions/send-variation-email/index.ts`**
- Line 520: `Hello@contact.pourhub.au` → `Hello@pourhub.au`

**16. `supabase/functions/notify-subtrade-reschedule/index.ts`**
- Line 381: `Hello@contact.pourhub.au` → `Hello@pourhub.au`

**17. `supabase/functions/submit-signature/index.ts`**
- Line 1582: `Hello@contact.pourhub.au` → `Hello@pourhub.au`
- Line 1834: `Hello@contact.pourhub.au` → `Hello@pourhub.au`

---

## Summary of Changes

| Type | Count |
|------|-------|
| Frontend files | 1 |
| Edge function files | 16 |
| Total replacements | ~22 |

---

## Prerequisites

Before deploying these changes, ensure the new domain `pourhub.au` is:
1. Configured in Resend as a verified sending domain
2. DNS records (SPF, DKIM, DMARC) are set up for email deliverability
3. If using inbound email routing, the MX records point correctly for `pourhub.au`
