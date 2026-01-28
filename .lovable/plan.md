

# Sub-Trade Referral & Scheduling System - Implementation Plan

## Executive Summary

This plan implements an External Invite System that allows PourHub businesses to invite subcontractors (pump operators, diggers, testers, finishers) to specific pours via SMS/email. Invites use secure token-based access (no login required), following the existing patterns from quote/variation signing flows.

---

## Phase 1: Database Schema

### New Tables

#### 1. `external_invites` (Core invite tracking)

```sql
CREATE TABLE public.external_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  job_pour_id UUID NOT NULL REFERENCES job_pours(id) ON DELETE CASCADE,
  
  -- Invite details
  invite_type TEXT NOT NULL DEFAULT 'sub_trade',
  role TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT,
  recipient_email TEXT,
  notes TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'drafted' 
    CHECK (status IN ('drafted','sent','viewed','accepted','declined','revoked','expired')),
  
  -- Token security (stored hashed)
  token_hash TEXT NOT NULL UNIQUE,
  token_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  
  -- Delivery tracking
  sent_via TEXT CHECK (sent_via IN ('sms','email','both')),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT require_contact CHECK (recipient_phone IS NOT NULL OR recipient_email IS NOT NULL)
);
```

#### 2. `external_invite_events` (Audit trail)

```sql
CREATE TABLE public.external_invite_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_invite_id UUID NOT NULL REFERENCES external_invites(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);
```

### RLS Policies

```sql
-- Business users can manage their own invites
CREATE POLICY "Users can manage invites for their business"
  ON external_invites FOR ALL
  USING (business_id = get_user_business_id(auth.uid()))
  WITH CHECK (business_id = get_user_business_id(auth.uid()));

-- Audit events follow parent invite access
CREATE POLICY "Users can view events for their invites"
  ON external_invite_events FOR SELECT
  USING (external_invite_id IN (
    SELECT id FROM external_invites WHERE business_id = get_user_business_id(auth.uid())
  ));
```

### Indexes

```sql
CREATE INDEX idx_external_invites_business ON external_invites(business_id);
CREATE INDEX idx_external_invites_pour ON external_invites(job_pour_id);
CREATE INDEX idx_external_invites_token ON external_invites(token_hash);
CREATE INDEX idx_external_invites_status ON external_invites(status);
```

---

## Phase 2: Edge Functions

### 1. `send-subtrade-invite` (Create & send invite)

**Location**: `supabase/functions/send-subtrade-invite/index.ts`

**Flow**:
1. Validate input (recipient name, role, contact method)
2. Generate secure random token (32 bytes, base64url)
3. Hash token with SHA-256 for storage
4. Insert invite record with hashed token
5. Send SMS via Twilio and/or email via Resend
6. Log event to audit trail
7. Return success with invite ID

**Token Security**:
```typescript
const rawToken = crypto.getRandomValues(new Uint8Array(32));
const tokenString = base64url.encode(rawToken);
const tokenHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(tokenString));
```

**SMS Template** (Twilio):
```
{BusinessName}: You're invited to work as {Role} on a pour {Date}.
View & respond: https://pourhub.com.au/i/{token}
```

**Email Template** (Resend):
- Subject: `{BusinessName} - Work Invite for {Date}`
- Body: Business name, pour date/time, site address, role, notes, CTA button

**Required Secret**: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

### 2. `validate-subtrade-token` (Public token validation)

**Location**: `supabase/functions/validate-subtrade-token/index.ts`

**Flow**:
1. Hash incoming token
2. Lookup invite by token_hash
3. Validate: not expired, not revoked, not already responded
4. Mark as "viewed" if first access
5. Return pour details (date, time, address, role, notes, business name)

**Security**: Only exposes necessary data - no internal IDs in response.

### 3. `respond-subtrade-invite` (Accept/Decline)

**Location**: `supabase/functions/respond-subtrade-invite/index.ts`

**Flow**:
1. Validate token (same as above)
2. Update invite status to accepted/declined
3. Set responded_at timestamp
4. Log event to audit trail
5. Notify business (in-app notification + optional email)
6. Return success with optional .ics calendar data

---

## Phase 3: Frontend Components

### 1. Sub-Trade Invite Dialog

**Location**: `src/components/jobs/SubTradeInviteDialog.tsx`

```text
┌─────────────────────────────────────────────────┐
│ Invite Sub-Trade                          [X]   │
├─────────────────────────────────────────────────┤
│ For: Slab Pour 1 - 14 March 2025               │
├─────────────────────────────────────────────────┤
│ Recipient Name *          [________________]    │
│                                                 │
│ Role *                    [Pump Operator  ▼]    │
│   Options: Pump, Digger/Excavation,             │
│            Testing, Finisher, Other             │
│                                                 │
│ Phone Number              [________________]    │
│   (For SMS invite)                              │
│                                                 │
│ Email Address             [________________]    │
│   (For email invite)                            │
│                                                 │
│ Notes (optional)          [________________]    │
│   Access instructions, timing, etc.             │
├─────────────────────────────────────────────────┤
│              [Preview]    [Send Invite]         │
└─────────────────────────────────────────────────┘
```

**Validation**:
- Name required
- Role required
- At least one contact method required
- Phone in E.164 format (+61...)

### 2. Sub-Trade Status Badge Component

**Location**: `src/components/jobs/SubTradeStatusBadge.tsx`

Visual indicator showing invite status:
- 🟡 Invited (sent, awaiting response)
- 🟢 Confirmed (accepted)
- 🔴 Declined
- ⚪ Not invited

