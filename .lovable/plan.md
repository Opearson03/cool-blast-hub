
## What’s happening (root cause)
Right now Oliver’s business is marked as a **Demo/Exempt account** in the backend (`subscription_exempt = true`). In `useSubscription()`, that flag **short-circuits** the normal tier logic and forces:
- `isExempt = true`
- `tier = "pro"`
- `hasFullAppAccess = true`

So even though `business_subscriptions.plan_tier` is set to **estimating**, Oliver still gets **full app access** (Jobs/Schedule/Contacts/etc).

That’s why the gating + “locked” UI never kicks in.

## Goals
1. Estimating users (including Oliver) can only access:
   - Quotes (`/admin/estimates`)
   - Settings (`/admin/settings`)
2. Other modules remain **visible** in the menu but are:
   - **Greyed out**
   - **Non-clickable** (don’t navigate)
3. Direct URL access (e.g. typing `/admin/jobs`) is still blocked as a safety net.

---

## Implementation steps

### 1) Backend data fix: remove “Demo/Exempt” for Oliver’s business
- Update the business record for Oliver’s business to set:
  - `subscription_exempt = false`
- Keep subscription as:
  - `business_subscriptions.plan_tier = 'estimating'`
  - `status = 'active'`

Why this matters: as long as `subscription_exempt=true`, Oliver will always be treated as “Demo/Pro” regardless of tier.

**How we’ll apply it**
- Add a small backend migration that runs:
  - `UPDATE businesses SET subscription_exempt = false WHERE id = '<oliver_business_id>';`
- This is safe: if the business doesn’t exist in an environment, the update is a no-op.

### 2) Client-side: ensure stale cached “Pro/Demo” doesn’t linger
`useSubscription` caches subscription results in `localStorage` for 30 minutes. If Oliver previously loaded as Demo/Pro, he can appear unlocked briefly.

To avoid confusion, we’ll do one of these (I’ll implement the safest option):
- **Bump the cache key version** (e.g. `pourhub_subscription_cache_v2`) so everyone gets a clean re-check after these subscription changes.

### 3) Menu behavior: locked items are visible, grey, and cannot be opened
Update `src/components/layout/AdminLayout.tsx`:

**Current behavior**
- Locked items show a lock icon, but they’re still `<Link to="...">` and can be clicked.

**New behavior**
- If an item is locked:
  - Render it as a non-link element (or keep `<Link>` but `preventDefault()`), so it **never navigates**
  - Add `aria-disabled="true"` and remove from tab order (`tabIndex={-1}`) for accessibility
  - Apply “greyed out” styling that still meets your contrast standards (muted foreground, but not overly faint)
  - On click/tap, show a toast like:
    - Title: “PourHub Pro feature”
    - Description: “Upgrade to Pro to unlock Jobs, Schedule, and Contacts.”

This makes it feel truly “disabled” while still being discoverable.

**Also adjust the logo/home link**
- The top-left logo currently links to `/admin` (Dashboard), which is a locked page for Estimating.
- We’ll change it so:
  - Estimating/Free → logo links to `/admin/estimates`
  - Pro/Demo → logo links to `/admin`

### 4) Route safety net: keep blocking direct access to locked pages
`FullAppAccessGate` already blocks non-full-access users from non-quotes/settings routes.
Once Oliver is no longer “Demo/Exempt”, this will work as intended.

Optional refinement (recommended):
- If user tries to open a locked route, we can choose between:
  1) Current behavior: show the Upgrade prompt page (good clarity)
  2) Redirect to `/admin/estimates` and show a toast (feels more like “can’t be opened”)

I’ll implement option (1) as the default safety net (it’s already built and clear), while the menu itself will be truly non-navigable—so normal usage matches your request.

---

## Files we’ll change
1. `src/components/layout/AdminLayout.tsx`
   - Disable locked nav items (no navigation)
   - Add toast feedback
   - Adjust logo link behavior for non-full-access tiers
2. `src/hooks/useSubscription.ts`
   - Bump subscription cache key version (avoid stale Demo/Pro cache)
3. `supabase/migrations/<new_migration>.sql`
   - Set Oliver’s business `subscription_exempt=false`

---

## Verification checklist (what you’ll test)
1. Sign out and back in as `oliver@wattledigital.com` (or hard refresh after changes).
2. Confirm the tier badge shows **Estimating** (not Demo).
3. In the sidebar/mobile menu:
   - Dashboard/Jobs/Schedule/Contacts are **greyed out**
   - Clicking them does **not** navigate
   - A toast appears explaining it’s Pro-only
4. Paste `/admin/jobs` directly in the URL:
   - You should see the **upgrade gate** (or be redirected, depending on final choice)
5. Confirm `/admin/estimates` and `/admin/settings` work normally.

---

## Notes / edge cases we’ll handle
- If other users share Oliver’s business, removing Demo/Exempt will apply to all of them (because exemption is business-wide, not user-specific). This matches the intended model (tier is per business).
- We’ll keep contrast-safe “disabled” styling (muted foreground, no ultra-low opacity) to maintain your accessibility standards.
