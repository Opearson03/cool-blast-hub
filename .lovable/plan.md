

# Dashboard Revamp Plan

## Current State

The dashboard currently shows:
- **2 metric cards**: Pours Today, This Week
- **Daily Schedule Widget**: Today's pours with subbie confirmation status
- **Inbox Widget**: Pending plans, tests, dockets (hidden if empty)

## Proposed Revamp

Based on your feedback, the dashboard should focus on:
1. **Today's work & schedule** (primary)
2. **Pending sub-contractor invites** for the week ahead (action required)
3. **Tomorrow preview** (planning ahead)

### New Dashboard Layout

```text
+------------------------------------------+
|  Dashboard                    [+ Quick Add]|
+------------------------------------------+
|                                          |
|  TODAY'S FOCUS                           |
|  ┌──────────┐ ┌──────────┐ ┌──────────┐  |
|  │ 3 Pours  │ │ 2 Subbies│ │ 1 Alert  │  |
|  │ Today    │ │ Pending  │ │ Action   │  |
|  └──────────┘ └──────────┘ └──────────┘  |
|                                          |
|  ┌─ TODAY'S SCHEDULE ──────────────────┐ |
|  │ 6:00am  Slab Pour - 123 Smith St    │ |
|  │         ✓ 3/3 subbies confirmed     │ |
|  │                                     │ |
|  │ 11:00am Formwork - 456 Jones Ave    │ |
|  │         ⚠ 1/2 subbies confirmed     │ |
|  └─────────────────────────────────────┘ |
|                                          |
|  ┌─ SUBBIE RESPONSES NEEDED ───────────┐ |
|  │ Tomorrow (3 pending)                │ |
|  │   • John Smith - Laborer - Sent     │ |
|  │   • Mike Jones - Pump Op - Viewed   │ |
|  │   • Dave Brown - Formworker - Sent  │ |
|  │                                     │ |
|  │ This Week (5 more pending)          │ |
|  │   Wed: 2 awaiting  Thu: 3 awaiting  │ |
|  └─────────────────────────────────────┘ |
|                                          |
|  ┌─ TOMORROW'S PREVIEW ────────────────┐ |
|  │ 2 tasks scheduled                   │ |
|  │ • Site Visit - ABC Project          │ |
|  │ • Earthworks - XYZ Estate           │ |
|  └─────────────────────────────────────┘ |
|                                          |
|  ┌─ INBOX (if items pending) ──────────┐ |
|  │ Plans (2) | Tests (1) | Dockets (0) │ |
|  └─────────────────────────────────────┘ |
+------------------------------------------+
```

### New Components

#### 1. Pending Subbie Invites Widget (NEW)
Shows all sub-contractor invites that haven't been accepted/declined for the next 7 days:

| Field | Description |
|-------|-------------|
| Subbie name | Recipient name from invite |
| Role | Laborer, Pump Operator, etc. |
| Pour date | When they're needed |
| Job name | Quick reference |
| Status | `sent`, `viewed` (not yet responded) |
| Days until | Urgency indicator |
| Action | Quick resend or call button |

Grouped by:
- **Tomorrow** - needs immediate attention
- **This week** - grouped by day with counts

#### 2. Tomorrow's Preview Widget (NEW)
Compact preview of tomorrow's scheduled tasks:
- Task count
- List of pour names with job info
- Any pending subbie issues flagged

#### 3. Enhanced Summary Cards
Replace the current 2-card layout with 3 more actionable cards:

| Card | Current | Proposed |
|------|---------|----------|
| Card 1 | Pours Today | **Today's Tasks** (count + quick view) |
| Card 2 | This Week | **Pending Responses** (subbies awaiting reply) |
| Card 3 | - | **Action Required** (unsigned quotes, pending ITPs, etc.) |

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/dashboard/PendingSubbieInvitesWidget.tsx` | **Create** | New widget showing pending subbie responses for the week |
| `src/components/dashboard/TomorrowPreviewWidget.tsx` | **Create** | Compact tomorrow schedule preview |
| `src/components/dashboard/SummaryCards.tsx` | **Create** | Enhanced 3-card summary component |
| `src/pages/admin/AdminDashboard.tsx` | **Modify** | Integrate new widgets in proper order |
| `src/hooks/useBusinessData.ts` | **Modify** | Add pending subbie invite count to RPC |

### Database Query for Pending Invites

```sql
SELECT 
  ei.id,
  ei.recipient_name,
  ei.recipient_phone,
  ei.role,
  ei.status,
  ei.sent_at,
  jp.pour_date,
  jp.pour_name,
  j.name as job_name
FROM external_invites ei
JOIN job_pours jp ON ei.job_pour_id = jp.id
JOIN jobs j ON ei.job_id = j.id
WHERE ei.business_id = $1
  AND ei.status IN ('sent', 'viewed', 'drafted')
  AND jp.pour_date >= CURRENT_DATE
  AND jp.pour_date <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY jp.pour_date ASC, ei.recipient_name;
```

### Widget Display Order

1. **Summary Cards** (3 cards in a row)
2. **Today's Schedule** (existing, enhanced)
3. **Pending Subbie Invites** (new, priority action item)
4. **Tomorrow's Preview** (new, planning ahead)
5. **Inbox** (existing, only if items pending)

### Technical Notes

- All new widgets will use React Query for data fetching with appropriate cache invalidation
- The pending subbie widget will include a "Resend" quick action for `sent` status invites
- Phone number click will trigger native call on mobile
- Widgets collapse gracefully on mobile (single column layout)
- Empty states will show helpful prompts rather than blank space

