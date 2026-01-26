

## Driveway "Add Area" Prompt and Reinforcement Question Updates

### Overview
Two changes are needed for the Driveway scope:
1. **Add Area Markup Prompt**: Update the "Add Area" button in driveway to show the same markup prompt dialog (offering takeoff or manual entry) that other scopes like Piers and Footings use
2. **Reinforcement Questions**: Replace the "Include Edge Beam Reinforcement" and "Include Internal Beam Reinforcement" questions with a single "Include Edge Thickening Reinforcement" question appropriate for driveways

### Current State

**1. Add Area Issue:**
- In `ModularCalculator.tsx:895`, the `MultiAreaInput` for driveways passes `onRequestMarkup` without the scope identifier
- Other components (Piers, Footings, Linear sections) pass the scope ID: `onRequestMarkup={() => onRequestMarkup?.(scope.id)}`
- The `MultiAreaInput` component already has `MarkupPromptDialog` support (lines 140-165), it just needs the proper callback

**2. Reinforcement Questions Issue:**
- The `reinforcement-raft` module currently has two questions:
  - `edge_beam_reo` with label "Include Edge Beam Reinforcement" (section: "Edge Beams")
  - `internal_beam_reo` with label "Include Internal Beam Reinforcement" (section: "Internal Beams")
- For driveways, we don't have internal beams (already removed), so the internal beam question shouldn't appear
- The edge beam question should be renamed to "Include Edge Thickening Reinforcement" for driveway context
- The section label should also update to "Edge Thickening" for driveways

### Changes Required

#### 1. Update `ModularCalculator.tsx` - Fix Add Area Markup Callback

Update the `onRequestMarkup` prop for `MultiAreaInput` to pass the scope identifier:

```typescript
// Line 895: Change from:
onRequestMarkup={onRequestMarkup}

// To:
onRequestMarkup={() => onRequestMarkup?.(scope.id)}
```

#### 2. Update `reinforcement-raft.ts` - Scope-Aware Question Labels

Add `scopeLabel` support to customize questions based on scope:

**Option A - Use `showIf` to hide internal beam question for driveway:**
- Add `showIf` condition to `internal_beam_reo` question to hide it when scope is driveway

**Option B - Add scope-aware label overrides:**
- Add an optional `scopeLabels` property that allows per-scope label customization

Recommended approach: Use `showIf` condition and add `scopeLabel` function support:

```typescript
// Update edge_beam_reo question (lines 53-59)
{
  id: 'edge_beam_reo',
  type: 'boolean',
  label: 'Include Edge Beam Reinforcement',
  // Add scope-aware label
  getScopeLabel: (scopeId: string) => {
    if (scopeId === 'driveway') return 'Include Edge Thickening Reinforcement';
    return 'Include Edge Beam Reinforcement';
  },
  defaultValue: false,
  sectionLabel: 'Edge Beams',
  getScopeSectionLabel: (scopeId: string) => {
    if (scopeId === 'driveway') return 'Edge Thickening';
    return 'Edge Beams';
  },
},

// Update internal_beam_reo question (lines 65-71)
{
  id: 'internal_beam_reo',
  type: 'boolean',
  label: 'Include Internal Beam Reinforcement',
  defaultValue: false,
  sectionLabel: 'Internal Beams',
  // Hide for driveway scope (no internal beams)
  showIf: (answers, scopeData) => scopeData?.scopeId !== 'driveway',
},
```

#### 3. Update `types.ts` - Add Scope Label Functions to Question Interface

Add optional scope-aware label properties to `ComponentQuestion`:

```typescript
interface ComponentQuestion {
  // ... existing properties
  getScopeLabel?: (scopeId: string) => string;
  getScopeSectionLabel?: (scopeId: string) => string;
}
```

#### 4. Update `ModuleSection.tsx` - Render Scope-Aware Labels

Update the question rendering logic to use scope-aware labels when available:

```typescript
// In QuestionInput and section rendering, check for getScopeLabel
const effectiveLabel = question.getScopeLabel 
  ? question.getScopeLabel(scopeData?.scopeId || '') 
  : question.label;

const effectiveSectionLabel = question.getScopeSectionLabel
  ? question.getScopeSectionLabel(scopeData?.scopeId || '')
  : question.sectionLabel;
```

