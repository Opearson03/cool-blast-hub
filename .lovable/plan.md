
# Fix: Display Business Details on Quote Signing Page

## Problem
The quote signing page receives all business details (name, address, phone, email, logo) from the backend, but the UI only displays the logo/name as a header. The business contact information (address, phone, email) is not being rendered, making it appear like the details are "not prefilling" when they're actually available but hidden.

## Solution
Update the SignQuote page to display the business contact details in the header section, providing clients with full business context when viewing and signing quotes.

## Technical Changes

### File: `src/pages/public/SignQuote.tsx`

Add a business details section below the logo/name in the header card:

```text
Current header structure (lines 261-277):
┌─────────────────────────────────────┐
│         [Logo or Name]              │
│       Quote #EST-2026-0218          │
└─────────────────────────────────────┘

Updated header structure:
┌─────────────────────────────────────┐
│         [Logo or Name]              │
│       Quote #EST-2026-0218          │
│                                     │
│   11b Cobbans Close Beresfield      │
│   📞 0429956767                     │
│   ✉️ opearson@jefcon.com.au         │
└─────────────────────────────────────┘
```

**Specific changes:**
1. After the quote number (line ~276), add business contact info section
2. Display business address (if available)
3. Display business phone with Phone icon (if available)  
4. Display business email with Mail icon (if available)
5. Style consistently with the rest of the page using muted text colors

## Implementation Details

The `quoteData.business` object already contains:
- `address`: string | null
- `phone`: string | null  
- `email`: string | null

These just need to be rendered in the CardHeader section after the quote number, conditionally showing each field only if it has a value.
