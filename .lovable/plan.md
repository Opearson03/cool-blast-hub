## Incorporate Directory into PourHub App (Admin-Only Access)

### Overview

Move the Subcontractor Directory from a standalone public page into the existing PourHub admin app. It becomes a section within the admin layout, accessible only to authenticated PourHub business users. The directory pages will be wrapped in `ProtectedRoute` and rendered inside `AdminLayout`.

### Key Changes

**1. Move directory routes behind authentication**

- Change `/directory` to `/admin/directory` (protected, admin role)
- Change `/directory/:id` to `/admin/directory/:id` (protected, admin role)
- Remove the old public `/directory` routes

**2. Wrap directory pages in AdminLayout**

Both `SubcontractorDirectory.tsx` and `SubcontractorProfilePage.tsx` will:

- Use `AdminLayout` instead of their own standalone header/layout
- Remove the custom PourHub logo header (AdminLayout already provides it)
- Keep all filtering, cards, and profile detail content as-is

**3. Add "Directory" as a link in the Subcontractors tab to the admin "contacts" page**

Add a new nav item in `AdminLayout.tsx`:

- Label: "Directory"
- Icon: `Search` (from lucide-react)
- Route: `/admin/directory`
- `requiresPro: true` (Pro tier feature)

This sits alongside Dashboard, Jobs, Quotes, Schedule, Contact, Settings.

**5. Update internal links**

- DirectoryCard "View Profile" links: `/directory/:id` becomes `/admin/directory/:id`
- Profile page "Back to Directory" link: `/directory` becomes `/admin/directory`
- Remove "Join the Directory" CTA button (not relevant for admin users browsing)
- Replace "Contact via PourHub" button on profile detail with a more useful action -- e.g. "Invite to Job" linking to the invite flow, or simply showing the subcontractor's contact details (since admin users are authenticated, we could expose phone/email to them via a separate authenticated RPC)

**6. Update the database RPCs (optional enhancement)**

The existing `get_public_directory_profiles` RPC uses `SECURITY DEFINER` and returns limited fields. Since directory is now admin-only, we could optionally create an authenticated version that also returns email and phone for direct contact. However, for the initial move, the existing RPCs work fine since they're called via the Supabase client which will have the user's session.

No RPC changes needed for the initial integration -- the existing functions work for authenticated users too.

### Files to Modify


| File                                               | Change                                                                                                                     |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `src/App.tsx`                                      | Change `/directory` and `/directory/:id` routes to `/admin/directory` and `/admin/directory/:id`, wrap in `ProtectedRoute` |
| `src/components/layout/AdminLayout.tsx`            | Add "Directory" nav item                                                                                                   |
| `src/components/layout/AdminBottomNav.tsx`         | Add "Directory" tab                                                                                                        |
| `src/pages/directory/SubcontractorDirectory.tsx`   | Wrap content in `AdminLayout`, remove standalone header, update link paths                                                 |
| `src/pages/directory/SubcontractorProfilePage.tsx` | Wrap content in `AdminLayout`, remove standalone header, update link paths                                                 |
| `src/components/directory/DirectoryCard.tsx`       | Update "View Profile" link to `/admin/directory/:id`                                                                       |


### What Stays the Same

- All directory filtering logic (trade, availability, search)
- DirectoryCard design and badges
- Profile detail page content (photo, bio, trades, verification badges)
- The existing RPCs (`get_public_directory_profiles`, `get_public_directory_profile`)
- Subcontractor portal routes (`/sub-contractors/*`) remain independent
- Existing invite flow is untouched

### Navigation Structure After Change

```text
Admin Sidebar:
  Dashboard
  Jobs
  Quotes
  Schedule
  Contact
      - sub-contractors
         - search directory
 
  Settings
```

&nbsp;