

# Plan: Test Result Email Section Improvements

## Overview

Make three improvements to the Test Result Email section in Admin Settings:
1. Change placeholder example from "mullinsconcrete" to "democrete"
2. Auto-generate unique email aliases based on business name during signup/creation
3. Make the section collapsible, default closed, with read-only "copy email" interaction

## Changes

### 1. Update Placeholder Text

**File: `src/components/settings/TestResultEmailSection.tsx`**

Change the input placeholder from:
```
placeholder="e.g., mullinsconcrete"
```
to:
```
placeholder="e.g., pourhub"
```

### 2. Auto-Generate Unique Email Aliases

When a business is created, automatically generate a unique email alias based on their business name. If the alias is already taken, append a number (e.g., `smithconcrete`, `smithconcrete2`, `smithconcrete3`).

**Database Function:**
Create a helper function `generate_unique_email_alias(business_name TEXT)` that:
- Converts business name to lowercase
- Removes special characters and spaces (or converts to underscores)
- Truncates to 30 characters max
- Checks if alias exists, appends incrementing numbers if needed
- Returns the unique alias

**Trigger on Business Creation:**
Create a trigger that automatically sets `inbound_email_alias` when a new business is inserted (if null).

```text
Business Name: "Smith Concreting Pty Ltd"
    ↓ normalize
Generated: "smithconcretingptyltd"
    ↓ check uniqueness
Final: "smithconcretingptyltd" (or "smithconcretingptyltd2" if taken)
```

### 3. Make Section Collapsible with Copy-Only Interaction

**File: `src/components/settings/TestResultEmailSection.tsx`**

Restructure the component to:
- Wrap in `Collapsible` component (default closed)
- Remove the edit functionality (no more alias editing by users)
- Show only the email address and copy button when expanded
- If no alias exists, auto-generate one on first expand or show a "generating..." state

**New UI Structure:**
```text
┌────────────────────────────────────────────────────┐
│ [▶] Test Result Email                              │  ← Collapsed by default
└────────────────────────────────────────────────────┘

When expanded:
┌────────────────────────────────────────────────────┐
│ [▼] Test Result Email                              │
│                                                    │
│  Share this email with your testing lab...         │
│                                                    │
│  ┌────────────────────────────────────────────┐   │
│  │ democrete@pourhub.au             [Copy]    │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  ⓘ Auto-processes PDF attachments                 │
│                                                    │
│  How it works:                                     │
│  1. Share your email address with your lab        │
│  2. Lab sends test results (PDF) to your email    │
│  3. AI automatically extracts test data           │
│  4. Review and approve results to link to jobs    │
└────────────────────────────────────────────────────┘
```

## Technical Details

### SQL Migration

```sql
-- Function to generate unique email alias from business name
CREATE OR REPLACE FUNCTION generate_unique_email_alias(business_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_alias TEXT;
  test_alias TEXT;
  counter INTEGER := 1;
BEGIN
  -- Normalize: lowercase, remove special chars, keep alphanumeric/underscore
  base_alias := regexp_replace(
    lower(business_name), 
    '[^a-z0-9]', 
    '', 
    'g'
  );
  
  -- Truncate to 27 chars to leave room for counter suffix
  base_alias := left(base_alias, 27);
  
  -- Ensure minimum length
  IF length(base_alias) < 3 THEN
    base_alias := base_alias || 'biz';
  END IF;
  
  test_alias := base_alias;
  
  -- Check for uniqueness, append counter if needed
  WHILE EXISTS (
    SELECT 1 FROM businesses WHERE inbound_email_alias = test_alias
  ) LOOP
    counter := counter + 1;
    test_alias := base_alias || counter::TEXT;
  END LOOP;
  
  RETURN test_alias;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate alias on business creation
CREATE OR REPLACE FUNCTION set_inbound_email_alias()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.inbound_email_alias IS NULL THEN
    NEW.inbound_email_alias := generate_unique_email_alias(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_inbound_email_alias
  BEFORE INSERT ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION set_inbound_email_alias();

-- Backfill existing businesses without aliases
UPDATE businesses 
SET inbound_email_alias = generate_unique_email_alias(name)
WHERE inbound_email_alias IS NULL;
```

### Component Changes

**File: `src/components/settings/TestResultEmailSection.tsx`**

- Remove `isEditing`, `newAlias`, and `updateAliasMutation` state/logic
- Add `isOpen` state for collapsible (default `false`)
- Keep only `handleCopy` functionality
- Wrap in `Collapsible` from Radix UI
- Show chevron icon that rotates on expand

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/settings/TestResultEmailSection.tsx` | Complete rewrite: collapsible, read-only, updated placeholder |
| SQL Migration | Add alias generation function, trigger, and backfill |

## User Experience

1. **New businesses**: Automatically get an email alias generated from their name
2. **Existing businesses without alias**: Get one auto-assigned via backfill
3. **Settings page**: Section is collapsed by default - click to expand and copy email
4. **No manual editing**: Reduces complexity; aliases are system-managed for uniqueness

