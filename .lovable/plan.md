

## Invite Subcontractors from Directory

### Overview

Add an "Invite to Job" button on each directory profile page that opens the existing `ScheduleSubbieDialog` pre-filled with the subcontractor's name, trade, email, and phone from their directory profile. After the invite is sent (SMS + email), the invite also appears in the subcontractor's dashboard via the existing matching logic. Additionally, add a "Login to Dashboard" link on the SMS/email response confirmation page so subcontractors can easily access their portal.

### How It Works

The existing infrastructure already supports everything needed:
- `ScheduleSubbieDialog` handles job/pour selection and sends invites via SMS and email
- `subcontractor-get-invites` edge function matches invites to subcontractors by email/phone
- The subcontractor dashboard "My Work" tab already shows matched invites
- When a subcontractor accepts/declines via SMS/email link, the status updates in `external_invites`, which the dashboard reads

The only new pieces are:
1. A button + data bridge on the directory profile page
2. A "Login to Dashboard" link on the response confirmation page

### Changes

**1. Fetch email/phone for directory profiles (authenticated admin query)**

Create a small hook or inline query that fetches `email` and `phone` from `subcontractor_directory_profiles` by ID. This is needed because the existing `get_public_directory_profile` RPC intentionally omits these fields. Since the directory is admin-only, a direct query is safe (RLS allows authenticated reads).

**2. Add "Invite to Job" button on `SubcontractorProfilePage`**

- Add a prominent "Invite to Job" button next to the "Write a Review" button
- When clicked, open the existing `ScheduleSubbieDialog` with `preselectedSubbie` populated from the directory profile data (name, trade types, phone, email)
- The dialog handles job/pour selection and sends the SMS + email invite

**3. Add "Invite to Job" button on `DirectoryCard`**

- Add a secondary "Invite" button alongside the existing "View Profile" button on each directory card
- Opens the same `ScheduleSubbieDialog` pre-filled with that subcontractor's details

**4. Add "Login to Dashboard" link on `RespondInvite` confirmation pages**

After a subcontractor accepts or declines via the SMS/email link, add a "Go to Dashboard" button that links to `/sub-contractors/work`. This appears on:
- Single invite confirmation screen
- Batch invite confirmation screen

### Files to Modify

| File | Change |
|---|---|
| `src/pages/directory/SubcontractorProfilePage.tsx` | Add "Invite to Job" button, fetch email/phone, open `ScheduleSubbieDialog` with `preselectedSubbie` |
| `src/components/directory/DirectoryCard.tsx` | Add "Invite" button that opens `ScheduleSubbieDialog` |
| `src/pages/public/RespondInvite.tsx` | Add "Login to Dashboard" link on both single and batch confirmation screens |

### Files Unchanged

- All edge functions (send-subtrade-invite, send-batch-subtrade-invite, respond-subtrade-invite, subcontractor-get-invites) -- these already handle the full invite + dashboard sync flow
- `ScheduleSubbieDialog` -- already supports `preselectedSubbie` prop
- Subcontractor dashboard pages -- already display matched invites

### Data Flow

```text
Admin clicks "Invite to Job" on directory profile
  -> ScheduleSubbieDialog opens (pre-filled with name, trade, phone, email)
  -> Admin selects job + pours
  -> send-subtrade-invite / send-batch-subtrade-invite edge function fires
  -> SMS sent via Twilio, Email sent via Resend
  -> external_invites row created
  -> Subcontractor sees invite in "My Work" dashboard tab (matched by email/phone)
  -> Subcontractor can accept/decline from dashboard OR SMS/email link
  -> Response confirmation page shows "Login to Dashboard" button
```

### Technical Details

- The `preselectedSubbie` prop on `ScheduleSubbieDialog` expects: `{ recipient_name, role, recipient_phone, recipient_email, lastUsed }`. We map the directory profile fields to this shape.
- For `DirectoryCard`, the invite button needs email/phone. Since the card only has the public `DirectoryProfile` data (no email/phone), clicking "Invite" will navigate to the profile page where the full data is available. Alternatively, we can add a lightweight fetch inline. The simpler approach is to only put the "Invite to Job" button on the profile detail page (not on cards) to avoid extra queries per card.
- The "Login to Dashboard" link on `RespondInvite` uses a simple anchor to `/sub-contractors/work`. If the subcontractor isn't registered, it will redirect to login -- which is expected and acceptable.
