
## Goal
Fix two related problems in the sub-trade invite system:
1) When a pour date changes and you choose “Reschedule & Notify”, the contractor receives a link but it fails (or they can’t re-confirm).
2) SMS invites sometimes “fail” (or appear sent when they actually failed), and resending can be blocked.

---

## What I found (root causes)

### A) Reschedule links are being generated incorrectly
In `supabase/functions/notify-subtrade-reschedule/index.ts` the reschedule SMS/email link is built like:

- `https://pourhub.com.au/i/${invite.token_hash.slice(0, 43)}`

But `token_hash` is a SHA-256 hex hash of the real token, not the real token itself. Slicing it produces a string that will never validate in `validate-subtrade-token` (which re-hashes the provided token and compares hashes). So the link can’t work.

### B) Reschedule doesn’t reset “already responded” invites
Even if the link were correct, `validate-subtrade-token` intentionally blocks invites that are already `accepted`/`declined` and the contractor can’t re-respond. In a reschedule scenario we want them to confirm again.

### C) Some SMS “failures” are real delivery failures (Twilio trial restriction)
Your database contains SMS failures like Twilio error `21608` (trial accounts can’t send to unverified numbers). So the system may create an invite successfully, but SMS delivery fails. Right now, some UI flows still show “Invite sent successfully” even when `sms_delivery_status = failed`.

### D) Resend workflow is currently broken for sub-trade invites
`useResendSubTradeNotification()` sends `resend_invite_id`, but `send-subtrade-invite` does not handle it. The duplicate-invite protection then blocks the resend (“Duplicate found by name/phone”), preventing recovery after a failed SMS.

### E) Links are hardcoded to `https://pourhub.com.au`
Some functions hardcode `pourhub.com.au`. If your environment/published URL differs, recipients may land on the wrong site. You already have an `APP_URL` backend secret; we should use it for all public links.

---

## Implementation plan

### 1) Fix reschedule notifications to send a valid working link
**File:** `supabase/functions/notify-subtrade-reschedule/index.ts`

For `action === "reschedule"`:

1. **Use APP_URL as the base URL**
   - `const appUrl = (Deno.env.get("APP_URL") || "").replace(/\/+$/, "");`
   - Build links as `${appUrl}/i/${rawToken}`.

2. **Generate a fresh token on reschedule (so we can send a real token)**
   - Create a new `rawToken` (URL-safe base64) and `tokenHash = sha256(rawToken)`.

3. **Update the invite(s) in the database to match the new token hash**
   - **Single invite:** update that invite row’s `token_hash = tokenHash`.
   - **Batch invite:** update **all rows in that batch** (`batch_id = ...`) to:
     - `batch_token_hash = tokenHash`
     - `token_hash = tokenHash`
     - (keep other pours’ statuses as-is; only reset the rescheduled pour invite status)

4. **Reset invite state so the contractor can re-confirm**
   - For invites tied to the rescheduled pour:
     - set `status = "sent"`
     - set `responded_at = null`
     - optionally `viewed_at = null`
     - refresh `token_expires_at` (e.g., +14 days)

5. **Send ONE notification per recipient (avoid duplicate SMS/email spam)**
   - Group invites by `(batch_id or invite.id)` and send one message per group.
   - Message includes old date/new date + correct link using the new `rawToken`.

6. **Return detailed results to the client**
   - keep/extend existing response: `sms_sent`, `sms_failed`, `emails_sent`, `emails_failed`, plus per-recipient errors.

This resolves:
- invalid reschedule link
- “already accepted so you can’t confirm again”
- wrong domain issues via APP_URL

---

### 2) Fix invite sending links to use APP_URL everywhere (not hardcoded domain)
**Files:**
- `supabase/functions/send-subtrade-invite/index.ts`
- `supabase/functions/send-batch-subtrade-invite/index.ts`
- (and any other invite-related function that outputs `/i/...` links)

Changes:
- Replace `https://pourhub.com.au/i/...` with `${appUrl}/i/...` using `APP_URL`.
- Keep the existing token hashing approach (store only hashes), but always send raw token in the link.

This ensures links work in every environment and after any domain change.

---

