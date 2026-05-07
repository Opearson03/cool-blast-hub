## Site Diary — Photos tied to each pour

A new **Site Diary** sub-section inside a job's Files tab. Each pour (Project Plan / Schedule Works) gets its own card with three photo buckets — **Before**, **During**, **After** — plus optional captions. Mobile-first capture, web-friendly review.

### Why this matters
- Defends against client/client-of-client disputes ("the slab wasn't prepped", "there was a crack day one").
- Builds a defensible record of workmanship for warranty + insurance.
- Becomes export-able evidence for the Job Pack PDF.
- Differentiator vs generic file dumps competitors offer.

### Where it lives

`Job → Files tab` already has folder chips (`All / Dockets / Plans / Quotes / Photos / Other`).

We add a new chip: **Site Diary** (becomes the default view when pours exist).

```text
Files
[ All ] [ Site Diary* ] [ Dockets ] [ Plans ] [ Quotes ] [ Photos ] [ Other ]
                ▼
   ┌─ Pour 1 — "Driveway slab" — 14 May ─────────────┐
   │  Before (3)        During (5)        After (2)   │
   │  [📷+] thumbs…     [📷+] thumbs…     [📷+] thumbs│
   └──────────────────────────────────────────────────┘
   ┌─ Pour 2 — "Shed footings" — 18 May ──────────────┐
   │  Before (0)        During (0)        After (0)   │
   └──────────────────────────────────────────────────┘
```

The plain `Photos` chip stays for ad-hoc site photos not tied to a pour.

### User flows

**Capture (mobile / tablet)**
1. Open job → Files → Site Diary.
2. Tap a pour card → tap `Before / During / After` → native camera or gallery picker.
3. Multi-select supported. Optional caption per photo (defaults to timestamp).
4. Auto-uploads with progress; failures retry-able.

**Review (web)**
- Lightbox carousel per stage with caption, taken-at, uploader.
- Drag-and-drop upload.
- Move a photo to another stage or delete.
- "Mark as cover" — pinned thumbnail on the pour card.

**Export**
- Job Pack PDF gains an optional "Site Diary" section: each pour with a tidy 3-column Before/During/After contact sheet (out-of-scope for v1 implementation, but data model supports it).

### Data model

Reuse the existing `documents` table — photos already land here. Add two nullable columns:

| Column | Type | Purpose |
|---|---|---|
| `pour_id` | `uuid` | Link to `job_pours.id` (FK, on delete set null). |
| `diary_stage` | `text` | `'before' | 'during' | 'after'`, validated by trigger (no CHECK constraint per memory rules). |
| `caption` | `text` | Optional user note. |
| `taken_at` | `timestamptz` | EXIF or upload time fallback. |
| `is_cover` | `boolean default false` | Pinned thumbnail per pour. |

Index: `(reference_id, pour_id, diary_stage)`.

`subfolder = 'site_diary'` for back-compat with the existing folder filter.

### Files to add / change

**New**
- `src/components/jobs/tabs/diary/SiteDiarySection.tsx` — list of pour cards.
- `src/components/jobs/tabs/diary/PourDiaryCard.tsx` — single pour, 3 stage columns, counts, cover thumb.
- `src/components/jobs/tabs/diary/DiaryStageGrid.tsx` — thumb grid + upload button per stage.
- `src/components/jobs/tabs/diary/DiaryPhotoLightbox.tsx` — full-screen viewer with caption editing, move, delete, set-cover.
- `src/hooks/useSiteDiaryPhotos.ts` — react-query fetch/insert/update/delete keyed by `jobId`.

**Edit**
- `src/components/jobs/tabs/JobDocumentsTab.tsx` — add `site_diary` to `FOLDER_TABS`; render `<SiteDiarySection>` when active; keep existing photos/folder behaviour intact.
- `supabase/migrations/...` — add columns + index + validation trigger on `documents`.

### Out of scope for v1
- AI scope detection on photos.
- Comparing before/after with sliders.
- Job Pack PDF site-diary section (data is captured; PDF rendering is a follow-up).
- Subbie portal photo capture (only logged-in business users for now).
- Geo-pinning on a map.

### Open questions
1. Should every photo require a stage (Before/During/After), or allow "Unsorted" within a pour?
2. Should we cap photo size / auto-compress on upload (e.g. resize >2560px) to keep storage costs sane?
3. Do you want the Site Diary chip to become the default tab on Files when the job has pours?