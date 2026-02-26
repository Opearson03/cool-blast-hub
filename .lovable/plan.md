

## Live "Total Value Quoted" Counter on Landing Page

### What it does
Displays a live-updating dollar figure on the landing page showing the total value of all quotes finalized through PourHub. This number grows as businesses send and accept quotes, creating social proof and showing platform traction.

### How it works

**1. New database function** (`get_total_quoted_value`)
- A secure server-side function that sums `total_amount` from the `estimates` table
- Only counts estimates with status `sent`, `accepted`, or that have been signed (`signed_at IS NOT NULL`)
- Returns a single number (the aggregate total, ex-GST)
- Accessible publicly (no auth required) since it only returns a single aggregate number -- no business or client data is exposed

**2. New React hook** (`useTotalQuotedValue`)
- Mirrors the existing `useWaitlistCount` pattern
- Calls the new RPC function
- Caches for 5 minutes, refreshes in the background
- Returns the formatted total

**3. Landing page update** (`src/pages/Index.tsx`)
- Adds a second counter badge below the existing waitlist counter in the hero section
- Displays something like: **"$1,250,000+ quoted through PourHub"**
- Uses `formatCurrency` for consistent AUD formatting
- Shows a loading skeleton while fetching (same pattern as waitlist counter)

### Where it appears
In the hero section, below the existing "X concreters on the waiting list" badge -- creating a pair of social proof indicators:
- "42 concreters on the waiting list"
- "$1,250,000+ quoted through PourHub"

### Technical Details

**Database migration:**
```sql
CREATE OR REPLACE FUNCTION public.get_total_quoted_value()
RETURNS numeric
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(SUM(total_amount), 0)
  FROM public.estimates
  WHERE status IN ('sent', 'accepted')
     OR signed_at IS NOT NULL;
$$;
```

`SECURITY DEFINER` ensures the function runs with elevated permissions (bypasses RLS) but only returns a single aggregate number -- no row-level data is leaked.

**Files to create:**
- `src/hooks/useTotalQuotedValue.ts` -- new hook (mirrors `useWaitlistCount`)

**Files to modify:**
- `src/pages/Index.tsx` -- add the counter badge in the hero section
- Database migration for the new RPC function

