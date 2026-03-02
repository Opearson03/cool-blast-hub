

## Add SMS Sending to Onboard Waitlist Modal

### Overview
Add an "SMS" tab to the onboarding popup so staff can compose a custom SMS message (with the personalised signup link auto-inserted), and send it via Twilio.

### Changes

**1. New Edge Function: `send-waitlist-sms`**

A backend function that:
- Validates the staff JWT and confirms `pourhub_staff` role
- Accepts `{ waitlistId, phone, message }` in the request body
- Formats the phone to AU E.164 format
- Sends the SMS via Twilio REST API (using existing `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` secrets)
- Updates the waitlist entry's `outreach_status` to "invited" and sets `invited_at`
- Returns success/failure status

**2. Update `supabase/config.toml`**
- Add `[functions.send-waitlist-sms]` with `verify_jwt = false` (validation done in code)

**3. Update `OnboardWaitlistModal.tsx`**
- Add a third tab: "SMS" (with a `MessageCircle` icon)
- The SMS tab reuses the existing plan selection and link generation flow
- Once the link is generated, show:
  - A `Textarea` pre-filled with a default message template including the signup link, e.g.: *"Hey [name], it's PourHub! Here's your personalised signup link with [X] months free: [link]"*
  - The staff member can edit the message freely
  - A "Send SMS" button that calls the new edge function
  - Show the recipient's phone number (from the waitlist entry)
  - If no phone number exists, show a message saying SMS is unavailable for this contact

### No database changes needed
The existing `waiting_list.phone` column and `outreach_status` field are sufficient. The `update_waitlist_outreach` RPC already handles status updates.

### Technical Details

The edge function follows the same pattern as the existing `send-subtrade-invite` Twilio integration:

```text
POST /send-waitlist-sms
Authorization: Bearer <staff-jwt>
Body: { waitlistId, phone, message }

1. Validate JWT + pourhub_staff role
2. Format phone to E.164
3. POST to Twilio Messages API
4. Update waitlist outreach_status via RPC
5. Return { success, sms_status }
```
