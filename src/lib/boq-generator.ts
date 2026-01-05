import { BOQItem } from "@/components/jobs/boq/BOQTypes";

interface ScopeData {
  [key: string]: any;
}

/**
 * Generates Bill of Quantities items from estimate description (fallback)
 */
export function generateBOQFromDescription(description: string | null): BOQItem[] {
  if (!description) return [];

  const items: BOQItem[] = [];
  let itemId = 1;

  const addItem = (
    category: BOQItem['category'],
    description: string,
    quantity: number,
    unit: string
  ) => {
    if (quantity > 0) {
      items.push({
        id: `boq-${itemId++}`,
        category,
        description,
        quantity: Math.round(quantity * 100) / 100,
        unit,
      });
    }
  };

  // Parse "Standard Slab: 100.0m² standard slab"
  const slabMatch = description.match(/Standard Slab:\s*([\d.]+)\s*m²/i);
  if (slabMatch) {
    const area = parseFloat(slabMatch[1]);
    const volume = area * 0.1 * 1.05; // 100mm depth + 5% wastage
    addItem("concrete", "N32 Concrete (Standard Slab)", volume, "m³");
    const meshSheets = Math.ceil((area * 1.1) / 14.4);
    addItem("reinforcement", "SL82 Mesh", meshSheets, "sheets");
    addItem("other", "Poly Membrane", area, "m²");
  }

  // Parse "Piers: 10 piers"
  const piersMatch = description.match(/Piers:\s*(\d+)\s*piers?/i);
  if (piersMatch) {
    const count = parseInt(piersMatch[1]);
    const volumePerPier = Math.PI * 0.225 * 0.225 * 1; // 450mm diameter, 1m depth
    addItem("concrete", "N25 Concrete (Piers)", count * volumePerPier, "m³");
    addItem("reinforcement", "Pier Cages", count, "units");
  }

  // Parse "Driveway: 50.0m² driveway"
  const drivewayMatch = description.match(/Driveway:\s*([\d.]+)\s*m²/i);
  if (drivewayMatch) {
    const area = parseFloat(drivewayMatch[1]);
    if (area > 0) {
      const volume = area * 0.1 * 1.05;
      addItem("concrete", "N32 Concrete (Driveway)", volume, "m³");
      const meshSheets = Math.ceil((area * 1.1) / 14.4);
      addItem("reinforcement", "SL82 Mesh", meshSheets, "sheets");
    }
  }

  // Parse "Concrete: 52.50m³ @ 32MPa"
  const concreteMatch = description.match(/Concrete:\s*([\d.]+)\s*m³\s*@\s*(\d+)\s*MPa/i);
  if (concreteMatch && items.length === 0) {
    const volume = parseFloat(concreteMatch[1]);
    const mpa = concreteMatch[2];
    addItem("concrete", `N${mpa} Concrete`, volume, "m³");
  }

  // Parse "Reo: 39 sheets SL82"
  const reoMatch = description.match(/Reo:\s*(\d+)\s*sheets?\s*(\w+)/i);
  if (reoMatch && !items.find(i => i.category === 'reinforcement')) {
    const sheets = parseInt(reoMatch[1]);
    const meshType = reoMatch[2];
    addItem("reinforcement", `${meshType} Mesh`, sheets, "sheets");
  }

  return items;
}

/**
 * Generates Bill of Quantities items from estimate scope data
 */
