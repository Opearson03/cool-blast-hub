

# Feature: Measure Expansion Joints on Plans

## Overview

Add the ability to measure expansion joint locations and lengths directly on the takeoff screen, similar to how strip footings are marked. This allows users to draw joint lines on plans rather than manually estimating quantities.

## User Flow

1. User adds a new expansion joint in the **Connections & Joints** module
2. Joint is created with **total_length_m = 0** by default
3. Two input options are presented:
   - **Manual Entry**: User types total length in meters directly
   - **"Mark on Plans" Button**: Navigates to the takeoff screen to draw joint lines

4. When "Mark on Plans" is clicked:
   - The current estimate state is saved
   - User is navigated to the takeoff step
   - The polyline drawing tool is activated
   - User draws one or more lines representing joint cuts (continuous polyline, same as strip footings)

5. When user completes marking (presses Enter, Done, or double-clicks):
   - A dimensions dialog appears showing total length measured
   - User configures joint depth and other options
   - On confirm, user is automatically returned to the Configure step
   - The joint's `total_length_m` is populated with the measured length
   - Joint piece quantity is auto-calculated: `quantity = ceil(total_length_m / (joint_length / 1000))`

---

## Technical Changes

### 1. Update ExpansionJointConfig Interface

**File:** `src/lib/estimate-components/types.ts`

Add new fields to track measured length:

```text
Current fields kept:
  - id, name, depth, length, quantity, price_each
  - capping_required, capping_type, capping_price_per_m
  - dowels_required, dowel_size, dowel_count, ...
  - foam_required, foam_type, foam_rolls, ...

New fields to add:
  - total_length_m?: number;        // Total measured length in meters (from takeoff or manual)
  - measured_on_plans?: boolean;    // Flag indicating if length came from takeoff
```

### 2. Update MultiExpansionJointInput Component

**File:** `src/components/estimates/calculators/MultiExpansionJointInput.tsx`

**New Props:**
```typescript
interface MultiExpansionJointInputProps {
  joints: ExpansionJointConfig[];
  onChange: (joints: ExpansionJointConfig[]) => void;
  priceMap?: PriceMap;
  // NEW: Markup prompt support
  onRequestMarkup?: (jointId: string) => void;
  hasPlans?: boolean;
}
```

**UI Changes per joint card:**
- Add a new section for **Total Length** with two input methods:
  1. Manual text input for total_length_m (defaulting to 0)
  2. "Mark on Plans" button (shown only when hasPlans is true)
- Auto-calculate quantity from total_length_m: `Math.ceil(total_length_m / (joint.length / 1000))`
- Display a "Measured" badge if `measured_on_plans === true`
- Keep manual quantity override available if user wants to adjust

**Calculation Logic Change:**
- If `total_length_m > 0`, auto-calculate quantity
- Allow user to override quantity manually
- When joint length changes, recalculate quantity from total_length_m

### 3. Add Expansion Joint Scope to Takeoff

**File:** `src/types/takeoff.ts`

Add `expansion_joints` to LINEAR_SCOPES:
```typescript
export const LINEAR_SCOPES = [
  'strip_footings',
  'retaining_wall_footings',
  'kerbs_channels',
  'retaining_walls',
  'expansion_joints',  // NEW
] as const;
```

### 4. Update ModuleSection to Pass Markup Props

**File:** `src/components/estimates/calculators/ModuleSection.tsx`

Pass the new props to MultiExpansionJointInput:
```typescript
<MultiExpansionJointInput
  joints={(answers.expansion_joints || []) as ExpansionJointConfig[]}
  onChange={(joints) => onAnswerChange('expansion_joints', joints)}
  priceMap={priceMap}
  // NEW: Pass markup support props
  onRequestMarkup={onRequestJointMarkup}
  hasPlans={hasPlans}
/>
```

### 5. Update ModularCalculator for Joint Markup

**File:** `src/components/estimates/calculators/ModularCalculator.tsx`

- Accept new `onRequestMarkup` format for joints: `"connections-joints:joint:{jointId}"`
- Handle returning from takeoff and updating the specific joint's `total_length_m`

### 6. Update PlanTakeoffStep for Joint Marking

