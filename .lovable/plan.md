
# Connect Expo iOS app to the existing Lovable Cloud backend

No backend migration is required. Lovable Cloud already is a Supabase project, and your Expo app can talk to it directly using the same URL, anon key, database, auth users, RLS policies, storage buckets, and edge functions that this web app uses today.

This plan covers what to do **in the Expo project** (separate repo) and the small **changes to make in this Lovable project** to support a second client.

---

## 1. Shared backend connection details

Your Expo app should be configured with these (same values this web app uses):

- `SUPABASE_URL`: `https://fhwqsocjvpbghptvzekk.supabase.co`
- `SUPABASE_ANON_KEY`: the publishable anon key already in this project's `.env`

Store them in Expo via `app.config.ts` → `extra`, or `EXPO_PUBLIC_*` env vars. Never ship the service role key in the mobile app.

## 2. Expo client setup (done in the Expo repo)

Install:

```text
@supabase/supabase-js
@react-native-async-storage/async-storage
react-native-url-polyfill
expo-web-browser
expo-auth-session  (only if using OAuth)
```

Create `lib/supabase.ts`:

```text
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,  // important for native
  },
})
```

Wire `AppState` to call `supabase.auth.startAutoRefresh()` / `stopAutoRefresh()` on foreground/background (per Supabase RN docs) so token refresh works reliably on iOS.

## 3. Auth on native

- **Email/password**: works as-is — same `auth.users` table, same passwords. Existing web users can sign in from iOS immediately.
- **Google sign-in**: must use a deep-link redirect (e.g. `pourhub://auth-callback`) via `expo-auth-session`. The redirect URI must be added to the allow-list in Lovable Cloud → Auth settings.
- **Password reset / magic links**: emails currently link to `https://pourhub.com.au`. For mobile we'll need Universal Links (Associated Domains) so those URLs open the iOS app, OR a separate `pourhub://` deep-link template.

## 4. Edge functions

All existing functions (`send-batch-subtrade-invite`, `verify-abn`, `subcontractor-get-invites`, `create-checkout`, etc.) are callable from Expo via:

```text
supabase.functions.invoke('function-name', { body: {...} })
```

No changes required to the functions themselves — they're shared.

## 5. Storage

Same buckets, same policies. Use `expo-image-picker` / `expo-document-picker` to pick files, then `supabase.storage.from(bucket).upload(path, file)`. The site-diary photo feature in particular will Just Work.

## 6. Realtime

`supabase.channel(...).on('postgres_changes', …)` works identically in RN. Useful for live job/pour updates on iOS.

## 7. Small changes needed in *this* Lovable project

These are the only repo-side edits required to support the iOS client cleanly:

1. **Auth redirect allow-list** — add the Expo dev URL (`exp://...`) and your production deep-link scheme (`pourhub://auth-callback`) to Lovable Cloud → Users → Auth Settings → Additional redirect URLs. (Config change, not code.)
2. **Universal Links** (optional but recommended) — host an `apple-app-site-association` file at `https://pourhub.com.au/.well-known/apple-app-site-association` so existing email/SMS links open the iOS app when installed.
3. **Capacitor wrapper** — note: this project already has `capacitor.config.ts` and a memory rule that "Native Capacitor apps bypass the landing page directly to /auth or the dashboard." Confirm whether you're abandoning Capacitor in favour of Expo. If so, we can deprecate the Capacitor build path; if not, both clients can coexist.

## 8. Things to be aware of

- **PII / RLS** — every table is scoped via `business_id` and `has_role`. As long as the mobile user signs in with the same account, they see the same data. No new policies needed.
- **`APP_URL`** secret — used by edge functions to build links in emails/SMS. It currently points at `https://pourhub.com.au`. Decide whether mobile-originated invites should still link to the web (recommended for now) or to a deep-link.
- **Stripe checkout** — `create-checkout` returns a hosted URL. On iOS, open it in `WebBrowser.openAuthSessionAsync` and handle the return-to-app deep link.

## 9. What this plan does NOT do

- It does not move data anywhere — your existing users, businesses, jobs, estimates, pours, subcontractors, etc. stay exactly where they are.
- It does not change any RLS, table, or function in this project (other than the auth redirect allow-list, which is a Cloud setting, not a migration).
- The deliverable from "Implement plan" here is just (a) adding the deep-link redirect URI to Cloud auth settings and (b) optionally hosting the Apple App Site Association file. Everything else happens in your separate Expo repo.

---

## Recommended next step

Approve this plan and I'll:
1. Add the Expo deep-link scheme to the Cloud auth redirect allow-list (you tell me the scheme, e.g. `pourhub://auth-callback`).
2. Add the `apple-app-site-association` file to `public/.well-known/` once you have your Apple Team ID + bundle ID.

For the Expo repo itself, I can paste a ready-to-use `lib/supabase.ts`, `AuthProvider`, and a sample sign-in screen — just say the word.
