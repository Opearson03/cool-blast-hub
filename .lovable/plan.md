
# Quote Request Widget for Customer Websites

## What we're building
An embeddable "Request a Quote" widget that PourHub members can paste onto their own website with a single `<script>` tag. Customers fill in their details, upload building plans (PDF/image), and the submission lands directly in the member's PourHub Inbox as a pending plan — ready to convert into an estimate using the existing flow.

## How it works (end-to-end)

```text
Customer's website
       │
       │  embed: <script src=".../widget.js" data-business="alias"></script>
       ▼
PourHub Widget (form + plan uploader)
       │
       │  POST multipart  (no auth)
       ▼
Edge function: submit-public-quote-request
       │  - validates business alias
       │  - rate-limits per IP
       │  - validates file (PDF/PNG/JPG, ≤20MB)
       │  - uploads to estimate-plans bucket
       │  - inserts row in pending_plans
       ▼
Member's PourHub Inbox  ──► "Start Estimate" (existing flow)
```

## Pieces to build

### 1. Public landing/preview page — `/widget`
Marketing/help page in PourHub showing:
- What the widget does + screenshot
- The member's personal embed snippet (uses their `inbound_email_alias` as the identifier)
- Customisation options (button colour, heading text)
- Live preview of the widget
- "Copy embed code" button

### 2. Standalone widget bundle — `/embed/quote-request`
A lightweight standalone HTML route (no app chrome, no auth) that renders the form in an iframe. The `<script>` snippet customers paste creates an iframe pointing at this URL with query params (business alias, theme colour).

The embed snippet looks like:
```html
<script src="https://pourhub.com.au/widget.js" 
        data-business="acmeconcrete" 
        data-color="#FF6B00"></script>
```
`widget.js` injects a styled iframe + a floating "Request a Quote" button.

### 3. Widget form (inside the iframe)
- Name, email, phone, site address
- Project description (textarea)
- Plan upload (reuses pattern from `PlanUploader.tsx` — PDF/PNG/JPG, ≤20MB, drag-drop)
- Submit button → calls public edge function
- Success screen ("We've received your plans, [Business Name] will be in touch")
- PourHub-branded footer ("Powered by PourHub")

### 4. New edge function — `submit-public-quote-request`
Public (no JWT). Accepts multipart form data:
- Looks up business by `inbound_email_alias` → gets `business_id`
- Validates inputs (Zod), file type and size
- Rate limits by IP (in-memory or simple counter table) to prevent abuse
- Uploads file to `estimate-plans` storage under `{business_id}/widget-uploads/{uuid}-{filename}`
- Inserts row into `pending_plans`:
  - `from_email` = customer email
  - `from_name` = customer name
  - `subject` = "Quote Request from [Customer] — [Site Address]"
  - `email_body` = project description + phone
  - `file_url` = signed URL
  - `status` = 'pending'
- Returns `{ success: true }`

No DB schema changes needed — `pending_plans` already supports this exact shape, and the existing `PendingPlansSheet` + Inbox UI will display widget submissions automatically.

### 5. CORS + security
- Edge function returns `Access-Control-Allow-Origin: *` (it must be embeddable on any domain)
- Honeypot field + simple rate limiting (e.g., max 5 submissions/IP/hour) to deter spam
- File type validation server-side (magic byte check, not just MIME)
- Max file size enforced server-side

### 6. Inbox visibility
A small "Source: Website Widget" badge on widget-submitted pending plans so members can distinguish them from emailed plans. Add a `source` field to the metadata — store in `extracted_data` JSON to avoid a schema migration.

## Files

**New:**
- `supabase/functions/submit-public-quote-request/index.ts` — public edge function
- `src/pages/embed/QuoteRequestWidget.tsx` — standalone iframe page (no auth, no chrome)
- `public/widget.js` — small loader script (vanilla JS, ~2KB) members embed
- `src/pages/admin/WidgetSettings.tsx` — settings page showing embed snippet + preview
- Add route `/embed/quote-request` (no auth wrapper) and `/admin/widget` in `src/App.tsx`

**Modified:**
- `src/components/jobs/PendingPlansSheet.tsx` — show "Website Widget" badge when source is widget
- Sidebar nav — add "Website Widget" link under settings/marketing area

## Key technical decisions
- **Identifier**: Reuse the existing per-business `inbound_email_alias` (already unique, already public-safe) instead of adding a new widget token
- **No new tables**: `pending_plans` already covers everything needed
- **Iframe over inline injection**: avoids CSS conflicts with the host site, easier to style consistently
- **Standard quote flow unchanged**: widget submissions use the same "Start Estimate" button members already use for emailed plans

