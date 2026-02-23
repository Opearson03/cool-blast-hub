
## Document Uploads and White Card for Subcontractors

### Overview

Add working file upload functionality to both the **Signup flow** (Step 4) and the **Settings page** (Documents section), plus a new **White Card** field with a two-step flow: ask if they hold one, then upload proof.

### Database Changes

Add 3 new columns to `subcontractor_directory_profiles`:

| Column | Type | Nullable | Purpose |
|---|---|---|---|
| `white_card_number` | text | Yes | The white card number |
| `white_card_document_url` | text | Yes | URL to uploaded white card photo or USI transcript |
| `has_white_card` | boolean | Yes (default false) | Whether they hold a white card |

### Storage Buckets

Both `subcontractor-documents` (private) and `subcontractor-photos` (public) already exist. No new buckets needed. Insurance certs and white card docs go to `subcontractor-documents`; profile photos go to `subcontractor-photos`.

### Changes to Signup Flow (SubcontractorSignup.tsx)

**Step 4 becomes a richer upload step:**

1. **Profile Photo** -- drag-and-drop or browse, with image preview thumbnail
2. **Insurance Certificate** -- PDF/image upload with filename confirmation
3. **White Card section:**
   - Checkbox: "Do you hold a Construction White Card?"
   - If Yes: text input for White Card Number + file upload for White Card Photo OR USI Transcript
   - If No: nothing extra, proceed

All uploads happen in `handleSubmitProfile` (existing logic), extended to also upload white card docs and save the 3 new fields.

### Changes to Settings Page (SubcontractorSettings.tsx)

Replace the static "Document upload coming soon" placeholder in the Documents accordion with working upload/replace functionality:

1. **Profile Photo** -- show current photo (or placeholder), with "Upload" / "Replace" button. Uploads to `subcontractor-photos/{userId}/photo.{ext}`, saves public URL to `profile_photo_url`.
2. **Insurance Certificate** -- show current filename or "Not uploaded", with "Upload" / "Replace" button. Uploads to `subcontractor-documents/{userId}/insurance.{ext}`, saves path to `insurance_certificate_url`. "View" link if already uploaded.
3. **White Card** -- toggle for "I hold a Construction White Card"
   - If toggled on: show White Card Number input + file upload for card photo/USI transcript
   - Uploads to `subcontractor-documents/{userId}/whitecard.{ext}`
   - Save button persists all 3 fields (`has_white_card`, `white_card_number`, `white_card_document_url`)

### Profile Completion Update (useSubcontractorProfile.ts)

Update `calculateProfileCompletion` to include white card as an optional bonus (not required), keeping the existing 10 checks. Alternatively, keep it at 10 checks so white card doesn't affect completion -- since not all subbies will have one.

No change to completion logic -- white card stays optional.

### Files to Modify

| File | Change |
|---|---|
| `src/pages/subcontractors/SubcontractorSignup.tsx` | Add white card fields to Step 4, keep existing photo/insurance uploads |
| `src/pages/subcontractors/SubcontractorSettings.tsx` | Replace "coming soon" with working upload/replace for photo, insurance, and white card |
| `src/hooks/useSubcontractorProfile.ts` | Add `white_card_number`, `white_card_document_url`, `has_white_card` to interface |

### Technical Details

**Upload pattern (reused from existing signup logic):**
```typescript
// Profile photo -> public bucket
const path = `${userId}/photo.${ext}`;
await supabase.storage.from("subcontractor-photos").upload(path, file, { upsert: true });
const { data } = supabase.storage.from("subcontractor-photos").getPublicUrl(path);
// Save data.publicUrl to profile_photo_url

// Insurance / White card -> private bucket
const path = `${userId}/insurance.${ext}`;
await supabase.storage.from("subcontractor-documents").upload(path, file, { upsert: true });
// Save path to insurance_certificate_url
// For viewing, generate signed URL:
const { data } = await supabase.storage.from("subcontractor-documents").createSignedUrl(path, 3600);
```

**White Card UI flow in Settings:**
```
[Toggle] Do you hold a Construction White Card?
  |
  +-- Yes --> [Input: White Card Number]
              [Upload: White Card Photo or USI Transcript]
              [Save button]
  |
  +-- No  --> (nothing shown, toggle saves has_white_card: false)
```

**Migration SQL:**
```sql
ALTER TABLE subcontractor_directory_profiles
  ADD COLUMN has_white_card boolean DEFAULT false,
  ADD COLUMN white_card_number text,
  ADD COLUMN white_card_document_url text;
```
