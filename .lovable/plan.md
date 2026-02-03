
# Plan: Set "Simple" (Minimal) Template as Default and Recommended

## Current Behavior
- The default template is set to `"classic"` on initialization
- The template options are ordered: Classic first, Minimal second
- No visual indicator shows which template is recommended

## Changes Required

### File: `src/components/onboarding/OnboardingWizard.tsx`

| Change | Details |
|--------|---------|
| Update default state | Change `useState("classic")` to `useState("minimal")` |
| Reorder template options | Move "minimal" (Simple) first in the list |
| Add "Recommended" badge | Show a visual indicator on the Simple template |
| Rename "Minimal" to "Simple" | Match the terminology the user is using |

## Technical Details

### 1. Change Default Template (Line 54)
```typescript
// Before
const [quoteTemplate, setQuoteTemplate] = useState("classic");

// After
const [quoteTemplate, setQuoteTemplate] = useState("minimal");
```

### 2. Update Template Options (Lines 427-444)
```typescript
{[
  { id: "minimal", name: "Simple", recommended: true },
  { id: "classic", name: "Classic", recommended: false },
].map((template) => (
  <button
    key={template.id}
    type="button"
    onClick={() => setQuoteTemplate(template.id)}
    className={`p-3 border rounded-lg text-center transition-all relative ${
      quoteTemplate === template.id
        ? "border-primary bg-primary/10 ring-2 ring-primary"
        : "border-border hover:border-primary/50"
    }`}
  >
    {template.recommended && (
      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium">
        Recommended
      </span>
    )}
    <FileText className="w-4 h-4 mx-auto mb-1" />
    <span className="font-medium text-sm">{template.name}</span>
  </button>
))}
```

## Expected Result

The onboarding wizard will now:
- Pre-select the "Simple" template by default
- Display "Simple" as the first option with a "Recommended" badge
- Keep "Classic" available as an alternative choice
