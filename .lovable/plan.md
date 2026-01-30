

# Change Multi-Layer Mesh Chair Labels to "Chairs Top, Chairs Bottom"

## Summary

When mesh has 2 layers, the current labels are:
- "Bar Chairs" (for bottom layer support)
- "Chairs Between Layers" (to separate the two layers)

This will be changed to clearer terminology:
- **"Chairs Bottom"** - holds the bottom mesh layer off the ground
- **"Chairs Top"** - separates the two mesh layers (holds the top layer at correct height)

This is a label-only change - no backend logic or calculations are affected.

---

## Files to Modify

| File | Changes |
|------|---------|
| `AreaReinforcementInput.tsx` | Change "Bar Chairs" to "Chairs Bottom" (when 2 layers) and "Chairs Between Layers" to "Chairs Top" |
| `BeamReinforcementInput.tsx` | Change "Chairs Between Layers" to "Chairs Top" |
| `FootingSectionReinforcementInput.tsx` | Change "Chairs Between Layers" to "Chairs Top" |
| `LinearSectionReinforcementInput.tsx` | Change "Chairs Between Layers" to "Chairs Top" |

---

## Technical Changes

### 1. `AreaReinforcementInput.tsx`

**Line ~534-535** - Make "Bar Chairs" label conditional on mesh layers:
```typescript
<Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
  {meshLayers > 1 ? 'Chairs Bottom' : 'Bar Chairs'}
</Label>
```

**Line ~611-613** - Change "Chairs Between Layers" to "Chairs Top":
```typescript
<Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
  Chairs Top
</Label>
```

**Line ~631** - Update sub-label from "Layer Chairs/m²" to "Chairs/m²":
```typescript
<Label className="text-[10px] text-muted-foreground">Chairs/m²</Label>
```

### 2. `BeamReinforcementInput.tsx`

**Line ~925** - Change label:
```typescript
<Label className="text-xs font-medium">Chairs Top</Label>
```

**Line ~943** - Update sub-label:
```typescript
<Label className="text-[10px] text-muted-foreground">Chairs/m</Label>
```

### 3. `FootingSectionReinforcementInput.tsx`

**Line ~990** - Change label:
```typescript
<Label className="text-xs font-medium">Chairs Top</Label>
```

**Line ~1008** - Update sub-label:
```typescript
<Label className="text-[10px] text-muted-foreground">Chairs/m</Label>
```

### 4. `LinearSectionReinforcementInput.tsx`

**Line ~742-743** - Change label:
```typescript
<Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
  Chairs Top
</Label>
```

**Line ~762** - Update sub-label:
```typescript
<Label className="text-[10px] text-muted-foreground">Chairs/m</Label>
```

---

## Visual Comparison

**Single Layer Mesh:**
```text
┌─────────────────────────────────────┐
│ Bar Chairs                  [Yes/No]│
│ ├── Chair Size: 75-90mm            │
│ ├── Chairs/m²: 4                   │
│ └── $/100: $35.00                  │
└─────────────────────────────────────┘
```

**Double Layer Mesh (AFTER change):**
```text
┌─────────────────────────────────────┐
│ Chairs Bottom               [Yes/No]│  ← Was "Bar Chairs"
│ ├── Chair Size: 75-90mm            │
│ ├── Chairs/m²: 4                   │
│ └── $/100: $35.00                  │
├─────────────────────────────────────┤
│ Chairs Top                  [Yes/No]│  ← Was "Chairs Between Layers"
│ ├── Chairs/m²: 2                   │
│ └── $/100: $35.00                  │
└─────────────────────────────────────┘
```

---

## What Stays Unchanged

- All data field names (`chairs_enabled`, `layer_chairs_enabled`, etc.)
- Calculation logic in reinforcement modules
- BOQ generation (labels in BOQ can remain as technical "Bar Chairs" / "Layer Spacer Chairs")
- Cost breakdown descriptions

