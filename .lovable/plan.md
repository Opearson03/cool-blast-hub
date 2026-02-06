

# Fix: Remove Broken Arrow Spinners from Onboarding Price List

## Problem

The price edit input in the onboarding wizard uses `<Input type="number">`, which renders browser-native up/down spinner arrows. These arrows don't work correctly for price adjustments, causing confusion.

## Solution

Change the input from `type="number"` to `type="text"` with `inputMode="decimal"` so there are no spinner arrows. The user simply types the price as a plain number. Validation already exists in `handleSaveEdit` (it checks `Number.isNaN(parseFloat(editValue))`), so invalid entries are safely rejected.

## Changes

**File: `src/components/onboarding/OnboardingPriceList.tsx`**

- Line 220: Change `type="number"` to `type="text"` and add `inputMode="decimal"` for mobile numeric keyboard
- Line 221: Remove `step="0.01"` (not needed for text inputs)

That's it -- one small change, no logic changes needed since the save handler already parses and validates the input.

