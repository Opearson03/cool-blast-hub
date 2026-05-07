# What you're missing — PourHub gap review

A focused review across the three lenses you picked: **conversion & growth**, **product gaps**, and **UX polish**. Findings are ordered by impact, not effort. Nothing here changes existing functionality — these are additions/refinements to consider.

---

## 1. Conversion & growth

### High impact

- **No social proof anywhere on the funnel.** The landing page has the live "$X quoted through PourHub" ticker (great), but there are zero testimonials, customer logos, named case studies, star ratings or "as seen in" strips. For a trades audience this is the single biggest trust gap. Even 2–3 real quotes with name + business + suburb would lift signups noticeably.
- **Pricing page is bare and inconsistent with the new design language.** `Pricing.tsx` still uses the old plain header (Logo + Sign In), no `LandingShell`, no eyebrow chips, no `font-display`, no FAQ, no comparison table, no "what happens after trial" explainer. This is the page people land on right before deciding to pay — it's currently the weakest surface.
- **Trial mechanics are invisible.** The hero says "Free to start. No credit card. Set up in under two minutes." but nowhere on the site is the trial *length* stated, what happens at the end, or whether a card is required at signup. Trades buyers are wary — make this explicit.
- **No risk-reversal.** No money-back guarantee, no "cancel anytime" badge near the CTA, no "we'll import your existing jobs" hand-holding promise.
- **One CTA destination.** Every primary button goes to `/signup?tier=pro`. There's no soft conversion path for the 90% who aren't ready — e.g. "See a 90-second demo video", "Download a sample quote PDF", "Get the AS2870 cheatsheet" (you have the article content already — gate one or two for emails).
- **Articles hub isn't a lead magnet.** You have ~25 strong SEO articles but no email capture, no "related tool" CTAs inside articles (e.g. "Try the slab calculator" deep-link), no author byline / E‑E‑A‑T signals which Google now weights heavily for trades content.

### Medium impact

- **No comparison pages.** "PourHub vs Buildxact", "PourHub vs spreadsheets", "PourHub vs ServiceM8 for concreters" — these capture bottom-of-funnel search and you have none.
- **Affiliate program is hidden.** It exists (per memory) but isn't surfaced on the landing page, footer, or pricing page. A small "Earn 20% recurring" footer link would activate dormant fans.
- **EOFY page exists but no seasonal/urgency hooks elsewhere.** No banner on landing/pricing pointing to it during the run-up.
- **No Google Reviews / Trustpilot / Product Hunt embed.** Even one external rating widget significantly outperforms inline testimonials for skeptical buyers.
- **Subbie marketplace is undersold to builders.** The `#subbies` section on the landing page pitches it *to subbies*. There's no equivalent "find ABN-verified subbies near you in 30 seconds" pitch *to the paying customer* — that's arguably your biggest differentiator vs Buildxact/ServiceM8 and it's buried.
- **No exit-intent or scroll-depth capture.** Pure JS popovers feel cheap, but a tasteful "Not ready? Get our free quoting checklist" at 70% scroll on articles would convert.

### Low-effort wins

- Add a sticky "Start free trial" bar on `/articles/*` pages.
- Add `/pricing` FAQ: "Is there a contract?", "What if I'm a sole trader?", "Can I switch plans?", "Do you do onboarding?".
- Surface the Bookings ("15-min walkthrough") CTA in the pricing page itself, not just the landing hero.

---

## 2. Product gaps

### Notable absences for a concreting ops platform

- **No accounting integration.** Xero was purged (per memory) and nothing replaced it. For a paid AU SaaS in this category, *some* path to Xero/MYOB/QuickBooks (even one-way invoice export as CSV/PDF email) is table-stakes. This will come up in every sales call.
- **No payment collection.** Quotes get accepted via e-signature, but there's no "Pay deposit now" / Stripe Connect link on the accepted quote. Concreters constantly chase deposits — owning that moment is huge.
- **No customer/client portal.** Clients sign quotes via a one-off link but can't log in to see job progress, photos, variations, invoices in one place. Builders especially expect this now.
- **No photo / site diary capture.** I don't see a photos table or a "before/during/after pour" capture flow tied to a pour. This is the #1 thing field crews want and the #1 thing that protects you in disputes (which your own articles emphasise).
- **No SWMS / safety pack generation.** Trade-specific compliance docs (SWMS, JSA, toolbox talks) per pour would be a sticky add-on.
- **No timesheet → payroll bridge.** You have timesheets and employees but no export to the major AU payroll providers (Xero Payroll, Employment Hero, KeyPay).
- **No quote follow-up automation.** Sent quotes don't appear to trigger nudge SMS/emails after N days. Easy win — your `send-crm-email` infra is already there.
- **No mobile native estimating.** Memory says the wizard is desktop/tablet only. Reasonable, but a "quick capture on phone, finish on desktop" handoff (voice memo, photo of plans) would close the gap without needing the full canvas.
- **No reporting / analytics for the business owner.** Win rate, average margin, $ pipeline by stage, gross profit per crew — nothing shown in the listed routes. This is what justifies the Pro tier.

