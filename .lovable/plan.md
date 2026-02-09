
# Hide "Retaining Walls" Scope from Scope Selector

## What Changes

The "Retaining Walls" scope will be hidden from the scope selector so users only see "Retaining Wall Footings". Since the retaining walls scope is referenced across many files (calculators, takeoff types, linear inputs, etc.), the safest approach is to simply hide it from the UI selection list rather than removing it entirely -- this avoids breaking any existing estimates that already use it.

## Technical Details (1 file)

### `src/components/estimates/ScopeSelector.tsx`

- Remove or comment out the `retaining_walls` entry (lines 80-86) from the `SCOPE_OPTIONS` array
- This prevents it from appearing as a selectable scope when creating/editing estimates
- Existing estimates that already use `retaining_walls` will continue to function since all calculator logic, type definitions, and constants remain untouched
