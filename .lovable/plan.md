

## Subcontractor Portal MVP -- PourHub Labour Marketplace

### Overview

A standalone subcontractor directory at `/sub-contractors` where Australian trades can create verified profiles using their ABN. Completely separate from the existing PourHub admin/staff/supplier portals.

### Prerequisite -- ABR API GUID

Before we can implement ABN verification, you need to register for a free API key:

1. Go to https://abr.business.gov.au/Tools/AbrApi
2. Fill out the registration form (takes ~2 minutes)
3. You'll receive a GUID via email
4. Come back and I'll store it securely as `ABR_API_GUID`

---

### Database Schema

**New table: `subcontractor_directory_profiles`**

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK auth.users) | Unique, not null |
| first_name | text | |
| last_name | text | |
| phone | text | |
| email | text | |
| abn | text | 11-digit string |
| legal_name | text | From ABR API |
| gst_registered | boolean | From ABR API |
| entity_type | text | From ABR API |
| abn_verified | boolean | Default false |
| trade_types | text[] | Array of selected trades |
| years_experience | integer | |
| service_radius_km | integer | |
| base_postcode | text | |
| insurance_certificate_url | text | Storage path |
| profile_photo_url | text | Storage path |
| bio | text | Short description |
| availability_status | text | "available" or "busy" |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**New role value**: Add `'subcontractor'` to the existing `app_role` enum, or use the `user_roles` table with a text-based role check (following existing `is_supplier` pattern).

**New RPC function**: `is_subcontractor(_user_id uuid)` -- mirrors the existing `is_supplier` pattern.

**RLS policies on `subcontractor_directory_profiles`**:
- Authenticated users can read all profiles (future search feature)
- Users can only insert/update/delete their own profile (`user_id = auth.uid()`)
- Admins (PourHub staff) can read all

**Storage bucket**: `subcontractor-documents` (private) for insurance certificates; `subcontractor-photos` (public) for profile photos.

---

### Edge Function: `verify-abn`

- Accepts `{ abn: string }` in request body
- Calls `https://abr.business.gov.au/json/AbnDetails.aspx?abn={ABN}&guid={ABR_API_GUID}`
- The ABR API returns JSONP by default (callback wrapper); the function strips the callback wrapper to parse the JSON
- Returns:
  - `valid: boolean`
  - `legal_name: string`
  - `gst_registered: boolean`
  - `entity_type: string`
  - `abn_status: string`
  - `error_message: string` (if invalid/cancelled)
- JWT validation required (only authenticated users can verify)
- Config: `verify_jwt = false` in config.toml (validate in code per project pattern)

---

### Frontend Pages and Components

**Route: `/sub-contractors`** -- Landing + Login page
- Hero section explaining the subcontractor marketplace
- Login form for existing subcontractors
- "Create Account" button leading to signup
- Clean, standalone design (not using AdminLayout)

**Route: `/sub-contractors/signup`** -- Multi-step registration
- Step 1: Email + password (Supabase auth signup)
- Step 2: ABN entry + verification (calls `verify-abn` edge function)
  - Shows spinner while verifying
  - On success: auto-fills and locks legal name, GST status, entity type
  - On failure: shows error, blocks proceeding
- Step 3: Profile details (name, phone, trade types, experience, postcode, radius, bio)
- Step 4: File uploads (insurance certificate, profile photo)
- Redirects to dashboard on completion

**Route: `/sub-contractors/dashboard`** -- Subcontractor dashboard
- Protected route (checks `is_subcontractor` role, same pattern as `SupplierProtectedRoute`)
- Shows: verified ABN badge, legal entity name, trade types, availability toggle
- Profile completion percentage bar
- Edit profile button

**Admin view** (within existing PourHub staff dashboard):
- New tab "Subcontractors" in `StaffDashboard.tsx`
- Table listing all `subcontractor_directory_profiles`
- Filters: GST registered, entity type, trade type, postcode
- ABN verified badge per row

---

### Component Structure

```
src/components/subcontractors/
  SubcontractorProtectedRoute.tsx    -- Auth guard (mirrors SupplierProtectedRoute)
  SubcontractorSignupFlow.tsx        -- Multi-step registration wizard
  AbnVerificationStep.tsx            -- ABN input + API call + results display
  ProfileDetailsStep.tsx             -- Trade types, experience, location
  FileUploadStep.tsx                 -- Insurance + photo uploads
  SubcontractorDashboard.tsx         -- Main dashboard content
  SubcontractorProfileCard.tsx       -- Profile summary with completion %
  AvailabilityToggle.tsx             -- Available/Busy switch
  SubcontractorAdminTable.tsx        -- Staff view table with filters

src/pages/subcontractors/
  SubcontractorsLanding.tsx          -- Landing + login
  SubcontractorSignup.tsx            -- Signup flow page
  SubcontractorDashboardPage.tsx     -- Dashboard page

src/hooks/
  useSubcontractorProfile.ts         -- Fetch/update profile hook
  useAbnVerification.ts              -- ABN verification mutation hook
```

---

### Route Registration (App.tsx)

```
/sub-contractors                     -- Landing/login (public)
/sub-contractors/signup              -- Registration (public)
/sub-contractors/dashboard           -- Dashboard (protected)
```

---

### Trade Type Options (multi-select)

- Concreter
- Steel Fixer
- Formworker
- Pump Operator
- Excavation
- Labourer

---

### Profile Completion Calculation

Score based on filled fields (each worth equal weight):
- First/last name, phone, email (basic info)
- ABN verified
- At least 1 trade type selected
- Years experience set
- Service radius + base postcode set
- Insurance certificate uploaded
- Profile photo uploaded
- Bio written

Display as percentage bar on dashboard.

---

### Files to Create/Modify

| File | Action |
|---|---|
| 1 database migration | Create table, RPC, RLS, storage buckets |
| `supabase/functions/verify-abn/index.ts` | New edge function |
| `supabase/config.toml` | Add `verify-abn` function config |
| `src/pages/subcontractors/SubcontractorsLanding.tsx` | New page |
| `src/pages/subcontractors/SubcontractorSignup.tsx` | New page |
| `src/pages/subcontractors/SubcontractorDashboardPage.tsx` | New page |
| `src/components/subcontractors/SubcontractorProtectedRoute.tsx` | New component |
| `src/components/subcontractors/SubcontractorSignupFlow.tsx` | New component |
| `src/components/subcontractors/AbnVerificationStep.tsx` | New component |
| `src/components/subcontractors/ProfileDetailsStep.tsx` | New component |
| `src/components/subcontractors/FileUploadStep.tsx` | New component |
| `src/components/subcontractors/SubcontractorDashboard.tsx` | New component |
| `src/components/subcontractors/SubcontractorProfileCard.tsx` | New component |
| `src/components/subcontractors/AvailabilityToggle.tsx` | New component |
| `src/components/subcontractors/SubcontractorAdminTable.tsx` | New component |
| `src/hooks/useSubcontractorProfile.ts` | New hook |
| `src/hooks/useAbnVerification.ts` | New hook |
| `src/App.tsx` | Add 3 new routes |
| `src/pages/staff/StaffDashboard.tsx` | Add "Subcontractors" admin tab |

---

### Implementation Order

1. Store `ABR_API_GUID` secret (after you register)
2. Database migration (table, RPC, RLS, storage buckets, role)
3. `verify-abn` edge function
4. Frontend: landing page + login
5. Frontend: signup flow with ABN verification
6. Frontend: dashboard with profile management
7. Admin tab in staff dashboard
8. End-to-end testing

