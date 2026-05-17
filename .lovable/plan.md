## Add Team Feed to Admin Dashboard

Mount the existing `FeedWidget` on the admin dashboard so admins can post updates (and see the same feed staff see).

### Changes

**`src/pages/admin/AdminDashboard.tsx`**
- Import `FeedWidget` from `@/components/feed/FeedWidget`.
- Fetch the current `user.id` alongside the existing `business_id` lookup (store in a `userId` state).
- Render `<FeedWidget businessId={businessId} userId={userId} isAdmin />` inside the existing widgets block (placed after `InboxWidget`).

### Notes
- The component already supports posting, @mentions, crew mentions, and deletion — passing `isAdmin` enables admin-level controls.
- No backend, RLS, or schema changes required; same component already runs on the employee dashboard.
