

# "Create Your First Quote" Guided Onboarding Flow

## What Changes

### 1. Onboarding Wizard Completion Step (Step 4)
**File: `src/components/onboarding/OnboardingWizard.tsx`**

Replace the "Create your first job" card with a "Create your first quote" card that navigates to `/admin/estimates` with a state flag (`{ startFirstQuote: true }`). Also add a secondary option for "Create your first job" as a less prominent alternative.

### 2. First-Quote Guided Overlay on Estimates Page
**File: `src/pages/admin/AdminEstimates.tsx`**

- Detect the `startFirstQuote` navigation state flag
- Track whether the user has zero estimates (first-time user)
- When triggered, show a welcoming intro modal/card explaining the quote wizard steps before opening the estimate form
- Auto-open the `ActiveEstimateFormDialog` after the user clicks "Let's Go"

### 3. New Component: `FirstQuoteGuide`
**File: `src/components/onboarding/FirstQuoteGuide.tsx`**

A dialog/modal that shows before the estimate form opens, with:
- Welcome message: "Let's create your first quote!"
- Visual step-by-step preview of what they'll do:
  1. **Client Details** — Enter client name, email, and site address
  2. **Select Scope** — Choose what type of work (driveway, slab, etc.)
  3. **Plan Takeoff** *(optional)* — Upload plans and measure from PDF
  4. **Configure Costs** — Fill in quantities, the calculator does the rest
  5. **Margin & Conditions** — Set your markup and terms
  6. **Review & Send** — Preview the PDF and send to your client
- A prominent "Create My First Quote" CTA button
- A "Skip, I'll explore first" secondary option

### 4. Step-by-step tooltips inside the Estimate Form (lightweight)
**File: `src/components/estimates/EstimateFormDialog.tsx`**

- Accept an optional `isFirstQuote` prop
- When `isFirstQuote` is true, show a small contextual hint banner at the top of each step with a brief explanation of what to do (e.g., on the "client" step: "Start by entering your client's name and the site address. You can add their email and phone later.")
- These hints are dismissible and non-blocking

## Technical Details

- The `startFirstQuote` flag is passed via React Router's `navigate("/admin/estimates", { state: { startFirstQuote: true } })` and consumed via `useLocation().state`
- The `FirstQuoteGuide` component is a standard `Dialog` with step icons matching the estimate wizard's `STEP_ORDER`
- The hint banners inside `EstimateFormDialog` use the existing card/badge patterns and only render when `isFirstQuote={true}`
- No database changes required — this is purely a frontend UX enhancement

## Files Modified
1. `src/components/onboarding/OnboardingWizard.tsx` — Change Step 4 CTA from "first job" to "first quote"
2. `src/pages/admin/AdminEstimates.tsx` — Detect `startFirstQuote` state, show guide, auto-open form
3. `src/components/estimates/EstimateFormDialog.tsx` — Add optional `isFirstQuote` prop for contextual hints
4. `src/components/onboarding/FirstQuoteGuide.tsx` — New component: intro modal with step preview