### Smaller gaps

- No team-wide notification preferences (per-user mute, push vs email).
- No saved scope templates ("Standard 100m² driveway") for one-click new quotes.
- No multi-currency / NZ support — closes off an obvious adjacent market.
- No public API or webhooks documented for power users / integrators.

---

## 3. UX & design polish

### Cross-page consistency

- **Design language is split.** EOFY, Articles, and now Enterprise use the new language (`LandingShell`, eyebrow chips, `font-display`, charcoal sectioning). `Pricing`, `Bookings`, `Auth`, `Signup`, `SubcontractorsLanding`, `SuppliersLanding`, and the public `SignQuote` / `RespondInvite` pages still use the old patterns. Until these are unified, the site feels stitched together.
- **Two different headers.** Landing/EOFY/Enterprise use `LandingShell`; Pricing/Bookings/Auth use a bespoke header with different padding and a different "Sign In" button style. Pick one shell.
- **Footer inconsistency.** The landing footer has product links and copyright; the new `LandingShell` may not surface the same legal links — audit and align (Privacy, Terms, Subbie disclaimers all need to be reachable from every public page).

### Specific friction points

- **`/auth` is 456 lines and combines login + signup + password reset + role redirects.** Worth splitting visually (tabs vs separate routes) and modernising to match the new shell. First impression after clicking "Sign in" matters.
- **`/signup` doesn't preview what the user gets.** No "here's what you'll see in 60 seconds" panel, no progress dots, no testimonial sidebar. Standard SaaS signup pages have these.
- **`/bookings` (Zoom walkthrough) — current page.** Worth a quick review for: confirmation messaging clarity, calendar mobile layout, what happens after booking (do they get an immediate trial start link in the confirmation email?).
- **No empty states for new accounts.** First-time users likely land on dashboards/lists with zero data and no inline guidance pointing to the "create your first quote" flow. Memory mentions a guided onboarding modal — verify it actually triggers and is dismissible-but-recoverable.
- **Mobile nav on the landing page hides Features/Pricing/Subbies/Articles entirely** (`hidden md:flex`) with no hamburger. Mobile visitors only see Sign in + Start free.
- **No dark/light mode toggle on public pages** — the app supports themes but marketing is locked dark. Some buyers will check on a bright laptop screen and bounce.

### Smaller polish items

- The "🎉 Free month included" line in Signup uses a raw emoji — inconsistent with the `eyebrow`/`Badge` system used elsewhere.
- The Enterprise section on the landing page still uses an old gradient `Sparkles` badge instead of the new `eyebrow` chip you just standardised on (worth a 10-line cleanup pass for visual consistency now that Enterprise itself is updated).
- `font-display` is applied unevenly — some H2s on Index and Pricing still use base font.
- No skeleton loaders on the live ticker / quoted value strip — currently a generic pulsing rectangle.

---

## Suggested next moves (pick 1–3)

1. **Bring `/pricing` up to the new design language + add FAQ + add risk-reversal copy + show trial mechanics.** Highest-leverage single change.
2. **Add a real social-proof block** (testimonials with name/business/suburb, and ideally a small "trusted by N concreters across AU" counter) to landing + pricing.
3. **Build the photo / site diary feature** tied to pours. Biggest product moat vs generic tools and most-asked feature in your category.
4. **Ship a Stripe-Connect "pay deposit" link on accepted quotes.** Direct revenue-affecting feature, ~1 week of work given existing Stripe infra.
5. **Unify all public pages under `LandingShell`** (Pricing, Bookings, Auth, Signup, Subbies/Suppliers landings) so the brand feels coherent end-to-end.

Tell me which of these you want to tackle first and I'll come back with an implementation plan for that one.
