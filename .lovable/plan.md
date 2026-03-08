

## Skip Signup — Go Straight to Stripe Checkout from Booking Confirmation

### Current Flow
Booking form collects name, email, company → confirmation page → "Start Your Free Month" links to `/signup?tier=pro&freeMonths=1` → user re-enters all info → clicks "Continue to Payment" → Stripe checkout.

### New Flow
Booking form collects name, email, company → confirmation page → "Start Your Free Month" button directly calls the `create-checkout` edge function with the already-collected data → user lands on Stripe checkout immediately. No `/signup` page in between.

### Changes

**1. `BookingConfirmation.tsx`** — Pass email and company from booking form data. Replace the `<Link>` button with an `onClick` handler that:
- Calls `supabase.functions.invoke("create-checkout", { body: { email, fullName: name, businessName: company, tier: "pro", freeMonths: 1 } })`
- Redirects to the returned Stripe checkout URL
- Shows a loading spinner while the checkout session is being created

**2. `Bookings.tsx`** — Pass `email` and `company` into `BookingConfirmation` (these are available from the form submission data already in state).

**3. Update confirmation state** — Extend the `confirmation` state object to include `email` and `company` from the form data so it can be forwarded to `BookingConfirmation`.

### No backend changes needed
The `create-checkout` edge function already accepts unauthenticated calls with `email`, `fullName`, `businessName`, `tier`, and `freeMonths`. It already applies the 30-day trial. The user goes straight to Stripe with card collection.