export function generateBOQFromEstimate(
  scopeData: ScopeData | null,
  selectedScopes: string[] | null,
  description?: string | null
): BOQItem[] {
  // Check if scopeData is empty or has no valid scopes
  const hasValidScopeData = scopeData && selectedScopes && selectedScopes.length > 0 &&
    Object.keys(scopeData).some(key => scopeData[key] && Object.keys(scopeData[key]).length > 0);

  // If no valid scope data, try to generate from description
  if (!hasValidScopeData) {
    return generateBOQFromDescription(description || null);
  }

  const items: BOQItem[] = [];
  let itemId = 1;

  const addItem = (
    category: BOQItem['category'],
    description: string,
    quantity: number,
    unit: string,
    unitPrice?: number,
    notes?: string
  ) => {
    if (quantity > 0) {
      items.push({
        id: `boq-${itemId++}`,
        category,
        description,
        quantity: Math.round(quantity * 100) / 100,
        unit,
        unitPrice,
        totalPrice: unitPrice ? Math.round(quantity * unitPrice * 100) / 100 : undefined,
        notes,
      });
    }
  };

  // Process Standard Slab
  if (selectedScopes.includes("standard_slab") && scopeData.standard_slab) {
    const slab = scopeData.standard_slab;
    const area = parseFloat(slab.slabArea) || 0;
    const thickness = (parseFloat(slab.slabThickness) || 100) / 1000;
    const wastage = (parseFloat(slab.wastagePercent) || 5) / 100;
    const volume = area * thickness * (1 + wastage);
    const strength = slab.concreteStrength || "32";

    addItem("concrete", `N${strength} Concrete`, volume, "m³", parseFloat(slab.concretePrice) || undefined);

    // Mesh
    if (slab.meshType) {
      const meshArea = 14.4; // Standard sheet size
      const meshSheets = Math.ceil((area * 1.1) / meshArea);
      addItem("reinforcement", `${slab.meshType} Mesh`, meshSheets, "sheets", parseFloat(slab.meshPrice) || undefined);
    }

    // Poly membrane
    if (slab.polyMembrane) {
      const polyArea = area * (parseInt(slab.polyLayers) || 1);
      addItem("other", "Poly Membrane", polyArea, "m²", parseFloat(slab.polyPrice) || undefined);
    }
  }

  // Process Raft Slab
  if (selectedScopes.includes("raft_slab") && scopeData.raft_slab) {
    const raft = scopeData.raft_slab;
    const length = parseFloat(raft.slabLength) || 0;
    const width = parseFloat(raft.slabWidth) || 0;
    const area = length * width;
    const depth = (parseFloat(raft.slabDepth) || 100) / 1000;
    const wastage = (parseFloat(raft.wastagePercent) || 5) / 100;
    const volume = area * depth * (1 + wastage);
    const strength = raft.concreteStrength || "32";

    addItem("concrete", `N${strength} Concrete (Raft Slab)`, volume, "m³", parseFloat(raft.concretePrice) || undefined);

    // Edge beams
    if (raft.edgeBeams && raft.edgeBeamWidth && raft.edgeBeamDepth) {
      const perimeter = 2 * (length + width);
      const edgeBeamVolume = perimeter * (parseFloat(raft.edgeBeamWidth) / 1000) * (parseFloat(raft.edgeBeamDepth) / 1000);
      addItem("concrete", "Edge Beam Concrete", edgeBeamVolume, "m³");
    }

    // Mesh
    if (raft.meshType) {
      const meshArea = 14.4;
      const meshSheets = Math.ceil((area * 1.1) / meshArea);
      addItem("reinforcement", `${raft.meshType} Mesh`, meshSheets, "sheets", parseFloat(raft.meshPrice) || undefined);
    }

    // Rebar if specified
    if (raft.rebarType && raft.rebarSpacing) {
      const rebarCount = Math.ceil((length / (parseFloat(raft.rebarSpacing) / 1000)) + (width / (parseFloat(raft.rebarSpacing) / 1000)));
      addItem("reinforcement", `${raft.rebarType} Rebar`, rebarCount, "bars");
    }
  }

  // Process Waffle Pod
  if (selectedScopes.includes("waffle_pod") && scopeData.waffle_pod) {
    const waffle = scopeData.waffle_pod;
    const length = parseFloat(waffle.slabLength) || 0;
    const width = parseFloat(waffle.slabWidth) || 0;
    const area = length * width;
    const strength = waffle.concreteStrength || "32";

    // Waffle pods
    const podArea = 1.04; // Typical pod area
    const podCount = Math.ceil(area / podArea);
    addItem("formwork", "Waffle Pods", podCount, "units", parseFloat(waffle.podPrice) || undefined);

    // Concrete volume (reduced due to voids)
    const volume = parseFloat(waffle.concreteVolume) || area * 0.15;
    addItem("concrete", `N${strength} Concrete (Waffle)`, volume, "m³", parseFloat(waffle.concretePrice) || undefined);

    // Mesh
    if (waffle.meshType) {
      const meshArea = 14.4;
      const meshSheets = Math.ceil((area * 1.1) / meshArea);
      addItem("reinforcement", `${waffle.meshType} Mesh`, meshSheets, "sheets", parseFloat(waffle.meshPrice) || undefined);
    }
  }

  // Process Strip Footings
  if (selectedScopes.includes("strip_footings") && scopeData.strip_footings) {
    const footings = scopeData.strip_footings;
    const length = parseFloat(footings.totalLength) || 0;
    const width = (parseFloat(footings.footingWidth) || 450) / 1000;
    const depth = (parseFloat(footings.footingDepth) || 300) / 1000;
    const volume = length * width * depth;
    const strength = footings.concreteStrength || "25";

    addItem("concrete", `N${strength} Concrete (Strip Footings)`, volume, "m³", parseFloat(footings.concretePrice) || undefined);

    // Trench mesh
    if (footings.trenchMesh) {
      addItem("reinforcement", "Trench Mesh", length, "m");
    }
  }

  // Process Piers
  if (selectedScopes.includes("piers") && scopeData.piers) {
    const piers = scopeData.piers;
    const count = parseInt(piers.pierCount) || 0;
    const diameter = (parseFloat(piers.pierDiameter) || 450) / 1000;
    const depth = parseFloat(piers.pierDepth) || 1;
    const radius = diameter / 2;
    const volumePerPier = Math.PI * radius * radius * depth;
    const totalVolume = count * volumePerPier;
    const strength = piers.concreteStrength || "25";

    addItem("concrete", `N${strength} Concrete (Piers)`, totalVolume, "m³", parseFloat(piers.concretePrice) || undefined);

    // Pier cages
    if (piers.pierCages) {
      addItem("reinforcement", "Pier Cages", count, "units", parseFloat(piers.cagePrice) || undefined);
    }
  }

  // Process Suspended Slab
  if (selectedScopes.includes("suspended_slab") && scopeData.suspended_slab) {
    const suspended = scopeData.suspended_slab;
    const area = parseFloat(suspended.slabArea) || 0;
    const thickness = (parseFloat(suspended.slabThickness) || 200) / 1000;
    const wastage = (parseFloat(suspended.wastagePercent) || 5) / 100;
    const volume = area * thickness * (1 + wastage);
    const strength = suspended.concreteStrength || "40";

    addItem("concrete", `N${strength} Concrete (Suspended)`, volume, "m³", parseFloat(suspended.concretePrice) || undefined);

    // Formwork
    addItem("formwork", "Formwork/Propping", area, "m²", parseFloat(suspended.formworkPrice) || undefined);

    // Rebar
    if (suspended.topRebarType) {
      addItem("reinforcement", `${suspended.topRebarType} Top Rebar`, area * 15, "kg");
    }
    if (suspended.bottomRebarType) {
      addItem("reinforcement", `${suspended.bottomRebarType} Bottom Rebar`, area * 15, "kg");
    }
  }

  // Process Crossovers
  if (selectedScopes.includes("crossovers") && scopeData.crossovers) {
    const crossovers = scopeData.crossovers;
    const area = parseFloat(crossovers.area) || 0;
    const thickness = (parseFloat(crossovers.thickness) || 150) / 1000;
    const volume = area * thickness;
    const strength = crossovers.concreteStrength || "32";

    addItem("concrete", `N${strength} Concrete (Crossover)`, volume, "m³", parseFloat(crossovers.concretePrice) || undefined);

    if (crossovers.meshType) {
      const meshArea = 14.4;
      const meshSheets = Math.ceil((area * 1.1) / meshArea);
      addItem("reinforcement", `${crossovers.meshType} Mesh`, meshSheets, "sheets");
    }
  }

  // Process Paths & Surrounds
  if (selectedScopes.includes("paths_surrounds") && scopeData.paths_surrounds) {
    const paths = scopeData.paths_surrounds;
    const area = parseFloat(paths.area) || 0;
    const thickness = (parseFloat(paths.thickness) || 100) / 1000;
    const volume = area * thickness;
    const strength = paths.concreteStrength || "25";

    addItem("concrete", `N${strength} Concrete (Paths)`, volume, "m³", parseFloat(paths.concretePrice) || undefined);

    if (paths.meshType) {
      const meshArea = 14.4;
      const meshSheets = Math.ceil((area * 1.1) / meshArea);
      addItem("reinforcement", `${paths.meshType} Mesh`, meshSheets, "sheets");
    }
  }

  // Process Retaining Wall Footings
  if (selectedScopes.includes("retaining_wall") && scopeData.retaining_wall) {
    const wall = scopeData.retaining_wall;
    const length = parseFloat(wall.wallLength) || 0;
    const footingWidth = (parseFloat(wall.footingWidth) || 600) / 1000;
    const footingDepth = (parseFloat(wall.footingDepth) || 300) / 1000;
    const volume = length * footingWidth * footingDepth;
    const strength = wall.concreteStrength || "25";

    addItem("concrete", `N${strength} Concrete (Retaining Wall Footing)`, volume, "m³", parseFloat(wall.concretePrice) || undefined);

    if (wall.rebarType) {
      addItem("reinforcement", `${wall.rebarType} Rebar`, length * 8, "m");
    }
  }

  return items;
}
