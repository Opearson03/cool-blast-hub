
# Fix Inbox "Start Estimate" Workflow

## Problem Summary

The "Start Estimate" button in the Inbox's Plans to Quote section fails to create a properly functioning estimate because:

1. **Wrong file storage**: The `PendingPlansSheet` creates a legacy `estimate_takeoffs` record with `plan_url` field, but the system now uses `takeoff_files` table
2. **No wizard integration**: After creating, it navigates to the detail sheet (read-only) instead of opening the estimate wizard
3. **Plan files inaccessible**: The plan file from the inbox is stored in `test-documents` bucket but never copied to `estimate-plans` bucket or linked via `takeoff_files`

## Solution

Refactor the conversion flow to:
1. Copy the plan file from inbox storage to estimate-plans bucket
2. Create proper `takeoff_files` record (not legacy `plan_url`)
3. Navigate to the estimate wizard for scope configuration
4. Add in-app plan viewing (already exists in EstimateDetailSheet)

---

## Technical Changes

### File: `src/components/jobs/PendingPlansSheet.tsx`

#### 1. Refactor `convertMutation` to use proper file storage

Replace the current conversion logic with:

```text
1. Create estimate with draft status (minimal data)
2. Create estimate_takeoffs record (empty plan_url/plan_type)
3. Copy file from test-documents bucket to estimate-plans bucket
4. Create takeoff_files record with the new file URL
5. Update pending_plan status to 'converted'
6. Navigate to wizard with edit mode: /admin/estimates?edit={id}
```

#### 2. Update the navigation after conversion

Instead of navigating to `?id=${estimate.id}` (which opens detail sheet), navigate to open the estimate form dialog for editing.

Current behavior:
```typescript
navigate(`/admin/estimates?id=${estimate.id}`);
```

New behavior - pass state to open wizard:
```typescript
navigate(`/admin/estimates`, { 
  state: { editEstimateId: estimate.id } 
});
```

### File: `src/pages/admin/AdminEstimates.tsx`

#### 3. Handle navigation state to auto-open wizard

Add logic to check for `editEstimateId` in location state and automatically open the form dialog for that estimate.

---

## Detailed Implementation

### Step 1: Update PendingPlansSheet conversion mutation

```typescript
const convertMutation = useMutation({
  mutationFn: async () => {
    if (!selectedPlan) throw new Error("No plan selected");

    // Get user's business ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_id")
      .eq("id", user.id)
      .single();
    
    if (!profile?.business_id) throw new Error("No business found");

    // 1. Create estimate draft
    const { data: estimate, error: estimateError } = await supabase
      .from("estimates")
      .insert({
        business_id: businessId,
        client_name: clientName || "New Client",
        client_email: clientEmail || null,
        client_phone: clientPhone || null,
        site_address: siteAddress || "Address TBD",
        status: "draft",
        estimate_type: "commercial_slab",
        notes: `Plan received via email from ${selectedPlan.from_email}`,
      })
      .select()
      .single();

    if (estimateError) throw estimateError;

    // 2. Create takeoff record
    const { data: takeoff, error: takeoffError } = await supabase
      .from("estimate_takeoffs")
      .insert({
        estimate_id: estimate.id,
        plan_url: null,
        plan_type: null,
        page_count: 1,
        current_page: 1
      })
      .select()
      .single();

    if (takeoffError) throw takeoffError;

    // 3. Copy file from test-documents to estimate-plans
    // Extract source path from pending_plan file_url
    const sourceUrl = selectedPlan.file_url;
    const sourcePath = extractPathFromUrl(sourceUrl, 'test-documents');
    
    // Download the file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('test-documents')
      .download(sourcePath);
    
    if (downloadError) throw downloadError;

    // Upload to estimate-plans
    const fileExt = selectedPlan.file_name.split('.').pop()?.toLowerCase() || 'pdf';
    const destPath = `${profile.business_id}/${estimate.id}/${crypto.randomUUID()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('estimate-plans')
      .upload(destPath, fileData, { upsert: true });
    
    if (uploadError) throw uploadError;

    // Get signed URL for the new file
    const { data: signedUrlData } = await supabase.storage
      .from('estimate-plans')
      .createSignedUrl(destPath, 3600 * 24 * 7);

    // 4. Create takeoff_files record
    const { error: fileRecordError } = await supabase
      .from('takeoff_files')
      .insert({
        takeoff_id: takeoff.id,
        file_url: signedUrlData?.signedUrl || destPath,
        file_type: fileExt === 'pdf' ? 'pdf' : 'image',
        file_name: selectedPlan.file_name.replace(/\.[^/.]+$/, '') || 'Building Plan',
        page_count: 1,
        sort_order: 0
      });

    if (fileRecordError) {
      console.error("Error creating takeoff file:", fileRecordError);
    }

    // 5. Update pending plan status
    const { error: updateError } = await supabase
      .from("pending_plans")
      .update({
        status: "converted",
        linked_estimate_id: estimate.id,
      })
      .eq("id", selectedPlan.id);

    if (updateError) throw updateError;

    return estimate;
  },
  onSuccess: (estimate) => {
    queryClient.invalidateQueries({ queryKey: ["pending-plans"] });
    queryClient.invalidateQueries({ queryKey: ["pending-plans-list"] });
    toast.success("Estimate created - complete the quote setup");
    setShowConvertDialog(false);
    setSelectedPlan(null);
    onOpenChange(false);
    // Navigate with state to auto-open wizard
    navigate("/admin/estimates", { 
      state: { editEstimateId: estimate.id } 
    });
  },
  // ... error handler unchanged
});
```

### Step 2: Handle auto-open in AdminEstimates

```typescript
// In AdminEstimates component, add:
const location = useLocation();

