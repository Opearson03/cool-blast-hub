
# Wire Expo iOS app into Lovable Cloud

Using your details:
- Deep-link redirect: `pourhub://auth-callback`
- iOS Bundle ID: `com.pourhub.app`
- Apple Team ID: `8TZRBXLVYS`
- App ID prefix for AASA: `8TZRBXLVYS.com.pourhub.app`

## What I'll do in this Lovable project

1. **Host `apple-app-site-association`** at `public/.well-known/apple-app-site-association` (no extension, served as JSON) so iOS recognises `https://pourhub.com.au` (and `www`, `pourhub.au`) as Universal Links for your app. Content:

   ```text
   {
     "applinks": {
       "apps": [],
       "details": [
         {
           "appID": "8TZRBXLVYS.com.pourhub.app",
           "paths": [
             "/auth-callback",
             "/auth-callback/*",
             "/sign/*",
             "/respond-invite/*",
             "/reset-password",
             "/reset-password/*"
           ]
         }
       ]
     }
   }
   ```

   I'll also add a Vite/serve rule (or a tiny `vercel.json`/`_headers` equivalent already used by the project) to ensure it's served with `Content-Type: application/json` and **no redirect**. Since this is a Vite SPA, I'll wire it via `public/.well-known/` + a `_headers` file (Lovable hosting supports it) so Apple's CDN fetch passes.

2. **Add the deep-link scheme to the auth redirect allow-list** for Lovable Cloud:
   - `pourhub://auth-callback`
   - `pourhub://`
   - `exp://` (for Expo Go dev)
   - `https://pourhub.com.au/auth-callback` (Universal Link variant)

   This is a Cloud auth setting, not a code change. I'll do it via the Cloud auth config tool. You'll just see a confirmation.

3. **Confirm Capacitor coexistence** — leave `capacitor.config.ts` and the existing "native bypass landing → /auth" rule untouched so the current Capacitor build still works while you stand up Expo. We can deprecate Capacitor later once Expo ships.

## What I will NOT touch

- No DB migrations, no RLS changes, no edge function changes — same project, same data, same users.
- No changes to `src/integrations/supabase/client.ts` or `.env`.
- No changes to existing web auth flows.

## After this is in place — Expo side (separate repo, your work)

I'll hand you a ready-to-paste bundle:
- `lib/supabase.ts` (AsyncStorage + AppState refresh)
- `AuthProvider.tsx`
- `SignIn.tsx` with email/password + Google via `pourhub://auth-callback`
- `app.json` snippet with `scheme: "pourhub"`, `ios.bundleIdentifier: "com.pourhub.app"`, and `ios.associatedDomains: ["applinks:pourhub.com.au", "applinks:www.pourhub.com.au", "applinks:pourhub.au"]`

## Technical notes

- AASA must be served from the **apex** that your emails/SMS link to. `APP_URL` is `https://pourhub.com.au`, so that host is the canonical one. I'll list all three hostnames in `associatedDomains` on the Expo side; only `pourhub.com.au` strictly needs the AASA file, but hosting it on the others is harmless if they 1:1 mirror the SPA.
- iOS fetches AASA via Apple's CDN — no `aasa-resources` entitlement needed for modern iOS. Just plain HTTPS, valid JSON, no redirects, `Content-Type: application/json` (or `application/pkcs7-mime` — JSON is fine for iOS 14+).
- Google sign-in from Expo will round-trip through Supabase's `/auth/v1/callback` then back to `pourhub://auth-callback` — that's why the scheme must be on the allow-list.
- Password reset / magic-link emails currently target `https://pourhub.com.au/...`. With Universal Links configured, those will open the iOS app automatically when installed, and fall back to the web otherwise. No email template changes needed.

## Approve to implement

Approving this plan will: create `public/.well-known/apple-app-site-association`, add a `_headers` file (or equivalent) for correct content type, and update the Cloud auth redirect allow-list with the four URLs above.
