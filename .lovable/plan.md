
## Waitlist Onboarding System — Planning Overview

This is a planning conversation, not a build request yet. Here's how the onboarding flow can be structured when you're ready, and what already exists vs. what needs to be built.

---

### What Already Exists

You already have more infrastructure than you might realise:

- **Waitlist table** with email, name, business name, phone, referral count, referral code, and join date for every entry
- **"Onboard" button** in the staff dashboard Waitlist tab — opens a modal to select a plan (Estimating $99/mo or Pro $240/mo), generates a Stripe checkout link, and lets you open it (for phone calls), copy it, or fire it via your email client
- **Free months logic** — already calculates 1 base month + 1 per referral and applies it as a Stripe trial period automatically
- **`staff-create-checkout` backend function** — generates a personalised Stripe checkout link in ~1 second
- **Welcome email template** — branded PourHub email via Resend, already used for waitlist signups

What's **missing** is a tracked, two-step outreach flow — specifically:
1. A one-click **"Send invite email"** that fires a proper branded outreach email directly from the server (not via your email client, which the current "Send Email" button does)
2. **Outreach status tracking** — knowing who has been emailed, who has clicked their link, who has signed up, and who needs a follow-up call
3. A **follow-up CRM view** — sorting the waitlist by outreach status so you can quickly see who to call next

---

### Proposed Onboarding Flow

```text
Waitlist Entry
     │
     ├─→ [Email Invite]  ──→  Branded email with personalised
     │                         Stripe checkout link + free months
     │                         Status: "invited"
     │
     ├─→ [Follow-up Call] ──→  Staff calls, walks through
     │                          product, can open checkout
     │                          live on the call
     │                          Status: "call_scheduled" / "called"
     │
     └─→ [Converted] ──→  Stripe webhook fires → status: "converted"
                           Entry disappears from active outreach queue
```

---

### What Needs to Be Built

#### 1. Outreach tracking columns on `waiting_list`

Add the following columns to track where each person is in the funnel:

| Column | Type | Purpose |
|---|---|---|
| `outreach_status` | text | `pending`, `invited`, `call_scheduled`, `converted` |
| `invited_at` | timestamptz | When the invite email was sent |
| `checkout_url` | text | Store the generated Stripe checkout link |
| `checkout_tier` | text | Which plan was selected |
| `staff_notes` | text | Freeform notes for the follow-up call |
| `stripe_session_id` | text | For detecting when they convert |

#### 2. New backend function: `send-waitlist-invite`

A new Resend-powered email function (similar to `send-waitlist-welcome`) that sends a proper outreach email with:

- Personalised greeting (name + business name)
- Their free months count called out prominently
- A big CTA button linking to their Stripe checkout
- A "reply to this email" for questions — keeps it personal

This replaces the current "Send Email" button which opens the user's local mail client (inconsistent, no tracking).

When this function is called, it also:
- Stores the `checkout_url` on the waitlist entry
- Sets `invited_at` and `outreach_status = 'invited'`

#### 3. Updated `OnboardWaitlistModal`

Extend the existing modal with a two-tab design:

- **Tab 1: Email Invite** — select plan → generate checkout → send branded email in one click. Shows "Invited" badge if already sent.
- **Tab 2: Phone Call** — the existing flow (open checkout link, copy, enter card on call)
- **Staff notes field** — add a notes input so you can log what was discussed during a call

#### 4. Updated `WaitlistTable` with outreach status

- Add an `Outreach Status` column showing a badge: `Pending` / `Invited` / `Called` / `Converted`
- Sort order: uncontacted first, most referrals at the top (highest-value leads first)
- Filter bar: filter by status to quickly see who needs a follow-up
- "Converted" entries can be hidden by default (they're now subscribers)

#### 5. Auto-convert on Stripe success

When a waitlist person completes Stripe checkout, the existing `stripe-webhook` function fires. Extend it to:
- Look up the email in `waiting_list`
- Set `outreach_status = 'converted'`

This means your waitlist table automatically stays accurate — you never need to manually mark someone as converted.

---

### Files That Would Change

| File | Change |
|---|---|
| Database migration | Add `outreach_status`, `invited_at`, `checkout_url`, `checkout_tier`, `staff_notes`, `stripe_session_id` to `waiting_list`; update `get_waiting_list_entries` RPC to return new columns |
| New: `supabase/functions/send-waitlist-invite/index.ts` | Branded outreach email via Resend + updates waitlist entry status |
| `supabase/functions/staff-create-checkout/index.ts` | Optionally persist the checkout URL back to the waitlist entry |
| `supabase/functions/stripe-webhook/index.ts` | On `checkout.session.completed`, look up and mark waitlist entry as converted |
| `src/components/staff/OnboardWaitlistModal.tsx` | Add tabs (Email / Phone), staff notes input, "already invited" state |
| `src/components/staff/WaitlistTable.tsx` | Add status badge column, sorting, filtering |

---

### Recommended Phasing

Since you said you're not ready yet, a good order when the time comes:

**Phase 1 — Core email invite + tracking** (highest ROI, do this first)
- DB columns + `send-waitlist-invite` function + update modal to use it
- This alone gets you one-click branded email sends with status tracking

**Phase 2 — Phone call flow polish**
- Staff notes on the modal
- Sort/filter the table by status

**Phase 3 — Auto-convert**
- Stripe webhook update
- Converted entries hidden from active queue

---

### One Thing to Decide Now

The current "Send Email" button opens your local mail client. That's fine for ad-hoc emails but means:
- No tracking of who was contacted
- Email comes from your personal address, not `hello@pourhub.au`
- The email content isn't branded or templated

If you want tracking + branded emails, Phase 1 above is the right move. When you're ready to build, just say the word.
