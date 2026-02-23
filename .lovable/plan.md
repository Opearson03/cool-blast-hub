

## Subcontractor Reviews Gate + Auto-Add Contacts + Directory Link from Jobs

### Overview

Three related changes:

1. **Reviews restricted to verified working relationships** -- Only allow a user to leave a review for a subcontractor they have actually worked with (i.e. have at least one "accepted" invite that has been completed/past date).

2. **Auto-add subcontractors to contacts after working together** -- When a subcontractor accepts an invite and the job is completed (or the pour date passes), automatically add them to the business's `subcontractors` contact list so they appear in the Sub-Contractors tab without needing the directory.

3. **"Find New Sub-Contractors" button on the Jobs sub-contractors tab** -- Add a button in `JobSubbiesTab` that routes to `/admin/directory`.

---

### 1. Reviews Gated by Working Relationship

**Approach**: Create a database function `has_worked_with_subcontractor(user_id, profile_id)` that checks if the user's business has any `external_invites` with status `accepted` for that subcontractor (matched by email/phone from `subcontractor_directory_profiles`). Use this to:

- **RLS**: Update the INSERT policy on `subcontractor_reviews` to require `has_worked_with_subcontractor`
- **UI**: In `SubcontractorProfilePage`, query whether the current user has worked with this subcontractor. If not, hide or disable the "Write a Review" button with a tooltip explaining "You can only review subcontractors you've worked with"

**New RPC function:**
```sql
CREATE OR REPLACE FUNCTION public.has_worked_with_subcontractor(
  _user_id uuid,
  _profile_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM external_invites ei
    JOIN subcontractor_directory_profiles sdp ON sdp.id = _profile_id
    WHERE ei.business_id = get_user_business_id(_user_id)
      AND ei.invite_type = 'sub_trade'
      AND ei.status = 'accepted'
      AND (
        (sdp.email IS NOT NULL AND LOWER(ei.recipient_email) = LOWER(sdp.email))
        OR
        (sdp.phone IS NOT NULL AND ei.recipient_phone = sdp.phone)
      )
  );
$$;
```

**UI changes in `SubcontractorProfilePage.tsx`:**
- Add a query using `supabase.rpc("has_worked_with_subcontractor", { _user_id, _profile_id })` 
- Conditionally show/disable the "Write a Review" button based on the result
- Show a message like "Complete a job with this subcontractor to leave a review"

**RLS update:**
- Replace the INSERT policy on `subcontractor_reviews` to also require `has_worked_with_subcontractor(auth.uid(), subcontractor_profile_id)`

---

### 2. Auto-Add to Subcontractor Contacts

**Approach**: When the `respond-subtrade-invite` edge function processes an "accepted" response, check if the subcontractor already exists in the business's `subcontractors` table. If not, insert them automatically.

**Changes to `respond-subtrade-invite/index.ts`:**

After updating the invite status to "accepted", add logic:
```typescript
if (response === "accepted") {
  // Check if this subbie is already in the business's contacts
  const { data: existing } = await supabase
    .from("subcontractors")
    .select("id")
    .eq("business_id", invite.business_id)
    .eq("name", invite.recipient_name)
    .maybeSingle();

  if (!existing) {
    await supabase.from("subcontractors").insert({
      business_id: invite.business_id,
      name: invite.recipient_name,
      email: invite.recipient_email || null,
      phone: invite.recipient_phone || null,
      trade: invite.role || null,
    });
  }
}
```

This same logic is added to both the single-response and batch-response handlers.

**Also update `subcontractor-respond-invite/index.ts`** (the dashboard-based response handler) with the same auto-add logic.

---

### 3. "Find New Sub-Contractors" Button on Job Subbies Tab

**Changes to `JobSubbiesTab.tsx`:**

Add a "Find in Directory" button next to the existing "Invite Sub-Contractor" button that links to `/admin/directory`:

```tsx
<Button asChild variant="outline">
  <Link to="/admin/directory">
    <Search className="w-4 h-4 mr-2" />
    Find in Directory
  </Link>
</Button>
```

This appears in both the empty state and the populated state header.

---

### Files to Modify

| File | Change |
|---|---|
| `supabase/migrations/...` | Create `has_worked_with_subcontractor` function; update INSERT RLS policy on `subcontractor_reviews` |
| `supabase/functions/respond-subtrade-invite/index.ts` | Auto-add subcontractor to contacts on accept (single + batch) |
| `supabase/functions/subcontractor-respond-invite/index.ts` | Auto-add subcontractor to contacts on accept (dashboard response) |
| `src/pages/directory/SubcontractorProfilePage.tsx` | Gate review button behind `has_worked_with_subcontractor` check |
| `src/components/jobs/tabs/JobSubbiesTab.tsx` | Add "Find in Directory" button |

### What Stays the Same

- All existing review display logic (ReviewsList, StarRating, DirectoryCard ratings)
- Existing invite flow and ScheduleSubbieDialog
- SubbiesTab contact list (will naturally show auto-added contacts)
- Subcontractor portal dashboard

