

## Xero Accounting Integration

### Overview
Connect your Xero account from Business Settings so you can push quotes as invoices, sync contacts, and track payment status -- all from within PourHub. Users simply click "Connect to Xero" and log in; no API keys or technical setup required on their end.

### Prerequisites (One-Time Platform Setup)
You need to create a Xero Developer App at https://developer.xero.com/app/manage:
1. Sign in with your Xero account
2. Click "New App"
3. App name: "PourHub"
4. Integration type: "Web app"
5. Company or application URL: `https://cool-blast-hub.lovable.app`
6. Redirect URI: `https://fhwqsocjvpbghptvzekk.supabase.co/functions/v1/xero-auth-callback`
7. Copy the **Client ID** and generate a **Client Secret**

Once you have those, I'll securely store them as backend secrets.

---

### Implementation Steps

#### 1. Add Secrets
Store `XERO_CLIENT_ID` and `XERO_CLIENT_SECRET` as backend secrets.

#### 2. Database Tables (2 new tables)

**`xero_connections`** -- stores each business's OAuth tokens

| Column | Type | Purpose |
|---|---|---|
| id | uuid (PK) | |
| business_id | uuid (FK, unique) | One connection per business |
| xero_tenant_id | text | Xero organisation ID |
| xero_org_name | text | Display name |
| access_token | text | Short-lived (30 min) |
| refresh_token | text | Long-lived |
| token_expires_at | timestamptz | Expiry tracking |
| scope | text | Granted scopes |
| created_at / updated_at | timestamptz | |

RLS: Only the business admin can read/delete their own row. Insert/update via service role in edge functions only.

**`xero_sync_log`** -- tracks what has been pushed to Xero

| Column | Type | Purpose |
|---|---|---|
| id | uuid (PK) | |
| business_id | uuid (FK) | |
| source_type | text | "estimate", "variation", "contact" |
| source_id | uuid | PourHub record ID |
| xero_invoice_id | text | Xero's ID |
| xero_invoice_number | text | |
| xero_contact_id | text | |
| xero_status | text | e.g. "AUTHORISED", "PAID" |
| last_synced_at | timestamptz | |
| created_at | timestamptz | |

RLS: Scoped to own business_id for select. Insert/update via service role.

#### 3. Edge Functions (3 new)

**`xero-auth`** (POST)
- Validates staff JWT, gets business_id from profile
- Builds Xero OAuth2 authorization URL with scopes: `offline_access openid profile email accounting.transactions accounting.contacts accounting.settings`
- Encodes business_id + user_id in a `state` parameter
- Returns the authorization URL for the frontend to redirect to

**`xero-auth-callback`** (GET)
- Xero redirects here after user authorizes
- Exchanges authorization code for access + refresh tokens
- Fetches tenant (organisation) info from Xero connections API
- Upserts into `xero_connections` using service role
- Redirects browser back to `/admin/settings?xero=connected`

**`xero-api`** (POST)
- Validates JWT and business ownership
- Reads stored tokens from `xero_connections`; auto-refreshes if expired
- Supported actions:
  - `create_contact` -- finds or creates a Xero contact by email
  - `create_invoice` -- pushes an estimate/variation as a DRAFT or AUTHORISED invoice with line items
  - `get_invoice_status` -- checks payment status of a synced invoice
  - `disconnect` -- revokes token and deletes connection row

#### 4. Frontend: Settings Integration Section

Add a new `SettingsGroup` titled "Integrations" in `AdminSettings.tsx` between Documents and Support, containing a `XeroIntegrationSettings` component:
- **Disconnected state**: Shows Xero logo + "Connect to Xero" button
- **Connected state**: Shows organisation name, connection date, and "Disconnect" button
- Handles `?xero=connected` URL param to show a success toast

New file: `src/components/settings/XeroIntegrationSettings.tsx`

#### 5. Frontend: "Send to Xero" on Quotes

In `EstimateDetailSheet.tsx`, for accepted quotes:
- Add a "Send to Xero" button (only shown when Xero is connected)
- Clicking it calls `xero-api` with action `create_contact` (using client email/name), then `create_invoice` with the quote's line items
- Shows a loading state during sync, then a success badge with the Xero invoice number
- If already synced (found in `xero_sync_log`), show the Xero invoice number and a "Refresh Status" button

#### 6. Frontend: "Send to Xero" on Variations

In `JobVariationsTab.tsx`, for approved variations:
- Add a "Send to Xero" dropdown action
- Same flow as quotes: create contact, then create invoice from variation line items

#### 7. Config Updates

Add to `supabase/config.toml`:
```
[functions.xero-auth]
verify_jwt = false

[functions.xero-auth-callback]
verify_jwt = false

[functions.xero-api]
verify_jwt = false
```

### New Files
- `supabase/functions/xero-auth/index.ts`
- `supabase/functions/xero-auth-callback/index.ts`
- `supabase/functions/xero-api/index.ts`
- `src/components/settings/XeroIntegrationSettings.tsx`
- `src/hooks/useXeroConnection.ts` -- React Query hook for connection status + sync log

### Modified Files
- `src/pages/admin/AdminSettings.tsx` -- add Integrations group
- `src/components/estimates/EstimateDetailSheet.tsx` -- add Send to Xero button
- `src/components/jobs/tabs/JobVariationsTab.tsx` -- add Send to Xero action
- Database migration (2 new tables + RLS policies)

### Implementation Order
1. Request XERO_CLIENT_ID and XERO_CLIENT_SECRET secrets from you
2. Create database tables with RLS
3. Build the 3 edge functions
4. Add the Settings UI (connect/disconnect)
5. Add the hook for checking connection status
6. Add "Send to Xero" to quotes and variations