### 3) Repair the resend workflow (so failed SMS can be retried)
**File:** `supabase/functions/send-subtrade-invite/index.ts`

Add support for optional `resend_invite_id`:
1. If `resend_invite_id` is present:
   - Load that invite by ID.
   - Verify it’s a `sub_trade` invite and belongs to the same business as the authenticated user (via the pour → job → business relationship).
   - Regenerate a new token + hash, update that invite row:
     - `token_hash`, `token_expires_at`, `sent_at = now()`
     - reset delivery fields (`sms_delivery_status`, `sms_error_message`, etc.)
     - keep status as `sent` (or set to `sent`)
   - Send notifications again.
   - Skip the duplicate-invite check (because this is explicitly a resend).

2. Update the response so the UI can show whether SMS/email succeeded.

This resolves the current “duplicate blocks resend” behavior shown in logs.

---

### 4) Improve UI feedback: don’t say “Invite sent” when SMS failed
**Frontend files to update (where invites are sent):**
- `src/components/jobs/SubTradeInviteDialog.tsx`
- `src/components/schedule/ScheduleSubbieDialog.tsx`
- `src/components/schedule/PourDetailSheet.tsx`
- `src/components/jobs/PourFormDialog.tsx` (the “create & invite” flow)
- `src/components/jobs/wizard/SubbieSelectionStep.tsx`
- `src/components/jobs/SubbieDetailSheet.tsx`

Changes:
- After `mutateAsync()`, inspect returned `{ sms_status, email_status, warning? }`.
- Show:
  - `toast.success` only if at least one channel succeeded.
  - `toast.warning` if email succeeded but SMS failed (or rate-limited).
  - `toast.error` if both failed.
- Keep the dialog open when everything failed (so user can adjust phone/email).

Additionally:
- In `src/components/jobs/SubTradesList.tsx`, show a **Resend** button when:
  - `sms_delivery_status === "failed" || sms_delivery_status === "rate_limited" || email_delivery_status === "failed"`
  - and wire it to the existing `useResendSubTradeNotification()`.

---

### 5) Make Twilio trial restrictions obvious (optional but recommended)
When SMS fails with Twilio error code `21608`, improve the surfaced message:
- Parse JSON-ish `sms_error_message` when possible.
- Display a friendly tooltip text like:
  - “SMS failed: Twilio trial accounts can only message verified numbers.”

This can be done in `DeliveryStatusIndicator` (tooltip formatting) and/or in the toast.

---

## How we’ll test (end-to-end)

1. **Create an invite** to a test phone/email.
   - Confirm the invite link opens `/i/:token` and loads the invite details.

2. **Accept the invite** as the contractor.

3. **Change pour date** and choose “Reschedule & Notify”.
   - Contractor receives a new link.
   - Link loads successfully (no “invalid/expired”).
   - Invite is no longer “already responded”; contractor can accept/decline again.

4. **Force an SMS failure** (e.g., known-unverified number in Twilio trial).
   - Ensure UI shows warning/error (not success).
   - Ensure delivery indicator shows failure details.
   - Click “Resend” and confirm the resend is not blocked by duplicate checks.

5. Verify `external_invites` rows update correctly:
   - token hashes change on reschedule/resend
   - statuses reset only where intended
   - delivery status fields populated consistently

---

## Deliverables (files likely changed)

### Backend functions
- `supabase/functions/notify-subtrade-reschedule/index.ts` (main fix)
- `supabase/functions/send-subtrade-invite/index.ts` (APP_URL + resend_invite_id support + improved delivery status defaults)
- `supabase/functions/send-batch-subtrade-invite/index.ts` (APP_URL)

### Frontend
- Invite sending UIs listed above
- `src/components/jobs/SubTradesList.tsx` (resend button conditions)
- (Optional) `src/components/jobs/DeliveryStatusIndicator.tsx` (friendlier Twilio error display)

---

## Notes / Constraints
- We will continue storing only hashed tokens in the database (good security practice). For reschedule/resend we generate new tokens and update hashes accordingly.
- If your SMS provider account is still in trial mode, some “SMS failures” are expected until numbers are verified or the account is upgraded. The UI changes will make this clear instead of silently reporting success.
