

## Clickable Contact Cards with Detail Sheets

### Overview

When a user clicks on a contact in any tab of the Contact page, a detail sheet (side panel) opens showing contact information and contextual actions specific to the contact type.

### What Already Exists

- **ClientDetailSheet** -- Already built at `src/components/contacts/ClientDetailSheet.tsx` with quotes, jobs, and contact info. Currently NOT wired up to the Clients tab.
- **SubbieContactDetailSheet** -- Already built at `src/components/dashboard/SubbieContactDetailSheet.tsx` with upcoming/past jobs, edit contact, and "Assign to Job". Currently NOT wired up to the Sub-Contractors tab.
- **ContactList** -- Already has an `onSelect` prop that fires when a card is clicked. Currently not passed by any tab.

### Changes Per Tab

#### 1. Clients Tab (`ClientsTab.tsx`)
- Import and use the existing `ClientDetailSheet`
- Add state for `selectedClient` and `detailOpen`
- Pass `onSelect` to `ContactList` that opens the detail sheet
- Add two new action buttons to `ClientDetailSheet`:
  - **"New Quote"** -- navigates to `/admin/estimates` (or opens Quick Quote dialog pre-filled)
  - **"New Job"** -- navigates to `/admin/jobs` with the client pre-selected (or triggers the MiscJobFormDialog)
- Add a **"Resend"** button next to sent quotes in the estimates list

#### 2. Sub-Contractors Tab (`SubbiesTab.tsx`)
- Import and use the existing `SubbieContactDetailSheet`
- Convert the `ContactListItem` back to a `PastSubbie` shape when selected
- Pass `onSelect` to `ContactList` that opens the detail sheet
- The sheet already shows upcoming jobs, past jobs, "Assign to Job", and contact editing -- no changes needed to the sheet itself

#### 3. Suppliers Tab (`SuppliersTab.tsx`)
- Create a new `SupplierDetailSheet` component
- Shows contact info (name, company, phone, email, category)
- Fetches past purchase orders for this supplier from `purchase_orders` table (matched by `supplier_contact_id` or `supplier_name`)
- Action buttons:
  - **"Raise PO"** -- navigates to a job's BOQ order wizard (user picks job first)
  - **"Request Quote"** -- same flow but for quote type
- Lists past POs with status, job name, and date
- Wire up via `onSelect` in `SuppliersTab`

#### 4. Internal Contacts Tab (`InternalContactsTab.tsx`)
- Create a simple `InternalContactDetailSheet` component
- Shows: name, role, phone (clickable), email (clickable), notes
- No complex actions -- just a read-only detail view with edit button
- Make table rows clickable to open the sheet

### New Files

| File | Description |
|---|---|
| `src/components/contacts/SupplierDetailSheet.tsx` | Side sheet showing supplier info, past POs, and raise PO/quote actions |
| `src/components/contacts/InternalContactDetailSheet.tsx` | Simple side sheet showing internal contact details |

### Modified Files

| File | Change |
|---|---|
| `src/components/contacts/ClientsTab.tsx` | Add state + wire `onSelect` to open `ClientDetailSheet`; add "New Quote" and "New Job" buttons to the sheet |
| `src/components/contacts/ClientDetailSheet.tsx` | Add "New Quote" and "New Job" action buttons; add "Resend" to sent quotes |
| `src/components/contacts/SubbiesTab.tsx` | Add state + wire `onSelect` to open `SubbieContactDetailSheet` (converting ContactListItem to PastSubbie format) |
| `src/components/contacts/SuppliersTab.tsx` | Add state + wire `onSelect` to open new `SupplierDetailSheet` |
| `src/components/contacts/InternalContactsTab.tsx` | Add state + wire row clicks to open `InternalContactDetailSheet` |

### Technical Details

**Client Detail Sheet enhancements:**
- "New Quote" button navigates to `/admin/estimates` (the existing quotes page where they can create a new estimate)
- "New Job" button navigates to `/admin/jobs` (the existing jobs page where they can create a new job)
- Resend button on sent estimates calls the existing `send-estimate-email` edge function

**Supplier Detail Sheet data fetching:**
```typescript
// Fetch POs for this supplier
const { data: purchaseOrders } = useQuery({
  queryKey: ["supplier-pos", supplier?.id],
  queryFn: async () => {
    const { data } = await supabase
      .from("purchase_orders")
      .select("*, job:jobs(name, job_number)")
      .or(`supplier_contact_id.eq.${supplier.id},supplier_name.ilike.${supplier.name}`)
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    return data || [];
  },
  enabled: open && !!supplier,
});
```

**Subbie selection mapping:**
The `ContactListItem` from the merged contacts list needs to be mapped to `PastSubbie` format for the existing sheet:
```typescript
const handleSelect = (contact: ContactListItem) => {
  setSelectedSubbie({
    recipient_name: contact.name,
    role: contact.trade || "",
    recipient_email: contact.email || null,
    recipient_phone: contact.phone || null,
  });
  setDetailOpen(true);
};
```

**Internal contact sheet** is deliberately simple -- just a clean card view of the contact's details with call/email action buttons, matching the existing UI patterns.
