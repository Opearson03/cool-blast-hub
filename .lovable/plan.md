
# Plan: Refined Geometric Reinforcement Calculation for Waffle Pods

## Overview

This plan refines the waffle pod reinforcement calculation to be geometry-driven, traceable, and editable. Key improvements based on your feedback:

1. **Derive nx/ny from pod field dimensions** (not from pod count)
2. **Make mesh coverage area selectable** (Pod field only, Full slab, Custom)
3. **Label chair calculations as "allowances"** and make editable
4. **Output both weight AND stock lengths** (6m/12m selectable)

---

## Current State vs Proposed Changes

| Component | Current | Proposed |
|-----------|---------|----------|
| Rib bar calculation | `(pods × 2.3) ÷ 5.5 = 6m lengths` | Geometric: `(nx+1) + (ny+1) ribs × span` |
| nx/ny derivation | Not captured | `nx = floor((L_in - g)/(pL + g))` from pod field bounding box |
| Mesh area | `totalArea ÷ 12.5` | Selectable: Pod field only / Full slab / Custom |
| Chair formulas | Empirical, not labeled | Same heuristics, but labeled "allowance" + editable |
| Output format | Weight (kg) only | Weight + estimated stock lengths (6m/12m) |

---

## Phase 1: Derive nx/ny from Pod Field Geometry

### Formula

Using the pod field bounding rectangle (derived from edge beams or slab dimensions):

```text
L_in = Slab Length - (2 × edge_beam_inset) - (2 × edge_beam_width/2)
W_in = Slab Width - (2 × edge_beam_inset) - (2 × edge_beam_width/2)

nx = floor((L_in - g) / (pL + g))
ny = floor((W_in - g) / (pW + g))
```

Where:
- `pL`, `pW` = pod dimensions (e.g., 1090mm × 1090mm)
- `g` = rib/gap width (e.g., 110mm)
- `edge_beam_inset` = distance edge beam sits inside slab perimeter (default 50mm)

### Data Source

The pod field bounding rectangle can be derived from:
1. **Takeoff polygon bounding box** (if available from markup)
2. **Approximate from area + aspect ratio** (fallback): Use slab area and perimeter to estimate L × W

### Fallback

If only `podCount` is available (legacy data or manual entry), estimate using:
```text
nx ≈ ceil(sqrt(podCount × aspectRatio))
ny = floor(podCount / nx)
```

Display a "rough estimate" badge when using this fallback.

---

## Phase 2: Rib Bar Calculation (Geometric)

### Rib Structure

```text
WAFFLE POD RIB GRID (plan view)
─────────────────────────────────────
│     │     │     │     │     │     │
│ POD │ RIB │ POD │ RIB │ POD │ RIB │
│     │  Y  │     │  Y  │     │  Y  │
─────────────────────────────────────
│ RIB X     │ RIB X     │ RIB X     │
─────────────────────────────────────

X-direction ribs: (ny + 1) ribs running horizontally
Y-direction ribs: (nx + 1) ribs running vertically
```

### Calculation

```text
X_span = (nx × pL) + ((nx + 1) × g)   // Total length of X-direction rib
Y_span = (ny × pW) + ((ny + 1) × g)   // Total length of Y-direction rib

Total rib length = (ny + 1) × X_span + (nx + 1) × Y_span
```

### Per-Rib Bar Configuration

Each rib has:
- Bottom bars: `n_bottom` bars (default: 2)
- Top bars: `n_top` bars (default: 1)

```text
Bottom bar total length = total_rib_length × n_bottom × lap_factor
Top bar total length = total_rib_length × n_top × lap_factor
```

### Output Format (Weight + Stock Lengths)

```text
REINFORCEMENT BREAKDOWN

Rib Bottom Bars (N12):
  X-direction: 9 ribs × 12.0m × 2 bars = 216m
  Y-direction: 13 ribs × 8.0m × 2 bars = 208m
  Total: 424m → 377kg → 71 × 6m lengths

Rib Top Bars (N12):
  Total: 212m → 188kg → 36 × 6m lengths

Stock length: [6m ▼] [12m]
```

---

## Phase 3: Mesh Coverage Area Options

### New Field: `topping_mesh_area_mode`

Options:
1. **"pod_field"** (default): Uses `podFieldArea` from volume calculation
2. **"full_slab"**: Uses total slab area
3. **"custom"**: User enters area manually (for zones with different mesh)

### UI

```text
TOPPING SLAB MESH
─────────────────────────────────────
Mesh Type: [SL82 ▼]
Layers:    [1 ▼]

Coverage:  ○ Pod field only (89.5 m²)
           ○ Full slab area (105.2 m²)
           ○ Custom: [____] m²

Lap allowance: [12.5]%
─────────────────────────────────────
```

### Calculation

```text
meshArea = selectedArea × (1 + lapPercent/100) × layers
meshSheets = ceil(meshArea / 14.4)
```

---

## Phase 4: Chair Calculations (Labeled as Allowances)

### Keep Heuristics, Add Transparency

The current formulas are practical for quoting:
- TM Chairs: `perimeter ÷ 1.2` (heuristic)
- Bar Chairs: `pods × 3` (heuristic)

**Changes:**
1. Label as "Estimated allowance" in UI
2. Make all values editable
3. Add a "derived from" hint showing the formula

### Enhanced Chair Display

