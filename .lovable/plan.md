

## Convert Quick Quotes to Jobs or Variations

### Overview

Add the ability to convert a quick quote into either a **new job** or a **variation on an existing job**. This is integrated at the QuickQuoteDialog's save/send stage so the user chooses the quote's purpose before sending, and the customer's signing page reflects whether it's a variation.

### User Flow

1. In the Quick Quote dialog, a new **"Quote Type"** selector appears above the line items:
   - **New Job** (default) -- behaves as it does today; when the client signs, a new job is created
   - **Variation** -- user picks an existing active job from a dropdown; when the client signs, a variation is created on that job instead

2. When "Variation" is selected:
   - A job selector dropdown appears listing active jobs (fetched from Supabase)
   - The estimate is saved with metadata linking it to the target job (stored in `scope_data` as `{ quote_purpose: "variation", target_job_id: "..." }`)
   - The email/PDF is sent the same way, but the signing page will show it as a variation

3. The **customer signing flow** (already verified working -- loads correctly with branding, signature canvas, and submit) will be enhanced:
   - The `submit-signature` edge function checks if the accepted quote has `quote_purpose: "variation"` in its `scope_data`
   - If so, instead of creating a new job, it creates a `job_variations` row on the target job
   - If not (or "new_job"), it creates a new job as it does today

### Signing Flow Verification

The signing flow has been tested and is **working correctly**:
- Quote loads with full business branding (logo, colors, contact details)
- Client name, site address, and total amount display properly
- Scope of works and terms/conditions render correctly
- Signature canvas is functional (mouse and touch)
- Terms acceptance checkbox and submit button are present
- Token validation and expiry checks are operational

### Changes

| File | Change |
|---|---|
| `src/components/estimates/QuickQuoteDialog.tsx` | Add "Quote Type" radio selector (New Job / Variation), job selector dropdown when Variation is chosen, save `quote_purpose` and `target_job_id` into estimate's `scope_data` |
| `supabase/functions/submit-signature/index.ts` | In the quote signing handler, check `scope_data.quote_purpose`; if `"variation"`, create a `job_variations` row on `scope_data.target_job_id` instead of creating a new job |
| `supabase/functions/validate-signing-token/index.ts` | Include `scope_data` in the response so the signing page can indicate if this is a variation quote |
| `src/pages/public/SignQuote.tsx` | If the quote data indicates it's a variation, show a label like "Variation Quote for [Job Name]" instead of the standard heading |

### Technical Details

**QuickQuoteDialog.tsx**

- Add state: `quotePurpose: "new_job" | "variation"` (default `"new_job"`), `targetJobId: string`
- Fetch active jobs via `useQuery` when dialog opens: `supabase.from("jobs").select("id, name, job_number, site_address").in("status", ["scheduled", "active"])`
- When saving, include in the estimate insert: `scope_data: { quote_purpose: quotePurpose, target_job_id: targetJobId || null }`
- UI: Radio group or segmented toggle between "New Job" and "Variation", with a job select dropdown that appears conditionally

**submit-signature/index.ts**

- After accepting a quote signature, before creating a job, check: `const scopeData = estimate.scope_data || {}; const isVariation = scopeData.quote_purpose === "variation" && scopeData.target_job_id;`
- If variation:
  - Count existing variations on the target job to generate `variation_number`
  - Insert into `job_variations` with the quote's line items, amount, and description
  - Skip the job creation and BOQ generation
  - Set variation status to `"approved"` with `approved_at` and `signed_at`
- If new job: proceed as today (no changes to existing logic)

**validate-signing-token/index.ts**

- Add `scope_data` to the estimate select query
- Include `quotePurpose` and optionally `targetJobName` in the response data (fetch job name if it's a variation)

**SignQuote.tsx**

- Add `quotePurpose` and `targetJobName` to the `QuoteData` interface
- If `quotePurpose === "variation"`, display "Variation Quote" badge and the linked job name in the header area

