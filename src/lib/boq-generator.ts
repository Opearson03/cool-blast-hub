import { BOQItem } from "@/components/jobs/boq/BOQTypes";

interface ScopeData {
  [key: string]: any;
}

interface ScopeAnswers {
  area?: number;
  perimeter?: number;
  thickness?: number;
  depth?: number;
  diameter?: number;
  num_piers?: number;
  length?: number;
  width?: number;
  [key: string]: any;
}

interface ModuleAnswers {
  "concrete-supply"?: {
    calculated_volume?: number;
    concrete_price?: number;
    concrete_type?: string;
    wastage_percent?: number;
  };
  "reinforcement-slab"?: {
    mesh_type?: string;
    mesh_price_per_sheet?: number;
    mesh_area?: number;
    bar_type?: string;
    bar_kg?: number;
    reo_type?: string;
  };
  "reinforcement-piers"?: {
    is_reinforced?: boolean;
    vertical_bars_count?: number;
    vertical_bar_size?: string;
    lig_count?: number;
    lig_size?: string;
  };
  "reinforcement-footing"?: {
    mesh_type?: string;
    trench_mesh_length?: number;
  };
  "base-preparation"?: {
    crusher_dust_required?: boolean;
    crusher_dust_area?: number;
    crusher_dust_depth?: number;
  };
  "formwork"?: {
    formwork_required?: boolean;
    formwork_metres?: number;
  };
  "surface-finishing"?: {
    finish_type?: string;
    finish_area?: number;
    finish_required?: boolean;
    sealing_required?: boolean;
    sealer_type?: string;
    curing_required?: boolean;
    curing_method?: string;
  };
  [key: string]: any;
}