**File:** `src/components/estimates/takeoff/PlanTakeoffStep.tsx`

- Handle `expansion_joints` scope type in the polyline marking workflow
- Store joint markups with scope_id = 'expansion_joints'
- After completing a polyline, show a simplified dimensions dialog for joints
- Return the measured length to the callback

### 7. Create JointDimensionsDialog Component

**File:** `src/components/estimates/takeoff/JointDimensionsDialog.tsx` (New)

A simplified dialog for expansion joint measurements:
- Shows total length measured
- Displays number of segments if multiple lines drawn
- Joint depth dropdown (100mm, 125mm, 150mm, 200mm)
- Joint piece length dropdown (3m or 6m)
- Auto-calculated quantity
- "Confirm" and "Add Another" buttons

### 8. Update EstimateFormDialog for Joint Return Flow

**File:** `src/components/estimates/EstimateFormDialog.tsx`

Handle the return flow when user completes joint marking:
- Parse the `pendingTakeoffScope` for joint identifiers
- Look up the specific joint configuration by ID
- Update its `total_length_m` and `measured_on_plans` fields
- Navigate back to the configure step with the module open

---

## UI Layout (Updated Joint Card)

```text
┌─────────────────────────────────────────────────────────────┐
│ ▼ 100mm Joints            5 pieces × 3m        $175.00     │
├─────────────────────────────────────────────────────────────┤
│ Label (optional): [                                      ]  │
│                                                             │
│ ┌─ Total Length ──────────────────────────────────────────┐ │
│ │ [     0     ] m    [📍 Mark on Plans]    (or edit)      │ │
│ │ ✓ Measured on plans: 15.2m ───────────── recalculate   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Joint Depth & Length ──────────────────────────────────┐ │
│ │ Joint Depth: [100mm ▼]      Joint Piece Length: [3m ▼] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Quantity & Price ──────────────────────────────────────┐ │
│ │ Qty: [6] (auto from 15.2m ÷ 3m)   Price Each: [$35.00] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ── Joint Capping Mould ─────────────────── [Yes ●○ No]     │
│ ── Dowels Required ─────────────────────── [Yes ●○ No]     │
│ ── Expansion Foam Required ─────────────── [Yes ●○ No]     │
│                                                             │
│ [Remove]                                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/estimate-components/types.ts` | Add `total_length_m` and `measured_on_plans` to ExpansionJointConfig |
| `src/types/takeoff.ts` | Add `expansion_joints` to LINEAR_SCOPES |
| `src/components/estimates/calculators/MultiExpansionJointInput.tsx` | Add total length input + "Mark on Plans" button, auto-calc quantity |
| `src/components/estimates/calculators/ModuleSection.tsx` | Pass markup props to MultiExpansionJointInput |
| `src/components/estimates/calculators/ModularCalculator.tsx` | Handle joint markup callbacks |
| `src/components/estimates/takeoff/PlanTakeoffStep.tsx` | Add expansion_joints scope handling |
| `src/components/estimates/takeoff/JointDimensionsDialog.tsx` | New file for joint dimension entry after marking |
| `src/components/estimates/EstimateFormDialog.tsx` | Handle return flow from joint marking |
| `src/lib/estimate-components/modules/connections-joints.ts` | Use total_length_m for capping calculation if available |

---

## Quantity Calculation Logic

```typescript
// Auto-calculate quantity from measured length
const calculateQuantityFromLength = (totalLengthM: number, jointPieceLengthMM: number): number => {
  if (!totalLengthM || totalLengthM <= 0) return 0;
  const pieceLengthM = jointPieceLengthMM / 1000; // 3m or 6m
  return Math.ceil(totalLengthM / pieceLengthM);
};

// Example: 15.2m of joints with 3m pieces = ceil(15.2/3) = 6 pieces
```

---

## Benefits

1. **Accuracy**: Measure exact joint locations from plans instead of estimating
2. **Speed**: Draw lines quickly rather than counting and measuring manually
3. **Flexibility**: Can still enter length manually if no plans available
4. **Consistency**: Uses same polyline marking workflow as strip footings
5. **Auto-calculation**: Quantity automatically derived from measured length
6. **Reversibility**: User can override auto-calculated quantity if needed

