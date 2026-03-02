

## Allow Manual Phone Number Entry in SMS Tab

### Problem
When a waitlist entry has no phone number, the SMS tab shows a static "SMS unavailable" message with no way to proceed. Staff should be able to manually type in a phone number and send the SMS anyway.

### Solution
Replace the "SMS unavailable" placeholder with an inline phone number input field. Once a number is entered, the normal SMS flow (plan selection, link generation, message composition, send) proceeds as usual, using the manually entered number instead of the stored one.

### Technical Changes

**File: `src/components/staff/OnboardWaitlistModal.tsx`**

1. Add a `manualPhone` state variable to hold a manually entered phone number
2. Use `entry.phone || manualPhone` throughout the SMS tab logic to determine the active phone number
3. Replace the "No phone number" empty state with an input field:
   - Label: "Enter phone number"
   - Standard text input with placeholder like "04XX XXX XXX"
   - Once a number is entered, show the plan selection and normal SMS flow below it
4. When displaying "Sending to" in the SMS tab, show whichever number is active (stored or manual)
5. Reset `manualPhone` in `handleReset`
6. Pass `entry.phone || manualPhone` to the `send-waitlist-sms` edge function call

No backend or database changes needed -- the edge function already accepts any phone number in the request body.

