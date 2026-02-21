

## Resend Campaigns to New Recipients

### Overview

Add a "Resend" button to each campaign in the Sent Emails log. Clicking it pre-fills the Compose tab with the campaign's subject and HTML body, allowing staff to pick new recipients and send.

### Changes

| File | Change |
|---|---|
| `src/components/staff/crm/SentEmailsLog.tsx` | Add a `onResend` prop callback. Add a "Resend" button inside each expanded campaign that calls `onResend` with the campaign's subject and HTML body. |
| `src/components/staff/crm/CrmTab.tsx` | Add state for pre-filled subject/body. Wire `SentEmailsLog`'s `onResend` to populate that state and switch to the Compose tab. Pass the pre-filled values to `ComposeEmail`. |
| `src/components/staff/crm/ComposeEmail.tsx` | Accept optional `initialSubject` and `initialBody` props. Use them as default values for the subject and body fields so the composer opens pre-filled and ready for the staff to choose new recipients. |

### User Flow

1. Staff opens the **Sent** tab and expands a campaign.
2. Clicks the **Resend** button.
3. The **Compose** tab opens with the subject and HTML body pre-filled from the original campaign.
4. Staff selects new recipients (e.g. "All Leads", "All Contacts", or specific selections) and clicks Send.

No database or backend changes required -- this reuses the existing `send-crm-email` edge function.
