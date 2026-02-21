

## Staff CRM: Contacts, Bulk Email, CSV Import, and Reply Inbox

### Overview

Add a full CRM tab to the staff dashboard with a unified view across three contact sources (leads, waitlist, users), bulk/selective email campaigns via Resend, CSV lead import, and an in-app inbox for replies.

No new "CRM contacts" table is needed for waitlist or users -- those stay where they are. A new `crm_leads` table stores manually added or CSV-imported leads. A new `crm_email_campaigns` + `crm_email_recipients` pair tracks every email sent. A new `crm_inbox` table stores inbound replies via a Resend webhook.

---

### Data Architecture

Three contact sources, queried together in the UI:

| Source | Table | Key fields |
|---|---|---|
| Leads | `crm_leads` (new) | name, email, phone, company, source, tags, notes, created_at |
| Waitlist | `waiting_list` (existing) | full_name, email, phone, business_name, outreach_status |
| Users | `profiles` + `auth.users` (existing, via RPC) | full_name, email, business_name, subscription_status |

New tables:

```text
crm_leads
  id, email, full_name, company_name, phone, source, tags (text[]),
  notes, created_at, updated_at

crm_email_campaigns
  id, subject, html_body, sent_by (staff user id), sent_at,
  recipient_count, filter_type (all/leads/waitlist/users/selected),
  created_at

crm_email_recipients
  id, campaign_id (FK), contact_type (lead/waitlist/user),
  contact_id, email, status (sent/delivered/bounced/opened),
  resend_email_id, sent_at

crm_inbox
  id, from_email, from_name, subject, body_text, body_html,
  in_reply_to_campaign_id (nullable FK), received_at, is_read,
  staff_reply (text, nullable), staff_replied_at
```

---

### New Backend Functions

#### 1. `send-crm-email` (Edge Function)

- Accepts: `{ subject, htmlBody, recipients: [{ email, name, contactType, contactId }] }`
- Staff-only (JWT + `is_pourhub_staff` check)
- Loops through recipients, calls `resend.emails.send()` for each with `from: "PourHub <hello@pourhub.au>"` and `reply-to: crm@pourhub.au` (or a dedicated inbound address)
- Creates a `crm_email_campaigns` row and a `crm_email_recipients` row per recipient
- Returns success count / failure count

#### 2. `receive-crm-reply` (Edge Function)

- Resend inbound webhook endpoint (similar pattern to existing `receive-test-email`)
- Receives replies to `crm@pourhub.au`
- Stores in `crm_inbox` with parsed from/subject/body
- Attempts to match reply to a campaign via the `In-Reply-To` header or sender email lookup in `crm_email_recipients`

#### 3. `get_crm_contacts` (Database RPC)

- Staff-only SECURITY DEFINER function
- Accepts filter param: `all`, `leads`, `waitlist`, `users`
- Returns a unified result set with columns: `contact_type, contact_id, email, full_name, company_name, phone, source_detail, created_at`
- Queries across `crm_leads`, `waiting_list`, and `profiles`/`auth.users`

#### 4. `import_crm_leads` (Database RPC)

- Staff-only
- Accepts a JSONB array of `{ email, full_name, company_name, phone, source, tags, notes }`
- Bulk inserts into `crm_leads`, skipping duplicates by email (ON CONFLICT DO NOTHING)
- Returns count of inserted vs skipped

---

### New Frontend Components

All under `src/components/staff/crm/`:

#### `CrmTab.tsx`
Top-level component rendered in the new "CRM" staff dashboard tab. Contains sub-tabs or a sidebar for:
- **Contacts** (default view)
- **Compose** (email editor)
- **Inbox** (replies)

#### `CrmContactsTable.tsx`
- Fetches contacts via `get_crm_contacts` RPC
- Filter bar: All / Leads / Waitlist / Users
- Search by name/email
- Row selection via checkboxes (for selective email sends)
- "Import CSV" button opens `CsvImportDialog`
- "Add Lead" button opens a simple form dialog
- "Email Selected" button opens `ComposeEmail` with pre-selected recipients

#### `CsvImportDialog.tsx`
- File input accepting `.csv`
- Client-side CSV parsing (native `FileReader` + split -- no library needed)
- Preview table showing parsed rows with column mapping (email, name, company, phone)
- "Import" button calls `import_crm_leads` RPC
- Shows inserted/skipped counts on completion

#### `ComposeEmail.tsx`
- Subject line input
- HTML body editor (simple textarea with a preview toggle -- keeps it lightweight)
- Recipient selection mode:
  - "Selected contacts" (passed from table selection)
  - "Filter: All Leads" / "Filter: All Waitlist" / "Filter: All Users" / "Filter: Everyone"
  - Shows recipient count preview
- "Send" button calls `send-crm-email` edge function
- Shows progress/success toast

#### `CrmInbox.tsx`
- Fetches from `crm_inbox` table ordered by `received_at DESC`
- Shows unread count badge on the Inbox sub-tab
- List view with from, subject, date, read/unread indicator
- Click opens a detail panel showing the full reply body
- "Mark as read" toggle
- Optional: quick reply (calls Resend to send a direct reply)

---

### Staff Dashboard Changes

`StaffDashboard.tsx`:
- Add a new "CRM" tab with a `Contact2` (or `Mail`) icon
- Renders `<CrmTab />` in the new `TabsContent`
- Add `crm_leads` and `crm_inbox` to the realtime subscription channel

---

### DNS Requirement for Inbound Replies

Resend's inbound email feature requires an MX record on a subdomain (e.g., `crm.pourhub.au`) pointing to Resend's inbound servers. This is a one-time DNS configuration step you'll need to do in your domain registrar. I'll set up the webhook endpoint and provide you with the exact MX record values when we build it.

---

### Files to Create / Change

| File | Action |
|---|---|
| Database migration | Create `crm_leads`, `crm_email_campaigns`, `crm_email_recipients`, `crm_inbox` tables with RLS; create `get_crm_contacts` and `import_crm_leads` RPCs |
| `supabase/functions/send-crm-email/index.ts` | New -- bulk email sender via Resend |
| `supabase/functions/receive-crm-reply/index.ts` | New -- Resend inbound webhook for reply storage |
| `src/components/staff/crm/CrmTab.tsx` | New -- top-level CRM tab container |
| `src/components/staff/crm/CrmContactsTable.tsx` | New -- unified contacts table with filters, search, selection |
| `src/components/staff/crm/CsvImportDialog.tsx` | New -- CSV import dialog with preview |
| `src/components/staff/crm/ComposeEmail.tsx` | New -- email composer with recipient modes |
| `src/components/staff/crm/CrmInbox.tsx` | New -- reply inbox viewer |
| `src/pages/staff/StaffDashboard.tsx` | Add "CRM" tab trigger + content |

---

### Build Order

1. **Database migration** -- tables, RLS, RPCs
2. **CrmContactsTable + CrmTab** -- get the contacts view working first
3. **CsvImportDialog** -- CSV import into `crm_leads`
4. **ComposeEmail + send-crm-email** -- email sending
5. **receive-crm-reply + CrmInbox** -- inbound reply handling
6. **StaffDashboard integration** -- wire everything into the dashboard tab
