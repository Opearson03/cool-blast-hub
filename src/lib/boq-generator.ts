import { BOQItem } from "@/components/jobs/boq/BOQTypes";

// Rebar weights in kg per metre
const REBAR_WEIGHTS: Record<string, number> = {
  'N12': 0.888,
  'N16': 1.58,
  'N20': 2.47,
  'N24': 3.55,
  'N28': 4.83,
  'R10': 0.617,
  'R12': 0.888,
};

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
  trench_length?: number;
  connection_length?: number;
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
    reo_type?: string;
    mesh_type?: string;
    mesh_sheets?: number;
    mesh_price_per_sheet?: number;
    mesh_area?: number;
    mesh_lap_allowance?: number;
    bar_size?: string;
    bar_area?: number;
    bar_spacing?: number;
    bar_layers?: number;
    rebar_price_per_tonne?: number;
    bar_chairs?: boolean;
    chair_type?: string;
    chairs_per_m2?: number;
    chair_price_each?: number;
    tie_wire?: boolean;
    tie_wire_coils?: number;
    tie_wire_price?: number;
    rebar_caps?: boolean;
    rebar_caps_count?: number;
    rebar_cap_price?: number;
  };
  "reinforcement-piers"?: {
    is_reinforced?: boolean;
    vertical_bars_count?: number;
    vertical_bar_size?: string;
    lig_count?: number;
    lig_size?: string;
    rebar_price_per_tonne?: number;
    rebar_type?: string;
    has_starters?: boolean;
    starter_count?: number;
    starter_size?: string;
    starter_length?: number;
    tie_wire?: boolean;
    tie_wire_coils?: number;
    tie_wire_price?: number;
  };
  "reinforcement-footing"?: {
    reo_type?: string;
    mesh_type?: string;
    trench_mesh_type?: string;
    trench_mesh_length?: number;
    trench_mesh_price_per_m?: number;
    trench_mesh_chairs?: boolean;
    tm_chairs_per_metre?: number;
    tm_chair_price?: number;
    long_bars?: boolean;
    long_bar_size?: string;
    long_bars_top?: number;
    long_bars_bottom?: number;
    rebar_price_per_tonne?: number;
    tie_wire?: boolean;
    tie_wire_coils?: number;
    tie_wire_price?: number;
  };
  "base-preparation"?: {
    crusher_dust_required?: boolean;
    crusher_dust_area?: number;
    crusher_dust_depth?: number;
    crusher_dust_price?: number; // per m³
    road_base_required?: boolean;
    road_base_type?: string;
    road_base_depth?: number;
    road_base_area?: number;
    road_base_price?: number; // per m³
    membrane_required?: boolean;
    membrane_type?: string;
    membrane_area?: number;
    membrane_overlap?: number;
    membrane_price?: number; // per roll (200m² standard)
  };
  "formwork"?: {
    formwork_required?: boolean;
    formwork_metres?: number;
    timber_type?: string;
    timber_price?: number;
    stakes_included?: boolean;
    stake_count?: number;
    stake_price?: number;
    sundry_fixings?: number;
  };
  "connections-joints"?: {
    // Dowels
    dowels_required?: boolean;
    dowel_size?: string;
    dowel_count?: number;
    dowel_price_each?: number;
    chemical_anchor?: boolean;
    chemical_cartridges?: number;
    chemical_price?: number;
    // Expansion foam
    foam_required?: boolean;
    foam_type?: string;
    foam_height?: number;
    foam_length?: number;
    foam_price_per_m?: number;
    // Expansion joints
    expansion_joints_required?: boolean;
    joint_depth?: number;
    joint_length?: number;
    joint_quantity?: number;
    joint_price_each?: number;
    capping_required?: boolean;
    capping_type?: string;
    capping_length?: number;
    capping_price_per_m?: number;
  };
  // Legacy support for old estimates
  "dowels"?: {
    dowels_required?: boolean;
    dowel_size?: string;
    dowel_count?: number;
    dowel_price_each?: number;
    chemical_anchor?: boolean;
    chemical_cartridges?: number;
    chemical_price?: number;
  };
  "joints-foam"?: {
    foam_required?: boolean;
    foam_type?: string;
    foam_height?: number;
    foam_length?: number;
    foam_price_per_m?: number;
  };
  "joints-expansion"?: {
    expansion_joints_required?: boolean;
    joint_depth?: number;
    joint_length?: number;
    joint_quantity?: number;
    joint_price_each?: number;
    capping_required?: boolean;
    capping_type?: string;
    capping_length?: number;
    capping_price_per_m?: number;
  };
  "joints-key"?: {
    key_joints_required?: boolean;
    key_depth?: number;
    key_length?: number;
    key_quantity?: number;
    key_price_each?: number;
  };
  "joints-control"?: {
    saw_cutting_required?: boolean;
    saw_cut_metres?: number;
    saw_cut_price_per_m?: number;
    caulking_required?: boolean;
    caulking_metres?: number;
    caulking_price_per_m?: number;
  };
  "surface-finishing"?: {
    finish_required?: boolean;
    finish_type?: string;
    finish_area?: number;
    sealing_required?: boolean;
    sealer_required?: boolean;
    sealer_type?: string;
    sealer_coverage_rate?: number;
    sealer_coats?: number;
    sealer_price_per_litre?: number;
    slip_additive_required?: boolean;
    slip_additive_rate?: number;
    slip_additive_price?: number;
    curing_required?: boolean;
    curing_method?: string;
    curing_coverage_rate?: number;
    curing_coats?: number;
    curing_product_price?: number;
    retarder_required?: boolean;
    retarder_coverage_rate?: number;
    retarder_price_per_litre?: number;
  };
  "sundries"?: {
    sundries_required?: boolean;
    sundries_total?: number;
  };
  "plumbing"?: {
    plumbing_required?: boolean;
    strip_drain_required?: boolean;
    strip_drain_length?: number;
    strip_drain_price?: number;
    plumber_allowance?: boolean;
    plumber_hours?: number;
    plumber_rate?: number;
    plumber_sundries?: boolean;
    sundries_amount?: number;
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
    standard_slab: "Slab on Ground",
    raft_slab: "Raft Slab",
    waffle_pod: "Waffle Pod",
    strip_footings: "Strip Footings",
    piers: "Piers",
    suspended_slab: "Suspended Slab",
    crossovers: "Crossover",
    driveway: "Small Slab",
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
      // Mesh reinforcement
      if ((reoSlabModule.reo_type === "mesh" || !reoSlabModule.reo_type) && reoSlabModule.mesh_type) {
        const meshArea = reoSlabModule.mesh_area || scopeAnswers.area || 0;
        const meshSheetArea = 14.4; // Standard sheet size (6m x 2.4m)
        const lapAllowance = 1.1; // 10% lap allowance
        const meshSheets = reoSlabModule.mesh_sheets || Math.ceil((meshArea * lapAllowance) / meshSheetArea);
        
        if (meshSheets > 0) {
          addItem(
            "reinforcement",
            `${reoSlabModule.mesh_type} Mesh`,
            meshSheets,
            "sheets",
            reoSlabModule.mesh_price_per_sheet
          );
        }
      }
      
      // Bar reinforcement - calculate weight from estimate data
      if (reoSlabModule.reo_type === "bar" && reoSlabModule.bar_size) {
        const barArea = reoSlabModule.bar_area || scopeAnswers.area || 0;
        const spacing = Number(reoSlabModule.bar_spacing) || 200;
        const layers = Number(reoSlabModule.bar_layers) || 1;
        const barSize = reoSlabModule.bar_size || 'N12';
        
        // Calculate total bar length (both directions)
        const barsPerMetre = 1000 / spacing;
        const sideLength = Math.sqrt(barArea);
        const barsPerDirection = Math.ceil(sideLength * barsPerMetre);
        const totalBarLength = barsPerDirection * sideLength * 2 * layers;
        
        const weightPerMetre = REBAR_WEIGHTS[barSize] || 0.888;
        const totalWeight = totalBarLength * weightPerMetre * 1.1; // 10% lap
        
        const pricePerTonne = reoSlabModule.rebar_price_per_tonne || 2100;
        const unitPrice = pricePerTonne / 1000;
        
        if (totalWeight > 0) {
          addItem(
            "reinforcement",
            `${barSize} Rebar @ ${spacing}mm ctrs`,
            Math.round(totalWeight),
            "kg",
            Math.round(unitPrice * 1000) / 1000
          );
        }
      }

      // Bar chairs/spacers
      if (reoSlabModule.bar_chairs) {
        const area = scopeAnswers.area || 0;
        const chairsPerM2 = reoSlabModule.chairs_per_m2 || 4;
        const chairCount = Math.ceil(area * chairsPerM2);
        const chairType = reoSlabModule.chair_type || "Standard";
        if (chairCount > 0) {
          addItem(
            "reinforcement",
            `Bar Chairs (${chairType})`,
            chairCount,
            "pcs",
            reoSlabModule.chair_price_each
          );
        }
      }

      // Tie wire
      if (reoSlabModule.tie_wire && reoSlabModule.tie_wire_coils) {
        addItem(
          "reinforcement",
          "Tie Wire (1.6mm)",
          reoSlabModule.tie_wire_coils,
          "coils",
          reoSlabModule.tie_wire_price
        );
      }

      // Rebar safety caps
      if (reoSlabModule.rebar_caps && reoSlabModule.rebar_caps_count) {
        addItem(
          "reinforcement",
          "Rebar Safety Caps",
          reoSlabModule.rebar_caps_count,
          "pcs",
          reoSlabModule.rebar_cap_price
        );
      }
    }

    // Get pier reinforcement with calculated pricing
    const reoPiersModule = moduleAnswers["reinforcement-piers"];
    if (reoPiersModule && reoPiersModule.is_reinforced) {
      const pierCount = scopeAnswers.num_piers || 0;
      const pierDepth = (scopeAnswers.depth || 600) / 1000; // mm to m
      const pierDiameter = (scopeAnswers.diameter || 450) / 1000; // mm to m
      
      if (pierCount > 0) {
        // Calculate cage weight based on rebar sizes
        const verticalBars = reoPiersModule.vertical_bars_count || 4;
        const verticalSize = reoPiersModule.vertical_bar_size || 'N16';
        const ligCount = reoPiersModule.lig_count || 4;
        const ligSize = reoPiersModule.lig_size || 'R10';
        
        const verticalWeightPerM = REBAR_WEIGHTS[verticalSize] || 1.58;
        const ligWeightPerM = REBAR_WEIGHTS[ligSize] || 0.617;
        const ligCircumference = Math.PI * (pierDiameter - 0.05); // 50mm cover allowance
        
        // Weight per pier cage
        const verticalWeight = verticalBars * pierDepth * verticalWeightPerM;
        const ligWeight = ligCount * ligCircumference * ligWeightPerM;
        const weightPerPier = verticalWeight + ligWeight;
        
        // Calculate price per pier based on rebar cost
        const pricePerTonne = reoPiersModule.rebar_price_per_tonne || 2100;
        const unitPrice = (weightPerPier / 1000) * pricePerTonne;
        
        addItem(
          "reinforcement",
          `Pier Cages (${verticalSize} x ${verticalBars})`,
          pierCount,
          "units",
          Math.round(unitPrice * 100) / 100,
          `~${weightPerPier.toFixed(1)}kg each`
        );

        // Starter bars
        if (reoPiersModule.has_starters) {
          const starterCount = reoPiersModule.starter_count || 4;
          const starterSize = reoPiersModule.starter_size || 'N16';
          const starterLength = (reoPiersModule.starter_length || 600) / 1000; // mm to m
          const starterWeightPerM = REBAR_WEIGHTS[starterSize] || 1.58;
          
          const totalStarters = pierCount * starterCount;
          const totalStarterWeight = totalStarters * starterLength * starterWeightPerM * 1.1; // 10% lap
          const starterPrice = (totalStarterWeight / 1000) * pricePerTonne;
          
          addItem(
            "reinforcement",
            `Starter Bars ${starterSize} (${starterCount} per pier)`,
            totalStarters,
            "pcs",
            Math.round((starterPrice / totalStarters) * 100) / 100,
            `~${totalStarterWeight.toFixed(1)}kg total`
          );
        }

        // Tie wire for piers
        if (reoPiersModule.tie_wire && reoPiersModule.tie_wire_coils) {
          addItem(
            "reinforcement",
            "Tie Wire (1.6mm)",
            reoPiersModule.tie_wire_coils,
            "coils",
            reoPiersModule.tie_wire_price
          );
        }
      }
    }

    // Get footing reinforcement (trench mesh)
    const reoFootingModule = moduleAnswers["reinforcement-footing"];
    if (reoFootingModule) {
      const trenchLength = reoFootingModule.trench_mesh_length || scopeAnswers.trench_length || scopeAnswers.connection_length || 0;
      
      // Trench mesh with type
      if ((reoFootingModule.reo_type === "trench_mesh" || reoFootingModule.reo_type === "both") && trenchLength > 0) {
        const meshType = reoFootingModule.trench_mesh_type || "L11TM4";
        addItem(
          "reinforcement",
          `Trench Mesh (${meshType})`,
          trenchLength,
          "m",
          reoFootingModule.trench_mesh_price_per_m
        );
      }

      // Trench mesh chairs
      if (reoFootingModule.trench_mesh_chairs && trenchLength > 0) {
        const chairsPerM = reoFootingModule.tm_chairs_per_metre || 2;
        const chairCount = Math.ceil(trenchLength * chairsPerM);
        if (chairCount > 0) {
          addItem(
            "reinforcement",
            "Trench Mesh Chairs",
            chairCount,
            "pcs",
            reoFootingModule.tm_chair_price
          );
        }
      }

      // Longitudinal bars for footings
      if (reoFootingModule.long_bars || reoFootingModule.reo_type === "bar") {
        const longBarSize = reoFootingModule.long_bar_size || "N12";
        const topBars = reoFootingModule.long_bars_top || 2;
        const bottomBars = reoFootingModule.long_bars_bottom || 2;
        const totalBarCount = topBars + bottomBars;
        const barWeight = REBAR_WEIGHTS[longBarSize] || 0.888;
        const totalWeight = totalBarCount * trenchLength * barWeight * 1.1; // 10% lap
        
        if (totalWeight > 0) {
          const pricePerTonne = reoFootingModule.rebar_price_per_tonne || 2100;
          const unitPrice = pricePerTonne / 1000;
          addItem(
            "reinforcement",
            `${longBarSize} Longitudinal Bars (${topBars}T/${bottomBars}B)`,
            Math.round(totalWeight * 10) / 10,
            "kg",
            unitPrice
          );
        }
      }

      // Tie wire for footings
      if (reoFootingModule.tie_wire && reoFootingModule.tie_wire_coils) {
        addItem(
          "reinforcement",
          "Tie Wire (1.6mm)",
          reoFootingModule.tie_wire_coils,
          "coils",
          reoFootingModule.tie_wire_price
        );
      }
    }

    // Get base preparation data
    const basePrepModule = moduleAnswers["base-preparation"];
    if (basePrepModule && basePrepModule.crusher_dust_required) {
      const area = basePrepModule.crusher_dust_area || scopeAnswers.area || 0;
      const depthMM = Number(basePrepModule.crusher_dust_depth) || 75;
      const depthM = depthMM / 1000;
      const volume = area * depthM;
      const tonnes = volume * 1.6; // Crusher dust bulk density ~1.6t/m³
      
      // Price is stored per m³, convert to per tonne for BOQ display
      const pricePerM3 = basePrepModule.crusher_dust_price || 60;
      const pricePerTonne = pricePerM3 / 1.6;
      
      if (tonnes > 0) {
        addItem(
          "other",
          `Crusher Dust (${depthMM}mm)`,
          Math.round(tonnes * 10) / 10,
          "tonnes",
          Math.round(pricePerTonne * 100) / 100
        );
      }
    }

    // Road Base
    if (basePrepModule && basePrepModule.road_base_required) {
      const area = basePrepModule.road_base_area || scopeAnswers.area || 0;
      const depthMM = Number(basePrepModule.road_base_depth) || 100;
      const depthM = depthMM / 1000;
      const volume = area * depthM;
      const tonnes = volume * 1.8; // Road base bulk density ~1.8t/m³
      
      const roadBaseType = basePrepModule.road_base_type || 'ROADBASE 20MM';
      const typeLabels: Record<string, string> = {
        'ROADBASE 20MM': '20mm (Class 2)',
        'ROADBASE 40MM': '40mm (Class 3)',
      };
      const displayType = typeLabels[roadBaseType] || roadBaseType;
      
      // Price is stored per m³, convert to per tonne for BOQ display
      const pricePerM3 = basePrepModule.road_base_price || 55;
      const pricePerTonne = pricePerM3 / 1.8;
      
      if (tonnes > 0) {
        addItem(
          "other",
          `Road Base ${displayType} (${depthMM}mm)`,
          Math.round(tonnes * 10) / 10,
          "tonnes",
          Math.round(pricePerTonne * 100) / 100
        );
      }
    }

    // Membrane with type - price is per roll (200m²), calculate rolls needed
    if (basePrepModule && basePrepModule.membrane_required !== false) {
      const membraneArea = basePrepModule.membrane_area || scopeAnswers.area || 0;
      const overlapPercent = 1 + (Number(basePrepModule.membrane_overlap) || 15) / 100;
      const totalArea = membraneArea * overlapPercent;
      const membraneType = basePrepModule.membrane_type || "Black 200um";
      
      // Price is per roll (200m² standard), calculate rolls required
      const rollArea = 200;
      const rollsRequired = Math.ceil(totalArea / rollArea);
      const pricePerRoll = basePrepModule.membrane_price || 180;
      
      if (rollsRequired > 0) {
        const typeLabels: Record<string, string> = {
          'PLASTIC 4X50 MED': 'Black 200um Medium',
          'PLASTIC 4X50 HI': 'Black 200um High Impact',
          'PLASTIC 4X25 ORG': 'Orange 300um',
        };
        const displayType = typeLabels[membraneType] || membraneType;
        
        addItem(
          "other",
          `Poly Membrane (${displayType})`,
          rollsRequired,
          "rolls",
          pricePerRoll,
          `Covers ${Math.round(totalArea)}m² incl. overlap`
        );
      }
    }

    // Get formwork data with detailed breakdown
    const formworkModule = moduleAnswers["formwork"];
    if (formworkModule && formworkModule.formwork_required) {
      const formworkMetres = formworkModule.formwork_metres || scopeAnswers.perimeter || 0;
      if (formworkMetres > 0) {
        const timberType = formworkModule.timber_type || "90x45";
        // Default timber price per metre if not stored
        const timberPrice = formworkModule.timber_price || 8;
        addItem(
          "formwork",
          `Formwork Timber (${timberType})`,
          formworkMetres,
          "lm",
          timberPrice
        );

        // Stakes - calculate from formwork metres if not explicitly stored
        if (formworkModule.stakes_included) {
          const stakeSpacing = 0.6; // FORMWORK_CONSTANTS.stakeSpacing
          const stakeCount = Math.ceil(formworkMetres / stakeSpacing) + 1;
          
          if (stakeCount > 0) {
            // Default stake price if not stored
            const stakePrice = formworkModule.stake_price || 3;
            addItem(
              "formwork",
              "Timber Stakes",
              stakeCount,
              "pcs",
              stakePrice
            );
          }
        }

        // Sundry fixings
        if (formworkModule.sundry_fixings && formworkModule.sundry_fixings > 0) {
          addItem(
            "formwork",
            "Formwork Fixings & Sundries",
            1,
            "lot",
            formworkModule.sundry_fixings
          );
        }
      }
    }

    // Connections & Joints (combined module) - also handles legacy keys
    const connectionsModule = moduleAnswers["connections-joints"];
    const legacyDowelsModule = moduleAnswers["dowels"];
    const legacyFoamModule = moduleAnswers["joints-foam"];
    const legacyExpansionModule = moduleAnswers["joints-expansion"];
    
    // Use combined module if available, fall back to legacy
    const dowelsData = connectionsModule || legacyDowelsModule;
    const foamData = connectionsModule || legacyFoamModule;
    const expansionData = connectionsModule || legacyExpansionModule;

    // Dowels
    if (dowelsData && dowelsData.dowels_required) {
      const dowelCount = dowelsData.dowel_count || 0;
      const dowelSize = dowelsData.dowel_size || "N12";
      const dowelPrice = dowelsData.dowel_price_each || 5;
      if (dowelCount > 0) {
        addItem(
          "reinforcement",
          `Dowel Bars (${dowelSize})`,
          dowelCount,
          "pcs",
          dowelPrice
        );
      }

      // Chemical anchors
      if (dowelsData.chemical_anchor && dowelsData.chemical_cartridges) {
        const chemicalPrice = dowelsData.chemical_price || 35;
        addItem(
          "other",
          "Chemical Anchor Cartridges",
          dowelsData.chemical_cartridges,
          "pcs",
          chemicalPrice
        );
      }
    }

    // Expansion foam
    if (foamData && foamData.foam_required) {
      const foamLength = foamData.foam_length || 0;
      const foamHeight = foamData.foam_height || 100;
      const foamType = foamData.foam_type || "Standard";
      if (foamLength > 0) {
        addItem(
          "other",
          `Expansion Foam ${foamHeight}mm (${foamType})`,
          foamLength,
          "m",
          foamData.foam_price_per_m
        );
      }
    }

    // Expansion joints
    if (expansionData && expansionData.expansion_joints_required) {
      const jointQty = expansionData.joint_quantity || 0;
      const jointDepth = expansionData.joint_depth || 100;
      const jointLength = expansionData.joint_length || 3000;
      if (jointQty > 0) {
        addItem(
          "other",
          `Expansion Joints ${jointDepth}mm × ${jointLength / 1000}m`,
          jointQty,
          "pcs",
          expansionData.joint_price_each
        );
      }

      // Joint capping
      if (expansionData.capping_required && expansionData.capping_length) {
        const cappingType = expansionData.capping_type || "Standard";
        addItem(
          "other",
          `Joint Capping (${cappingType})`,
          expansionData.capping_length,
          "m",
          expansionData.capping_price_per_m
        );
      }
    }

    // Key joints
    const keyModule = moduleAnswers["joints-key"];
    if (keyModule && keyModule.key_joints_required) {
      const keyQty = keyModule.key_quantity || 0;
      const keyDepth = keyModule.key_depth || 100;
      const keyLength = (keyModule.key_length || 3000) / 1000;
      if (keyQty > 0) {
        addItem(
          "other",
          `Key Joints ${keyDepth}mm × ${keyLength}m`,
          keyQty,
          "pcs",
          keyModule.key_price_each
        );
      }
    }

    // Control joints (saw cutting & caulking)
    const controlModule = moduleAnswers["joints-control"];
    if (controlModule) {
      // Saw cutting
      if (controlModule.saw_cutting_required && controlModule.saw_cut_metres) {
        addItem(
          "finishing",
          "Saw Cut Control Joints",
          controlModule.saw_cut_metres,
          "m",
          controlModule.saw_cut_price_per_m
        );
      }

      // Caulking
      if (controlModule.caulking_required && controlModule.caulking_metres) {
        addItem(
          "finishing",
          "Joint Caulking/Sealant",
          controlModule.caulking_metres,
          "m",
          controlModule.caulking_price_per_m
        );
      }
    }

    // Plumbing / Strip Drain
    const plumbingModule = moduleAnswers["plumbing"];
    if (plumbingModule && plumbingModule.plumbing_required) {
      // Strip drain
      if (plumbingModule.strip_drain_required && plumbingModule.strip_drain_length && plumbingModule.strip_drain_length > 0) {
        addItem(
          "other",
          "Strip Drain",
          plumbingModule.strip_drain_length,
          "m",
          plumbingModule.strip_drain_price || 85
        );
      }
      
      // Plumber labour (add as line item for BOQ)
      if (plumbingModule.plumber_allowance && plumbingModule.plumber_hours && plumbingModule.plumber_hours > 0) {
        addItem(
          "other",
          "Plumber Labour Allowance",
          plumbingModule.plumber_hours,
          "hrs",
          plumbingModule.plumber_rate || 95
        );
      }
      
      // Plumber sundries
      if (plumbingModule.plumber_sundries && plumbingModule.sundries_amount && plumbingModule.sundries_amount > 0) {
        addItem(
          "other",
          "Plumber Sundries",
          1,
          "allowance",
          plumbingModule.sundries_amount
        );
      }
    }

    // Get surface finishing data with detailed products
    const finishingModule = moduleAnswers["surface-finishing"];
    if (finishingModule && finishingModule.finish_required) {
      const finishArea = finishingModule.finish_area || scopeAnswers.area || 0;
      
      // Sealer - calculate litres from area and coverage rate
      if ((finishingModule.sealing_required || finishingModule.sealer_required) && finishingModule.sealer_type) {
        const coverageRate = finishingModule.sealer_coverage_rate || 8; // m²/L default
        const coats = finishingModule.sealer_coats || 2;
        const sealerLitres = Math.ceil((finishArea * coats) / coverageRate);
        
        const sealerLabel = finishingModule.sealer_type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
        // Default sealer price if not stored
        const sealerPrice = finishingModule.sealer_price_per_litre || 35;
        
        if (sealerLitres > 0) {
          addItem(
            "finishing",
            `${sealerLabel} Sealer`,
            sealerLitres,
            "L",
            sealerPrice
          );
        }
      }

      // Slip additive - calculate kg from area and rate
      if (finishingModule.slip_additive_required) {
        const additiveRate = finishingModule.slip_additive_rate || 0.05; // kg/m²
        const slipKg = Math.ceil(finishArea * additiveRate * 10) / 10;
        // Default slip additive price if not stored
        const slipPrice = finishingModule.slip_additive_price || 45;
        
        if (slipKg > 0) {
          addItem(
            "finishing",
            "Slip-Resistant Additive",
            slipKg,
            "kg",
            slipPrice
          );
        }
      }
      
      // Curing compound - calculate litres from area and coverage rate
      if (finishingModule.curing_required) {
        const curingMethod = finishingModule.curing_method || "spray";
        
        if (curingMethod !== "water" && curingMethod !== "plastic") {
          const coverageRate = finishingModule.curing_coverage_rate || 6; // m²/L default
          const coats = finishingModule.curing_coats || 1;
          const curingLitres = Math.ceil((finishArea * coats) / coverageRate);
          // Default curing price if not stored
          const curingPrice = finishingModule.curing_product_price || 25;
          
          if (curingLitres > 0) {
            addItem(
              "finishing",
              "Curing Compound",
              curingLitres,
              "L",
              curingPrice
            );
          }
        }
      }

      // Retarder for exposed aggregate - calculate litres from area and coverage rate
      if (finishingModule.retarder_required) {
        const coverageRate = finishingModule.retarder_coverage_rate || 5; // m²/L default
        const retarderLitres = Math.ceil(finishArea / coverageRate);
        // Default retarder price if not stored
        const retarderPrice = finishingModule.retarder_price_per_litre || 45;
        
        if (retarderLitres > 0) {
          addItem(
            "finishing",
            "Surface Retarder",
            retarderLitres,
            "L",
            retarderPrice
          );
        }
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
