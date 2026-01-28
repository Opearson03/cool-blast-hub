

# Subbie Risk Mitigation Implementation Plan

## Overview

This plan implements four key risk mitigation features for the sub-trade invitation system:

1. **Notification Failure Visibility** - Track and display SMS/email delivery status
2. **Duplicate Invite Prevention** - Block inviting same subbie to same pour twice  
3. **Response Confirmation** - Send confirmation SMS/email to subbie after they respond
4. **SMS Rate Limiting** - Cap at 50 SMS messages per business per day

---

## 1. Database Changes

Add new columns to the `external_invites` table to track delivery status:

```sql
ALTER TABLE external_invites 
ADD COLUMN sms_delivery_status TEXT DEFAULT NULL,
ADD COLUMN sms_message_sid TEXT DEFAULT NULL,
ADD COLUMN email_delivery_status TEXT DEFAULT NULL,
ADD COLUMN email_message_id TEXT DEFAULT NULL,
ADD COLUMN sms_error_message TEXT DEFAULT NULL,
ADD COLUMN email_error_message TEXT DEFAULT NULL;
```

**Delivery status values:**
- `null` - Not sent via this channel
- `sent` - Successfully sent to provider
- `failed` - Provider returned error
- `delivered` - Confirmed delivered (if webhook configured)

---

## 2. Edge Function Updates

### 2.1 `send-subtrade-invite/index.ts`

**Rate Limiting (50 SMS/day):**
```text
1. Before sending SMS, query external_invites table
2. Count records where:
   - business_id = current business
   - sms_delivery_status = 'sent'
   - sent_at >= start of today (midnight AEST)
3. If count >= 50, return error: "Daily SMS limit reached (50/day)"
```

**Duplicate Prevention:**
```text
1. Before creating invite, check for existing active invite:
   - Same job_pour_id
   - Same recipient_name (case-insensitive) OR same recipient_phone
   - Status in ('drafted', 'sent', 'viewed', 'accepted')
2. If duplicate found, return error: "This subbie already has an active invite for this pour"
```

**Delivery Tracking:**
```text
1. After Twilio SMS call, capture:
   - message_sid from response
   - Update sms_delivery_status = 'sent' or 'failed'
   - Store error message if failed
2. After Resend email call, capture:
   - email_id from response  
   - Update email_delivery_status = 'sent' or 'failed'
   - Store error message if failed
```

### 2.2 `respond-subtrade-invite/index.ts`

**Response Confirmation:**
After the subbie responds (accept/decline), send them a confirmation:

```text
SMS Template (if phone exists):
- Accept: "Confirmed! You're booked for {Date} as {Role} with {BusinessName}. Add to calendar: {icsUrl}"
- Decline: "Thanks for letting us know. We'll keep you in mind for future work. - {BusinessName}"

Email Template (if email exists):
- Similar content with calendar attachment for accepts
- Includes job details summary
```

### 2.3 `notify-subtrade-reschedule/index.ts`

**Delivery Tracking:**
Same pattern as send-subtrade-invite - capture delivery status after each notification.

---

## 3. UI Updates

### 3.1 `SubTradeStatusBadge.tsx`

Add new delivery status indicators:

| Status | Indicator |
|--------|-----------|
| SMS sent | Green phone icon |
| SMS failed | Red phone icon with warning |
| Email sent | Green mail icon |
| Email failed | Red mail icon with warning |

### 3.2 `SubTradesList.tsx`

Update invite row to show:
- Existing status badge (Invited, Confirmed, etc.)
- **New:** Delivery indicator icons next to phone/email icons
- **New:** Tooltip on hover showing error message if failed
- **New:** "Retry" button for failed notifications

### 3.3 `useSubTradeInvites.ts`

Update interface to include new fields:
```typescript
export interface SubTradeInvite {
  // ... existing fields
  sms_delivery_status: 'sent' | 'failed' | null;
  sms_message_sid: string | null;
  sms_error_message: string | null;
  email_delivery_status: 'sent' | 'failed' | null;
  email_message_id: string | null;
  email_error_message: string | null;
}
```

Add new mutation for retrying failed notifications:
```typescript
export function useResendSubTradeNotification()
```

### 3.4 Error Handling in Dialog

