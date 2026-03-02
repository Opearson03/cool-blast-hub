

## Xero Accounting Integration

### Overview
Connect your Xero account from Business Settings to push quotes as invoices, sync contacts, and track payment status -- all from within PourHub. Users click "Connect to Xero" and log in via standard OAuth; no API keys or manual setup on their end.

### Prerequisites (One-Time Setup by You)
Create a Xero Developer App at https://developer.xero.com/app/manage:
1. Sign in with your Xero account
2. Click "New App"
3. App name: "PourHub", Integration type: **Web app**
4. Company or application URL: `https://cool-blast-hub.lovable.app`
5. Redirect URI: `https://fhwqsocjvpbghptvzekk.supabase.co/functions/v1/xero-auth-callback`
6. Copy the **Client ID** and generate a **Client Secret**

I will then securely store these as `XERO_CLIENT_ID` and `XERO_CLIENT_SECRET`.

---

### Implementation Steps

#### 1. Store Secrets
Add `XERO_CLIENT_ID` and `XERO_CLIENT_SECRET` as backend secrets.

#### 2. Database Tables (2 new)

**`xero_connections`** -- one row per business storing OAuth tokens

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| business_id | uuid FK (unique) | One connection per business |
| xero_tenant_id | text | Xero organisation ID |
| xero_org_name | text | Display name |
| access_token | text | Short-lived (30 min) |
| refresh_token | text | Long-lived |
| token_expires_at | timestamptz | For auto-refresh logic |
| scope | text | Granted scopes |
| created_at / updated_at | timestamptz | |

RLS: Business admin can SELECT/DELETE their own row. INSERT/UPDATE via service role only (edge functions).

**`xero_sync_log`** -- tracks what has been pushed to Xero

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| business_id | uuid FK | |
| source_type | text | "estimate", "variation", "contact" |
| source_id | uuid | PourHub record ID |
| xero_invoice_id | text | |
| xero_invoice_number | text | |
| xero_contact_id | text | |
| xero_status | text | e.g. "AUTHORISED", "PAID" |
| last_synced_at / created_at | timestamptz | |

RLS: Business-scoped SELECT. INSERT/UPDATE via service role.

#### 3. Backend Functions (3 new)

**`xero-auth`** (POST)
- Validates user JWT, gets business_id from profile
- Builds Xero OAuth2 authorization URL with scopes: `offline_access openid profile email accounting.transactions accounting.contacts accounting.settings`
- Encodes business_id + user_id in a `state` parameter
- Returns the URL for the frontend to redirect to

**`xero-auth-callback`** (GET)
- Xero redirects here after user authorizes
- Exchanges authorization code for access + refresh tokens
- Fetches tenant (organisation) info from Xero connections API
- Upserts into `xero_connections`
- Redirects browser to `/admin/settings?xero=connected`

**`xero-api`** (POST)
- Validates JWT and business ownership
- Reads tokens from `xero_connections`; auto-refreshes if expired
- Actions:
  - `create_contact` -- find or create a Xero contact by email
  - `create_invoice` -- push estimate/variation as a DRAFT invoice with line items
  - `get_invoice_status` -- check payment status
  - `disconnect` -- revoke token and delete connection

#### 4. Settings UI: Integrations Section

Add a new settings group titled "Integrations" in AdminSettings between Documents and Support, containing a `XeroIntegrationSettings` component:
- **Disconnected**: Xero logo + "Connect to Xero" button
- **Connected**: Organisation name, connection date, "Disconnect" button
- Handles `?xero=connected` URL param to show success toast

#### 5. "Send to Xero" on Accepted Quotes

In the estimate detail sheet, for accepted quotes:
- Show a "Send to Xero" button (only when Xero is connected)
- Creates the contact, then creates the invoice with line items
- Shows loading state, then a success badge with the Xero invoice number
- If already synced, show invoice number + "Refresh Status" button

#### 6. "Send to Xero" on Approved Variations

In the job variations tab, for approved variations:
- Add a "Send to Xero" dropdown action
- Same flow: create contact, then invoice from variation line items

---

### New Files
- `supabase/functions/xero-auth/index.ts`
- `supabase/functions/xero-auth-callback/index.ts`
- `supabase/functions/xero-api/index.ts`
- `src/components/settings/XeroIntegrationSettings.tsx`
- `src/hooks/useXeroConnection.ts` (React Query hook for connection status + sync log)

### Modified Files
- `src/pages/admin/AdminSettings.tsx` -- add Integrations group
- `src/components/estimates/EstimateDetailSheet.tsx` -- add Send to Xero button
- `src/components/jobs/tabs/JobVariationsTab.tsx` -- add Send to Xero action
- Database migration (2 new tables + RLS policies)
- `supabase/config.toml` -- add 3 new function entries

### Build Order
1. Collect and store Xero Client ID and Secret
2. Create database tables with RLS
3. Build the 3 backend functions
4. Add the Settings UI (connect/disconnect)
5. Add the React Query hook for connection status
6. Add "Send to Xero" to quotes and variations

