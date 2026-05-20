## Goal

Inside the BOQ Order Wizard, every logged-in user sees the closest sales rep from Boral, Heidelberg, Hanson and Holcim, preloaded with name, branch, phone and email. Match is done by distance from the job's site postcode to each branch's postcode, capped by a per-branch service radius.

## What we already have

- `supplier_brands`, `supplier_reps`, `supplier_reps_staging` tables + `supplier-logos` bucket
- Firecrawl edge function `scrape-supplier-reps` (staff-only, role check now fixed)
- Staff "Suppliers" tab to scrape, review, approve, edit, delete
- `PreferredRepsBlock` already wired into `SupplierStep.tsx` of the wizard, with auto-upsert into the business's `supplier_contacts` on pick
- `au_postcode_coords` (1,102 AU postcodes with lat/lng) — same table the subcontractor radius search uses

## What's missing — and the plan

### 1. Add Hanson and Holcim brands
Seed two new rows into `supplier_brands` with their AU website URLs. Logos populate on first scrape.

### 2. Geocode every branch (Haversine, no external geocoder)

Add columns to `supplier_reps`:
- `postcode text` — the branch's own postcode parsed from `branch_address`
- `service_radius_km` already exists; default it to 75km when null
- `lat numeric`, `lng numeric` (auto-populated)

Add a trigger `set_supplier_rep_geo` that runs on insert/update of `branch_address` or `postcode`:
1. If `postcode` null, extract the first 4-digit number from `branch_address`
2. Look up `au_postcode_coords` and fill `lat`/`lng`

Same trigger pattern applies to `supplier_reps_staging` so staff can see "geocoded ✓" in the review UI.

### 3. Upgrade the scraper to capture branch postcodes

In `scrape-supplier-reps/index.ts`, extend the JSON schema passed to Firecrawl with a `postcode` field per contact, and a stricter prompt that says "extract the 4-digit Australian postcode from the branch address". Write it into `supplier_reps_staging.postcode`. The trigger above does the rest.

Add a Firecrawl `map` query per brand for branch/locations pages (Boral: `/contact-us/locations`, Heidelberg: `/contact-us`, Hanson: `/about-us/locations`, Holcim: `/contact/find-a-location`) and feed each into the existing `fcScrape` JSON extractor.

### 4. New SECURITY DEFINER RPC: `get_local_supplier_reps(_postcode text)`

Returns the nearest active rep **per brand** to the given postcode, using Haversine against `au_postcode_coords`, filtered by `service_radius_km`. Falls back to the state-level rep if no branch is within radius. Shape:

```
brand_id, brand_name, brand_logo_url,
rep_id, rep_name, rep_role,
email, phone, mobile,
branch_name, branch_address, postcode, state,
distance_km
```

One row per brand — that's "your local rep at Boral", "your local rep at Hanson", etc.

### 5. Rewrite `PreferredRepsBlock` to call the new RPC

Replace the current 3-step query with a single `.rpc('get_local_supplier_reps', { _postcode })` call. Falls back to the business's own postcode (from `businesses.postcode`) when the site address has none. Existing pick/upsert/select logic stays the same.

### 6. Staff UI tweaks (small)

In `SupplierDirectoryTab.tsx`:
- Show postcode + a "📍 geocoded" badge on staged + approved rows
- Add a "Service radius (km)" input to the edit dialog
- Show a warning when a staged row has no postcode (so staff can fix it before approving)

### 7. Operational sequence to get data live

1. Apply migration (new columns, trigger, RPC, seed Hanson + Holcim)
2. Deploy updated scraper
3. Staff runs scrape for all 4 brands from the Suppliers tab
4. Staff reviews staging, fixes any rows missing postcodes, approves
5. Wizard immediately shows "your local rep" per brand based on job postcode

## Technical details

- All distance maths in the RPC, not the client (server-authoritative + indexable). Use existing Haversine pattern from `get_directory_profiles_near_postcode` for consistency.
- RLS: `supplier_reps` already `SELECT` for authenticated. RPC is `SECURITY DEFINER` so it can read `au_postcode_coords` without per-row policy churn.
- No Google Maps API needed — postcode-centroid accuracy (~5km) is fine for "find the closest branch".
- Scraper continues to write to `supplier_reps_staging` only — nothing goes live without staff approval.
- Visibility stays as-is: wizard only, no dashboard widget.

## Files touched

- New migration: columns + trigger + RPC + brand seeds
- `supabase/functions/scrape-supplier-reps/index.ts` — add postcode to schema, scrape 4 brands
- `src/components/jobs/boq/order-wizard/PreferredRepsBlock.tsx` — RPC call, business-postcode fallback
- `src/components/staff/SupplierDirectoryTab.tsx` — postcode badge, radius input, missing-postcode warning

## Out of scope (for now)

- Dashboard widget / dedicated Suppliers page
- Google Maps geocoding (postcode centroids are enough)
- Regional brands (Independent, etc.)
- LinkedIn rep scraping