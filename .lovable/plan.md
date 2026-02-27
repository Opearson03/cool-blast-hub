
# Affiliate Program for PourHub

## How It Works

**For Affiliates (Content Creators / Instagrammers):**
- Sign up via a public affiliate registration page (`/affiliates`)
- Get a unique affiliate code and trackable link
- Earn **10% commission per month for 10 months** on each referred customer's subscription
- Track earnings, referrals, and payout status via an affiliate dashboard

**For New Customers (using an affiliate link):**
- Get **50% off for 2 months** when signing up through an affiliate link
- Discount applied automatically via a Stripe coupon at checkout

---

## What Gets Built

### 1. Database Tables

**`affiliates`** -- Stores affiliate profiles
- `id`, `email`, `full_name`, `instagram_handle`, `affiliate_code` (unique, auto-generated), `status` (pending/approved/suspended), `payout_method` (bank/paypal), `payout_details` (JSONB), `created_at`
- RLS: affiliates read their own row; staff manage all

**`affiliate_referrals`** -- Tracks each conversion
- `id`, `affiliate_id` (FK), `customer_email`, `stripe_subscription_id`, `subscription_tier`, `monthly_amount` (subscription price in cents), `commission_rate` (default 0.10), `months_remaining` (starts at 10, decremented), `status` (active/completed/canceled), `created_at`
- RLS: affiliates see their own referrals; staff see all

**`affiliate_commissions`** -- Individual monthly commission records
- `id`, `referral_id` (FK), `affiliate_id` (FK), `amount_cents`, `month_number` (1-10), `status` (pending/paid), `paid_at`, `created_at`
- RLS: affiliates see their own; staff manage all

### 2. Stripe Integration

**Coupon creation** (one-time setup via Stripe dashboard or API):
- Create a Stripe coupon: 50% off, duration = 2 months (`repeating`, `duration_in_months: 2`)

**Checkout modification** (`create-checkout` edge function):
- Accept an optional `affiliate_code` parameter
- If present, validate the code against the `affiliates` table
- Apply the 50% coupon to the checkout session via `discounts`
- Store `affiliate_code` in subscription metadata

### 3. Webhook Enhancement (`stripe-webhook`)

On `checkout.session.completed`:
- Check subscription metadata for `affiliate_code`
- If found, create an `affiliate_referrals` record linking the affiliate to this subscription
- Generate the first commission record

On `invoice.payment_succeeded`:
- Check if the subscription has an affiliated referral with `months_remaining > 0`
- If so, create a new `affiliate_commissions` record (10% of invoice amount)
- Decrement `months_remaining`; mark referral as `completed` when it hits 0

### 4. Affiliate Registration Page (`/affiliates`)

- Public page with a registration form: name, email, Instagram handle
- On submit, inserts into `affiliates` table with `status: pending`
- Shows a "we'll review your application" message
- No auth required (anonymous insert via RPC, similar to waitlist pattern)

### 5. Affiliate Dashboard (`/affiliates/dashboard`)

- Simple auth-gated page (affiliates log in with email/password)
- Shows: unique affiliate link, total referrals, total earned, pending payouts
- Table of referrals with status and commission breakdown
- Copy link / share buttons

### 6. Staff Management

- Add an "Affiliates" tab to the existing staff dashboard
- Approve/suspend affiliates
- View all referrals and commissions
- Mark commissions as paid (manual payout tracking for now)

### 7. Tracking via URL

- Affiliate links use format: `pourhub.com.au/signup?aff=CODE`
- The signup page reads `aff` param, stores it in session, and passes it through to checkout

---

## Technical Sequence

1. Create database tables + RLS policies (migration)
2. Create Stripe coupon (50% off, 2 months)
3. Add affiliate registration RPC + page
4. Modify `create-checkout` to accept and apply affiliate codes
5. Modify `stripe-webhook` to track referrals and generate commissions
6. Build affiliate dashboard (login + stats)
7. Add affiliate management to staff dashboard
