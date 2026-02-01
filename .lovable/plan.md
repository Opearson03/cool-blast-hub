
# Add Multi-Row Control Joints with Takeoff Measurement

## Overview

Refactor the **Control Joints** module to match the multi-row pattern used by the **Connections & Joints** module. This will allow users to add multiple control joint configurations (e.g., different lengths for different slab areas), with each joint having its own caulking toggle. Users will also be able to measure control joints directly on the takeoff screen using the polyline drawing tool.

---

## User Flow

1. User enables "Is saw cutting required?" toggle
2. A multi-row interface appears where they can add multiple control joint configurations
3. For each joint configuration:
   - Enter total length manually OR click "Mark on Plans" to measure
   - Select pricing method (per metre or hourly)
   - Toggle "Requires Caulking?" with per-metre pricing
4. When "Mark on Plans" is clicked:
   - Navigate to takeoff screen
   - Draw polylines to mark saw cut locations
   - On completion, return to configure step with measured length populated

---

## Technical Changes

### 1. Create ControlJointConfig Interface

**File:** `src/lib/estimate-components/types.ts`

Add new interface for control joint configurations:

```typescript
export interface ControlJointConfig {
  id: string;
  name?: string;                    // Optional label (e.g., "Garage Floor Cuts")
  
  // Length - manual or measured from takeoff
  total_length_m: number;           // Total saw cut length in metres
  measured_on_plans?: boolean;      // Flag if measured from takeoff
  
  // Saw cutting pricing
  pricing_method: 'per_metre' | 'hourly';
  price_per_m?: number;             // Price per metre (when per_metre)
  hours?: number;                   // Hours (when hourly)
  hourly_rate?: number;             // Hourly rate (when hourly)
  
  // Caulking - per joint toggle
  caulking_required: boolean;
  caulking_price_per_m?: number;
}
```

### 2. Create MultiControlJointInput Component

**File:** `src/components/estimates/calculators/MultiControlJointInput.tsx` (NEW)

Create a new component following the same pattern as `MultiExpansionJointInput`:

- Summary header showing total length and cost
- Collapsible cards for each joint configuration
- Per-joint fields:
  - Optional label
  - Total length input + "Mark on Plans" button
  - Pricing method dropdown (per metre / hourly)
  - Conditional price fields based on method
  - Caulking required toggle with price per metre
- Add/Remove joint buttons

### 3. Update Control Joints Module

**File:** `src/lib/estimate-components/modules/joints-control.ts`

Refactor to use the multi-row pattern:

**Remove old questions:**
- `saw_cutting_method`, `saw_cut_length`, `saw_cut_price_per_m`, `saw_cut_hours`, `saw_cut_hourly_rate`
- `caulking_required`, `caulking_method`, `caulking_length`, `caulking_price_per_m`, `caulking_hours`, `caulking_hourly_rate`

**Keep:**
- `saw_cutting_required` as master toggle

**Update `calculate` function:**
```typescript
const controlJoints: ControlJointConfig[] = answers.control_joints || [];

controlJoints.forEach((joint, index) => {
  const length = joint.total_length_m || 0;
  
  // Saw cutting cost
  if (joint.pricing_method === 'per_metre') {
    const cost = length * joint.price_per_m;
    // Add line item...
  } else {
    const cost = joint.hours * joint.hourly_rate;
    // Add line item...
  }
  
  // Caulking cost (if enabled for this joint)
  if (joint.caulking_required) {
    const caulkCost = length * joint.caulking_price_per_m;
    // Add line item...
  }
});
```

**Update `getExclusions`:**
- Check if ANY joint has caulking enabled before adding exclusion

### 4. Add Control Joints to LINEAR_SCOPES

**File:** `src/types/takeoff.ts`

Add `control_joints` to LINEAR_SCOPES for polyline marking:

```typescript
export const LINEAR_SCOPES = [
  'strip_footings',
  'retaining_wall_footings', 
  'kerbs_channels',
  'retaining_walls',
  'expansion_joints',
  'control_joints',  // NEW
] as const;
```

