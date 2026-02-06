
# Plan: Auto-Update Business Inbox Email When Name Changes

## Overview
When a user updates their business name in Settings, the inbox email alias (e.g., `smithconcreting@pourhub.au`) should automatically update to reflect the new name.

## Current Behavior
- Alias is generated from business name on **creation only** (INSERT trigger)
- Updating the business name does NOT update the alias
- The `generate_unique_email_alias()` function already exists and handles uniqueness

## Implementation

### 1. Database: Add UPDATE Trigger
Create a new migration that modifies the existing trigger function to handle both INSERT and UPDATE operations:

```sql
-- Update trigger function to regenerate alias when name changes
CREATE OR REPLACE FUNCTION public.set_inbound_email_alias()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On INSERT: always generate if null
  IF TG_OP = 'INSERT' THEN
    IF NEW.inbound_email_alias IS NULL THEN
      NEW.inbound_email_alias := generate_unique_email_alias(NEW.name);
    END IF;
  -- On UPDATE: regenerate if name changed
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.name IS DISTINCT FROM OLD.name THEN
      NEW.inbound_email_alias := generate_unique_email_alias(NEW.name);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Add UPDATE trigger (INSERT trigger already exists)
DROP TRIGGER IF EXISTS trigger_update_inbound_email_alias ON businesses;
CREATE TRIGGER trigger_update_inbound_email_alias
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  WHEN (NEW.name IS DISTINCT FROM OLD.name)
  EXECUTE FUNCTION set_inbound_email_alias();
```

### 2. Frontend: Show Updated Email After Save
Update `AdminSettings.tsx` to:
- Invalidate the business query after saving (already done)
- The `TestResultEmailSection` will automatically reflect the new alias since it receives `currentAlias` from the business data

### 3. Optional Enhancement: Notify User of Email Change
Add a toast notification in the save handler when the business name changes, informing the user their inbox email has also been updated.

## Files Changed
| File | Change |
|------|--------|
| `supabase/migrations/[new].sql` | Add UPDATE trigger for alias regeneration |
| `src/pages/admin/AdminSettings.tsx` | Add notification when name changes |

## Important Considerations
- **Email routing**: The CloudMailin or email forwarding configuration uses these aliases. Updating the alias means the old email address will stop working immediately.
- **User notification**: We should clearly inform users that their inbox email has changed so they can update their testing labs and suppliers.

## Testing Checklist
1. Change business name in Settings and save
2. Confirm the inbox email alias updates to match the new name
3. Verify the `TestResultEmailSection` shows the new email
4. Confirm a toast notification informs the user of the email change
