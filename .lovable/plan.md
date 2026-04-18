

## Goal
When a customer submits a quote via the website widget, email the PourHub member a notification ("XYZ submitted a quote request…") with the uploaded plan attached as a PDF/image.

## Where the notification goes
The `businesses` table already has an `email` column (the business's primary contact email). I'll reuse that as the notification destination — no new schema needed.

To make it explicit and editable from the widget context, I'll add a small **"Notification email"** input to the widget settings (both the `WidgetEmbedSection` accordion and the full `/admin/widget` page). This input reads/writes `businesses.email` directly, so changes flow through to all the places that already use it. If the field is empty, the notification is skipped (graceful no-op) and we'll show a small inline warning.

## Email content
- **From**: `{Business Name} <{alias}@pourhub.au>` (matches existing outbound pattern)
- **To**: `businesses.email`
- **Subject**: `New quote request from {Customer Name} — {Site Address}`
- **Body** (branded HTML, plain styling consistent with other PourHub emails):
  - "{Customer Name} just submitted a quote request through your website."
  - Customer details: name, email, phone, site address
  - Project description (if provided)
  - "View this submission in your PourHub Inbox" CTA → `https://pourhub.com.au/admin/jobs` (Inbox)
- **Attachment**: the uploaded plan file (PDF/PNG/JPG), passed as base64 via Resend's `attachments` field — file already lives in memory at the point of email sending, so no extra download needed.

## Files

**Modified:**
1. `supabase/functions/submit-public-quote-request/index.ts`
   - After successfully inserting into `pending_plans`, fetch `business.email` (already loaded), and if present, send a notification via Resend
   - Use the in-memory `bytes` (already read for upload) as the attachment — no re-download
   - Wrap in try/catch so notification failure does not fail the submission
   - Log result; existing `RESEND_API_KEY` secret is already configured

2. `src/components/settings/WidgetEmbedSection.tsx`
   - Add a "Notification email" `<Input>` bound to `businesses.email` with a small "Save" button (mutation updates `businesses.email`)
   - Helper text: "We'll send quote submissions to this address. Leave blank to disable notifications."

3. `src/pages/admin/WidgetSettings.tsx`
   - Mirror the same notification email input inside the "Customise" card so it's visible on the dedicated widget page too

**No DB migration**, no new edge function, no new secret.

## Edge cases
- If `business.email` is null/empty → skip the email send silently, log to console
- If Resend send fails → log error but still return `{ success: true }` to the customer (the submission is already saved)
- Attachment size: file is capped at 20MB at upload time; Resend's per-email attachment limit is ~40MB — well within range