Also update the "Edge Beams" section label rendering for driveway:
```typescript
const isEdgeBeamsSection = isRaftReoModule && 
  (currentSection === 'Edge Beams' || currentSection === 'Edge Thickening');
```

#### 5. Update `ModularCalculator.tsx` - Pass Scope ID to Module Sections

Ensure `scopeData` includes the scope ID for question filtering:

```typescript
// When building scopeData for modules, include scopeId
const scopeDataWithId = {
  ...scopeData,
  scopeId: scope.id,
};
```

### Files to Modify

1. **`src/components/estimates/calculators/ModularCalculator.tsx`**
   - Update `MultiAreaInput` `onRequestMarkup` callback to pass scope ID
   - Ensure scopeData passed to ModuleSection includes scope ID

2. **`src/lib/estimate-components/types.ts`**
   - Add `getScopeLabel` and `getScopeSectionLabel` optional properties to `ComponentQuestion`

3. **`src/lib/estimate-components/modules/reinforcement-raft.ts`**
   - Add scope-aware labels to `edge_beam_reo` question
   - Add `showIf` condition to `internal_beam_reo` to hide for driveway

4. **`src/components/estimates/calculators/ModuleSection.tsx`**
   - Update label rendering to use scope-aware labels
   - Update section detection to recognize "Edge Thickening" as equivalent to "Edge Beams"

### Technical Details

**Updated Question Configuration:**
```typescript
// reinforcement-raft.ts
{
  id: 'edge_beam_reo',
  type: 'boolean',
  label: 'Include Edge Beam Reinforcement',
  getScopeLabel: (scopeId) => 
    scopeId === 'driveway' ? 'Include Edge Thickening Reinforcement' : 'Include Edge Beam Reinforcement',
  defaultValue: false,
  sectionLabel: 'Edge Beams',
  getScopeSectionLabel: (scopeId) => 
    scopeId === 'driveway' ? 'Edge Thickening' : 'Edge Beams',
},
{
  id: 'internal_beam_reo',
  type: 'boolean',
  label: 'Include Internal Beam Reinforcement',
  defaultValue: false,
  sectionLabel: 'Internal Beams',
  showIf: (_answers, scopeData) => scopeData?.scopeId !== 'driveway',
},
```

**Driveway Reinforcement UI After Changes:**
```text
┌────────────────────────────────────────────────────┐
│ Reinforcement Module                               │
├────────────────────────────────────────────────────┤
│                                                    │
│ ── SLAB SURFACE ────────────────────────────────   │
│ Mesh Lap Allowance: [12.5%]                        │
│ [Per-area reinforcement inputs]                    │
│                                                    │
│ ── EDGE THICKENING ─────────────────────────────   │
│ Include Edge Thickening Reinforcement: [Yes/No]   │
│ [Per-edge-thickening reinforcement inputs]         │
│                                                    │
│ (Internal Beams section HIDDEN for driveway)       │
│                                                    │
│ ── OTHER ACCESSORIES ───────────────────────────   │
│ Include Tie Wire: [Yes/No]                         │
│                                                    │
│ ── DELIVERY ────────────────────────────────────   │
│ Reinforcement Delivery: [$150]                     │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Testing Checklist

- [ ] Clicking "Add Area" in driveway shows markup prompt dialog (takeoff or manual)
- [ ] Selecting "Mark on Plans" navigates to takeoff step
- [ ] Selecting "Enter manually" adds a new area inline
- [ ] Reinforcement module shows "Edge Thickening" section label (not "Edge Beams")
- [ ] Reinforcement question shows "Include Edge Thickening Reinforcement" (not "Include Edge Beam Reinforcement")
- [ ] "Internal Beams" section is completely hidden for driveway scope
- [ ] Raft slab still shows "Edge Beams" and "Internal Beams" labels correctly
- [ ] Edge thickening reinforcement inputs appear when toggle is enabled
- [ ] Calculations work correctly for edge thickening reinforcement

