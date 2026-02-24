

## Add ABN Lookup to Admin Onboarding

### What changes
Add an ABN verification button next to the existing ABN field in the onboarding wizard (Step 1: Business Details). When the user enters an ABN and clicks "Verify", it calls the `verify-abn` edge function and shows the result (business name, GST status, entity type) or an error. ABN remains optional -- users can skip without verifying.

### File: `src/components/onboarding/OnboardingWizard.tsx`

1. **Import** `useAbnVerification` hook and the `CheckCircle2` / `XCircle` icons (already have `CheckCircle`)
2. **Add state** for ABN verification result (`abnData`, `abnVerified`)
3. **Replace** the plain ABN input (lines 322-331) with:
   - ABN input + "Verify" button side by side
   - Below: verification result card showing legal name, entity type, GST status (green) or error message (red)
   - If verified, auto-populate the `businessName` display if desired
4. **Update `handleSaveBusinessDetails`** to also save the verified legal name if available (the `businesses` table already has a `name` column)
5. The "Continue" and "Skip" buttons remain unchanged -- ABN verification is optional

### UI Behaviour
- User types ABN, clicks "Verify"
- Spinner shows while calling the edge function
- On success: green card with legal name, entity type, GST status
- On failure: red message with error
- User can clear and re-enter a different ABN
- Skipping or continuing without verifying is allowed
