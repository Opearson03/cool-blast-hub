

## Add "Join the Directory" CTA to Invite Response Page

### Overview
Add a promotional call-to-action at the bottom of the invite accept/decline page (and the confirmation screens) encouraging subcontractors to join the free PourHub directory to get more work.

### Changes

**File: `src/pages/public/RespondInvite.tsx`**

Replace the "Powered by PourHub" footer in all four views (single invite, batch invite, single confirmation, batch confirmation) with a styled CTA block that includes:
- A short message: "Want more work? Join the PourHub directory -- it's free!"
- A button linking to `/sub-contractors` (the subcontractor portal/signup page)
- Keep the "Powered by PourHub" text below it

The CTA will appear in these locations:
1. **Single invite view** (lines 599-600) -- below the Accept/Decline buttons
2. **Batch invite view** (lines 501-502) -- below the Submit button
3. **Single confirmation view** (lines 321-322) -- below the "Add to Calendar" / "Login to Dashboard" buttons
4. **Batch confirmation view** (lines 280-281) -- below the "Add to Calendar" / "Login to Dashboard" buttons

### CTA Design
A subtle but noticeable banner with a gradient background, icon, headline text, and a button:

```text
--------------------------------------
  Want more work?
  Join the free PourHub directory to
  get discovered by local businesses.

  [ Join Free Directory ]
--------------------------------------
  Powered by PourHub
```

### Technical Details
- The CTA will be a reusable block extracted into a small component within the same file to avoid repetition across the 4 views
- Links to `/sub-contractors` which is the existing subcontractor portal registration page
- Uses existing UI components (`Button`, `Separator`) and Lucide icons (`Users` or `Briefcase`)
- No backend changes required
