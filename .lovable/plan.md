## Goal

Transform the Team tab into a more useful, attractive operational hub, and add an internal chat where admins can message crews, DM individuals, or post to a company-wide channel.

## 1. Team page redesign (visual roster grid)

Replace the current list/tabs layout with a modern operational hub:

**Top KPI strip** (4 compact cards):
- Clocked in now (live count)
- On leave today
- Pending leave requests
- Tickets expiring within 30 days

**Roster grid** (responsive cards, 2–4 columns):
- Avatar, name, position, role badge (admin/staff)
- Live status pill: 🟢 Clocked in (since X) · 🌴 On leave · ⚪ Off
- Crew chip(s) the employee belongs to
- Phone tap-to-call, expiring-ticket warning icon
- Quick actions: Message, View profile

**Filters bar**: search · crew filter · status filter (clocked in / on leave / off / pending invite)

**Pending invites**: collapsed accordion under the grid (keep resend / cancel)

Existing sub-tabs (Timesheets, Leave) stay as secondary tabs below the roster, plus two new ones: **Crews** and **Chat**.

## 2. Crews management (in Team)

Promote crew management out of `/admin/crews` and surface it as a sub-tab inside Team:
- List crews with member avatars + supervisor flag
- Create/edit/delete crew, manage members (reuse existing `CrewFormDialog` and `CrewMembersDialog`)
- "Open chat" button jumps straight to that crew's channel

## 3. Internal chat

A Slack-lite messaging system scoped to the business.

**Channels supported**
- `#team` — auto-created per business, all members of the business
- One channel per crew — auto-created/synced from `crews` table
- Direct messages — 1:1 between any two business members

**Features (v1)**
- Realtime text via Supabase Realtime
- Image attachments (private storage bucket, signed URLs)
- @mentions of teammates
- Read receipts (last_read_at per member per channel)
- Unread badges in sidebar + on the Team nav item
- Message edit/delete by author; admins can delete any
- Auto-scroll, day separators, typing not included in v1

**UI**
- Two-pane layout inside the new "Chat" sub-tab: left = channel list (Team, Crews, Direct messages), right = active conversation
- Mobile: channel list collapses; full-screen conversation view
- Composer with image attach button and emoji
- Same chat UI is exposed to employees in the mobile dashboard (`/employee/chat`)

## 4. Database changes

New tables:

- `chat_channels` — `id`, `business_id`, `type` ('team' | 'crew' | 'dm'), `crew_id` (nullable), `name`, timestamps
- `chat_channel_members` — `channel_id`, `user_id`, `last_read_at`, `joined_at`
- `chat_messages` — `id`, `channel_id`, `sender_id`, `body`, `attachment_url`, `attachment_type`, `mentions uuid[]`, `edited_at`, `deleted_at`, timestamps

RLS: members of a channel can read/write; admins of the business can do anything; sender can edit/delete own messages within the business.

Triggers / RPCs:
- On business create → create `#team` channel and add all profiles
- On profile insert (employee joins business) → add to `#team`
- On crew create → create matching channel; on `crew_members` change → sync membership
- `mark_channel_read(channel_id)` RPC updates `last_read_at`
- `get_or_create_dm(other_user_id)` RPC returns/creates a DM channel between two business members

Storage: new private bucket `chat-attachments` with policies tied to channel membership.

Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages, chat_channel_members;`

## 5. Access & gating

- Entire Team tab (including Chat) stays Pro-only via existing `requiresPro` flag
- Admin can post in any channel; crew chat: all members + admins can post
- Employees see only the channels they belong to

## 6. Out of scope (v1)

- Threads/replies, reactions, file types beyond images, voice notes, push notifications, message search across channels, typing indicators, message pinning

## Technical notes

- New components under `src/components/chat/` (`ChatLayout`, `ChannelList`, `MessageList`, `MessageComposer`, `MessageBubble`, `AttachmentUploader`)
- Hooks: `useChannels`, `useMessages(channelId)`, `useUnreadCounts`, `useSendMessage`
- Reuse `get_team_profiles` RPC for member pickers
- Add unread badge to `AdminLayout` nav item via lightweight subscribed counter
- Roster grid lives in a new `src/components/employees/TeamRosterGrid.tsx`; KPI strip in `TeamKpiStrip.tsx`
- Existing `AdminCrews` route can stay as a deep-link, but UI lives inside Team
