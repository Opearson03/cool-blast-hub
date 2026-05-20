## Preferred Supplier Reps — Heidelberg & Boral

Add a curated "Preferred Suppliers" layer to the BOQ ordering flow so users can pick a pre-loaded sales rep from a major concrete supplier (starting with Heidelberg/Hanson and Boral) near their job, with the supplier's logo shown next to them. Data is sourced by a one-off Firecrawl scrape, reviewed by an admin, and stored in our DB — not scraped at runtime.

### 1. New data model

New tables (in `public`):

- `supplier_brands`
  - `name`, `slug` (e.g. "boral", "heidelberg"), `logo_url`, `website`, `primary_color`, `is_active`
- `supplier_reps`
  - `brand_id` → `supplier_brands.id`
  - `name`, `role` (e.g. "Sales Rep", "Area Manager"), `email`, `phone`, `mobile`
  - `region` (e.g. "Sydney Metro"), `state`, `postcodes text[]`, `service_radius_km`
  - `branch_name`, `branch_address`, `lat`, `lng`
  - `source_url`, `last_verified_at`, `is_active`

RLS:
- `supplier_brands` + `supplier_reps`: public `SELECT` to any authenticated user (this is a shared directory, like the subbie directory).
- `INSERT/UPDATE/DELETE` restricted to platform staff (reuse existing `is_staff` / `has_role('admin','staff')` check used elsewhere in the project).

Logos stored in a new public storage bucket `supplier-logos` (uploaded by the scraper edge function).

### 2. Firecrawl scraper (edge function)

New edge function: `scrape-supplier-reps` (verify_jwt = false, staff-token gated).

Per brand it runs a 3-stage Firecrawl flow:

1. `map` the brand's site (`boral.com.au`, `heidelbergmaterials.com.au`) filtered with `search: "contact branch sales"` to find branch/contact pages.
2. `scrape` each candidate page with `formats: ['markdown', { type: 'json', schema }]` where the schema asks for: rep name, role, email, phone, branch, state, address.
3. `scrape` the homepage with `formats: ['branding']` once per brand to pull logo + primary colour, upload the logo to `supplier-logos`, populate `supplier_brands`.

Results are written to a `supplier_reps_staging` table with `status = 'pending'` so a human reviews before promoting rows to `supplier_reps`. This protects us from scrape noise and from publishing personal contact details that shouldn't be there.

Required secret: `FIRECRAWL_API_KEY` (Firecrawl connector).

### 3. Staff review UI

New tab under the existing Staff portal: **Supplier Directory**.
- Lists staged scrape results grouped by brand.
- Each row: approve / edit / reject. Approve copies into `supplier_reps`.
- Manual "Add rep" + "Add brand" buttons for entries Firecrawl misses.
- "Re-run scrape" button per brand (calls the edge function).

### 4. Order wizard integration

In `src/components/jobs/boq/order-wizard/SupplierStep.tsx`, add a new section **above** the existing saved-suppliers search:

```
┌─ Preferred suppliers near {site postcode} ──────────┐
│ [Boral logo]  Jane Smith — Sales Rep, Sydney Metro  │
│               jane@boral.com.au · 0400 000 000  [+] │
│ [Hdlbrg logo] Tom Lee — Area Mgr, Western Sydney    │
│               tom@…                              [+] │
└──────────────────────────────────────────────────────┘
```

- New hook `usePreferredReps(postcode, state)` that queries `supplier_reps` filtered by `postcodes @> {jobPostcode}` OR distance(lat/lng, job) < `service_radius_km`. Falls back to state-level matches.
- Clicking a rep populates the wizard the same way picking a saved supplier does — internally it injects the rep into `manualSupplier` (and optionally saves it to the user's `supplier_contacts` if they tick "Save to my contacts").
- Works for both PO (single) and Quote (multi-select) modes — multi-select lets the user fire RFQs to Boral + Heidelberg at once.

Logo display: small 24px rounded square next to the rep name, using `supplier_brands.logo_url`.

### 5. Rollout

1. Migration + storage bucket.
2. Edge function + Firecrawl connector wired up.
3. Staff review screen.
4. Run scrape for Boral + Heidelberg, approve initial set.
5. Add the "Preferred suppliers" block to `SupplierStep.tsx`.

### Open questions for you

1. **Scope of contact details** — Boral/Heidelberg rarely publish individual rep emails/mobiles publicly; most pages give a branch phone + generic enquiry email. Are you OK starting with **branch-level contacts** (branch name + phone + enquiry email + logo) and adding named reps manually over time? Or do you want me to also scrape LinkedIn (more legally fraught, may need a separate provider)?
2. **Geo matching** — do you want matching by postcode list, by radius from branch lat/lng, or just by state for v1?
3. **Visibility** — should this directory be visible to every business on the platform, or gated behind a plan tier?
