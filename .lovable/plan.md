
# Add Double Layer Mesh/TM Chairs to Estimate, Schedule & BOQ

## Summary

When users select 2-layer mesh or trench mesh configurations, they need "layer chairs" (spacers that hold the two mesh layers apart at the correct distance). The UI for enabling layer chairs already exists, and the cost calculations in the reinforcement modules are working correctly. However, the **Bill of Quantities (BOQ) generator is not extracting these items**, meaning they don't appear on the material schedule for procurement.

---

## Current State Analysis

| Component | Location | Layer Chairs Support |
|-----------|----------|---------------------|
| **Area Reinforcement UI** | `AreaReinforcementInput.tsx` | Shows toggle when mesh_layers > 1 |
| **Beam Reinforcement UI** | `BeamReinforcementInput.tsx` | Shows toggle when tm_layers > 1 |
| **Linear Section UI** | `LinearSectionReinforcementInput.tsx` | Shows toggle when tm_layers > 1 |
| **Raft Slab Calculator** | `reinforcement-raft.ts` | Calculates and adds to cost breakdown |
| **Footing Calculator** | `reinforcement-footing.ts` | Calculates and adds to cost breakdown |
| **BOQ Generator** | `boq-generator.ts` | Missing layer chair extraction |

---

## Solution

Update the BOQ generator to extract layer chairs from:
1. Slab areas with 2-layer mesh
2. Edge beams with 2-layer trench mesh  
3. Internal beams with 2-layer trench mesh
4. Footings with 2-layer trench mesh

---

## Technical Changes

### File: `src/lib/boq-generator.ts`

#### 1. Add Layer Chair Extraction for Slab Areas (lines ~681-715)

After the existing bar chairs extraction, add logic to iterate through areas and aggregate layer chairs:

```typescript
// After bar chairs extraction block (~line 715)

// ═══════════════════════════════════════════════════════════════
// SLAB LAYER CHAIRS (for 2-layer mesh)
// ═══════════════════════════════════════════════════════════════
if (areas.length > 0) {
  let totalLayerChairs = 0;
  let layerChairPrice = 35;
  
  areas.forEach((area: any) => {
    const reoType = area.reo_type || 'mesh';
    if (reoType !== 'mesh') return;
    
    const meshLayers = area.mesh_layers || 1;
    if (meshLayers <= 1) return;
    if (!area.layer_chairs_enabled) return;
    
    const areaValue = area._actualArea || (Number(area.length) || 0) * (Number(area.width) || 0);
    if (areaValue <= 0) return;
    
    const layerChairsPerM2 = area.layer_chairs_per_m2 ?? 2;
    layerChairPrice = area.layer_chair_price ?? 35;
    totalLayerChairs += Math.ceil(areaValue * layerChairsPerM2);
  });
  
  if (totalLayerChairs > 0) {
    const bags = Math.ceil(totalLayerChairs / 100);
    addItem(
      "reinforcement",
      "Mesh Layer Spacer Chairs",
      bags,
      "bags",
      layerChairPrice,
      `${bags} × 100 pcs (between mesh layers)`
    );
  }
}
```

#### 2. Add Layer Chair Extraction for Edge Beams (lines ~733-798)

Inside the edge beams loop, after processing trench mesh and ligatures:

```typescript
// After edge beams trench mesh extraction

// ═══════════════════════════════════════════════════════════════
// EDGE BEAM LAYER CHAIRS (for 2-layer TM)
// ═══════════════════════════════════════════════════════════════
if (edgeBeams.length > 0) {
  let totalLayerChairs = 0;
  let layerChairPrice = 12.50;
  
  edgeBeams.forEach((beam: any) => {
    const tmLayers = beam.tm_layers || 1;
    if (tmLayers <= 1) return;
    if (!beam.layer_chairs_enabled) return;
    
    const length = Number(beam.length) || 0;
    if (length <= 0) return;
    
    const layerChairsPerM = beam.layer_chairs_per_m ?? 1;
    layerChairPrice = beam.layer_chair_price ?? 12.50;
    totalLayerChairs += Math.ceil(length * layerChairsPerM);
  });
  
  if (totalLayerChairs > 0) {
    const bags = Math.ceil(totalLayerChairs / 25);
    addItem(
      "reinforcement",
      "Edge Beam TM Layer Chairs",
      bags,
      "bags",
      layerChairPrice,
      `${bags} × 25 pcs (between TM layers)`
    );
  }
}
```