### 5. Update ModuleSection for Control Joints

**File:** `src/components/estimates/calculators/ModuleSection.tsx`

Add special case rendering for the control joints module:

```typescript
// Special case: Control Joints module renders multi-control-joint input
if (module.id === 'joints-control' && answers.saw_cutting_required) {
  elements.push(
    <div key="control-joints-section" className="space-y-4">
      <div className="flex items-center gap-2 pt-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Control Joints / Saw Cuts
        </h4>
        <div className="flex-1 h-px bg-border" />
      </div>
      <MultiControlJointInput
        joints={(answers.control_joints || []) as ControlJointConfig[]}
        onChange={(joints) => onAnswerChange('control_joints', joints)}
        priceMap={priceMap}
        onRequestMarkup={onRequestControlJointMarkup}
        hasPlans={hasPlans}
      />
    </div>
  );
}
```

### 6. Update ModularCalculator for Control Joint Markup

**File:** `src/components/estimates/calculators/ModularCalculator.tsx`

Handle markup callbacks for control joints with format: `control_joints:joint:{jointId}`

### 7. Update PlanTakeoffStep for Control Joint Marking

**File:** `src/components/estimates/takeoff/PlanTakeoffStep.tsx`

Handle `control_joints` scope in the linear marking workflow (same pattern as expansion_joints)

### 8. Update useTakeoffMarkups Hook

**File:** `src/hooks/useTakeoffMarkups.ts`

Add `getControlJointTotalLength()` function to aggregate polyline lengths for control joints scope

### 9. Update EstimateFormDialog for Control Joint Return Flow

**File:** `src/components/estimates/EstimateFormDialog.tsx`

Handle return flow when user completes control joint marking:
- Parse the `pendingTakeoffScope` for control joint identifiers
- Update the specific joint's `total_length_m` and `measured_on_plans` fields
- Navigate back to configure step

---

## UI Layout (Per Control Joint Card)

```text
+-------------------------------------------------------------+
| > Garage Floor Cuts         45.2m @ $4.50/m         $203.40 |
+-------------------------------------------------------------+
| Label (optional): [                                       ] |
|                                                             |
| +- Total Length -------------------------------------------+|
| | [   45.2   ] m    [Mark on Plans]      (Measured)        ||
| +----------------------------------------------------------+|
|                                                             |
| +- Pricing Method -----------------------------------------+|
| | Method: [Per Metre v]    Price: $[4.50]/m                ||
| +----------------------------------------------------------+|
|                                                             |
| -- Caulking Required ------------------- [Yes (o) No]      |
|     Caulking Price: $[8.00]/m                              |
|                                                             |
| [Remove]                                                    |
+-------------------------------------------------------------+
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/estimate-components/types.ts` | Add `ControlJointConfig` interface |
| `src/components/estimates/calculators/MultiControlJointInput.tsx` | NEW - Multi-row control joint input component |
| `src/lib/estimate-components/modules/joints-control.ts` | Refactor to multi-row pattern with per-joint caulking |
| `src/types/takeoff.ts` | Add `control_joints` to LINEAR_SCOPES |
| `src/components/estimates/calculators/ModuleSection.tsx` | Add special case for control joints rendering |
| `src/components/estimates/calculators/ModularCalculator.tsx` | Handle control joint markup callbacks |
| `src/components/estimates/takeoff/PlanTakeoffStep.tsx` | Handle control_joints scope |
| `src/hooks/useTakeoffMarkups.ts` | Add getControlJointTotalLength() |
| `src/components/estimates/EstimateFormDialog.tsx` | Handle control joint return flow |

---

## Benefits

1. **Flexibility**: Different areas can have different control joint configurations
2. **Accuracy**: Measure exact saw cut locations from plans
3. **Per-Joint Caulking**: One area may need caulking while another doesn't
4. **Consistency**: Same UI pattern as expansion joints for familiar UX
5. **Speed**: Mark multiple saw cuts in one takeoff session

