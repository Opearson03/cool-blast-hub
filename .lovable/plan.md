

## Free Trial for Zoom Booking Users

### What changes

**1. Booking confirmation CTA** — Update `BookingConfirmation.tsx` to link to `/signup?tier=pro&freeMonths=1` instead of plain `/signup`. Update copy to say "Start Your Free Month" instead of "Start Free Trial".

**2. Signup page pricing display** — When `freeMonths=1` is in the URL, show the price as ~~$199~~ **$0 for your first month** in the plan summary card. The "Continue to Payment" button text stays the same (card is still required).

**3. Edge function trial logic** — The `create-checkout` edge function already supports `freeMonths` and converts it to `trial_period_days` (line 175-178). It passes `freeMonths * 30` as `trial_period_days` to Stripe, which gives a free period while still collecting the card. No backend changes needed.

### Files to change

| File | Change |
|------|--------|
| `src/components/bookings/BookingConfirmation.tsx` | Update CTA link to `/signup?tier=pro&freeMonths=1`, update button/copy text |
| `src/pages/Signup.tsx` | When `freeMonths` param exists, show crossed-out price with "$0 first month" styling in the plan summary card |

### No database or edge function changes required
The `create-checkout` function already handles `freeMonths` → Stripe `trial_period_days`. Stripe's `payment_method_collection: "always"` ensures the card is collected even during trial.

