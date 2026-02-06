
# Per-Scope Inclusions & Exclusions

## What Changes

### 1. Conditions Step in the Estimator Wizard (UI)

Currently the "Conditions" step shows a single flat list of inclusions and a single flat list of exclusions. This will be reorganised to group items by scope.

**New Layout:**

The Conditions step will show inclusions and exclusions grouped under collapsible scope headings, plus a "General" group for global items (permits, engineering, waterproofing) that apply across all scopes.

```text
What's Included
  [General]
    [ ] Sundries and consumables
  [Raft Slab]
    [ ] Supply of concrete to site
    [ ] Concrete pump hire
    [ ] All labour for concrete placement and finishing
    ...
  [Piers]
    [ ] Excavation works as required
    [ ] Supply of concrete to site
    ...

What's Excluded
  [General]
    [ ] Council permits and inspections
    [ ] Engineering certification
    [ ] Waterproofing membrane
  [Raft Slab]
    [ ] Saw cutting control joints
    ...
  [Piers]
    [ ] Service scanning and locating
    ...
```

Each scope section will be collapsible (using existing Collapsible components) and default to expanded. Users can still toggle individual items on/off as before.

### 2. PDF Page 2 - Per-Scope Conditions

The `TermsAndExclusionsPage` component will render inclusions and exclusions grouped by scope name, with smaller text sizes to fit everything on one page.

**Current text sizes vs new:**
- Section headers: `text-xs` (stays the same)
- Item text: `text-sm` (14px) becomes `text-xs` (12px)
- Introductory text: `text-xs` becomes `text-[10px]`
- Spacing between items: `space-y-1` becomes `space-y-0.5`
- Spacing between sections: `mb-6`/`mb-8` becomes `mb-3`/`mb-4`

**PDF layout example:**
```text
INCLUSIONS
  Raft Slab:
    Supply of concrete to site
    All labour for concrete placement and finishing
    Concrete pump hire
  Piers:
    Excavation works as required
    Supply of concrete to site

EXCLUSIONS
  General:
    Council permits and inspections
    Engineering certification
  Raft Slab:
    Saw cutting control joints
  Piers:
    Service scanning and locating
```

### 3. Data Storage Changes

Currently inclusions/exclusions are stored as flat lists in `estimate.notes`. The new format stores them per-scope.

**New notes format:**
```text
INCLUSIONS:
[Raft Slab]
- Supply of concrete to site
- Concrete pump hire
[Piers]
- Excavation works as required

EXCLUSIONS:
[General]
- Council permits and inspections
[Raft Slab]
- Saw cutting control joints
```

The `scope_data` will also carry structured inclusion/exclusion data per scope so the PDF renderer can extract it directly.

---

## Technical Details

### Files to Modify

| File | Change |
|------|--------|
| `src/components/estimates/EstimateFormDialog.tsx` | Restructure the Conditions step UI to group by scope; update `selectedInclusions`/`selectedExclusions` state to be scope-keyed maps instead of flat Sets; update `saveEstimate` to serialise per-scope conditions |
| `src/components/estimates/PrintableEstimate.tsx` | Update `TermsAndExclusionsPage` to accept and render per-scope grouped data; reduce text sizes |
| `src/lib/quote-pdf-data.ts` | Update `collectInclusions` and `collectExclusions` to return scope-grouped data; update `QuotePDFData` interface |

### State Shape Change

**Current:**
```typescript
selectedInclusions: Set<string>   // e.g. Set(["concrete_supply", "labour", ...])
selectedExclusions: Set<string>   // e.g. Set(["exc_permits", "exc_engineering", ...])
```

**New:**
```typescript
// Key is scope ID or "_general" for global items
selectedInclusions: Record<string, Set<string>>
// e.g. { "_general": Set(["sundries"]), "raft_slab": Set(["concrete_supply", "labour"]), "piers": Set(["excavation"]) }
selectedExclusions: Record<string, Set<string>>
```

### Inclusion/Exclusion Item Mapping

Each item in `DEFAULT_INCLUSIONS` and `DEFAULT_EXCLUSIONS` already has `relevantModules`. The grouping logic will:

1. For each selected scope, get its `moduleIds` from `SCOPE_REGISTRY`
2. Filter items whose `relevantModules` overlap with that scope's modules
3. Items with no `relevantModules` (global) go into the "_general" group
4. Items relevant to multiple scopes appear under each applicable scope

### Backwards Compatibility

When loading an existing estimate that was saved with the old flat format, the migration logic will:
- Parse flat inclusion/exclusion IDs from the notes field
- Distribute them into per-scope groups based on `relevantModules` matching
- Global items go to `_general`

### PDF Text Size Reductions

To fit all per-scope conditions on a single page:
- Scope group headings: `text-xs font-semibold` with scope name
- Item bullets: `text-[11px]` (between 10px and 12px)
- Remove "This quote includes:" / "The following items are NOT included:" intro text (scope headings provide enough context)
- Tighten vertical spacing: `space-y-0.5` for items, `mb-3` between sections
- Use a compact two-column layout for inclusions when there are many items

### Auto-Selection Logic Update

When scopes are first selected, the auto-selection logic will:
1. For each scope, identify relevant inclusions/exclusions based on module overlap
2. Auto-check relevant items under each scope
3. Auto-check global exclusions under `_general`
