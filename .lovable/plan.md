
# A/B/C Landing Page Test

Three lean, ad-focused landing pages targeting different angles, each on its own URL so you can point individual ad campaigns at them and compare conversion.

## The three variants

Each page is a single-purpose landing page (sticky CTA, no global nav, minimal footer, one primary action: **Start free trial**). Suggested angles — happy to swap:

- **/lp/a — "Quote Faster"** — Speed/estimating angle. Hero: "Quote a slab in 10 minutes." Proof: time saved per quote, screenshots of takeoff. For builders/concreters drowning in quotes.
- **/lp/b — "Win More Jobs"** — Professional quote/branding angle. Hero: "Send quotes that win." Proof: branded PDF preview, e-sign, client portal. For owner-operators losing jobs to slicker competitors.
- **/lp/c — "Run the Whole Job"** — Operations angle. Hero: "From quote to pour to paid." Proof: scheduling, subbie network, dockets, BOQ. For growing crews wanting one system.

Each page: hero + sub-headline + primary CTA → 3 benefit blocks → social proof (quoted value counter, logos) → secondary CTA → minimal footer (privacy/terms only).

## Routing

Add three public routes in `src/App.tsx` above the catch-all:
- `/lp/a` → `LandingA`
- `/lp/b` → `LandingB`
- `/lp/c` → `LandingC`

CTAs route to `/signup?variant=a` (etc.) so the variant is preserved into signup.

## Tracking

**Database** — new `landing_page_events` table:
- `variant` (text: 'a' | 'b' | 'c')
- `event_type` (text: 'view' | 'cta_click' | 'signup_started' | 'signup_completed')
- `session_id` (text — random uuid stored in localStorage for stitching events to sessions)
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` (text, nullable — captured from URL)
- `referrer` (text), `user_agent` (text), `path` (text)

RLS: public `INSERT` allowed (anonymous tracking); `SELECT` restricted to authenticated staff only.

A small `useLandingTracker(variant)` hook will:
1. On mount, generate/reuse `session_id`, capture UTM params, insert a `view` row.
2. Expose `trackCTA()` for buttons to call before navigation.
3. Fire matching GA4 events via `window.gtag` (`landing_view`, `landing_cta_click`, with `variant` + UTM params as event params).

Signup completion: hook into the existing signup success flow (`SignupSuccess` page) — if `?variant=` is present (carried through from `/signup?variant=x`), insert a `signup_completed` event.

**Reporting** — a simple `/admin/lp-results` staff page listing per-variant counts: views, CTA clicks, signup starts, signup completes, with conversion %. (Can defer to a follow-up if you want the variants live first.)

## Ad workflow

In Google/Meta ads, point each ad set's destination URL at the relevant `/lp/X?utm_source=google&utm_campaign=...&utm_content=variant_a`. UTM params will land in both DB and GA4, so you can slice by ad as well as by page.

## Files to add/change

```text
src/pages/landing/LandingA.tsx          new
src/pages/landing/LandingB.tsx          new
src/pages/landing/LandingC.tsx          new
src/components/landing/LandingShell.tsx new — shared minimal header/footer/CTA bar
src/hooks/useLandingTracker.ts          new
src/App.tsx                             add 3 routes
src/pages/SignupSuccess.tsx             record signup_completed when ?variant present
supabase migration                      create landing_page_events + RLS
```

## Out of scope (ask if wanted)

- Single-URL random A/B/C splitter (you chose distinct URLs).
- Results dashboard UI (can do as follow-up).
- Meta/Google Ads pixel install (you said you'll rely on GA + DB; pixels can be added later if needed).