useEffect(() => {
  // Check if we should auto-open an estimate for editing
  const state = location.state as { editEstimateId?: string } | null;
  if (state?.editEstimateId && estimates.length > 0) {
    const estimate = estimates.find(e => e.id === state.editEstimateId);
    if (estimate) {
      setEditingEstimate(estimate);
      setFormOpen(true);
      // Clear the state to prevent re-opening on refresh
      navigate(location.pathname, { replace: true });
    }
  }
}, [location.state, estimates]);
```

### Step 3: Add helper function for URL path extraction

```typescript
function extractPathFromUrl(url: string, bucketName: string): string {
  // Handle both signed URLs and public URLs
  const bucketMarker = `/${bucketName}/`;
  const startIndex = url.indexOf(bucketMarker);
  if (startIndex === -1) return url;
  
  let path = url.slice(startIndex + bucketMarker.length);
  // Remove query params (signed URL tokens)
  const queryIndex = path.indexOf('?');
  if (queryIndex !== -1) {
    path = path.slice(0, queryIndex);
  }
  return decodeURIComponent(path);
}
```

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/jobs/PendingPlansSheet.tsx` | Refactor conversion to use takeoff_files, copy file between buckets, navigate to wizard |
| `src/pages/admin/AdminEstimates.tsx` | Add useEffect to handle auto-open from navigation state |

---

## Plan Viewing (Already Implemented)

The `EstimateDetailSheet` already supports viewing plans:
- Lines 822-853: "Building Plans" section with View button
- Lines 856-920: Full plan viewer dialog with PDF iframe and image support
- Supports multiple files with Previous/Next navigation

No changes needed for viewing - just ensure files are properly stored in `takeoff_files` table.

---

## Implementation Sequence

1. Add the URL path extraction helper function to PendingPlansSheet
2. Refactor the `convertMutation` to properly copy files and create `takeoff_files` record
3. Update navigation to pass state for auto-opening wizard
4. Add useEffect in AdminEstimates to handle the auto-open state
5. Test the full flow: Inbox → Start Estimate → Wizard opens with plan attached

---

## Why This Works

1. **Proper file storage**: Plans are copied to the same bucket/structure used by the standard estimate creation
2. **takeoff_files table**: Using the new architecture ensures plans appear in the wizard and detail sheet
3. **Wizard integration**: Opening the wizard allows users to configure scopes, markup plans, and finalize the quote
4. **Backward compatible**: Existing estimates and viewing functionality remain unchanged
