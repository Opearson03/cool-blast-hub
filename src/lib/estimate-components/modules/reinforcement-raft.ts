import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap, BeamConfig, MeasurementArea } from '../types';
import { getPrice, REBAR_WEIGHTS } from '../types';

/**
 * Raft Slab Reinforcement Module (Unified)
 * 
 * Supports per-item reinforcement configuration:
 * - Each slab area can have different mesh/bar settings
 * - Each beam (edge/internal) can have different TM and ligature settings
 */

const getChairTypeFromThickness = (thickness: number): string => {
  if (thickness < 100) return '2540C';
  if (thickness < 125) return '5065C';
  if (thickness < 175) return '7590C';
  if (thickness < 250) return '100120C';
  return '125150C';
};

const CHAIR_LABELS: Record<string, string> = {
  '2540C': '25-40mm',
  '5065C': '50-65mm',
  '7590C': '75-90mm',
  '100120C': '100-120mm',
  '125150C': '125-150mm',
};

export const reinforcementRaftModule: EstimateModule = {
  id: 'reinforcement-raft',
  name: 'Reinforcement',
  description: 'Steel reinforcement for raft slab',
  icon: 'Grid3X3',

  questions: [
    // ═══════════════════════════════════════════════════════════════
    // SECTION 1: SLAB SURFACE (pricing/calculation params only)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'mesh_lap_allowance',
      type: 'number',
      label: 'Mesh Lap Allowance',
      defaultValue: 12.5,
      min: 0,
      max: 30,
      unit: '%',
      sectionLabel: 'Slab Surface',
    },

    // ═══════════════════════════════════════════════════════════════
    // SECTION 2: EDGE BEAMS (toggle only - per-beam config in UI)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'edge_beam_reo',
      type: 'boolean',
      label: 'Include Edge Beam Reinforcement',
      defaultValue: true,
      sectionLabel: 'Edge Beams',
      // Note: Per-beam TM type, ligatures etc are configured inline in the UI
    },

    // ═══════════════════════════════════════════════════════════════
    // SECTION 3: INTERNAL BEAMS (toggle only - per-beam config in UI)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'internal_beam_reo',
      type: 'boolean',
      label: 'Include Internal Beam Reinforcement',
      defaultValue: true,
      sectionLabel: 'Internal Beams',
      // Note: Per-beam TM type, ligatures etc are configured inline in the UI
    },

    // ═══════════════════════════════════════════════════════════════
    // SECTION 4: ACCESSORIES
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'bar_chairs',
      type: 'boolean',
      label: 'Include Bar Chairs',
      defaultValue: true,
      sectionLabel: 'Accessories',
      showIf: (answers) => answers.slab_reo_type === 'mesh' || answers.slab_reo_type === 'bar',
    },
    {
      id: 'chair_type',
      type: 'select',
      label: 'Chair Size',
      options: [
        { value: '2540C', label: '25-40mm' },
        { value: '5065C', label: '50-65mm' },
        { value: '7590C', label: '75-90mm' },
        { value: '100120C', label: '100-120mm' },
        { value: '125150C', label: '125-150mm' },
      ],
      defaultValue: '7590C',
      showIf: (answers) => (answers.slab_reo_type === 'mesh' || answers.slab_reo_type === 'bar') && answers.bar_chairs === true,
      deriveFrom: (scopeData) => {
        const thickness = Number(scopeData?.thickness) || 300;
        return getChairTypeFromThickness(thickness);
      },
    },
    {
      id: 'chairs_per_m2',
      type: 'number',
      label: 'Chairs/m²',
      defaultValue: 4,
      min: 1,
      max: 10,
      showIf: (answers) => (answers.slab_reo_type === 'mesh' || answers.slab_reo_type === 'bar') && answers.bar_chairs === true,
    },
    {
      id: 'chair_price_per_100',
      type: 'currency',
      label: 'Price/100',
      defaultValue: 35,
      showIf: (answers) => (answers.slab_reo_type === 'mesh' || answers.slab_reo_type === 'bar') && answers.bar_chairs === true,
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const chairType = moduleAnswers.chair_type || '7590C';
        return priceMap?.['consumables']?.[chairType];
      },
    },
    {
      id: 'tie_wire',
      type: 'boolean',
      label: 'Include Tie Wire',
      defaultValue: true,
      showIf: (answers) => answers.slab_reo_type === 'mesh' || answers.slab_reo_type === 'bar',
    },
    {
      id: 'tie_wire_coils',
      type: 'number',
      label: 'Coils',
      defaultValue: 2,
      min: 1,
      showIf: (answers) => (answers.slab_reo_type === 'mesh' || answers.slab_reo_type === 'bar') && answers.tie_wire === true,
    },
    {
      id: 'tie_wire_price',
      type: 'currency',
      label: 'Price/Coil',
      defaultValue: 15,
      showIf: (answers) => (answers.slab_reo_type === 'mesh' || answers.slab_reo_type === 'bar') && answers.tie_wire === true,
      deriveFrom: (_scopeData, _moduleAnswers, priceMap) => {
        return priceMap?.['consumables']?.['TIE WIRE'];
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // SECTION 5: DELIVERY
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'reo_delivery',
      type: 'currency',
      label: 'Reinforcement Delivery',
      defaultValue: 150,
      sectionLabel: 'Delivery',
      priceListKey: 'rebar.REO DELIVERY',
      showIf: (answers) => answers.slab_reo_type !== 'none' && answers.slab_reo_type !== 'fiber',
    },
  ],

  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;
    const LAP_ALLOWANCE = 1.125;

    // Hardcoded defaults (per-area overrides take precedence)
    const defaultSlabReoType = 'mesh';
    const defaultMeshType = 'SL82';
    const defaultBarSize = 'N12';
    const defaultBarSpacing = '200';
    const defaultBarLayers = '2';

    // Get areas and beams from scope data
    const areas: MeasurementArea[] = scopeData?.areas || [];
    const edgeBeams: BeamConfig[] = scopeData?.edgeBeams || [];
    const internalBeams: BeamConfig[] = scopeData?.beams || [];
    const totalArea = Number(scopeData?.area) || 0;

    // Check if any area has reinforcement
    const hasAnySlabReo = areas.length > 0 
      ? areas.some(a => (a.reo_type || defaultSlabReoType) !== 'none' && (a.reo_type || defaultSlabReoType) !== 'fiber')
      : true; // Default to mesh if no areas defined

    if (!hasAnySlabReo && !answers.edge_beam_reo && !answers.internal_beam_reo) {
      return {
        moduleId: 'reinforcement-raft',
        moduleName: 'Reinforcement',
        lineItems: [],
        subtotal: 0,
        exclusions: [],
      };
    }

    // ═══════════════════════════════════════════════════════════════
    // SLAB SURFACE REINFORCEMENT (per area)
    // ═══════════════════════════════════════════════════════════════
    const lapPercent = 1 + (Number(answers.mesh_lap_allowance) || 12.5) / 100;
    const sheetArea = 14.4;
    const pricePerTonne = getPrice(priceMap, 'rebar', `${defaultBarSize} CB`, 2100);

    if (areas.length > 0) {
      areas.forEach((area) => {
        const reoType = area.reo_type || defaultSlabReoType;
        const areaValue = area._actualArea || (Number(area.length) || 0) * (Number(area.width) || 0);
        
        if (areaValue <= 0 || reoType === 'none' || reoType === 'fiber') return;

        if (reoType === 'mesh') {
          const meshType = area.mesh_type || defaultMeshType;
          const meshLayers = Number(area.mesh_layers) || 1;
          const pricePerSheet = Number(answers.mesh_price_per_sheet) || getPrice(priceMap, 'mesh', meshType, 95);
          const totalMeshArea = areaValue * lapPercent;
          const sheetsPerLayer = Math.ceil(totalMeshArea / sheetArea);
          const sheets = sheetsPerLayer * meshLayers;
          const cost = sheets * pricePerSheet;

          const layerText = meshLayers > 1 ? ` - ${meshLayers} layers` : '';
          lineItems.push({
            id: `mesh_${area.id}`,
            description: `${area.name} – ${meshType} (${sheets} sheets${layerText})`,
            quantity: sheets,
            unit: 'sheets',
            unitPrice: pricePerSheet,
            total: Math.round(cost * 100) / 100,
            category: 'materials',
          });
          subtotal += cost;
        }

        if (reoType === 'bar') {
          const barSize = area.bar_size || defaultBarSize;
          const spacing = Number(area.bar_spacing || defaultBarSpacing);
          const layers = Number(area.bar_layers || defaultBarLayers);
          const weightPerMetre = REBAR_WEIGHTS[barSize] || 0.888;

          const barsPerMetre = 1000 / spacing;
          const sideLength = Math.sqrt(areaValue);
          const barsPerDirection = Math.ceil(sideLength * barsPerMetre);
          const totalBarLength = barsPerDirection * sideLength * 2 * layers * LAP_ALLOWANCE;
          const totalWeight = totalBarLength * weightPerMetre;
          const cost = (totalWeight / 1000) * pricePerTonne;

          lineItems.push({
            id: `bar_${area.id}`,
            description: `${area.name} – ${barSize} @ ${spacing}mm (${layers}L, ${Math.round(totalWeight)}kg)`,
            quantity: Math.round(totalWeight),
            unit: 'kg',
            unitPrice: pricePerTonne / 1000,
            total: Math.round(cost * 100) / 100,
            category: 'materials',
          });
          subtotal += cost;
        }
      });
    } else if (totalArea > 0) {
      // Fallback for single area without per-area breakdown - default to mesh
      const pricePerSheet = getPrice(priceMap, 'mesh', defaultMeshType, 95);
      const totalMeshArea = totalArea * lapPercent;
      const sheets = Math.ceil(totalMeshArea / sheetArea);
      const cost = sheets * pricePerSheet;

      lineItems.push({
        id: 'mesh_slab',
        description: `Slab ${defaultMeshType} (${sheets} sheets)`,
        quantity: sheets,
        unit: 'sheets',
        unitPrice: pricePerSheet,
        total: Math.round(cost * 100) / 100,
        category: 'materials',
      });
      subtotal += cost;
    }

    // ═══════════════════════════════════════════════════════════════
    // ACCESSORIES
    // ═══════════════════════════════════════════════════════════════
    if (answers.bar_chairs && hasAnySlabReo) {
      const chairType = answers.chair_type || getChairTypeFromThickness(Number(scopeData?.thickness) || 300);
      const chairsPerM2 = Number(answers.chairs_per_m2) || 4;
      const bagPrice = Number(answers.chair_price_per_100) || getPrice(priceMap, 'consumables', chairType, 35);
      
      const effectiveArea = areas.length > 0 
        ? areas.reduce((sum, a) => {
            const reoType = a.reo_type || defaultSlabReoType;
            if (reoType === 'none' || reoType === 'fiber') return sum;
            return sum + (a._actualArea || (Number(a.length) || 0) * (Number(a.width) || 0));
          }, 0)
        : totalArea;
      
      if (effectiveArea > 0) {
        const totalChairs = Math.ceil(effectiveArea * chairsPerM2);
        const bags = Math.ceil(totalChairs / 100);
        const cost = bags * bagPrice;

        lineItems.push({
          id: 'bar_chairs',
          description: `Bar Chairs ${CHAIR_LABELS[chairType] || chairType} (${bags} × 100)`,
          quantity: bags,
          unit: 'bags',
          unitPrice: bagPrice,
          total: Math.round(cost * 100) / 100,
          category: 'materials',
        });
        subtotal += cost;
      }
    }

    if (answers.tie_wire && hasAnySlabReo) {
      const coils = Number(answers.tie_wire_coils) || 2;
      const pricePerCoil = Number(answers.tie_wire_price) || getPrice(priceMap, 'consumables', 'TIE WIRE', 15);
      const cost = coils * pricePerCoil;

      lineItems.push({
        id: 'tie_wire',
        description: `Tie Wire (${coils} coils)`,
        quantity: coils,
        unit: 'coils',
        unitPrice: pricePerCoil,
        total: Math.round(cost * 100) / 100,
        category: 'materials',
      });
      subtotal += cost;
    }

    // ═══════════════════════════════════════════════════════════════
    // EDGE BEAMS (per beam - all config stored on beam object)
    // ═══════════════════════════════════════════════════════════════
    if (answers.edge_beam_reo && edgeBeams.length > 0) {
      // Hardcoded defaults for beams that don't have explicit settings
      const DEFAULT_TM_TYPE = 'L11TM4';
      const DEFAULT_ADD_LIGS = false;
      const DEFAULT_LIG_SIZE = 'R10';
      const DEFAULT_LIG_CENTRES = 200;

      edgeBeams.forEach((beam) => {
        const length = Number(beam.length) || 0;
        if (length <= 0) return;

        const tmType = beam.tm_type || DEFAULT_TM_TYPE;
        const tmLayers = Number(beam.tm_layers) || 1;
        const addLigs = beam.add_ligs ?? DEFAULT_ADD_LIGS;
        const ligSize = beam.lig_size || DEFAULT_LIG_SIZE;
        const ligCentres = beam.lig_centres ?? DEFAULT_LIG_CENTRES;

        const tmPrice = getPrice(priceMap, 'trench_mesh', tmType, 108);
        const tmLengthWithLap = length * LAP_ALLOWANCE;
        const tmSheetsPerLayer = Math.ceil(tmLengthWithLap / 6);
        const tmSheets = tmSheetsPerLayer * tmLayers;
        const tmCost = tmSheets * tmPrice;

        const layerText = tmLayers > 1 ? ` - ${tmLayers} layers` : '';
        lineItems.push({
          id: `edge_tm_${beam.id}`,
          description: `${beam.name} – ${tmType} (${tmSheets} sheets${layerText})`,
          quantity: tmSheets,
          unit: 'sheets',
          unitPrice: tmPrice,
          total: Math.round(tmCost * 100) / 100,
          category: 'materials',
        });
        subtotal += tmCost;

        if (addLigs) {
          const ligPrice = getPrice(priceMap, 'rebar', `${ligSize} COIL`, 2100);
          const ligWeightPerM = REBAR_WEIGHTS[ligSize] || 0.617;
          const ligCount = Math.ceil((length * 1000) / ligCentres);
          const ligPerimeter = 2 * ((Number(beam.width) / 1000) + (Number(beam.depth) / 1000)) + 0.1;
          const ligTotalLength = ligCount * ligPerimeter;
          const ligWeight = ligTotalLength * ligWeightPerM;
          const ligCost = (ligWeight / 1000) * ligPrice;

          lineItems.push({
            id: `edge_ligs_${beam.id}`,
            description: `${beam.name} – ${ligSize} Ligs @ ${ligCentres}mm (${ligCount} pcs)`,
            quantity: ligCount,
            unit: 'pcs',
            unitPrice: Math.round((ligCost / ligCount) * 100) / 100,
            total: Math.round(ligCost * 100) / 100,
            category: 'materials',
          });
          subtotal += ligCost;
        }
      });
    } else if (answers.edge_beam_reo && !edgeBeams.length) {
      const perimeter = Number(scopeData?.perimeter) || Number(scopeData?.edge_beam_length) || 0;
      if (perimeter > 0) {
        const tmType = 'L11TM4';
        const tmPrice = getPrice(priceMap, 'trench_mesh', tmType, 108);
        const tmLengthWithLap = perimeter * LAP_ALLOWANCE;
        const tmSheets = Math.ceil(tmLengthWithLap / 6);
        const tmCost = tmSheets * tmPrice;

        lineItems.push({
          id: 'edge_beam_tm',
          description: `Edge Beams – ${tmType} (${tmSheets} sheets)`,
          quantity: tmSheets,
          unit: 'sheets',
          unitPrice: tmPrice,
          total: Math.round(tmCost * 100) / 100,
          category: 'materials',
        });
        subtotal += tmCost;
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // INTERNAL BEAMS (per beam - all config stored on beam object)
    // ═══════════════════════════════════════════════════════════════
    if (answers.internal_beam_reo && internalBeams.length > 0) {
      // Hardcoded defaults for beams that don't have explicit settings
      const DEFAULT_TM_TYPE = 'L11TM4';
      const DEFAULT_ADD_LIGS = false;
      const DEFAULT_LIG_SIZE = 'R10';
      const DEFAULT_LIG_CENTRES = 200;

      internalBeams.forEach((beam) => {
        const length = Number(beam.length) || 0;
        if (length <= 0) return;

        const tmType = beam.tm_type || DEFAULT_TM_TYPE;
        const tmLayers = Number(beam.tm_layers) || 1;
        const addLigs = beam.add_ligs ?? DEFAULT_ADD_LIGS;
        const ligSize = beam.lig_size || DEFAULT_LIG_SIZE;
        const ligCentres = beam.lig_centres ?? DEFAULT_LIG_CENTRES;

        const tmPrice = getPrice(priceMap, 'trench_mesh', tmType, 108);
        const tmLengthWithLap = length * LAP_ALLOWANCE;
        const tmSheetsPerLayer = Math.ceil(tmLengthWithLap / 6);
        const tmSheets = tmSheetsPerLayer * tmLayers;
        const tmCost = tmSheets * tmPrice;

        const layerText = tmLayers > 1 ? ` - ${tmLayers} layers` : '';
        lineItems.push({
          id: `internal_tm_${beam.id}`,
          description: `${beam.name} – ${tmType} (${tmSheets} sheets${layerText})`,
          quantity: tmSheets,
          unit: 'sheets',
          unitPrice: tmPrice,
          total: Math.round(tmCost * 100) / 100,
          category: 'materials',
        });
        subtotal += tmCost;

        if (addLigs) {
          const ligPrice = getPrice(priceMap, 'rebar', `${ligSize} COIL`, 2100);
          const ligWeightPerM = REBAR_WEIGHTS[ligSize] || 0.617;
          const ligCount = Math.ceil((length * 1000) / ligCentres);
          const ligPerimeter = 2 * ((Number(beam.width) / 1000) + (Number(beam.depth) / 1000)) + 0.1;
          const ligTotalLength = ligCount * ligPerimeter;
          const ligWeight = ligTotalLength * ligWeightPerM;
          const ligCost = (ligWeight / 1000) * ligPrice;

          lineItems.push({
            id: `internal_ligs_${beam.id}`,
            description: `${beam.name} – ${ligSize} Ligs @ ${ligCentres}mm (${ligCount} pcs)`,
            quantity: ligCount,
            unit: 'pcs',
            unitPrice: Math.round((ligCost / ligCount) * 100) / 100,
            total: Math.round(ligCost * 100) / 100,
            category: 'materials',
          });
          subtotal += ligCost;
        }
      });
    } else if (answers.internal_beam_reo) {
      const totalInternalLength = Number(scopeData?.internal_beams_length) || 0;
      if (totalInternalLength > 0) {
        const tmType = 'L11TM4';
        const tmPrice = getPrice(priceMap, 'trench_mesh', tmType, 108);
        const tmLengthWithLap = totalInternalLength * LAP_ALLOWANCE;
        const tmSheets = Math.ceil(tmLengthWithLap / 6);
        const tmCost = tmSheets * tmPrice;

        lineItems.push({
          id: 'internal_beam_tm',
          description: `Internal Beams – ${tmType} (${tmSheets} sheets)`,
          quantity: tmSheets,
          unit: 'sheets',
          unitPrice: tmPrice,
          total: Math.round(tmCost * 100) / 100,
          category: 'materials',
        });
        subtotal += tmCost;
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // DELIVERY
    // ═══════════════════════════════════════════════════════════════
    const delivery = Number(answers.reo_delivery) || 150;
    if (delivery > 0 && lineItems.length > 0) {
      lineItems.push({
        id: 'reo_delivery',
        description: 'Reinforcement Delivery',
        quantity: 1,
        unit: 'item',
        unitPrice: delivery,
        total: delivery,
        category: 'materials',
      });
      subtotal += delivery;
    }

    return {
      moduleId: 'reinforcement-raft',
      moduleName: 'Reinforcement',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (answers, scopeData): ExclusionItem[] => {
    const exclusions: ExclusionItem[] = [];
    const defaultSlabReoType = answers.slab_reo_type || 'mesh';
    const areas: MeasurementArea[] = scopeData?.areas || [];

    // Check if any area has no reinforcement
    const areasWithNoReo = areas.filter(a => (a.reo_type || defaultSlabReoType) === 'none');
    const areasWithFiber = areas.filter(a => (a.reo_type || defaultSlabReoType) === 'fiber');

    if (areasWithNoReo.length > 0 && areasWithNoReo.length === areas.length) {
      exclusions.push({
        id: 'no_reinforcement',
        text: 'Steel reinforcement is not included.',
        moduleId: 'reinforcement-raft',
      });
    } else if (areasWithNoReo.length > 0) {
      exclusions.push({
        id: 'partial_no_reo',
        text: `Steel reinforcement excluded for: ${areasWithNoReo.map(a => a.name).join(', ')}.`,
        moduleId: 'reinforcement-raft',
      });
    }

    if (areasWithFiber.length > 0) {
      exclusions.push({
        id: 'fiber_areas',
        text: `Fiber reinforcement only (no steel) for: ${areasWithFiber.map(a => a.name).join(', ')}.`,
        moduleId: 'reinforcement-raft',
      });
    }

    if (!answers.edge_beam_reo) {
      exclusions.push({
        id: 'no_edge_beam_reo',
        text: 'Edge beam reinforcement excluded.',
        moduleId: 'reinforcement-raft',
      });
    }

    if (!answers.internal_beam_reo) {
      const internalBeams = scopeData?.beams || [];
      const hasInternalBeams = internalBeams.length > 0 || Number(scopeData?.internal_beams_length) > 0;
      if (hasInternalBeams) {
        exclusions.push({
          id: 'no_internal_beam_reo',
          text: 'Internal beam reinforcement excluded.',
          moduleId: 'reinforcement-raft',
        });
      }
    }

    return exclusions;
  },

  validate: (answers: Record<string, any>) => {
    const errors: string[] = [];

    if (answers.slab_reo_type === 'mesh' && !answers.mesh_type) {
      errors.push('Please select a mesh type');
    }

    if (answers.slab_reo_type === 'bar' && !answers.bar_size) {
      errors.push('Please select a bar size');
    }

    return { valid: errors.length === 0, errors };
  },
};
