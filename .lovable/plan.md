

## Waffle Pod Scope Enhancement Plan

### Overview
The Waffle Pod scope now has the Raft Slab foundation but needs pod-specific features that differentiate waffle pod construction from standard raft slabs. Waffle pods use EPS (expanded polystyrene) foam blocks placed in a grid pattern to create voids, reducing concrete volume and weight while maintaining structural integrity.

### Features to Add

#### 1. Pod Configuration Questions
Add the following fields to capture pod-specific dimensions:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `pod_size` | Select | 1090×1090 | Pod module dimensions (1050, 1090, 1110mm options) |
| `pod_thickness` | Select | 225mm | Pod height (225, 275, 325, 375mm options) |
| `top_slab_thickness` | Number | 85mm | Concrete topping thickness above pods |
| `rib_width` | Number | 110mm | Width of concrete ribs between pods |
| `pod_count` | Number | Auto-calculated | Number of pods (can be overridden) |

#### 2. Automated Pod Count Estimation
When area is entered (either manually or from takeoff), automatically estimate pod count:
```
Pod Count = Area ÷ (Pod Size + Rib Width)²
Example: 100m² ÷ (1.09 + 0.11)² = 100 ÷ 1.44 = ~70 pods
```

#### 3. Volume Calculation Update
Modify `calculateVolume` to subtract pod voids:
```
Concrete Volume = (Area × Total Thickness) - (Pod Count × Pod Size² × Pod Thickness) + Beams
Where: Total Thickness = Pod Thickness + Top Slab Thickness
```

#### 4. Excavation Calculation
Waffle pods use "box cut" excavation (flat excavation to total depth):
```
Excavation Volume = Area × (Pod Thickness + Top Slab Thickness)
```

#### 5. BOQ Integration
Add waffle pods as a formwork material line item:
- Quantity: Pod Count
- Unit: "units" or "pods"
- Category: Formwork

#### 6. Default Exclusion
Keep the existing exclusion (already present):
- "Supply of waffle pods (by others)"

### Files to Modify

1. **`src/lib/estimate-components/scopes.ts`**
   - Add pod-specific questions to WAFFLE_POD_SCOPE
   - Update `calculateVolume` for void subtraction
   - Add `calculateExcavationVolume` for box cut logic

2. **`src/components/estimates/calculators/ModularCalculator.tsx`**
   - Add pod count auto-estimation when area is set
   - Update excavation volume derivation for waffle pod scope

3. **`src/lib/boq-generator.ts`**
   - Ensure pod count is added to BOQ as formwork line item

4. **`supabase/functions/submit-signature/index.ts`**
   - Ensure pod count is included in signed quote BOQ

5. **`src/components/estimates/takeoff/SlabBeamMarkupDialog.tsx`**
   - Add pod configuration fields to waffle pod area dialog
   - Use existing constants: `WAFFLE_POD_MODULE_SIZES`, `WAFFLE_POD_THICKNESSES`

### Technical Details

#### Updated Questions Array
```typescript
questions: [
  // ... existing area, perimeter, beam questions ...
  {
    id: 'pod_size',
    type: 'select',
    label: 'Pod Module Size',
    required: true,
    options: [
      { value: '1050', label: '1050 × 1050 mm' },
      { value: '1090', label: '1090 × 1090 mm' },
      { value: '1110', label: '1110 × 1110 mm' },
    ],
    defaultValue: '1090',
    helpText: 'Standard EPS pod dimensions',
  },
  {
    id: 'pod_thickness',
    type: 'select',
    label: 'Pod Thickness',
    required: true,
    options: [
      { value: '225', label: '225mm' },
      { value: '275', label: '275mm' },
      { value: '325', label: '325mm' },
      { value: '375', label: '375mm' },
    ],
    defaultValue: '225',
    helpText: 'Height of EPS pods',
  },
  {
    id: 'top_slab_thickness',
    type: 'number',
    label: 'Top Slab Thickness (mm)',
    required: true,
    min: 50,
    defaultValue: 85,
    unit: 'mm',
    helpText: 'Concrete topping above pods',
  },
  {
    id: 'rib_width',
    type: 'number',
    label: 'Rib Width (mm)',
    required: false,
    min: 100,
    defaultValue: 110,
    unit: 'mm',
    helpText: 'Width of concrete ribs between pods',
  },
  {
    id: 'pod_count',
    type: 'number',
    label: 'Number of Pods',
    required: true,
    min: 1,
    helpText: 'Auto-calculated from area, can be overridden',
  },
]
```

#### Updated Volume Calculation
```typescript
calculateVolume: (answers) => {
  const area = Number(answers.area) || 0;
  const podSizeM = (Number(answers.pod_size) || 1090) / 1000;
  const podThicknessM = (Number(answers.pod_thickness) || 225) / 1000;
  const topSlabM = (Number(answers.top_slab_thickness) || 85) / 1000;
  const podCount = Number(answers.pod_count) || 0;
  
  // Total slab thickness (pods + topping)
  const totalThicknessM = podThicknessM + topSlabM;
  
  // Gross volume (before void subtraction)
  const grossVolume = area * totalThicknessM;
  
  // Pod void volume
  const podVoidVolume = podCount * (podSizeM * podSizeM * podThicknessM);
  
  // Net slab volume (ribs + topping)
  const slabVolume = grossVolume - podVoidVolume;
  
  // Add beam volumes (edge + internal)
  // ... existing beam logic ...
  
  return safeVolume(slabVolume + edgeBeamVolume + internalBeamVolume);
}
```

### UI Considerations
- Pod fields should appear in a dedicated "Pod Configuration" section
- Pod count should auto-update when area changes (with manual override)
- The "thickness" field should be renamed to clarify it refers to the main slab, or replaced with the pod-specific fields

### Testing Checklist
- [ ] Pod size dropdown shows 3 options (1050, 1090, 1110mm)
- [ ] Pod thickness dropdown shows 4 options (225-375mm)
- [ ] Top slab thickness defaults to 85mm
- [ ] Rib width defaults to 110mm
- [ ] Pod count auto-calculates from area
- [ ] Pod count can be manually overridden
- [ ] Volume calculation subtracts pod voids
- [ ] Excavation uses box cut method (full area × total depth)
- [ ] BOQ includes "Waffle Pods" line item with correct count
- [ ] Exclusion "Supply of waffle pods (by others)" appears by default

