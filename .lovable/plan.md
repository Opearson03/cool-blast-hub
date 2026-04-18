

## Enterprise Subdomain Redirect (after login)

When an enterprise client logs in at `pourhub.com.au/auth`, look up their email in a new `enterprise_redirects` table and, if matched, redirect them to their dedicated subdomain (e.g. `https://acme.pourhub.com.au/auth?redirect=1`) instead of `/admin`. Each enterprise project remains a separate Lovable app with its own database.

### 1. New table: `enterprise_redirects` (main project only)

| Column        | Type        | Notes                                              |
|---------------|-------------|----------------------------------------------------|
| `id`          | uuid PK     | `gen_random_uuid()`                                |
| `email`       | text UNIQUE | Lowercased on insert via trigger                   |
| `subdomain`   | text        | e.g. `acme` → resolves to `acme.pourhub.com.au`    |
| `business_name` | text      | Display label for staff portal                     |
| `notes`       | text        | Optional                                           |
| `created_at`  | timestamptz | `now()`                                            |

**RLS:**
- Staff can manage all rows (`is_pourhub_staff(auth.uid())`)
- Authenticated users can SELECT their own row (`lower(email) = lower(auth.email())`) — needed so the client-side post-login lookup works without exposing other clients' mappings.

### 2. Login redirect logic (`src/pages/Auth.tsx`)

In `redirectBasedOnRole`, after successful sign-in but **before** the existing role-based navigation:

```text
1. Query enterprise_redirects where lower(email) = user.email
2. If a row exists AND current hostname !== `${subdomain}.pourhub.com.au`:
     window.location.href = `https://${subdomain}.pourhub.com.au/auth?email=${email}`
     return  (skip rest of redirect logic)
3. Otherwise continue to /admin / /employee / etc.
```

The redirect uses `window.location.href` (not `navigate`) because it's cross-origin. The target enterprise project's `/auth` page already exists (same codebase pattern) and will accept the email param so the user just types their password again — no shared session is needed since each project has its own Supabase backend.

A safety check skips the redirect when already on the correct subdomain (prevents loops) and on `localhost` / `lovable.app` (so dev/preview keeps working).

### 3. Staff portal: manage enterprise mappings

Add a small **"Enterprise Redirects"** section in the staff portal (under an existing tab like Customers or Partners) with:
- Table view of all mappings (email, subdomain, business name)
- "Add mapping" dialog (email + subdomain + business name)
- Edit / delete buttons

### 4. DNS / hosting (manual, one-time per enterprise)

For each enterprise client, in the **main pourhub.com.au DNS**:
- Add a CNAME or A record for `{business}.pourhub.com.au` pointing to that enterprise's Lovable project
- Connect the subdomain inside the enterprise project's Lovable settings

This is outside the code change but documented in the staff portal section ("After adding a mapping here, configure DNS and connect the subdomain in the enterprise project's Lovable settings").

### Files

**New:**
- DB migration creating `enterprise_redirects` + RLS policies
- `src/pages/staff/sections/EnterpriseRedirects.tsx` — staff CRUD UI
- Hook into existing staff dashboard navigation

**Modified:**
- `src/pages/Auth.tsx` — add the lookup + cross-origin redirect at the top of `redirectBasedOnRole`

### Edge cases handled
- Already on correct subdomain → no redirect (prevents infinite loop)
- On localhost or `*.lovable.app` → skip redirect (dev safe)
- No matching row → normal flow continues
- Lookup fails / errors → log and fall through to normal flow (never block login)

