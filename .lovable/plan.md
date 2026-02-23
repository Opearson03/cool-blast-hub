

## Subcontractor Reviews System

### Overview

Add a reviews feature where authenticated PourHub admin/staff users can leave star ratings and written reviews on subcontractor profiles. Reviews are visible in two places:
1. **Admin Directory** -- on each subcontractor's profile page (`/admin/directory/:id`)
2. **Subcontractor Portal** -- on the subcontractor's own dashboard, so they can see feedback they've received

### Database

**New table: `subcontractor_reviews`**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `subcontractor_profile_id` | uuid | FK to `subcontractor_directory_profiles.id`, NOT NULL |
| `reviewer_user_id` | uuid | FK to `auth.users(id)`, NOT NULL |
| `reviewer_name` | text | Display name of reviewer (captured at write time) |
| `reviewer_business_name` | text | Business name (captured at write time) |
| `rating` | integer | 1-5, NOT NULL |
| `comment` | text | Optional written review, max 1000 chars |
| `created_at` | timestamptz | default `now()` |

**RLS Policies:**
- **SELECT**: All authenticated users can read reviews (needed for both admin directory and subcontractor portal views)
- **INSERT**: Authenticated users with admin or staff role can insert reviews (check `reviewer_user_id = auth.uid()`)
- **UPDATE**: Users can update their own reviews (`reviewer_user_id = auth.uid()`)
- **DELETE**: Users can delete their own reviews (`reviewer_user_id = auth.uid()`)

**Constraint**: One review per reviewer per subcontractor (`UNIQUE(subcontractor_profile_id, reviewer_user_id)`)

**New RPC: `get_subcontractor_review_summary`**

Returns aggregate rating data (average rating, total count) for a given subcontractor, used to display star averages on directory cards and profile pages.

### Directory Card Enhancement

Each `DirectoryCard` will show an average star rating and review count beneath the trade badges (e.g. "4.3 (12 reviews)"). The average rating data will be included in the `get_public_directory_profiles` RPC return (add `avg_rating` and `review_count` columns to the function output).

### Profile Page -- Reviews Section

On `SubcontractorProfilePage` (`/admin/directory/:id`), add a new section below the "About" bio:

- **Average rating** display with filled stars
- **Review count**
- **List of reviews** showing: reviewer name, business name, star rating, comment, date
- **"Write a Review" button** that opens a dialog with:
  - Star rating selector (1-5, required)
  - Comment textarea (optional, max 1000 chars)
  - Submit button
- If the current user has already reviewed this subcontractor, show "Edit Review" instead

### Subcontractor Dashboard -- Reviews Card

On `SubcontractorDashboardPage`, add a new card:

- Title: "My Reviews"
- Shows average rating and total count
- Lists the 3 most recent reviews with reviewer name, rating, and comment
- "View All" link to a simple reviews list (or expandable section)

The subcontractor fetches their own reviews using a query filtered by their profile ID.

### New Files

| File | Purpose |
|---|---|
| `src/hooks/useSubcontractorReviews.ts` | React Query hooks: fetch reviews for a profile, submit/edit/delete a review, fetch own reviews |
| `src/components/directory/ReviewsList.tsx` | Displays a list of review cards (reused in both directory and subcontractor portal) |
| `src/components/directory/WriteReviewDialog.tsx` | Dialog form for writing/editing a review (star selector + comment) |
| `src/components/directory/StarRating.tsx` | Reusable star display component (filled/half/empty stars) |

### Files to Modify

| File | Change |
|---|---|
| `src/pages/directory/SubcontractorProfilePage.tsx` | Add reviews section below bio with list + write review button |
| `src/pages/subcontractors/SubcontractorDashboardPage.tsx` | Add "My Reviews" card showing received reviews |
| `src/components/directory/DirectoryCard.tsx` | Show average rating + review count on each card |
| `src/hooks/usePublicDirectory.ts` | Update `DirectoryProfile` interface to include `avg_rating` and `review_count` |

### Updated RPC: `get_public_directory_profiles`

Add a LEFT JOIN to aggregate review data:

```sql
CREATE OR REPLACE FUNCTION public.get_public_directory_profiles()
RETURNS TABLE (
  -- existing columns ...
  avg_rating numeric,
  review_count bigint
)
...
AS $$
  SELECT sdp.id, sdp.first_name, ...,
         COALESCE(r.avg_rating, 0) as avg_rating,
         COALESCE(r.review_count, 0) as review_count
  FROM subcontractor_directory_profiles sdp
  LEFT JOIN (
    SELECT subcontractor_profile_id,
           ROUND(AVG(rating)::numeric, 1) as avg_rating,
           COUNT(*) as review_count
    FROM subcontractor_reviews
    GROUP BY subcontractor_profile_id
  ) r ON r.subcontractor_profile_id = sdp.id
  WHERE sdp.abn_verified = true
    AND sdp.trade_types IS NOT NULL
    AND array_length(sdp.trade_types, 1) > 0
  ORDER BY ...
$$;
```

### Technical Notes

- Reviews are tied to the reviewer's `auth.uid()` to prevent duplicates and enable edit/delete
- Reviewer name and business name are captured at write time (denormalized) so reviews remain readable even if the reviewer's account changes
- Star rating uses a validation trigger to enforce 1-5 range
- The subcontractor cannot review themselves (enforced via a check: `subcontractor_profile_id` cannot reference a profile owned by `reviewer_user_id`)

