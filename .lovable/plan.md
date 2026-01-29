

# Fix Email Domain Mismatch for Inbound Email Processing

## Problem Identified
Emails sent to `jefconptyltd@contact.pourhub.au` are being received by Resend, but the webhook is failing silently because the edge function expects `@pourhub.au` instead of `@contact.pourhub.au`.

The regex pattern on line 256 of the edge function:
```javascript
const aliasMatch = recipientEmail.toLowerCase().match(/^([a-z0-9_-]+)@pourhub\.au$/);
```

This does NOT match `jefconptyltd@contact.pourhub.au` and returns a 400 error with "Invalid recipient email format".

## Changes Required

### 1. Update Edge Function Domain Matching
**File:** `supabase/functions/receive-test-email/index.ts`

Update the regex to match the correct domain:
- Change from: `/^([a-z0-9_-]+)@pourhub\.au$/`
- Change to: `/^([a-z0-9_-]+)@contact\.pourhub\.au$/`

### 2. Update Settings Display
**File:** `src/components/settings/TestResultEmailSection.tsx`

Update the displayed email address:
- Change from: `` `${currentAlias}@pourhub.au` ``
- Change to: `` `${currentAlias}@contact.pourhub.au` ``

## Technical Details

| Component | Current | Should Be |
|-----------|---------|-----------|
| Edge function regex | `@pourhub\.au` | `@contact\.pourhub\.au` |
| Settings display | `alias@pourhub.au` | `alias@contact.pourhub.au` |

## Testing After Fix
1. Deploy the updated edge function
2. Send a test email to `jefconptyltd@contact.pourhub.au`
3. Check edge function logs for successful processing
4. Verify the email appears in the pending documents/test results

