
# Contacts Page - Consolidation of All Contacts & Email History

## Overview

Create a new `/admin/contacts` page that consolidates:
1. **All contact types**: Clients, Subbies, Suppliers
2. **Email inbox history**: A permanent log of all received emails (plans, test results, delivery dockets)

The SubbieContactListWidget will be removed from the dashboard.

---

## Page Structure

The page will use tabs to organize the two main sections:

```text
┌─────────────────────────────────────────────────────────┐
│ Contacts                                                │
├─────────────────────────────────────────────────────────┤
│ [Clients] [Subbies] [Suppliers]  │  [Inbox History]     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Search: [_______________]                              │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Contact Card 1                                   │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Contact Card 2                                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Tab 1: People Contacts

### 1.1 Clients Tab
- Source: `estimates` table (unique by `client_name` + `client_email`)
- Display: Client name, company, email, phone
- Details sheet: Shows all quotes/jobs for this client
- Click to call/email actions

### 1.2 Subbies Tab
- Source: `external_invites` table (existing `useBusinessSubbies` hook)
- Display: Name, role, phone, email
- Grouped by role (Laborer, Formworker, etc.)
- Reuse existing `SubbieContactDetailSheet` for viewing history
- "Invite to Job" action

### 1.3 Suppliers Tab
- Source: `supplier_contacts` table (created for BOQ/PO feature)
- Display: Name, company, category, phone, email
- Grouped by category (Concrete, Reinforcement, etc.)
- Edit/delete actions
- "Send PO" quick action

---

## Tab 2: Inbox History

A permanent log of ALL emails received at the business inbox address, regardless of status.

### Data Sources
Query all three pending tables with all statuses (not just pending):
- `pending_plans` - Quote request plans
- `pending_test_results` - Concrete test reports
- `pending_documents` - Delivery dockets

### Display
- Unified list sorted by `received_at` (newest first)
- Each row shows:
  - Document type icon (Plan/Test/Docket)
  - Subject/file name
  - From email/name
  - Received date
  - Status badge (Pending, Approved, Rejected, Converted)
  - Link to view document
  - Link to associated estimate/job if approved

### Filters
- Document type filter (All, Plans, Tests, Dockets)
- Status filter (All, Pending, Processed)
- Date range (optional)
- Search by subject/sender

---

## Technical Implementation

### 1. Create New Page: `src/pages/admin/AdminContacts.tsx`

Main page component with tabs:
- Uses `AdminLayout`
- Tabs: People (with sub-tabs for Clients, Subbies, Suppliers) | Inbox History
- Search functionality for each section

### 2. Create Contact Components

**New files:**
- `src/components/contacts/ClientsTab.tsx` - Lists unique clients from estimates
- `src/components/contacts/ClientDetailSheet.tsx` - Shows client details and history
- `src/components/contacts/SuppliersTab.tsx` - Lists supplier contacts
- `src/components/contacts/InboxHistoryTab.tsx` - Unified email log

**Reuse existing:**
- Move `SubbieContactListWidget` logic into `src/components/contacts/SubbiesTab.tsx`
- Keep `SubbieContactDetailSheet` (already full-featured)
- Keep `SupplierContactDialog` for add/edit

### 3. Add Navigation

Update `AdminLayout.tsx` to add "Contacts" nav item:
```typescript
{ href: "/admin/contacts", label: "Contacts", icon: Users }
```

### 4. Add Route

Update `App.tsx`:
```typescript
<Route path="/admin/contacts" element={<ProtectedRoute allowedRole="admin"><AdminContacts /></ProtectedRoute>} />
```

### 5. Update Dashboard

Modify `AdminDashboard.tsx`:
- Remove `<SubbieContactListWidget />` component
- Remove import

---

## Inbox History Query

```sql
-- Unified inbox history view (conceptual)
SELECT 
  id,
  'plan' as type,
  from_email,
  from_name,
  subject,
  file_url,
  received_at,
  status,
  linked_estimate_id as linked_id
FROM pending_plans
WHERE business_id = ?

UNION ALL

SELECT 
  id,
  'test' as type,
  from_email,
  NULL as from_name,
  subject,
  lab_report_url as file_url,
  received_at,
  status::text,
  linked_job_id as linked_id
FROM pending_test_results
WHERE business_id = ?

UNION ALL

SELECT 
  id,
  'docket' as type,
  from_email,
  NULL as from_name,
  subject,
  file_url,
  received_at,
  status,
  linked_job_id as linked_id
FROM pending_documents
WHERE business_id = ?

ORDER BY received_at DESC
```

---

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/admin/AdminContacts.tsx` | Create | Main contacts page with tabs |
| `src/components/contacts/ClientsTab.tsx` | Create | Client contacts list |
| `src/components/contacts/ClientDetailSheet.tsx` | Create | Client history sheet |
| `src/components/contacts/SubbiesTab.tsx` | Create | Subbies list (from widget) |
| `src/components/contacts/SuppliersTab.tsx` | Create | Supplier contacts list |
| `src/components/contacts/InboxHistoryTab.tsx` | Create | Email inbox history log |
| `src/components/layout/AdminLayout.tsx` | Modify | Add Contacts nav item |
| `src/App.tsx` | Modify | Add /admin/contacts route |
| `src/pages/admin/AdminDashboard.tsx` | Modify | Remove SubbieContactListWidget |

---

## User Flow

### Viewing Contacts
1. Navigate to Contacts from sidebar
2. Default view shows Clients tab
3. Switch between Clients, Subbies, Suppliers tabs
4. Search/filter within each tab
5. Click contact to see detail sheet with history

### Viewing Inbox History
1. Click "Inbox History" tab
2. See all received emails in chronological order
3. Filter by type or status
4. Click to view document
5. Click linked job/estimate to navigate there

---

## Benefits

1. **Centralized contact management** - One place for all business contacts
2. **Email audit trail** - Permanent record of all received documents
3. **Cleaner dashboard** - Focus on daily operations, not contact browsing
4. **Better organization** - Clients, subbies, suppliers clearly separated
5. **Quick actions** - Call, email, invite, or send PO directly from contact view
