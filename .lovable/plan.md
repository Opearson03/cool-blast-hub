

## Change Waitlist Onboarding: Account Setup Before Payment

### Current Flow
1. Staff generates a Stripe checkout link
2. Email sent to waitlist member with direct Stripe payment link
3. After paying, user lands on `/signup/success` to create login credentials (just email + password)

### New Flow
1. Staff generates an invite link to `/signup` (not Stripe directly)
2. Email sent with link to `/signup?email=...&name=...&business=...&tier=...&freeMonths=...`
3. User lands on the Signup page with fields pre-filled (email, name, business name)
4. User sets their password, accepts terms, then clicks "Continue to Payment"
5. Stripe checkout is created and user pays
6. After payment, user lands on `/signup/success` which now just creates the auth account using the stored details and signs them in (no form needed since details already collected)

### Changes Required

**1. `src/pages/Signup.tsx` -- Pre-fill from URL params**
- Read `name`, `email`, `business`, `freeMonths` from query params
- Pre-fill the form fields if present
- Pass `tier` and `freeMonths` to `create-checkout` so trial days can be applied

**2. `supabase/functions/staff-create-checkout/index.ts` -- Generate signup link instead of Stripe link**
- Instead of creating a Stripe checkout session directly, return a pre-filled `/signup` URL with query params (email, name, business, tier, freeMonths)
- Remove the Stripe session creation -- the user will go through the normal signup flow which creates the checkout session itself
- Still calculate free months and trial days for use in the signup URL

**3. `supabase/functions/create-checkout/index.ts` -- Accept freeMonths param**
- Accept an optional `freeMonths` parameter from the request body
- If provided, set `trial_period_days: 30 * freeMonths` on the subscription
- This allows waitlist members' free months to carry through to Stripe

**4. `src/components/staff/OnboardWaitlistModal.tsx` -- Update to use signup link**
- The "Generate Checkout Link" button now generates a `/signup` link (can be done client-side, no edge function needed)
- Build the URL: `/signup?tier={tier}&email={email}&name={name}&business={business}&freeMonths={freeMonths}`
- The rest of the modal (copy link, send email, phone tab) stays the same

**5. `supabase/functions/send-waitlist-invite/index.ts` -- Update email copy**
- Change the email CTA from "Get Started" (implying payment) to "Set Up Your Account"
- Update the copy to say "Click below to set up your account details" instead of "enter your card details"
- The `checkoutUrl` param is now a signup page URL, not a Stripe URL

### What Stays the Same
- The `/signup/success` page still handles post-payment account creation
- The `verify-checkout` edge function is unchanged
- The Stripe webhook flow is unchanged
- Normal (non-waitlist) signup flow is unchanged

### Technical Detail
- The `staff-create-checkout` edge function can be simplified since it no longer needs Stripe -- it just builds a URL. Alternatively, we can generate the link client-side in the modal and skip the edge function call entirely (simpler approach).
- The `create-checkout` function gains an optional `freeMonths` field to set trial days for waitlist members.
