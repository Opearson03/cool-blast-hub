

## Fix: Waitlist Invite Email Linking to Stripe Instead of Signup Page

### Problem
The "Set Up Your Account" button in the waitlist invite email is still linking directly to Stripe checkout instead of the `/signup` page. The `OnboardWaitlistModal` was already updated to generate `/signup?...` URLs client-side, and the `send-waitlist-invite` email template already uses the passed `checkoutUrl` variable correctly.

The root cause is that the `send-waitlist-invite` edge function needs to be **redeployed** so the latest code is live. Additionally, the old `staff-create-checkout` edge function still contains Stripe-direct logic and should be cleaned up to avoid confusion.

### Changes

**1. Redeploy `send-waitlist-invite` edge function**
- No code changes needed -- the template is already correct
- Just needs redeployment so the live version matches the codebase

**2. Simplify `supabase/functions/staff-create-checkout/index.ts`**
- This function still creates Stripe checkout sessions directly, which is no longer used by the modal
- Simplify it to generate a `/signup` URL (matching what the modal does client-side), or remove the Stripe logic entirely
- This prevents any future confusion or accidental use of the old Stripe-direct flow

### What's Already Correct (No Changes Needed)
- `OnboardWaitlistModal.tsx` -- already generates `/signup?tier=...&email=...&name=...&business=...&freeMonths=...` URLs client-side
- `send-waitlist-invite/index.ts` email template -- already uses the passed `checkoutUrl` and says "Set Up Your Account"
- `create-checkout/index.ts` -- already accepts `freeMonths` and applies trial days

### Technical Detail
- The `staff-create-checkout` function will be updated to build a `/signup` URL with query params instead of creating a Stripe session, removing the Stripe dependency
- Both edge functions will be redeployed to ensure the live versions match the code
