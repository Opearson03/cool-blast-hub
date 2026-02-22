

## Integrate Quick Quote Variations with Job Variations

### The Problem

There are two separate paths to create a variation, with significant overlap:
1. **Quick Quote (Quotes page)** -- creates an estimate, sends for signing, then converts to a `job_variations` row on signature
2. **Add Variation (Job page)** -- creates a `job_variations` row directly, then sends via a separate dialog

These share nearly identical line item editors but differ in useful ways. The goal is to unify them so they complement rather than duplicate each other.

### Approach: Add "Quick Quote Variation" to the Job Variations Tab

Rather than merging the two into one component (which would make both more complex), the cleanest integration is to **make Quick Quote available directly from the Job Variations tab** and **add the missing variation-specific fields to Quick Quote when used for variations**.

This way:
- **VariationFormDialog** remains the "quick internal draft" tool (no client details, no sending -- just log a variation)
- **QuickQuoteDialog** becomes the "send a variation quote for client approval" tool, accessible from both the Quotes page AND the Job Variations tab

### Changes

| File | Change |
|---|---|
| `src/components/estimates/QuickQuoteDialog.tsx` | Accept optional `preselectedJobId` and `preselectedJobName` props. When provided, auto-select "Variation" mode and lock the job selector. Add `reason` and `daysExtension` fields (shown only in variation mode). |
| `src/components/jobs/tabs/JobVariationsTab.tsx` | Add a "Send Quote for Variation" button (or menu item) that opens `QuickQuoteDialog` with the current job pre-selected. Pre-fill client details from the job's source estimate. |

### Detailed Changes

**QuickQuoteDialog.tsx**

- Add new optional props:
  - `preselectedJobId?: string` -- locks the job selector
  - `preselectedJobName?: string` -- display label for the locked job
  - `defaultClientName?: string` -- pre-fill client name
  - `defaultClientEmail?: string` -- pre-fill email
  - `defaultClientPhone?: string` -- pre-fill phone
  - `defaultSiteAddress?: string` -- pre-fill site address
- When `preselectedJobId` is provided:
  - Auto-set `quotePurpose` to `"variation"` and disable the radio toggle
  - Show the job name as a read-only badge instead of the searchable dropdown
  - Show additional variation-specific fields: **Reason** dropdown (same options as VariationFormDialog) and **Days Extension** input
  - Store these in `scope_data` alongside `quote_purpose` and `target_job_id`
- When opened from Quotes page (no props), behavior is unchanged

**JobVariationsTab.tsx**

- Add a new "Quote Variation" button next to (or within) "Add Variation"
  - "Add Variation" stays for quick internal drafts
  - "Quote Variation" opens QuickQuoteDialog with `preselectedJobId={jobId}` and pre-fills client details from the job
- Import `QuickQuoteDialog` and manage its open state
- Pre-fill client details by looking up the job's `builder_client` and source estimate's `client_email`/`client_phone`

### User Experience

From the **Quotes page**: Same as today. User can choose New Job or Variation when creating a quick quote.

From the **Job Variations tab**: Two options:
- **Add Variation** -- quick internal record (draft status, no client interaction)
- **Quote Variation** -- opens a pre-filled Quick Quote dialog for this job, sends a branded quote to the client for e-signature approval. When signed, automatically creates an approved variation on the job.

### What This Achieves

- No duplicate code -- one line-item editor, one sending pipeline
- Clear separation: "Add Variation" = internal tracking, "Quote Variation" = client-facing quote
- Variations created via Quick Quote go through the proper signing flow with branded PDFs
- The job context is automatically passed through, reducing manual entry
- Reason and days extension data flows through to the variation record created on signing

