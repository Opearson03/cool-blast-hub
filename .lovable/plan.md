
# Fix Volume Calculation for Raft Slab and Standard Slab Scopes

## Problem

When creating Raft Slab or Standard Slab estimates, the concrete volume is incorrectly inflated because the calculation includes edge beam and internal beam volumes even when those beams haven't been enabled by the user.

The UI correctly shows toggle switches ("Include edge beams?" and "Include internal beams?") that must be activated before beam data can be entered. However, the volume calculation functions ignore these toggles and always attempt to calculate beam volumes using fallback scalar fields (defaulting to perimeter for edge beam length).

## Affected Scopes

| Scope | Issue |
|-------|-------|
| **Raft Slab** | Edge beam + internal beam volumes calculated unconditionally |
| **Standard Slab (Slab on Ground)** | Edge beam + internal beam volumes calculated unconditionally |
| Driveway | Already fixed (checks `hasEdgeBeams`/`hasInternalBeams`) |
| Crossovers | Already fixed |
| Paths & Surrounds | Already fixed |
| Waffle Pod | Works correctly (always requires beams by design) |

## Root Cause

In `src/lib/estimate-components/scopes.ts`:

**Raft Slab** (lines 355-393):
- Edge beam volume is calculated from scalar fallback fields when `edgeBeams` array is empty
- Uses `perimeter` as default edge beam length, causing phantom volume
- Internal beam volume also uses fallback scalar fields

**Standard Slab** (lines 170-228):
- Same issue as Raft Slab

**Correctly working scopes** (Driveway, Crossovers, Paths & Surrounds):
```javascript
// Only calculate if toggle is enabled
if (answers.hasEdgeBeams === true) {
  // Calculate edge beam volume...
}
```

## Solution

Update the `calculateVolume` functions in both **Raft Slab** and **Standard Slab** scopes to:

1. Check for `hasEdgeBeams === true` before calculating edge beam volume
2. Check for `hasInternalBeams === true` before calculating internal beam volume
3. Only use the fallback scalar fields when the respective toggle is enabled

This mirrors the pattern already used in Driveway, Crossovers, and Paths & Surrounds scopes.

---

## Technical Changes

### File: `src/lib/estimate-components/scopes.ts`

**RAFT_SLAB_SCOPE.calculateVolume** (around line 355):

Before:
```javascript
calculateVolume: (answers) => {
  // ... slab volume calculation ...
  
  // Edge beam extra volume (always calculated)
  const edgeBeamLength = Number(answers.edge_beam_length) || perimeter;
  // ... calculates edge beam volume ...
  
  // Internal beams volume (always calculated)
  const beams = answers.beams || [];
  // ... calculates internal beam volume ...
}
```

After:
```javascript
calculateVolume: (answers) => {
  // ... slab volume calculation (unchanged) ...
  
  // Edge beam extra volume - only if explicitly enabled
  let edgeBeamVolume = 0;
  if (answers.hasEdgeBeams === true) {
    const edgeBeams = answers.edgeBeams || [];
    if (edgeBeams.length > 0) {
      // Calculate from edgeBeams array
    } else {
      // Fallback to scalar fields
    }
  }
  
  // Internal beams volume - only if explicitly enabled
  let internalBeamVolume = 0;
  if (answers.hasInternalBeams === true) {
    const beams = answers.beams || [];
    // ... calculate internal beam volume ...
  }
}
```

**STANDARD_SLAB_SCOPE.calculateVolume** (around line 170):

Apply the same pattern - wrap edge beam and internal beam calculations in toggle checks.

---

## Testing Verification

After implementation:
1. Create a new Raft Slab estimate with area and thickness only
2. Verify calculated volume = area x thickness (no phantom beam volume)
3. Enable "Include edge beams?" toggle and add beams
4. Verify volume now includes edge beam volume
5. Enable "Include internal beams?" toggle and add beams
6. Verify volume includes internal beam volume
7. Repeat for Standard Slab scope
