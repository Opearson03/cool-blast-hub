

# Fix: Waitlist Count Showing "0" Before Data Loads

## Problem

When the landing page or pricing page loads, the waitlist count query hasn't finished fetching yet. Because the code uses `{ data: waitlistCount = 0 }`, the counter immediately displays "0 concreters on the waiting list" until the server responds. This looks broken and undermines social proof.

## Solution

Use the `isLoading` / `isPending` state from the React Query hook to hide or animate the counter while the data is being fetched. Instead of showing "0", show a subtle loading indicator (a small animated placeholder) in place of the number. Once the real count arrives, it swaps in seamlessly.

This is a minimal, targeted fix -- no architectural changes needed.

## Changes

### 1. Update `useWaitlistCount` hook

Return the full query result (it already does), but also stop defaulting to `0` at the consumer level. Instead, consumers will check `isLoading` before displaying the count.

No changes needed to the hook itself -- it already returns `isLoading` as part of the React Query result.

### 2. Update `Index.tsx` (Landing Page)

Two places show the count:
- **Hero section** (line 109): `{waitlistCount} concreters on the waiting list`
- **CTA section** (line 340): `Join {waitlistCount} other concreters on the waiting list`

Change from:
```typescript
const { data: waitlistCount = 0 } = useWaitlistCount();
```
To:
```typescript
const { data: waitlistCount, isLoading: isCountLoading } = useWaitlistCount();
```

Then in both display locations, show a small animated skeleton (a pulsing `---` or similar) while `isCountLoading` is true, and the actual number once loaded. If the count resolved to `0` or `null`, hide the counter entirely (since "0 concreters" provides no social proof anyway).

### 3. Update `Pricing.tsx`

Same pattern -- destructure `isLoading` and conditionally render a placeholder or hide the counter while loading.

## Files Modified

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Use `isLoading` to show a skeleton placeholder instead of "0" while fetching |
| `src/pages/Pricing.tsx` | Same pattern as Index.tsx |

## Technical Detail

- Uses the existing `isLoading` boolean from React Query -- no new dependencies
- While loading: show a small pulsing placeholder (e.g., `animate-pulse bg-primary/30 rounded w-8 h-5 inline-block`) in place of the number
- When loaded with count > 0: show the actual number
- When loaded with count = 0: hide the entire waitlist counter element (showing "0 concreters" is counterproductive)
- No changes to the hook, the RPC function, or any backend logic

