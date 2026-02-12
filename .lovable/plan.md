

## Google Ads Conversion Tracking for Waitlist Signups

### What this does
When someone successfully joins the waiting list, a Google Ads conversion event will fire to track the lead. This uses the existing Google Analytics/Ads tag already loaded on your site.

### How it works
After a successful waitlist submission (right when the success screen appears), we fire the `gtag('event', 'conversion', ...)` call with the provided conversion ID and value of $1.00 AUD.

### Technical Details

**File to update:** `src/components/waitlist/WaitlistForm.tsx`

1. After the successful insert and email sending (around line 153 where `setIsSuccess(true)` is called), add the conversion tracking call:
   - Check that `window.gtag` exists (it won't in native apps or if blocked by ad blockers)
   - Fire: `gtag('event', 'conversion', { send_to: 'AW-17843911252/JYjvCKiAi_cbENT00bxC', value: 1.0, currency: 'AUD' })`

2. Add a TypeScript type declaration for the global `gtag` function to avoid type errors.

This is a minimal, single-file change. The conversion fires immediately on successful signup rather than on next page load, which is actually more reliable since users stay on the same page (the form transitions to the success/referral view without a navigation).