#### 3. Add Layer Chair Extraction for Internal Beams (lines ~801-870)

Same pattern as edge beams:

```typescript
// After internal beams trench mesh extraction

// ═══════════════════════════════════════════════════════════════
// INTERNAL BEAM LAYER CHAIRS (for 2-layer TM)
// ═══════════════════════════════════════════════════════════════
if (internalBeams.length > 0) {
  let totalLayerChairs = 0;
  let layerChairPrice = 12.50;
  
  internalBeams.forEach((beam: any) => {
    const tmLayers = beam.tm_layers || 1;
    if (tmLayers <= 1) return;
    if (!beam.layer_chairs_enabled) return;
    
    const length = Number(beam.length) || 0;
    if (length <= 0) return;
    
    const layerChairsPerM = beam.layer_chairs_per_m ?? 1;
    layerChairPrice = beam.layer_chair_price ?? 12.50;
    totalLayerChairs += Math.ceil(length * layerChairsPerM);
  });
  
  if (totalLayerChairs > 0) {
    const bags = Math.ceil(totalLayerChairs / 25);
    addItem(
      "reinforcement",
      "Internal Beam TM Layer Chairs",
      bags,
      "bags",
      layerChairPrice,
      `${bags} × 25 pcs (between TM layers)`
    );
  }
}
```

#### 4. Add Layer Chair Extraction for Strip Footings (in reinforcement-footing section)

For the footing reinforcement module extraction section, add:

```typescript
// After footing trench mesh extraction

// ═══════════════════════════════════════════════════════════════
// FOOTING LAYER CHAIRS (for 2-layer TM)
// ═══════════════════════════════════════════════════════════════
const footings = scopeAnswers.linearSections || scopeAnswers.footings || [];
if (footings.length > 0) {
  let totalLayerChairs = 0;
  let layerChairPrice = 12.50;
  
  footings.forEach((section: any) => {
    const tmLayers = section.tm_layers || 1;
    if (tmLayers <= 1) return;
    if (!section.layer_chairs_enabled) return;
    
    const length = section._actualLength || Number(section.length) || 0;
    if (length <= 0) return;
    
    const layerChairsPerM = section.layer_chairs_per_m ?? 1;
    layerChairPrice = section.layer_chair_price ?? 12.50;
    totalLayerChairs += Math.ceil(length * layerChairsPerM);
  });
  
  if (totalLayerChairs > 0) {
    const bags = Math.ceil(totalLayerChairs / 25);
    addItem(
      "reinforcement",
      "Footing TM Layer Chairs",
      bags,
      "bags",
      layerChairPrice,
      `${bags} × 25 pcs (between TM layers)`
    );
  }
}
```

---

## Implementation Details

| Material Type | Unit | Bag Size | Per-Unit Default |
|--------------|------|----------|------------------|
| Slab mesh layer chairs | bags | 100 pcs | $35/bag |
| TM layer chairs (beams/footings) | bags | 25 pcs | $12.50/bag |

---

## Testing Verification

1. Create a new Raft Slab estimate
2. Add an area with 2-layer mesh and enable "Chairs Between Layers"
3. Add edge beams with 2-layer TM and enable "Chairs Between Layers"
4. Verify cost breakdown shows layer chair line items
5. Accept the quote and navigate to the job
6. Open the Bill of Quantities
7. Verify layer chairs appear in the reinforcement section with correct quantities
8. Print/export BOQ and confirm layer chairs are listed

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/boq-generator.ts` | Add 4 new extraction blocks for layer chairs (slab, edge beams, internal beams, footings) |

