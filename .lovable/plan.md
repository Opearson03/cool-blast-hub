

## Add Template Variable Tags to CRM Email Composer

### Overview

Allow staff to use placeholder tags like `{name}`, `{email}`, `{company}` in the email body that get replaced with each recipient's actual data at send time.

### How It Works

1. **Composer UI**: Add a helper strip above the textarea showing available tags (`{name}`, `{email}`, `{company}`). Clicking a tag inserts it at the cursor position.

2. **Server-side replacement**: In the `send-crm-email` edge function, before sending each email, replace all `{name}`, `{email}`, and `{company}` placeholders in the HTML body with the recipient's actual values. Fallback to empty string if a value is missing.

3. **Preview**: The preview toggle will show a note that variables will be replaced per-recipient, and can optionally render with sample data.

### Changes

| File | Change |
|---|---|
| `src/components/staff/crm/ComposeEmail.tsx` | Add a variable tag bar with clickable chips that insert `{name}`, `{email}`, `{company}` into the textarea. Show a note in preview mode. |
| `supabase/functions/send-crm-email/index.ts` | Before each `resend.emails.send()` call, run a string replace on the HTML body: `{name}` with `recipient.name`, `{email}` with `recipient.email`, `{company}` with `recipient.company` (new field passed from frontend). |
| `src/components/staff/crm/CrmContactsTable.tsx` | Pass `company_name` through to the recipient data so it's available for the `{company}` tag. |

### Available Tags

| Tag | Replaced with |
|---|---|
| `{name}` | Recipient's full name (or empty string) |
| `{email}` | Recipient's email address |
| `{company}` | Recipient's company/business name (or empty string) |