Update `SubTradeInviteDialog.tsx` to show specific error messages:
- "Daily SMS limit reached (50/day). Try sending via email only."
- "This subbie already has an active invite for this pour."

---

## 4. File Changes Summary

| File | Action | Changes |
|------|--------|---------|
| Database Migration | Create | Add delivery tracking columns |
| `supabase/functions/send-subtrade-invite/index.ts` | Modify | Rate limiting, duplicate check, delivery tracking |
| `supabase/functions/respond-subtrade-invite/index.ts` | Modify | Add response confirmation SMS/email |
| `supabase/functions/notify-subtrade-reschedule/index.ts` | Modify | Add delivery tracking |
| `src/hooks/useSubTradeInvites.ts` | Modify | Update interface, add resend mutation |
| `src/components/jobs/SubTradesList.tsx` | Modify | Show delivery status, add retry button |
| `src/components/jobs/SubTradeStatusBadge.tsx` | Modify | Add delivery status indicators |
| `src/components/jobs/SubTradeInviteDialog.tsx` | Modify | Better error message display |

---

## 5. Technical Details

### Rate Limit Check Logic

```typescript
// Check SMS count for today (AEST timezone)
const today = new Date();
today.setHours(0, 0, 0, 0);
const todayIso = today.toISOString();

const { count } = await supabase
  .from("external_invites")
  .select("id", { count: "exact", head: true })
  .eq("business_id", businessId)
  .eq("sms_delivery_status", "sent")
  .gte("sent_at", todayIso);

if (count !== null && count >= 50) {
  return new Response(
    JSON.stringify({ 
      error: "Daily SMS limit reached (50/day). You can still send email-only invites.",
      code: "SMS_RATE_LIMIT"
    }),
    { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

### Duplicate Check Logic

```typescript
const { data: existingInvite } = await supabase
  .from("external_invites")
  .select("id, recipient_name, status")
  .eq("job_pour_id", body.job_pour_id)
  .in("status", ["drafted", "sent", "viewed", "accepted"])
  .or(`recipient_name.ilike.${body.recipient_name},recipient_phone.eq.${body.recipient_phone}`)
  .maybeSingle();

if (existingInvite) {
  return new Response(
    JSON.stringify({ 
      error: `${existingInvite.recipient_name} already has an active invite for this pour`,
      code: "DUPLICATE_INVITE"
    }),
    { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

### Response Confirmation SMS Templates

**Accept:**
```
Confirmed! You're booked for {Date} with {BusinessName}. 
Role: {Role}
Site: {Address}
Questions? Reply to this message.
```

**Decline:**
```
Thanks for letting us know. {BusinessName} will keep you in mind for future work.
```

### Delivery Status UI Component

```typescript
// New component: DeliveryStatusIndicator
interface Props {
  smsStatus: 'sent' | 'failed' | null;
  emailStatus: 'sent' | 'failed' | null;
  smsError?: string;
  emailError?: string;
}

// Shows green/red icons with tooltips
```

---

## 6. User Experience Flow

### Sending Invite
1. User fills form and clicks "Send Invite"
2. Backend checks rate limit (50 SMS/day)
   - If exceeded: Show toast "Daily SMS limit reached. Send via email only or try tomorrow."
3. Backend checks for duplicate
   - If duplicate: Show toast "This subbie already has an active invite"
4. If checks pass, send invite
5. Capture delivery status from Twilio/Resend
6. Show success with delivery confirmation: "Invite sent via SMS and email"

### Viewing Invites
1. SubTradesList shows each invite with status badge
2. Next to phone/email icons, show delivery indicators:
   - ✓ Green check = delivered
   - ⚠ Yellow warning = pending
   - ✗ Red X = failed (with tooltip showing error)
3. If any notification failed, show "Retry" button

### Subbie Responds
1. Subbie clicks Accept/Decline on public page
2. System records response
3. System sends confirmation SMS/email to subbie
4. System sends notification to business (existing behavior)

---

## 7. Edge Cases

1. **Phone provided but SMS fails**: Show failed indicator, still create invite
2. **Rate limit reached mid-batch**: Individual invites fail, not batch
3. **Duplicate detection by phone**: "0412345678" matches "0412 345 678" 
4. **Retry after failure**: Uses same token, just resends notification
5. **Response confirmation fails**: Log error but don't block response recording

