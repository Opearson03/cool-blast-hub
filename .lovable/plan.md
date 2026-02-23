

## Public Subcontractor Directory

### Overview

Build a standalone public-facing directory page at `/directory` where anyone (no login required) can browse and search verified subcontractors. This is independent from the existing PourHub app and will later be incorporated.

### New Route

| Route | Auth | Description |
|---|---|---|
| `/directory` | Public (no login) | Browse/search subcontractor profiles |
| `/directory/:id` | Public | Individual subcontractor profile page |

### Data Access

A new database function `get_public_directory_profiles` will return only profiles that are:
- ABN verified (`abn_verified = true`)
- Have at least one trade type
- Status is "available"

It will NOT expose sensitive fields (ABN, email, phone, insurance URLs, white card docs). Only public-safe fields are returned.

### Page 1: Directory Listing (`/directory`)

A polished, marketing-quality page with:

**Header**
- PourHub logo + "Subcontractor Directory" title
- Tagline: "Find verified trades for your next project"
- Link to `/sub-contractors/signup` ("Join the Directory")

**Search and Filters Bar**
- Text search (name, postcode, legal name)
- Trade type filter dropdown (Concreter, Steel Fixer, Formworker, etc.)
- Availability filter (Available / All)
- Postcode search with radius display

**Results Grid**
- Card-based layout (responsive grid: 1 col mobile, 2 col tablet, 3 col desktop)
- Each card shows:
  - Profile photo (or initials avatar)
  - First name + last initial (e.g. "John S.")
  - Trade badges
  - Years experience
  - Service area (postcode + radius)
  - ABN Verified badge
  - White Card badge (if `has_white_card = true`)
  - GST Registered badge
  - Availability indicator
  - "View Profile" button
- Empty state when no results match filters
- Result count display

### Page 2: Profile Detail (`/directory/:id`)

Individual profile page showing:
- Large profile photo (or initials)
- Full name, bio
- Trade types with badges
- Years of experience
- Service area (postcode + radius km)
- Verification badges (ABN Verified, White Card, GST)
- Legal business name
- "Contact" button (reveals a contact form or prompts login -- for now, links to `/sub-contractors` landing)
- Back to directory link

### Database

**New RPC function: `get_public_directory_profiles`**

Returns only safe, public fields for verified subcontractors. No authentication required.

```sql
CREATE OR REPLACE FUNCTION public.get_public_directory_profiles()
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  profile_photo_url text,
  trade_types text[],
  years_experience integer,
  service_radius_km integer,
  base_postcode text,
  bio text,
  availability_status text,
  abn_verified boolean,
  gst_registered boolean,
  has_white_card boolean,
  legal_name text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT id, first_name, last_name, profile_photo_url,
         trade_types, years_experience, service_radius_km,
         base_postcode, bio, availability_status,
         abn_verified, gst_registered, has_white_card, legal_name
  FROM subcontractor_directory_profiles
  WHERE abn_verified = true
    AND trade_types IS NOT NULL
    AND array_length(trade_types, 1) > 0
  ORDER BY availability_status = 'available' DESC, years_experience DESC NULLS LAST;
$$;
```

**New RPC function: `get_public_directory_profile`**

Returns a single profile by ID (same safe fields).

```sql
CREATE OR REPLACE FUNCTION public.get_public_directory_profile(_id uuid)
RETURNS TABLE ( ... same columns ... )
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT ... FROM subcontractor_directory_profiles
  WHERE id = _id AND abn_verified = true;
$$;
```

### Files to Create

| File | Purpose |
|---|---|
| `src/pages/directory/SubcontractorDirectory.tsx` | Main listing page with search/filters and card grid |
| `src/pages/directory/SubcontractorProfilePage.tsx` | Individual profile detail page |
| `src/components/directory/DirectoryCard.tsx` | Reusable profile card component |
| `src/components/directory/DirectoryFilters.tsx` | Search + filter bar component |
| `src/hooks/usePublicDirectory.ts` | React Query hooks for the two RPC functions |

### Files to Modify

| File | Change |
|---|---|
| `src/App.tsx` | Add `/directory` and `/directory/:id` routes (public, no auth) |

### Technical Details

**Privacy**: No ABN numbers, emails, phone numbers, or document URLs are exposed through the public RPC. Last names are shown in full on the detail page but truncated to initial on cards.

**No authentication required**: Both RPC functions use `SECURITY DEFINER` and don't check `auth.uid()`, making them callable by anonymous users via the Supabase anon key.

**Card design**: Each card uses the existing `Card` component with a clean layout -- photo at top, name + trades in middle, badges and stats at bottom.

**Filtering**: All filtering is done client-side after fetching the full list (same pattern as `SubcontractorAdminTable`). The dataset is small enough that server-side pagination isn't needed yet.
