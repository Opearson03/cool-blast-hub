
## Goal

Make team invitations free for the first 2 employees. From the 3rd onward, charge $5/employee/month, billed automatically through Stripe as an extra line item on the business's existing Pro subscription. Surface the cost in the **+ Invite Employee** dialog so admins confirm before adding a paid seat.

## Pricing rules

- Counted seats = active employees in `profiles` for the business (currently invited admin + staff).
- Free seats: 2 (the owner counts as seat #1, so the owner + 1 more is free).
- Paid seats: 3rd seat onward at $5 AUD / seat / month, recurring.
- Pro plan only. Free / Estimating tier admins cannot invite team members (existing Pro gate stays).
- Removing an employee → seat quantity decreases at the **next billing cycle** (proration disabled on decrement; Stripe just bills less next renewal).
- Adding a seat → quantity increases immediately, prorated for the rest of the cycle.

## Stripe setup (one-off)

Create a new metered-style **per-seat** product + recurring price in Stripe:

- Product: "PourHub Team Seat"
- Price: $5 AUD / month, `recurring.interval = month`, `recurring.usage_type = licensed` (quantity-based, not metered).
- Save the price ID (e.g. `price_seat_xxx`) into `src/lib/subscription-tiers.ts` as `TEAM_SEAT_PRICE_ID`.

This is added as a **second subscription item** on the customer's Pro subscription, with `quantity = max(0, employees - 2)`.

## Backend changes

### 1. New edge function: `update-seat-quantity`

Single source of truth for syncing seat count to Stripe.

Inputs: none (derives from caller's business).
Behaviour:
1. Auth check → resolve `business_id`.
2. Count `profiles` rows where `business_id = X` → `employeeCount`.
3. `paidSeats = max(0, employeeCount - 2)`.
4. Look up the business's Stripe subscription (`business_subscriptions.stripe_subscription_id`).
5. Find existing seat item (by price ID).
6. If `paidSeats === 0`: delete the seat item if present (no proration).
7. Else: create or update the item to `quantity: paidSeats`.
   - On **increase** → `proration_behavior: 'create_prorations'` (charge now).
   - On **decrease** → `proration_behavior: 'none'` (drop at next cycle).
8. Return `{ employeeCount, paidSeats, monthlyAmountCents }`.

Used by:
- `admin-create-employee` (after successful create) — call internally.
- `accept-invite` flow (when a pending invite is accepted).
- `delete-employee` (after removal).

### 2. New edge function: `preview-seat-cost`

Read-only preview for the invite dialog.

Returns: `{ employeeCount, freeSeats: 2, nextSeatCharged: boolean, perSeatPriceCents: 500, projectedMonthlyExtraCents }`.

### 3. Update `admin-create-employee/index.ts`

- Remove the hard `employee_limit` check (no upper limit anymore — billing handles it).
- Keep the duplicate-email and Pro-required checks.
- After creating the auth user + profile + role, call the seat sync logic (inline or via internal call).
- Return the new seat info in the response so the dialog can show "Seat #4 added — $5/mo added to your subscription".

### 4. Update `accept-invite/index.ts`

After the new profile is created, run the same seat-sync.

### 5. Update `delete-employee/index.ts`

After deletion, run seat-sync (will queue a decrement at next cycle).

### 6. Update `stripe-webhook/index.ts`

When the Pro subscription is created/updated, leave the seat item alone (don't reset it). When the Pro sub is canceled, also delete the seat item (handled by Stripe automatically since items live under the sub).

### 7. Update `check_employee_limit` RPC

Either remove its callers or change it to always return `can_add: true` for active Pro businesses (no cap). Simplest: leave the function but only use it for non-Pro accounts.

## Frontend changes

### `useSubscription.ts`

Add `getSeatPreview()` helper that invokes `preview-seat-cost`.

### `InviteEmployeeDialog.tsx`

Top of the dialog (both "Email Invite" and "Create Directly" tabs), show a billing summary card:

```
Team seats: 3 / 2 free
Adding this employee will add $5/month to your subscription
(billed prorated for the rest of this cycle).
```

If still within the 2 free seats:

```
Team seats: 1 / 2 free
This employee is included in your plan — no extra charge.
```

Add a small confirmation step: when the new seat will be charged, the submit button reads **"Add employee — +$5/mo"** and requires a single click (no extra modal — keep it one click but make the cost obvious).

Remove the existing "employee limit" error / upgrade-required alert.

### `AdminEmployees.tsx`

Add a tiny seat-summary chip near the **+ Invite Employee** button:

```
[ 3 seats · $5/mo extra ]   [+ Invite Employee]
```

Tooltip: "First 2 seats free. Each additional seat is $5/month, billed via your subscription."

### Settings → Billing (light touch)

If there's an existing billing/subscription page, list the seat line item separately ("Team seats × N — $X/mo") next to the base plan. Use the existing `customer-portal` flow for management — don't build a new UI.

## Edge cases

- **Pro sub not active** (free/estimating/no sub): block the invite UI with the existing Pro upgrade gate. No seat fee logic runs.
- **Demo / `subscription_exempt = true`**: skip seat-sync entirely; treat as unlimited.
- **Race conditions on rapid invites**: the sync function reads the live count from `profiles`, so it's idempotent — safe to call multiple times.
- **Existing teams already over 2 seats**: on the first invite/removal after deploy, the sync function will lazily create the seat item with the correct quantity. No backfill migration required.
- **Annual Pro plans**: same item, annual billing — Stripe prorates correctly when adding mid-cycle. (Optional: charge $50/year instead of $5/month when on the annual plan — out of scope for v1; sticking with monthly seat price even for annual subscribers, which Stripe supports as a separate item with its own interval.)

## Out of scope (v1)

- Volume discounts beyond the 2 free seats.
- Yearly seat pricing.
- A dedicated billing UI inside PourHub (keep using Stripe customer portal).
- Email notifications when a seat is added/removed.

## Files touched

- `supabase/functions/admin-create-employee/index.ts` — drop limit check, call seat sync.
- `supabase/functions/accept-invite/index.ts` — call seat sync after profile insert.
- `supabase/functions/delete-employee/index.ts` — call seat sync after removal.
- `supabase/functions/update-seat-quantity/index.ts` — **new**, shared sync logic.
- `supabase/functions/preview-seat-cost/index.ts` — **new**, read-only preview.
- `supabase/functions/stripe-webhook/index.ts` — minor: keep seat item on Pro sub updates.
- `src/lib/subscription-tiers.ts` — add `TEAM_SEAT_PRICE_ID` and `TEAM_SEAT_PRICE_CENTS = 500`, `FREE_SEATS = 2`.
- `src/hooks/useSubscription.ts` — `getSeatPreview()`.
- `src/components/employees/InviteEmployeeDialog.tsx` — show seat cost banner; replace limit error.
- `src/pages/admin/AdminEmployees.tsx` — seat summary chip near Invite button.

## Manual setup the user will need to do

1. In Stripe (Live + Test): create the "PourHub Team Seat" product at $5 AUD / month and paste the price ID into `subscription-tiers.ts`.
2. Confirm the existing Pro subscription's Stripe customer can have a second subscription item added (it can — standard Stripe behaviour).
