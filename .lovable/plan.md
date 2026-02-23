
## Center Buttons in Empty State

### Overview
The empty state for sub-contractors on the jobs page currently has left-aligned buttons. To improve the UI consistency with the centered text, I will center the button group.

### Proposed Changes

#### Subcontractor Tab Component
- **File**: `src/components/jobs/tabs/JobSubbiesTab.tsx`
- **Change**: Add `justify-center` to the `flex` container that holds the "Find in Directory" and "Invite Sub-Contractor" buttons within the `CardContent` empty state.

### Technical Details
- The parent container already has `text-center`, so adding `justify-center` to the flex container will align the buttons to the middle horizontally.

```text
Before: <div className="flex gap-2">
After:  <div className="flex gap-2 justify-center">
```

### Verification Plan
- Navigate to a job that has no sub-contractors invited yet.
- Check the "Sub-Contractors" tab.
- Verify that the "Find in Directory" and "Invite Sub-Contractor" buttons are now centered under the empty state text.
