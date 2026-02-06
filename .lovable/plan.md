
# Plan: Supplier Portal Implementation

## Overview

Create a new supplier user type with their own dedicated login portal at `/suppliers`, similar to how PourHub staff have their own portal at `/staff`. The `/suppliers` route will show a landing page about supplier advertising opportunities, with login access for registered suppliers.

---

## Architecture

The supplier portal will follow the same pattern as the staff portal:

```text
/suppliers                 -> Landing page + Login
/suppliers/dashboard       -> Supplier dashboard (protected)
suppliers.pourhub.com.au   -> Subdomain access (future)
```

---

## Database Changes

### 1. Add `supplier` to `app_role` enum

```sql
ALTER TYPE public.app_role ADD VALUE 'supplier';
```

### 2. Create `supplier_profiles` table

Store supplier-specific data (separate from the business-owned `supplier_contacts` which tracks contacts a business has added):

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users (unique) |
| company_name | text | Supplier's company name |
| contact_name | text | Primary contact person |
| phone | text | Contact phone |
| email | text | Contact email |
| abn | text | Australian Business Number |
| categories | text[] | Services offered (e.g. concrete, pumping, steel) |
| description | text | Business description |
| logo_url | text | Company logo |
| website | text | Company website |
| service_areas | text[] | Regions they service |
| is_verified | boolean | Verified by PourHub staff |
| created_at | timestamptz | Timestamp |
| updated_at | timestamptz | Timestamp |

### 3. Create `is_supplier` helper function

```sql
CREATE OR REPLACE FUNCTION public.is_supplier(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'supplier'
  )
$$;
```

### 4. RLS Policies for `supplier_profiles`

- Suppliers can view and update their own profile
- PourHub staff can view all supplier profiles (for verification)
- Public can view verified suppliers (for future directory feature)

---

## Frontend Changes

### File Structure

```text
src/
├── pages/
│   └── suppliers/
│       ├── SuppliersLanding.tsx    # Landing page with info + login
│       └── SupplierDashboard.tsx   # Protected supplier dashboard
├── components/
│   └── suppliers/
│       └── SupplierProtectedRoute.tsx  # Route guard
```

### 1. Create `SuppliersLanding.tsx`

A marketing-focused landing page that:
- Explains supplier benefits (reach PourHub users, get quote requests)
- Shows how advertising works
- Includes login form for existing suppliers
- Has a "Register Interest" button (future signup)

Visual sections:
- Hero: "Reach More Concreters with PourHub"
- Benefits: Get quote requests, verified badge, directory listing
- How it works: Register → Get verified → Receive leads
- Login card (same pattern as StaffAuth)

### 2. Create `SupplierDashboard.tsx`

Initial simple dashboard showing:
- Company profile overview
- Placeholder for future features (incoming RFQs, analytics)
- Profile edit capability

### 3. Create `SupplierProtectedRoute.tsx`

Same pattern as `StaffProtectedRoute`:
- Check session exists
- Call `is_supplier` RPC to verify role
- Redirect to `/suppliers` if unauthorized

### 4. Update `useSubdomain.ts`

Add supplier subdomain detection:
```typescript
if (hostname === "suppliers.pourhub.com.au" || hostname.startsWith("suppliers.")) {
  return "suppliers";
}
```

### 5. Update `App.tsx`

Add new routes:
```tsx
{/* Supplier Routes */}
<Route path="/suppliers" element={<SuppliersLanding />} />
<Route path="/suppliers/dashboard" element={
  <SupplierProtectedRoute>
    <SupplierDashboard />
  </SupplierProtectedRoute>
} />
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/suppliers/SuppliersLanding.tsx` | Landing page with marketing info + login |
| `src/pages/suppliers/SupplierDashboard.tsx` | Protected supplier dashboard |
| `src/components/suppliers/SupplierProtectedRoute.tsx` | Route guard for supplier pages |

## Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add supplier routes |
| `src/hooks/useSubdomain.ts` | Add supplier subdomain detection |
| Migration SQL | Add supplier role, table, RLS, and helper function |

---

## Security Considerations

1. Supplier role is separate from business admin/staff roles
2. Suppliers cannot access any business data
3. RLS ensures suppliers only see/edit their own profile
4. PourHub staff can manage supplier verification
5. No cross-role access possible

---

## Future Enhancements (not in this plan)

- Supplier registration/signup flow
- Integration with RFQ system to route quote requests to verified suppliers
- Supplier directory for businesses to browse
- Analytics dashboard for suppliers
- Advertising tier pricing

---

## Testing Checklist

1. Navigate to `/suppliers` - see landing page with login form
2. Attempt login without supplier role - get access denied
3. Login with supplier role - redirect to `/suppliers/dashboard`
4. Verify supplier can view/edit their profile
5. Verify supplier cannot access `/admin` or `/staff` routes
6. Test subdomain detection for `suppliers.pourhub.com.au`
