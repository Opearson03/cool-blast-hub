

## Default Name Variable to "Mate"

### Problem
When sending CRM emails with the `{name}` variable, if a contact has no name in the database, the variable is replaced with an empty string, leaving awkward gaps like "Hi !" in the email.

### Fix
Update the personalization logic in `supabase/functions/send-crm-email/index.ts` to fall back to "Mate" when the recipient's name is empty.

### Technical Details

**File:** `supabase/functions/send-crm-email/index.ts`

Change line ~101 from:
```typescript
.replace(/{name}/g, recipient.name || "")
```
to:
```typescript
.replace(/{name}/g, recipient.name || "Mate")
```

One line change. All other variables (`{email}`, `{company}`) remain unchanged.

