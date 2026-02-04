
# Plan: Add Optional Scopes to Scheduled Works (Project Plan Events)

## Overview

Allow users to assign specific scopes (e.g., "Raft Slab", "Driveway", "Piers") to individual project plan events when scheduling works. This helps clarify exactly what work is being done on each site visit.

---

## Changes Required

### 1. Database: Add `scopes` Column to `job_pours` Table

Add a new JSONB column to store an array of scope keys for each scheduled work event.

```sql
ALTER TABLE job_pours ADD COLUMN scopes JSONB DEFAULT '[]';
```

This will store values like `["raft_slab", "piers"]` - matching the existing scope key format used in estimates.

---

### 2. UI: Add Scope Selector to PourFormDialog

Update the form to include an optional multi-select for scopes:

**File:** `src/components/jobs/PourFormDialog.tsx`

**Changes:**
- Add `scopes` field to the form schema (optional array of strings)
- Fetch available scopes from the parent job's source estimate (if exists) or show all available scopes
- Add a multi-select UI component using badges/checkboxes
- Save selected scopes when creating/updating the pour

**UI Design:**
```
┌─────────────────────────────────────┐
│ Scopes (optional)                   │
├─────────────────────────────────────┤
│ [Raft Slab ✓] [Piers] [Driveway]    │
│ [Crossover] [Paths & Surrounds]     │
└─────────────────────────────────────┘
```

- Displayed as clickable badges that toggle on/off
- Pre-populate with job's available scopes from the source estimate
- Allow selecting multiple scopes per event

---

### 3. Display Scopes in Project Plan UI

**Files to update:**
- `src/components/jobs/tabs/JobPoursTab.tsx` - Show scope badges in the list
- `src/components/jobs/PourDetailSheet.tsx` - Display assigned scopes in the detail view
- `src/components/schedule/PourDetailSheet.tsx` - Display scopes in schedule view

**Display format:**
- Small badges under the event name showing assigned scopes
- E.g., `[Raft Slab] [Piers]` in muted style

---

### 4. Update TypeScript Types

Update the `JobPour` interface across all relevant files to include the new `scopes` field:

```typescript
interface JobPour {
  // ... existing fields
  scopes?: string[] | null;
}
```

---

## Scope Labels Reference

Using the existing scope labels already defined in `JobOverviewTab.tsx`:

| Key | Label |
|-----|-------|
| `standard_slab` | Slab on Ground |
| `raft_slab` | Raft Slab |
| `waffle_pod` | Waffle Pod |
| `strip_footings` | Strip Footings |
| `piers` | Piers |
| `suspended_slab` | Suspended Slab |
| `crossovers` | Crossover |
| `driveway` | Driveway |
| `paths_surrounds` | Paths & Surrounds |
| `retaining_wall` | Retaining Wall |
| `architectural` | Architectural Concrete |

---

## User Flow After Implementation

1. User navigates to a job's **Project Plan** tab
2. User clicks **Schedule Works** to add a new event
3. In the form dialog, user sees an optional **Scopes** section with available scopes as toggleable badges
4. User selects relevant scopes (e.g., "Raft Slab" for a slab pour)
5. Event is saved with the scope assignments
6. The project plan list shows the scopes as small badges next to each event
7. When viewing event details, the assigned scopes are clearly displayed

---

## Summary of File Changes

| File | Change |
|------|--------|
| **Migration** | Add `scopes` JSONB column to `job_pours` table |
| `src/components/jobs/PourFormDialog.tsx` | Add scope selector UI and form field |
| `src/components/jobs/tabs/JobPoursTab.tsx` | Display scope badges in list view |
| `src/components/jobs/PourDetailSheet.tsx` | Display scopes in job detail sheet |
| `src/components/schedule/PourDetailSheet.tsx` | Display scopes in schedule detail sheet |

---

## Technical Details

### Form Schema Addition
```typescript
const pourSchema = z.object({
  // ... existing fields
  scopes: z.array(z.string()).optional().default([]),
});
```

### Scope Selector Component
```tsx
<div className="space-y-2">
  <FormLabel>Scopes (optional)</FormLabel>
  <div className="flex flex-wrap gap-2">
    {availableScopes.map((scopeKey) => (
      <Badge
        key={scopeKey}
        variant={selectedScopes.includes(scopeKey) ? "default" : "outline"}
        className="cursor-pointer"
        onClick={() => toggleScope(scopeKey)}
      >
        {SCOPE_LABELS[scopeKey]}
      </Badge>
    ))}
  </div>
</div>
```

### Fetching Available Scopes
```typescript
// Get scopes from the job's source estimate
const { data: jobScopes } = useQuery({
  queryKey: ["job-available-scopes", jobId],
  queryFn: async () => {
    const { data: job } = await supabase
      .from("jobs")
      .select("source_estimate_id")
      .eq("id", jobId)
      .maybeSingle();
    
    if (!job?.source_estimate_id) return ALL_SCOPES;
    
    const { data: estimate } = await supabase
      .from("estimates")
      .select("selected_scopes")
      .eq("id", job.source_estimate_id)
      .maybeSingle();
    
    return (estimate?.selected_scopes as string[]) || ALL_SCOPES;
  },
});
```
