

## Show "Use a Larger Device" Popup on Mobile

### What Changes

When a user taps "New Estimate" (or taps a draft estimate to edit) on a mobile phone, instead of opening the estimate wizard, they'll see a friendly popup saying the takeoff experience works best on a larger screen.

### Changes

| File | What Changes |
|---|---|
| `src/pages/admin/AdminEstimates.tsx` | Import `useIsMobile`, add a `mobileWarningOpen` state, and gate `handleNewEstimate` and `handleRowClick` (draft editing) to show the warning dialog instead of opening the wizard on mobile. Add an `AlertDialog` with the message and a dismiss button. |

### Technical Details

1. **Import** `useIsMobile` from `@/hooks/use-mobile` (already used elsewhere in the project).

2. **Add state**: `const [mobileWarningOpen, setMobileWarningOpen] = useState(false);`

3. **Update `handleNewEstimate`**: Before the quota check, if `isMobile` is true, show the warning dialog and return early.

4. **Update `handleRowClick`**: For draft estimates, if `isMobile`, show the warning instead of opening the edit form. Non-draft estimates (view-only detail sheet) can still open normally.

5. **Add AlertDialog** at the bottom of the JSX:
   - Title: "Larger Screen Recommended"
   - Description: "For the best experience creating estimates and doing takeoffs, please use a tablet or desktop device."
   - Single "Got it" dismiss button

