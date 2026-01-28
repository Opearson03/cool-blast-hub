
# Plan: Batch Sub-Trade Invites with Single Response Link

## The Problem

Currently, when inviting a subbie to multiple pours:
1. **Multiple SMS/emails** are sent (one per pour)
2. Each SMS contains a **separate link** for each pour
3. The subbie has to respond to each invite individually
4. This is confusing for the subbie and wastes SMS credits

## The Solution

Send **ONE SMS/email** with a **single link** that shows ALL the pours they've been invited to, allowing them to accept/decline each pour from a single page.

## Architecture Changes

### New Concept: "Invite Batch"

Group multiple pour invites under a single batch ID and token:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CURRENT vs PROPOSED                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CURRENT (per-pour invites):                                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │ Invite A         │  │ Invite B         │  │ Invite C         │          │
│  │ token_hash: abc  │  │ token_hash: def  │  │ token_hash: ghi  │          │
│  │ pour_id: 1       │  │ pour_id: 2       │  │ pour_id: 3       │          │
│  │ → SMS #1         │  │ → SMS #2         │  │ → SMS #3         │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                             │
│  PROPOSED (batch invites):                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │ Invite Batch (batch_id: xyz)                                     │      │
│  │ batch_token_hash: abc123 → ONE SMS                               │      │
│  │ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │      │
│  │ │ Invite A    │  │ Invite B    │  │ Invite C    │                │      │
│  │ │ pour_id: 1  │  │ pour_id: 2  │  │ pour_id: 3  │                │      │
│  │ │ status: ?   │  │ status: ?   │  │ status: ?   │                │      │
│  │ └─────────────┘  └─────────────┘  └─────────────┘                │      │
│  └──────────────────────────────────────────────────────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Database Changes

Add new columns to `external_invites`:

```sql
ALTER TABLE external_invites
  ADD COLUMN batch_id UUID DEFAULT NULL,
  ADD COLUMN batch_token_hash TEXT DEFAULT NULL;

CREATE INDEX idx_external_invites_batch_id ON external_invites(batch_id);
CREATE INDEX idx_external_invites_batch_token_hash ON external_invites(batch_token_hash);
```

- `batch_id`: Groups invites that should share a single link
- `batch_token_hash`: The hashed token used for the batch link (all invites in batch share this)

### API Changes

**1. New Edge Function: `send-batch-subtrade-invite`**

Accepts multiple pour IDs and creates invites with a shared batch:

```typescript
// Request body
{
  job_pour_ids: string[],        // Array of pour IDs
  recipient_name: string,
  role: string,
  recipient_phone?: string,
  recipient_email?: string,
  notes?: string
}

// Response
{
  success: true,
  batch_id: "uuid",
  invite_count: 3,
  sent_via: "sms",
  ...
}
```

**2. Update Edge Function: `validate-subtrade-token`**

- Check for `batch_token_hash` in addition to individual `token_hash`
- Return ALL invites in the batch when batch token is used

**3. Update Edge Function: `respond-subtrade-invite`**

- Accept `invite_id` + `response` for each pour (or all at once)
- Support responding to individual pours within a batch

### Frontend Changes

**1. Update `SubbieSelectionStep.tsx`**

- Instead of calling `send-subtrade-invite` in a loop, call new `send-batch-subtrade-invite` once

**2. Update `RespondInvite.tsx` Page**

Show ALL pours in the batch with individual accept/decline for each:

```text
┌─────────────────────────────────────────────────────────────┐
│  [LOGO] JEFCON PTY LTD                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Hi John, you've been invited to work on 3 pours           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📅 Monday, 3 Feb - Garage Slab                      │   │
│  │ 📍 11B Cobbans Close                                │   │
│  │ 🔧 Role: Pump Operator                              │   │
│  │                          [Decline] [Accept ✓]       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📅 Wednesday, 5 Feb - Driveway                      │   │
│  │ 📍 11B Cobbans Close                                │   │
│  │ 🔧 Role: Pump Operator                              │   │
│  │                          [Decline] [Accept ✓]       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📅 Friday, 7 Feb - Footpath                         │   │
│  │ 📍 11B Cobbans Close                                │   │
│  │ 🔧 Role: Pump Operator                              │   │
│  │                          [Decline] [Accept ✓]       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│            [Submit All Responses]                           │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                    Powered by PourHub                       │
└─────────────────────────────────────────────────────────────┘
```

### SMS Message Update

Instead of:
> "You're invited to work as Pump Operator on a pour Monday, 3 February."

New format:
> "JEFCON: You're invited to 3 pours as Pump Operator (Feb 3, 5, 7). View & respond: pourhub.com.au/i/abc123"

### Backwards Compatibility

- Existing single-pour invites continue to work (no `batch_id`)
- The response page detects batch vs single and renders accordingly
- Old invite links remain valid

## Files to Modify

| File | Changes |
|------|---------|
| **Database Migration** | Add `batch_id` and `batch_token_hash` columns |
| `supabase/functions/send-batch-subtrade-invite/index.ts` | **NEW** - Create batch invites with single token |
| `supabase/functions/validate-subtrade-token/index.ts` | Support batch token lookup |
| `supabase/functions/respond-subtrade-invite/index.ts` | Handle batch responses |
| `src/pages/public/RespondInvite.tsx` | Multi-pour response UI |
| `src/components/jobs/wizard/SubbieSelectionStep.tsx` | Use batch invite endpoint |
| `src/components/jobs/PourSubbieStep.tsx` | Use batch invite endpoint |
| `src/hooks/useSubTradeInvites.ts` | Add `useSendBatchSubTradeInvite` hook |

## Technical Details

### Batch Creation Flow

1. Frontend calls `send-batch-subtrade-invite` with multiple pour IDs
2. Edge function generates ONE token and hashes it
3. Creates N invite records, all sharing the same `batch_id` and `batch_token_hash`
4. Sends ONE SMS/email with the batch link

### Response Flow

1. Subbie clicks link → `validate-subtrade-token` detects batch
2. Returns array of invites with pour details
3. Subbie accepts/declines each pour individually
4. Clicks "Submit" → `respond-subtrade-invite` updates all at once
5. Business receives ONE notification summarizing all responses
