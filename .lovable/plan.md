

# Plan: View & Download Signed Quote from Quote Page

## Overview
Add the ability to view and download the signed quote PDF directly from the "Accepted" quote detail popup, without needing to navigate to the job.

## Current State
- When a quote is signed via the public signing page, the signed PDF is:
  1. Generated server-side with the embedded signature
  2. Uploaded to the `documents` storage bucket
  3. Linked to the **job** (not the estimate) via `documents.reference_id = job.id`
- The estimate has signature data: `client_signature`, `client_signature_name`, `signed_at`
- Jobs have `source_estimate_id` linking back to the originating estimate

## Solution

### Add a new query to fetch the signed PDF document
When viewing an "accepted" estimate, we'll:
1. Find the job where `source_estimate_id = estimate.id`
2. Find the document where `reference_id = job.id` and `file_name LIKE 'Signed Quote%'`
3. Display View/Download options in the estimate detail sheet

### UI Changes
Add a new "Signed Quote" section in the EstimateDetailSheet that appears **only for accepted quotes** with signature data:

```
┌─────────────────────────────────────────┐
│ ✓ SIGNED                                │
│   Signed by: John Smith                 │
│   Date: 6 Feb 2026 at 10:30 AM          │
│                                         │
│   [View Signed PDF]   [Download]        │
└─────────────────────────────────────────┘
```

---

## Technical Implementation

### File: `src/components/estimates/EstimateDetailSheet.tsx`

**1. Add a new query to fetch the signed document:**
```typescript
const { data: signedDocument } = useQuery({
  queryKey: ["signed-document", estimate?.id],
  queryFn: async () => {
    if (!estimate?.id) return null;
    
    // First find the job created from this estimate
    const { data: job } = await supabase
      .from("jobs")
      .select("id")
      .eq("source_estimate_id", estimate.id)
      .maybeSingle();
    
    if (!job) return null;
    
    // Then find the signed quote document
    const { data: doc } = await supabase
      .from("documents")
      .select("id, file_name, file_url")
      .eq("reference_id", job.id)
      .ilike("file_name", "Signed Quote%")
      .maybeSingle();
    
    return doc;
  },
  enabled: open && !!estimate?.id && estimate?.status === "accepted",
});
```

**2. Add state for viewing signed PDF:**
```typescript
const [isSignedPdfViewerOpen, setIsSignedPdfViewerOpen] = useState(false);
```

**3. Add "Signed Quote" section UI (after Actions section, before Client Info):**
- Only visible when `estimate.status === "accepted"` and `estimate.signed_at` exists
- Show signer name and signed date/time
- "View" button opens PDF in a dialog (iframe)
- "Download" button opens PDF in new tab

**4. Add Dialog for viewing signed PDF:**
- Similar to the existing Plan Viewer Dialog
- Simple iframe viewer with download option

---

## Visual Placement
The signed quote section will appear:
1. After the action buttons (Print/Email/Revise)
2. Before the Client Details section
3. With a green accent to indicate "accepted" status

---

## Edge Cases Handled
- **No signed PDF found**: Hide the View/Download buttons, just show signature info
- **Query loading**: Show skeleton while fetching signed document
- **Estimate not accepted**: Don't run the query at all (enabled: false)

---

## Files Changed
| File | Change |
|------|--------|
| `src/components/estimates/EstimateDetailSheet.tsx` | Add signed document query, viewer dialog, and UI section |

---

## Testing Checklist
1. Open an "Accepted" quote
2. Verify "Signed" section appears with signer name and date
3. Click "View Signed PDF" - confirm PDF displays in dialog
4. Click "Download" - confirm PDF opens in new tab
5. Open a non-accepted quote - confirm section does NOT appear

