

## Auto-add Booking Contacts to CRM Leads

### Change

In `supabase/functions/create-booking/index.ts`, after the booking is successfully inserted, upsert a row into `crm_leads` with the booking contact's details. Use `ON CONFLICT (email) DO NOTHING` to avoid duplicates.

### Implementation

**File: `supabase/functions/create-booking/index.ts`** — After the booking insert (around line 155), add:

```typescript
// Add to CRM as a lead
try {
  await supabase
    .from("crm_leads")
    .upsert({
      email: email,
      full_name: name,
      company_name: company,
      phone: phone || null,
      source: "booking",
    }, { onConflict: "email", ignoreDuplicates: true });
} catch (crmErr) {
  console.error("CRM lead insert failed:", crmErr);
}
```

This uses the service role client already in scope, so RLS (staff-only) is bypassed. If the email already exists in `crm_leads`, the insert is silently skipped. The `source` is set to `"booking"` so staff can filter/identify these leads.

No database changes needed — `crm_leads` table already has all the required columns.