```text
ACCESSORIES (Estimated Allowances)
─────────────────────────────────────
TM Chairs: [42]  (from perimeter ÷ 1.2)
Bar Chairs: [288] (from pods × 3)

⚠️ These are allowances for quoting. 
   Adjust based on actual site conditions.
─────────────────────────────────────
```

---

## Phase 5: New Data Model

### New Fields in `WAFFLE_POD_SCOPE.questions`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `pods_x` | number | (derived) | Pod count in X-direction |
| `pods_y` | number | (derived) | Pod count in Y-direction |
| `pod_field_length` | number | (derived) | Inner pod field length (m) |
| `pod_field_width` | number | (derived) | Inner pod field width (m) |
| `rib_bottom_bars` | number | 2 | Bottom bars per rib |
| `rib_bottom_bar_size` | select | 'N12' | Bar size for bottom |
| `rib_top_bars` | number | 1 | Top bars per rib |
| `rib_top_bar_size` | select | 'N12' | Bar size for top |
| `topping_mesh_area_mode` | select | 'pod_field' | Mesh coverage area mode |
| `topping_mesh_custom_area` | number | 0 | Custom area (if mode is custom) |
| `stock_length` | select | '6' | Bar stock length (6m or 12m) |
| `nx_ny_override` | boolean | false | Manual override for nx/ny |

---

## Phase 6: Update WafflePodConfigCard

### New Sections

1. **Grid Dimensions** (derived or manual):
   ```text
   Pod Grid: [12] × [8] = 96 pods
   ⚠️ Estimated from pod field area
   □ Override manually
   ```

2. **Rib Reinforcement**:
   ```text
   Bottom Bars: [2] × [N12 ▼]
   Top Bars:    [1] × [N12 ▼]
   ```

3. **Reinforcement Breakdown** (collapsible):
   - X-rib lengths and bar quantities
   - Y-rib lengths and bar quantities
   - Total weight per bar size
   - Estimated stock lengths

4. **Topping Mesh**:
   - Area mode selector
   - Mesh type and layers
   - Calculated sheets

---

## Phase 7: Update Reinforcement Module

### File: `src/lib/estimate-components/modules/reinforcement-raft.ts`

Replace the waffle pod section (lines 341-428) with geometric calculation:

```text
if (isWafflePod) {
  // Get nx, ny from scope data (derived or manual)
  const nx = Number(scopeData?.pods_x) || 0;
  const ny = Number(scopeData?.pods_y) || 0;
  const podSizeM = (Number(scopeData?.pod_size) || 1090) / 1000;
  const ribWidthM = (Number(scopeData?.rib_width) || 110) / 1000;
  
  // Calculate spans
  const xSpanM = nx * podSizeM + (nx + 1) * ribWidthM;
  const ySpanM = ny * podSizeM + (ny + 1) * ribWidthM;
  
  // Total rib length
  const xRibTotalLength = (ny + 1) * xSpanM;
  const yRibTotalLength = (nx + 1) * ySpanM;
  const totalRibLength = xRibTotalLength + yRibTotalLength;
  
  // Bottom bars
  const bottomBars = Number(scopeData?.rib_bottom_bars) || 2;
  const bottomSize = scopeData?.rib_bottom_bar_size || 'N12';
  const bottomLength = totalRibLength * bottomBars * LAP_ALLOWANCE;
  const bottomWeight = bottomLength * REBAR_WEIGHTS[bottomSize];
  
  // Top bars
  const topBars = Number(scopeData?.rib_top_bars) || 1;
  const topSize = scopeData?.rib_top_bar_size || 'N12';
  const topLength = totalRibLength * topBars * LAP_ALLOWANCE;
  const topWeight = topLength * REBAR_WEIGHTS[topSize];
  
  // Stock lengths
  const stockLen = Number(scopeData?.stock_length) || 6;
  const bottomStockQty = Math.ceil(bottomLength / stockLen);
  const topStockQty = Math.ceil(topLength / stockLen);
  
  // Line items with both weight and stock
  lineItems.push({
    description: `Rib Bottom ${bottomSize} (${bottomStockQty} × ${stockLen}m, ${bottomWeight.toFixed(0)}kg)`,
    ...
  });
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/estimate-components/scopes.ts` | Add new fields to WAFFLE_POD_SCOPE; add nx/ny derivation logic |
| `src/lib/estimate-components/modules/reinforcement-raft.ts` | Replace empirical rib calculation with geometric formula |
| `src/components/estimates/calculators/WafflePodConfigCard.tsx` | Add grid dimensions, rib config, mesh options, reo breakdown UI |
| `src/components/estimates/calculators/ModularCalculator.tsx` | Calculate and pass nx/ny from pod field dimensions |

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| No pod field dimensions available | Estimate from area + aspect ratio (warn user) |
| Only pod count available | Use inverse formula to estimate nx×ny (label as "rough") |
| nx or ny is 0 | Skip rib reinforcement, show warning |
| Non-rectangular slab | Use bounding box; ribs may be overestimated (note to user) |
| User wants to override nx/ny | Provide toggle + manual inputs |

---

## Summary of Accuracy Improvements

1. **Rib bars derived from geometry**, not empirical multipliers
2. **nx/ny calculated from pod field dimensions**, not inferred from count
3. **Mesh area is selectable**, accounting for different coverage scenarios
4. **Chair calculations labeled as allowances**, making their nature clear
5. **Output includes stock lengths**, useful for ordering materials
6. **All values editable**, allowing user override with transparency
