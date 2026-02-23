

## Prevent Duplicate Subcontractor Contacts on Auto-Add

### Problem

The current auto-add logic in both edge functions (`respond-subtrade-invite` and `subcontractor-respond-invite`) only checks for duplicates by matching the subcontractor's **name** (case-insensitive). This means:
- "John Smith" vs "john smith" is caught, but "John Smith" with a different phone/email creates a duplicate
- A subcontractor invited multiple times with slight name variations (e.g. "J Smith" vs "John Smith") but the same email/phone will be added twice

### Solution

Improve the duplicate detection to check by **email OR phone OR name** (within the same business). If any of these match an existing contact, skip the insert. Also add a database-level unique constraint as a safety net.

### Changes

**1. Database migration -- add a unique index**

Add a partial unique index on `subcontractors` to prevent duplicates at the database level:

```sql
-- Prevent duplicate contacts by email within a business
CREATE UNIQUE INDEX IF NOT EXISTS idx_subcontractors_business_email
  ON subcontractors (business_id, LOWER(email))
  WHERE email IS NOT NULL;

-- Prevent duplicate contacts by phone within a business  
CREATE UNIQUE INDEX IF NOT EXISTS idx_subcontractors_business_phone
  ON subcontractors (business_id, phone)
  WHERE phone IS NOT NULL;
```

This ensures that even if the application-level check has a race condition, the database won't allow two contacts with the same email or phone for the same business.

**2. Update edge function duplicate check logic**

In all three locations (respond-subtrade-invite single, respond-subtrade-invite batch, subcontractor-respond-invite), replace the name-only check with a broader query:

```typescript
// Build OR conditions for matching
let query = supabase
  .from("subcontractors")
  .select("id, name, email, phone")
  .eq("business_id", invite.business_id);

// Check by email OR phone OR name
const orConditions = [];
if (invite.recipient_email) orConditions.push(`email.ilike.${invite.recipient_email}`);
if (invite.recipient_phone) orConditions.push(`phone.eq.${invite.recipient_phone}`);
orConditions.push(`name.ilike.${invite.recipient_name}`);

const { data: existing } = await query.or(orConditions.join(",")).maybeSingle();

if (!existing) {
  // Insert new contact
} else {
  // Optionally update missing fields (e.g. add email if only phone existed)
}
```

Additionally, wrap the insert in a try/catch to gracefully handle the unique index violation as a no-op.

**3. Files to modify**

| File | Change |
|---|---|
| New migration SQL | Add partial unique indexes on email and phone per business |
| `supabase/functions/respond-subtrade-invite/index.ts` | Update duplicate check in single handler (lines 206-228) and batch handler (lines 419-440) |
| `supabase/functions/subcontractor-respond-invite/index.ts` | Update duplicate check (lines 103-135) |

