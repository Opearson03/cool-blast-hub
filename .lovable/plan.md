

# Move Dowels & Expansion Foam into Per-Joint Configuration

## Problem

Currently, dowels and expansion foam are configured as **global module-level settings**, meaning if you enable them, they apply broadly across the entire estimate. However, in real projects with multiple slab thicknesses (e.g., 100mm and 200mm slabs meeting existing structures):

- One joint location might need **dowels only** (tying into an existing slab)
- Another might need **expansion foam only** (against a wall)
- A third might need **both** (complex abutment)

## Solution

Move dowels and expansion foam configuration into each `ExpansionJointConfig` entry, making them per-joint options within the multi-row expansion joint component.

---

## Technical Changes

### 1. Update ExpansionJointConfig Interface

**File:** `src/lib/estimate-components/types.ts`

Add new fields to the existing interface:

```text
Current:
  - id, name, depth, length, quantity, price_each
  - capping_required, capping_type, capping_price_per_m

New fields to add:
  - dowels_required: boolean
  - dowel_size: string
  - dowel_count: number
  - dowel_calculation_method: 'manual' | 'spacing'
  - connection_length: number (when using spacing method)
  - dowel_spacing: string
  - dowel_price_each: number
  - chemical_anchor: boolean
  - chemical_cartridges: number
  - chemical_price: number
  - foam_required: boolean
  - foam_type: string
  - foam_height: string
  - foam_rolls: number
  - foam_roll_price: number
```

### 2. Update MultiExpansionJointInput Component

**File:** `src/components/estimates/calculators/MultiExpansionJointInput.tsx`

Add two new collapsible sub-sections within each joint card (similar to the existing "Capping" section):

**Dowels Sub-Section:**
- Toggle: "Requires Dowels?"
- When enabled, show:
  - Dowel size dropdown (R12-R24 galvanised options)
  - Quantity method (manual count or spacing calculation)
  - Quantity/spacing inputs
  - Price per dowel
  - Chemical anchor toggle with cartridge count

**Expansion Foam Sub-Section:**
- Toggle: "Requires Expansion Foam?"
- When enabled, show:
  - Foam type dropdown (Sticky Back / Standard)
  - Foam height dropdown (50-300mm)
  - Number of rolls
  - Price per roll

### 3. Update Module Questions

**File:** `src/lib/estimate-components/modules/connections-joints.ts`

**Remove global questions:**
- `dowels_required` and all its sub-questions (lines 11-126)
- `foam_required` and all its sub-questions (lines 128-205)

**Keep only:**
- `expansion_joints_required` (the master toggle)

This simplifies the module to just the expansion joints toggle, with all materials configured per-joint.

### 4. Update Calculate Function

**File:** `src/lib/estimate-components/modules/connections-joints.ts`

Restructure the calculation to iterate through joints and calculate dowels/foam per joint:

```typescript
// For each expansion joint entry:
expansionJoints.forEach((joint, index) => {
  // 1. Calculate joint cost (existing)
  // 2. Calculate capping cost if required (existing)
  
  // 3. NEW: Calculate dowels if required for this joint
  if (joint.dowels_required) {
    // Calculate dowel count based on method
    // Add line item for dowels
    // Add chemical anchor line item if enabled
  }
  
  // 4. NEW: Calculate foam if required for this joint
  if (joint.foam_required) {
    // Calculate foam cost
    // Add line item for foam
  }
});
```

### 5. Update Exclusions Logic

**File:** `src/lib/estimate-components/modules/connections-joints.ts`

Update `getExclusions` to check if ANY joint has dowels/foam:

```typescript
// Only exclude dowels if NO joints have dowels configured
const anyDowels = joints.some(j => j.dowels_required);
if (!anyDowels) {
  exclusions.push({ text: 'Dowel bars not included...' });
}

// Only exclude foam if NO joints have foam configured
const anyFoam = joints.some(j => j.foam_required);
if (!anyFoam) {
  exclusions.push({ text: 'Expansion foam not included...' });
}
```

### 6. Update Summary Calculation

**File:** `src/components/estimates/calculators/MultiExpansionJointInput.tsx`

Update the `calculateJointCost` function to include dowels and foam costs in the per-joint subtotal and summary display.

---

## UI Layout (Per Joint Card)

```text
┌─────────────────────────────────────────────────────┐
│ ▼ 100mm Joints          5 × 100mm × 3m      $175.00 │
├─────────────────────────────────────────────────────┤
│ Label (optional): [                              ]  │
│                                                     │
│ ┌─ Depth & Length ────────────────────────────────┐ │
│ │ Joint Depth: [100mm ▼]    Joint Length: [3m ▼] │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─ Quantity & Price ──────────────────────────────┐ │
│ │ Quantity: [5]             Price Each: [$35.00] │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ── Joint Capping Mould ─────────────── [Yes ●○ No] │
│     Type: [Black ▼]    Price/m: [$4.50]            │
│                                                     │
│ ── Dowels Required ────────────────── [Yes ●○ No]  │  ← NEW
│     Size: [R12 × 300mm Galv ▼]                     │
│     Method: [Manual ▼]    Qty: [10]                │
│     Price Each: [$3.50]                            │
│     [  ] Include chemical anchoring                │
│                                                     │
│ ── Expansion Foam Required ─────────── [Yes ●○ No] │  ← NEW
│     Type: [Sticky Back ▼]    Height: [100mm ▼]     │
│     Rolls: [1]    Price/Roll: [$30.50]             │
│                                                     │
│ [Remove]                                            │
└─────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/estimate-components/types.ts` | Add dowel/foam fields to ExpansionJointConfig |
| `src/components/estimates/calculators/MultiExpansionJointInput.tsx` | Add Dowels and Foam sub-sections per joint |
| `src/lib/estimate-components/modules/connections-joints.ts` | Remove global dowel/foam questions, update calculate & exclusions |

---

## Benefits

1. **Flexibility**: Each joint location can have exactly what it needs
2. **Accuracy**: Dowel sizes and foam heights can match each slab's thickness
3. **Cleaner Module**: No more separate sections - everything is self-contained per joint
4. **Better UX**: Users configure all related items for a connection point in one place

