

## Add Sent Emails Log to CRM

### Overview

The campaign and recipient data is already being stored in the database (`crm_email_campaigns` and `crm_email_recipients` tables) every time an email is sent. We just need a new "Sent" sub-tab in the CRM to display this history.

### Changes

| File | Change |
|---|---|
| `src/components/staff/crm/SentEmailsLog.tsx` | New component -- fetches campaigns from `crm_email_campaigns` ordered by date, shows a list view (subject, recipient count, date, filter type). Clicking a campaign expands to show the HTML body preview and per-recipient delivery status from `crm_email_recipients`. |
| `src/components/staff/crm/CrmTab.tsx` | Add a "Sent" sub-tab (with a History icon) between Compose and Inbox. Renders `<SentEmailsLog />`. |

### Sent Emails Log Details

- **List view**: Each row shows subject, recipient count, sent date, and filter type badge (e.g. "selected", "all leads")
- **Expanded view**: Clicking a campaign shows:
  - The full HTML body (rendered in a preview frame)
  - A recipient table with email, contact type, and delivery status (sent/failed)
- Data comes directly from existing `crm_email_campaigns` joined with `crm_email_recipients` -- no database changes needed

