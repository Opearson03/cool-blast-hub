
Fix both estimate wizard issues in V2 only, since that is now the universal flow.

1. Correct the draft/finalise wiring on the summary step
- In `src/components/estimates/EstimateFormDialogV2.tsx`, change the new-estimate summary action so:
  - `Save as Draft` calls the draft mutation/status `"draft"`
  - `Finalize Quote` calls the finalize mutation/status `"pending"`
- Also review `handleSubmit`/`mutation` naming so there is no ambiguous “update” path still saving as pending.
- Result: clicking any draft button will never finalise the quote.

2. Make client saving reliable instead of fire-and-forget
- Replace the current unawaited `saveEstimateClient(...)` call in `goNext()` with an awaited helper so step 1 completion actually finishes the client upsert before moving on.
- Reuse that same helper inside the shared estimate save flow (`saveEstimate`) so clients are also saved when users jump straight to Save Draft / Finalize from later steps.
- Keep the existing “don’t overwrite existing filled fields” behavior.

3. Refresh the contact list/autocomplete after client save
- After a successful client upsert, invalidate the `["clients"]` query so the contacts page and client autocomplete reflect newly saved clients immediately.
- This avoids the situation where the database row exists but the UI still looks empty/stale.

4. Tighten edge cases
- Normalize client name matching when saving (trim consistently, optionally case-insensitive exact match as already intended).
- Ensure placeholder draft records like `Draft Estimate` still do not create contacts.
- Preserve existing estimate update behavior for real drafts vs already-finalised quotes.

5. Verify against current data flow
- The current backend state already shows:
  - recent estimates being saved as `pending`
  - at least one client row created for the active business
- After implementation, I would validate these exact scenarios:
  - new quote → Save as Draft stays `draft`
  - existing draft → Update Draft stays `draft`
  - step 1 Continue creates/updates a client
  - Contacts and autocomplete show the saved client without needing a manual refresh

Technical notes
- Root cause 1: in `EstimateFormDialogV2.tsx`, the new-estimate summary button labeled `Save as Draft` currently calls `handleSubmit`, and `handleSubmit` uses `saveEstimate('pending')`, which finalises the quote.
- Root cause 2: client saving currently happens only in `goNext()` on the client step and is launched in an async IIFE without awaiting completion or invalidating the `clients` query, so the UX appears unreliable even when inserts do succeed.