### 3. Pour Sub-Trades Section

**Location**: Update `src/components/jobs/tabs/JobPoursTab.tsx`

Add collapsible section to each pour card:

```text
┌─────────────────────────────────────────────────┐
│ Slab Pour 1          Scheduled    [Edit] [Del] │
│ Thu 14 Mar @ 06:30   80m³   Hanson              │
├─────────────────────────────────────────────────┤
│ ▼ Sub-Trades (2/3 confirmed)                    │
│                                                 │
│   🟢 Mike's Pumping - Pump         Confirmed   │
│   🟢 Digger Dave - Excavation      Confirmed   │
│   🟡 Test Labs Inc - Testing       Invited     │
│                                                 │
│   [+ Invite Sub-Trade]                          │
└─────────────────────────────────────────────────┘
```

### 4. Public Invite Response Page

**Location**: `src/pages/public/RespondInvite.tsx`
**Route**: `/i/:token`

```text
┌─────────────────────────────────────────────────┐
│        [XYZ Concreting Logo]                    │
│                                                 │
│   You've been invited to work on a pour         │
├─────────────────────────────────────────────────┤
│                                                 │
│   📅 Thursday, 14 March 2025                    │
│   ⏰ 6:30 AM                                    │
│   📍 123 Builder St, Suburb NSW 2000            │
│   🔧 Role: Pump Operator                        │
│                                                 │
│   Notes from XYZ Concreting:                    │
│   "Access via rear gate, be there 15min early"  │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│   [✓ Accept]              [✗ Decline]           │
│                                                 │
└─────────────────────────────────────────────────┘
```

**After Response**:
```text
┌─────────────────────────────────────────────────┐
│         ✓ Thanks!                               │
│                                                 │
│   XYZ Concreting has been notified.             │
│                                                 │
│   [📅 Add to Calendar]                          │
│                                                 │
│   ────────────────────────────                  │
│   Powered by PourHub                            │
└─────────────────────────────────────────────────┘
```

---

## Phase 4: Schedule Integration

### Update Schedule Views

**Files to modify**:
- `src/pages/admin/AdminSchedule.tsx`
- `src/components/schedule/PourDetailSheet.tsx`

**Changes**:
1. Query external_invites when fetching pours
2. Show confirmation badges on calendar tooltips
3. Add sub-trade section to pour detail sheet

**Visual indicator on calendar**:
```text
┌─────────────────────────────────────────────────┐
│ Slab Pour 1 @ 123 Builder St                    │
│ 🟢🟢🟡 3 sub-trades (2 confirmed)               │
└─────────────────────────────────────────────────┘
```

---

## Phase 5: Notifications

### In-App Notification on Response

When a sub-trade accepts/declines, create notification for business users:
- Type: `subtrade_response`
- Message: "{Name} has {accepted/declined} the {Role} invite for {Pour Name}"

### Optional Email to Business

If business has email notifications enabled, send summary email on response.

---

## File Structure Summary

### New Files

```text
src/
├── components/
│   └── jobs/
│       ├── SubTradeInviteDialog.tsx
│       ├── SubTradeStatusBadge.tsx
│       └── SubTradesList.tsx
├── pages/
│   └── public/
│       └── RespondInvite.tsx
└── hooks/
    └── useSubTradeInvites.ts

supabase/
└── functions/
    ├── send-subtrade-invite/
    │   └── index.ts
    ├── validate-subtrade-token/
    │   └── index.ts
    └── respond-subtrade-invite/
        └── index.ts
```

### Modified Files

```text
src/
├── App.tsx                        (add /i/:token route)
├── components/
│   ├── jobs/
│   │   └── tabs/JobPoursTab.tsx  (add sub-trades section)
│   └── schedule/
│       └── PourDetailSheet.tsx    (add sub-trades display)
└── pages/
    └── admin/
        └── AdminSchedule.tsx      (add confirmation badges)

supabase/
└── config.toml                    (add new function configs)
```

---

## Required Secrets

| Secret | Purpose |
|--------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio account identifier |
| `TWILIO_AUTH_TOKEN` | Twilio API authentication |
| `TWILIO_PHONE_NUMBER` | Twilio sender phone number |

**Note**: `RESEND_API_KEY` already exists for email delivery.

---

## Implementation Order

1. **Database** - Create tables, RLS policies, indexes
2. **Edge Functions** - send-subtrade-invite, validate-subtrade-token, respond-subtrade-invite
3. **Public Page** - RespondInvite.tsx with token validation
4. **Internal UI** - SubTradeInviteDialog, SubTradesList, status badges
5. **Integration** - Update JobPoursTab, PourDetailSheet, AdminSchedule
6. **Notifications** - In-app + optional email on response

---

## Security Considerations

1. **Token Storage**: Tokens are SHA-256 hashed before storage - raw token never persisted
2. **Token Expiry**: 14-day default, configurable per invite
3. **Rate Limiting**: Implement per-business daily invite limit (suggested: 50/day)
4. **Data Exposure**: Public page only shows: date, time, address, role, notes, business name
5. **Revocation**: Revoking an invite immediately invalidates the token
6. **No PII Leakage**: Internal IDs never exposed in URLs or responses

---

## Future Extensibility

The `invite_type` field supports future invite types:
- `builder_approval` - Builder sign-offs
- `supplier_confirmation` - Material confirmations
- `crew_confirmation` - Internal crew confirmations

Each type would add:
- New value in `invite_type` CHECK constraint
- New validation logic in token validation function
- New public page variant