interface ScopeEntry {
  scopeAnswers?: ScopeAnswers;
  moduleAnswers?: ModuleAnswers;
  calculatedTotal?: number;
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
 * Maps scope key to human-readable label
 */
function getScopeLabel(scopeKey: string): string {
  const labels: Record<string, string> = {
    standard_slab: "Standard Slab",
    raft_slab: "Raft Slab",
    waffle_pod: "Waffle Pod",
    strip_footings: "Strip Footings",
    piers: "Piers",
    suspended_slab: "Suspended Slab",
    crossovers: "Crossover",
    driveway: "Driveway",
    paths_surrounds: "Paths & Surrounds",
    retaining_wall: "Retaining Wall",
  };
  return labels[scopeKey] || scopeKey.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Generates Bill of Quantities items from estimate scope data
 * Handles the actual scope_data structure with scopeAnswers and moduleAnswers
 */
export function generateBOQFromEstimate(
  scopeData: ScopeData | null,
  selectedScopes: string[] | null,
  description?: string | null
): BOQItem[] {
  // Check if scopeData is empty or has no valid scopes
  const hasValidScopeData = scopeData && selectedScopes && selectedScopes.length > 0 &&
    Object.keys(scopeData).some(key => {
      const entry = scopeData[key];
      return entry && (entry.scopeAnswers || entry.moduleAnswers);
    });

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

  // Process each selected scope
  for (const scopeKey of selectedScopes || []) {
    const scopeEntry = scopeData[scopeKey] as ScopeEntry | undefined;
    if (!scopeEntry) continue;

    const scopeAnswers = scopeEntry.scopeAnswers || {};
    const moduleAnswers = scopeEntry.moduleAnswers || {};
    const label = getScopeLabel(scopeKey);

    // Get concrete data from concrete-supply module
    const concreteModule = moduleAnswers["concrete-supply"];
    if (concreteModule) {
      const volume = concreteModule.calculated_volume || 0;
      const concreteType = concreteModule.concrete_type || "32MPA";
      const mpa = concreteType.replace(/MPA/i, "").trim();
      
      if (volume > 0) {
        addItem(
          "concrete",
          `N${mpa} Concrete (${label})`,
          volume,
          "m³",
          concreteModule.concrete_price
        );
      }
    }

    // Get reinforcement data from reinforcement modules
    const reoSlabModule = moduleAnswers["reinforcement-slab"];
    if (reoSlabModule) {
      if (reoSlabModule.reo_type === "mesh" && reoSlabModule.mesh_type) {
        const meshArea = reoSlabModule.mesh_area || scopeAnswers.area || 0;
        const meshSheetArea = 14.4; // Standard sheet size (6m x 2.4m)
        const lapAllowance = 1.1; // 10% lap allowance
        const meshSheets = Math.ceil((meshArea * lapAllowance) / meshSheetArea);
        
        if (meshSheets > 0) {
          addItem(
            "reinforcement",
            `${reoSlabModule.mesh_type} Mesh`,
            meshSheets,
            "sheets",
            reoSlabModule.mesh_price_per_sheet
          );
        }
      } else if (reoSlabModule.reo_type === "bar" && reoSlabModule.bar_kg) {
        addItem(
          "reinforcement",
          `${reoSlabModule.bar_type || "N12"} Rebar`,
          reoSlabModule.bar_kg,
          "kg"
        );
      }
    }

    // Get pier reinforcement
    const reoPiersModule = moduleAnswers["reinforcement-piers"];
    if (reoPiersModule && reoPiersModule.is_reinforced) {
      const pierCount = scopeAnswers.num_piers || 0;
      if (pierCount > 0) {
        addItem(
          "reinforcement",
          `Pier Cages (${reoPiersModule.vertical_bar_size || "N20"} x ${reoPiersModule.vertical_bars_count || 4})`,
          pierCount,
          "units"
        );
      }
    }

    // Get footing reinforcement (trench mesh)
    const reoFootingModule = moduleAnswers["reinforcement-footing"];
    if (reoFootingModule) {
      if (reoFootingModule.mesh_type === "trench_mesh" && reoFootingModule.trench_mesh_length) {
        addItem(
          "reinforcement",
          "Trench Mesh",
          reoFootingModule.trench_mesh_length,
          "m"
        );
      }
    }

    // Get base preparation data
    const basePrepModule = moduleAnswers["base-preparation"];
    if (basePrepModule && basePrepModule.crusher_dust_required) {
      const area = basePrepModule.crusher_dust_area || scopeAnswers.area || 0;
      const depth = (basePrepModule.crusher_dust_depth || 50) / 1000;
      const volume = area * depth;
      const tonnes = volume * 1.6; // Crusher dust bulk density
      
      if (volume > 0) {
        addItem(
          "other",
          `Crusher Dust (${Math.round(depth * 1000)}mm)`,
          volume,
          "m³",
          undefined,
          `~${tonnes.toFixed(1)} tonnes`
        );
      }

      // Add poly membrane
      if (area > 0) {
        addItem("other", "Poly Membrane", area, "m²");
      }
    }

    // Get formwork data
    const formworkModule = moduleAnswers["formwork"];
    if (formworkModule && formworkModule.formwork_required) {
      const formworkMetres = formworkModule.formwork_metres || scopeAnswers.perimeter || 0;
      if (formworkMetres > 0) {
        addItem("formwork", "Edge Formwork", formworkMetres, "lm");
      }
    }

    // Get surface finishing data
    const finishingModule = moduleAnswers["surface-finishing"];
    if (finishingModule && finishingModule.finish_required) {
      const finishArea = finishingModule.finish_area || scopeAnswers.area || 0;
      
      // Sealer if required
      if (finishingModule.sealing_required && finishingModule.sealer_type) {
        const sealerLabel = finishingModule.sealer_type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
        addItem("finishing", `${sealerLabel} Sealer`, finishArea, "m²");
      }
      
      // Curing compound if required
      if (finishingModule.curing_required && finishingModule.curing_method) {
        addItem("finishing", "Curing Compound", finishArea, "m²");
      }
    }

    // Handle specific scope types for additional items
    if (scopeKey === "piers" && scopeAnswers.num_piers) {
      const pierCount = scopeAnswers.num_piers;
      const diameter = scopeAnswers.diameter || 450;
      const depth = scopeAnswers.depth || 1000;
      
      // If no concrete module data, calculate from scope answers
      if (!concreteModule?.calculated_volume) {
        const radiusM = (diameter / 1000) / 2;
        const depthM = depth / 1000;
        const volumePerPier = Math.PI * radiusM * radiusM * depthM;
        const totalVolume = pierCount * volumePerPier * 1.1; // 10% wastage
        
        addItem(
          "concrete",
          `N25 Concrete (${label})`,
          totalVolume,
          "m³"
        );
      }
    }

    if (scopeKey === "waffle_pod" && scopeAnswers.area) {
      // Add waffle pods quantity
      const area = scopeAnswers.area;
      const podArea = 1.04; // ~1m² per pod
      const podCount = Math.ceil(area / podArea);
      addItem("formwork", "Waffle Pods", podCount, "units");
    }
  }

  // If no items were generated, fall back to description
  if (items.length === 0) {
    return generateBOQFromDescription(description || null);
  }

  return items;
}
