
Goal: make the Xero connection recoverable and diagnosable with a true “start again” flow, because right now clearing local state alone is unlikely to fix this specific failure.

What I found from the current code and runtime:
1) `xero-auth` is succeeding (HTTP 200) and returning a valid authorization URL.
2) `xero-auth-callback` is not being hit during failed attempts (no callback logs).
3) `xero_connections` currently has no rows, so there is no stale connection record to remove.
4) This means the failure is occurring on Xero’s authorize side before callback (the “unauthorized_client / invalid scope” stage), so “delete local connection and retry” by itself won’t resolve root cause.

Implementation approach

1. Add a true “Reset Xero integration” action in settings (UI + backend call)
- File: `src/components/settings/XeroIntegrationSettings.tsx`
- Add a visible reset action even when not connected:
  - Calls a backend action that always clears any local Xero state for the current business (`xero_connections` + optional related sync rows if desired).
  - Then immediately starts a fresh connect flow.
- UX copy:
  - “Reset and reconnect” (for users stuck in loop).
  - Show clear toast states: reset started, reset complete, redirecting to Xero.

2. Strengthen backend reset logic so it is idempotent
- File: `supabase/functions/xero-api/index.ts`
- Extend `action: "disconnect"` (or add `action: "reset_connection"`) to:
  - Succeed even when no connection exists.
  - Best-effort token revocation.
  - Delete by `business_id` (not just `id`) to guarantee cleanup.
  - Optionally clear `xero_sync_log` entries for that business if we want a full clean slate.
- Return structured response:
  - `{ success: true, hadConnection: boolean, clearedSyncLog: number }`

3. Add OAuth diagnostics in `xero-auth` (no secrets exposed)
- File: `supabase/functions/xero-auth/index.ts`
- Keep current minimal scope set, but add strong logging and optional diagnostic payload:
  - log requested scope string, redirect URI, and client ID prefix/suffix only.
  - include a debug-friendly response field in non-production mode (or always safe) like:
    - `requested_scopes`
    - `redirect_uri`
- This helps verify exactly what Xero is receiving each attempt.

4. Improve callback error forwarding for faster triage
- File: `supabase/functions/xero-auth-callback/index.ts`
- Capture and forward all returned OAuth error details:
  - `error`, `error_description`
- Redirect with encoded reason that admin settings can display:
  - e.g. `?xero=error&reason=unauthorized_client&details=invalid_scope_for_client`
- Keep sanitization so no sensitive values leak.

5. Improve frontend error display in settings
- File: `src/components/settings/XeroIntegrationSettings.tsx`
- Decode and display clearer failure reason:
  - “Authorization was rejected before callback” vs generic “failed”.
- Add a “Copy debug details” button for support-level troubleshooting.

6. Optional fallback for scope compatibility testing (controlled)
- File: `supabase/functions/xero-auth/index.ts`
- Add temporary query/body toggle to request progressively smaller scopes for diagnosis:
  - Tier A: `offline_access accounting.transactions accounting.contacts`
  - Tier B: add `openid profile email`
- This helps identify if Xero is rejecting identity scopes or accounting scopes for this app.
- Keep this behind a debug flag and remove once confirmed.

Why this sequence
1) Reset path first gives immediate operational recovery mechanism.
2) Diagnostics next ensures each retry gives actionable evidence.
3) Callback/UI improvements reduce ambiguity and repeated guesswork.
4) Scope-tier test isolates provider-side mismatch quickly.

Acceptance criteria
1) User can click “Reset and reconnect” from Settings regardless of current connection state.
2) Reset call always returns success and leaves local connection state empty.
3) New connect attempt shows explicit diagnostic values (scope + redirect URI).
4) If provider rejects authorization, UI shows exact reason/details from callback when available.
5) If provider accepts, callback stores `xero_connections` and settings shows “Connected”.

Technical notes and risks
- Main risk: provider-side app configuration mismatch still exists; this plan won’t magically change Xero app permissions but will expose precise evidence.
- No database schema change required.
- No change required to feature-flag gating logic.
- Existing auth call in `xero-api` currently uses `getClaims`; aligning it to `getUser` (as already done in `xero-auth`) is recommended for consistency and fewer auth edge cases.

Validation plan (end-to-end)
1) From `/admin/settings`, click Reset and reconnect.
2) Confirm reset success toast and redirect to Xero.
3) Complete provider auth.
4) Confirm return to settings with connected state + org name.
5) Trigger a “Send to Xero” action from an estimate/variation and verify sync log updates.
