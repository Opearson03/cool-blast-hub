

# Plan: Automated Test Result Email Ingestion

## Overview

Enable concrete testing labs to email test results directly to a unique business email address (e.g., `mullinsconcrete@pourhub.au`), which automatically uploads the PDF, scans it with AI, and creates a pending test result for review.

## How It Works

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EMAIL INGESTION FLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Lab sends email to: mullinsconcrete@pourhub.au                         │
│                            ↓                                                │
│  2. Resend receives email → triggers webhook → edge function               │
│                            ↓                                                │
│  3. Edge function:                                                          │
│     • Validates the "to" address matches a business                         │
│     • Downloads PDF attachment(s)                                           │
│     • Uploads to storage bucket                                             │
│     • Calls scan-test-document to extract data                             │
│     • Creates pending_test_results record                                   │
│                            ↓                                                │
│  4. Business admin reviews & approves pending results                       │
│     • Links to correct job/pour                                             │
│     • Confirms or edits extracted data                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Database Changes

### New Column: `businesses.inbound_email_alias`
Stores the unique email prefix for each business (e.g., `mullinsconcrete`).

```sql
ALTER TABLE businesses 
ADD COLUMN inbound_email_alias TEXT UNIQUE;
```

### New Table: `pending_test_results`
Holds auto-ingested test results awaiting approval and job linking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `business_id` | uuid | FK to businesses |
| `from_email` | text | Sender's email address |
| `subject` | text | Email subject line |
| `received_at` | timestamptz | When email was received |
| `lab_report_url` | text | Storage URL for uploaded PDF |
| `extracted_data` | jsonb | AI-extracted fields (test_id, mpa, dates, etc.) |
| `status` | enum | `pending`, `approved`, `rejected` |
| `approved_by` | uuid | Who approved it |
| `linked_job_id` | uuid | FK to jobs (set on approval) |
| `linked_pour_id` | uuid | FK to job_pours (optional) |
| `created_at` | timestamptz | Record creation time |

## New Edge Function: `receive-test-email`

Webhook endpoint for Resend inbound emails:

1. **Parse incoming webhook** from Resend (`email.received` event)
2. **Extract recipient address** (the `to` field)
3. **Lookup business** by matching the email alias
4. **Download PDF attachment(s)** using Resend's attachment API
5. **Upload to `test-documents` bucket**
6. **Call `scan-test-document`** to extract data via AI
7. **Insert into `pending_test_results`** with extracted data
8. **Optionally notify business admin** via email/push

## Frontend Changes

### Settings Page Updates
- New section: "Test Result Email Address"
- Display the business's unique email: `{alias}@pourhub.au`
- Allow admin to customize the alias (with validation)
- Copy button for easy sharing with labs

### New Component: Pending Test Results Review
- List of pending test results awaiting approval
- Each item shows:
  - Received date/time
  - Sender email
  - AI-extracted preview (test ID, MPa, date)
  - PDF preview/download link
- Actions:
  - **Approve**: Select job/pour, confirm data, creates `concrete_tests` record
  - **Reject**: Discard with optional reason

### Integration Points
- Badge on Job Test Results tab showing pending count
- Notification when new results arrive
- Quick-link from pending result to job selection

## Infrastructure Requirements

### Resend Configuration (Manual Setup)
The business owner needs to:
1. Configure a custom domain in Resend for receiving (e.g., `pourhub.au`)
2. Add a webhook pointing to the edge function URL
3. Select `email.received` event type

### New Secret Required
- `RESEND_WEBHOOK_SECRET`: For verifying webhook signatures

## Files to Create/Modify

| File | Action |
|------|--------|
| SQL Migration | Add `inbound_email_alias` column, create `pending_test_results` table |
| `supabase/functions/receive-test-email/index.ts` | New webhook handler |
| `supabase/config.toml` | Add function config |
| `src/pages/admin/AdminSettings.tsx` | Add email alias display/edit section |
| `src/components/jobs/PendingTestResultsSheet.tsx` | New review component |
| `src/components/jobs/tabs/JobTestResultsTab.tsx` | Add pending count badge |

## Security Considerations

1. **Webhook signature verification** - Validate Resend webhook signatures
2. **Email alias uniqueness** - Prevent collisions between businesses
3. **RLS policies** - Ensure businesses only see their own pending results
4. **File validation** - Only accept PDF attachments under 10MB
5. **Rate limiting** - Consider limits to prevent abuse

## User Flow Example

1. **Setup** (one-time):
   - Admin goes to Settings → sees their email: `mullinsconcrete@pourhub.au`
   - Shares this email with their concrete testing lab

2. **Lab sends results**:
   - Lab emails test report PDF to `mullinsconcrete@pourhub.au`
   - System automatically processes and extracts data

3. **Admin reviews**:
   - Sees notification "1 pending test result"
   - Opens pending results, sees AI-extracted data
   - Selects correct job/pour, clicks "Approve"
   - Result appears in job's Test Results tab

