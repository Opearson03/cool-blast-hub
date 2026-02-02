
# Auto-Update Pour Actual Volume from Delivery Dockets

## Overview

When delivery dockets are assigned to a pour, automatically calculate the sum of all docket volumes and update the pour's `actual_m3` field. This provides real-time tracking of delivered concrete vs estimated.

---

## Current State

- **Delivery dockets** are stored in `pending_documents` table with `extracted_data.volume_m3`
- When approved, dockets get `linked_pour_id` set and `status = 'approved'`
- The `job_pours` table has an `actual_m3` field that is currently manually edited
- The docket number is saved to `job_pours.docket_numbers[]` but the volume is not aggregated

---

## Solution

Create a database trigger that fires whenever a delivery docket is approved or updated, and recalculates the total volume for the linked pour.

### Approach: Database Trigger

A trigger-based solution is preferred because:
1. **Consistency** - Volume updates happen regardless of which UI/API makes changes
2. **Real-time** - Immediate update after any docket approval
3. **No UI changes** - Existing approve flow works as-is
4. **Handles edge cases** - Docket deletions, pour reassignments all handled

---

## Technical Implementation

### 1. Create Database Function

```sql
CREATE OR REPLACE FUNCTION update_pour_actual_volume()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  old_pour_id UUID;
  new_pour_id UUID;
  total_volume NUMERIC;
BEGIN
  -- Determine which pour IDs need updating
  old_pour_id := NULL;
  new_pour_id := NULL;

  IF TG_OP = 'DELETE' THEN
    old_pour_id := OLD.linked_pour_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If pour changed, update both old and new
    IF OLD.linked_pour_id IS DISTINCT FROM NEW.linked_pour_id THEN
      old_pour_id := OLD.linked_pour_id;
    END IF;
    -- Only update new pour if document is approved
    IF NEW.status = 'approved' AND NEW.linked_pour_id IS NOT NULL THEN
      new_pour_id := NEW.linked_pour_id;
    END IF;
    -- If status changed from approved, recalc old pour
    IF OLD.status = 'approved' AND NEW.status != 'approved' AND OLD.linked_pour_id IS NOT NULL THEN
      old_pour_id := OLD.linked_pour_id;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.status = 'approved' AND NEW.linked_pour_id IS NOT NULL THEN
      new_pour_id := NEW.linked_pour_id;
    END IF;
  END IF;

  -- Update old pour (remove this docket's contribution)
  IF old_pour_id IS NOT NULL THEN
    SELECT COALESCE(SUM((extracted_data->>'volume_m3')::NUMERIC), 0)
    INTO total_volume
    FROM pending_documents
    WHERE linked_pour_id = old_pour_id
      AND status = 'approved'
      AND extracted_data->>'volume_m3' IS NOT NULL;

    UPDATE job_pours
    SET actual_m3 = NULLIF(total_volume, 0)
    WHERE id = old_pour_id;
  END IF;

  -- Update new pour (add this docket's contribution)
  IF new_pour_id IS NOT NULL AND new_pour_id IS DISTINCT FROM old_pour_id THEN
    SELECT COALESCE(SUM((extracted_data->>'volume_m3')::NUMERIC), 0)
    INTO total_volume
    FROM pending_documents
    WHERE linked_pour_id = new_pour_id
      AND status = 'approved'
      AND extracted_data->>'volume_m3' IS NOT NULL;

    UPDATE job_pours
    SET actual_m3 = NULLIF(total_volume, 0)
    WHERE id = new_pour_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;
```

### 2. Create Trigger

```sql
CREATE TRIGGER trg_update_pour_volume
AFTER INSERT OR UPDATE OR DELETE ON pending_documents
FOR EACH ROW
EXECUTE FUNCTION update_pour_actual_volume();
```

---

## Behavior

| Action | Result |
|--------|--------|
| Approve docket → pour A | Pour A's `actual_m3` = sum of all approved dockets for that pour |
| Approve another docket → pour A | `actual_m3` increases by new docket's volume |
| Reassign docket from pour A → pour B | Pour A's volume decreases, pour B's increases |
| Reject/unapprove a docket | Pour's `actual_m3` recalculates without that docket |
| Delete a docket | Pour's volume recalculates |
| Docket has no volume | No effect (skipped in sum) |

---

## UI Considerations

### Current Display Already Works

The `PourDetailSheet` already shows:
- **Estimated**: `pour.estimated_m3`
- **Actual**: `pour.actual_m3`

With this change, the "Actual" field will automatically populate as dockets are approved.

### Optional Enhancement: Show Docket Breakdown

Could add a small section in `PourDetailSheet` showing which dockets contributed to the actual volume:

```text
Actual: 45 m³
├─ Docket #12345: 7.5 m³
├─ Docket #12346: 8.0 m³  
├─ Docket #12347: 7.5 m³
└─ Docket #12348: 22.0 m³
```

This would require a simple query to fetch linked approved dockets. **This is optional - the core feature works without it.**

---

## Files to Modify

| Component | Change |
|-----------|--------|
| Database migration | Create trigger function and trigger |
| No UI changes required | Existing displays already show `actual_m3` |

---

## Optional: UI Enhancement for Docket Breakdown

If desired, add to `PourDetailSheet.tsx`:

1. Fetch approved dockets linked to this pour
2. Display volume breakdown below the "Actual" card
3. Show docket number → volume for transparency

---

## Testing Checklist

1. Create a job with a pour (estimated_m3 = 50)
2. Email a delivery docket with volume 8.5m³ to inbox
3. Approve docket → link to pour
4. Verify pour's `actual_m3` = 8.5
5. Approve second docket (7.5m³) → same pour
6. Verify `actual_m3` = 16.0
7. Reassign first docket to different pour
8. Verify first pour's `actual_m3` = 7.5, second pour = 8.5
9. Reject a docket
10. Verify volume recalculates without rejected docket
