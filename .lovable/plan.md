## Problem

`AdminJobDetail.tsx` auto-opens the Job Startup Wizard every time a job is opened while `startup_completed === false`. If the user dismisses the wizard, nothing is recorded, so it reappears on every subsequent visit — annoying for jobs the user intentionally skipped.

## Fix

Track a "dismissed" flag so the wizard only auto-opens **once** per job. Users can still re-open it manually later from the job page.

### Approach

Add a `startup_dismissed_at` (timestamptz, nullable) column to `jobs`. When the wizard closes without completion, stamp this column. Auto-open only when both `startup_completed === false` **and** `startup_dismissed_at == null`.

Why a DB column (not localStorage): the dismissal should follow the job across devices/users on the same business, matching how `startup_completed` already works.

### Changes

1. **Migration** — add `startup_dismissed_at timestamptz` to `public.jobs`.
2. **`JobStartupWizard.tsx`** — add an `onDismiss` callback fired when the dialog closes via the X / overlay / explicit Skip, before completion.
3. **`AdminJobDetail.tsx`**
   - Update auto-open effect: open only if `startup_completed === false && !startup_dismissed_at`.
   - On wizard dismiss, update `jobs.startup_dismissed_at = now()` and invalidate the query.
   - (Manual re-open from the existing entry point still works — it just sets `open=true` directly.)

### Out of scope

- Reorganising the wizard UI.
- Changing what "complete" means.
- Migrating existing jobs (they'll behave as before until dismissed once).