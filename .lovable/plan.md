
## Remove Duplicate Name Fields from Subcontractor Signup

### Problem
Step 1 ("Create Your Account") asks for "Full Name", then Step 3 ("Profile Details") asks for "First Name" and "Last Name" again.

### Solution
Remove the First Name / Last Name fields from Step 3 and auto-populate them from the Full Name entered in Step 1.

### Changes

**File: `src/pages/subcontractors/SubcontractorSignup.tsx`**

1. When the user moves from Step 2 to Step 3, auto-split the `fullName` into `firstName` and `lastName` (if not already set)
2. Remove the First Name / Last Name input fields from the Step 3 UI (lines ~427-436)
3. The profile insert already has the fallback logic (`firstName || fullName.split(" ")[0]`), so no changes needed there
