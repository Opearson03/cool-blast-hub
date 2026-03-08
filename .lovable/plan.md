

## Staff Portal Tab Consolidation

### Audit of Current 9 Tabs

| Tab | Content | Issue |
|-----|---------|-------|
| Overview | Signup trends, sub metrics, churn | Keep |
| Users | All users table | Overlaps with Subscriptions (both show businesses/users) |
| **Waiting List** | Waitlist entries | **Remove** — deprecated, contacts already in CRM |
| Subscriptions | Sub metrics (again) + subscribers table | Metrics duplicated from Overview |
| Suppliers | Supplier registrations | Standalone table, low traffic |
| CRM | Contacts, compose, sent, inbox | Keep |
| Subcontractors | Subcontractor profiles | Standalone table, low traffic |
| Affiliates | Affiliate management + commissions | Standalone table, low traffic |
| Bookings | Booking management | Standalone table, low traffic |

### Proposed Structure: 4 Tabs

**1. Overview** (unchanged)
- Signup trends, subscription metrics, churn metrics
- Update stat cards: replace "Waiting List" card with "Bookings" (upcoming count)

**2. Customers** (merge Users + Subscriptions)
- Single tab with the UsersTable and SubscribersTable as sub-tabs ("Users" / "Businesses")
- Remove the duplicate SubscriptionMetrics from here (it lives in Overview)

**3. CRM** (merge CRM + Bookings)
- Add "Bookings" as a 5th sub-tab inside the existing CRM tab structure (alongside Contacts, Compose, Sent, Inbox)
- Bookings are sales-related activity, fits naturally in CRM

**4. Partners** (merge Suppliers + Subcontractors + Affiliates)
- Three sub-tabs: "Suppliers" / "Subcontractors" / "Affiliates"
- All are external partner/vendor management

### Changes

| File | What |
|------|------|
| `StaffDashboard.tsx` | Reduce to 4 top-level tabs. Replace waitlist stat card with bookings. Remove waitlist imports/references. Remove realtime listener for `waiting_list`. |
| `CrmTab.tsx` | Add "Bookings" sub-tab rendering `BookingsTab` component |
| New `PartnersTab.tsx` | Simple sub-tab wrapper rendering `SupplierRegistrationsTable`, `SubcontractorAdminTable`, `AffiliatesTab` |
| New `CustomersTab.tsx` | Sub-tab wrapper with "Users" (`UsersTable`) and "Businesses" (`SubscribersTable`) |

No database or backend changes needed.

