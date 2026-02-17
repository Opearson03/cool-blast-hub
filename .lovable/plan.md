
## Phone Onboarding: "Take Payment Over the Phone" in Staff Portal

### The Concept
When you call someone from the waitlist, you need to:
1. Collect their card details verbally
2. Enter them on their behalf into a form
3. Create their account immediately
4. Send them a welcome email with login instructions

The cleanest Stripe-native way to do this is **Stripe Payment Links or Stripe Terminal** — but the best fit for your workflow is a **staff-initiated Stripe Checkout session** that you create on their behalf, then either:
- You enter their card details into Stripe's secure hosted checkout page (on your screen, while they read card details over the phone), OR
- Send them an email with the link and they can do it themselves in 30 seconds

This approach means **you never store or handle raw card data**, which keeps you PCI compliant.

### How the Flow Works

```text
Staff Portal → Waitlist tab → "Onboard" button next to entry
        ↓
Modal opens: pre-filled with their name/business from waitlist
        ↓
Staff selects tier (Estimating $99 or Pro $240)
        ↓
"Create Checkout Link" button → generates a Stripe Checkout URL
        ↓
Two options presented:
  [Open Checkout] → Opens Stripe hosted page in new tab (staff enters card while on phone)
  [Send via Email] → Sends a payment link email to the customer  
        ↓
After payment: Customer is redirected to /signup/success
        → Enters their password → Account created automatically
```

### What Changes

**1. New Edge Function: `staff-create-checkout`**
- Staff-only endpoint (validates `is_pourhub_staff` JWT)
- Takes: `email`, `fullName`, `businessName`, `tier`, `referralMonths` (for waitlist free months)
- Creates a Stripe Checkout session with `trial_period_days` equal to `30 * (1 + referralMonths)` — so if they referred 2 people they get 3 months free automatically
- Returns the checkout URL

**2. New Component: `OnboardWaitlistModal`**
- Triggered by a new "Onboard" button on each row in `WaitlistTable.tsx`
- Pre-fills name, email, business from the waitlist entry
- Lets staff pick the subscription tier
- Shows how many free months the person has earned (1 + referral count)
- Two action buttons: "Open Checkout" and "Copy Link / Send Email"
- Shows a success state once checkout session is created

**3. Update `WaitlistTable.tsx`**
- Fetch `referral_count` alongside existing fields from the waitlist RPC
- Add "Onboard" button per row (phone icon + label)

**4. Update DB function `get_waiting_list_entries()`**
- Add `referral_count` to the returned columns so the modal can display free months earned and pass it to the checkout

### Technical Details

**Free months calculation:**
- Base: 1 month free (everyone gets this)
- Bonus: +1 month per referral who joined the waitlist
- `trial_period_days = 30 * (1 + referral_count)`

**Stripe Checkout session parameters:**
```typescript
subscription_data: {
  trial_period_days: 30 * (1 + referralCount),
  metadata: { full_name, business_name, tier, onboarded_by_staff: "true" }
}
```

**Security:**
- The `staff-create-checkout` edge function validates the staff JWT before proceeding — regular users cannot call it
- No raw card data ever touches your server or code

**Files to create/modify:**
- `supabase/functions/staff-create-checkout/index.ts` (new)
- `supabase/config.toml` (add new function entry)
- `supabase/migrations/...` (update `get_waiting_list_entries` to include `referral_count`)
- `src/components/staff/OnboardWaitlistModal.tsx` (new)
- `src/components/staff/WaitlistTable.tsx` (add Onboard button + referral_count)
