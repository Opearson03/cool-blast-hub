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
    // SECTION 1: SLAB DEFAULTS
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'slab_reo_type',
      type: 'select',
      label: 'Default Slab Reo Type',
      required: true,
      sectionLabel: 'Slab Surface (Defaults)',
      helpText: 'Default for all areas - override per area below',
      options: [
        { value: 'none', label: 'No Reinforcement' },
        { value: 'mesh', label: 'Steel Mesh' },
        { value: 'bar', label: 'Bar Reinforcement' },
        { value: 'fiber', label: 'Fiber Only' },
      ],
      defaultValue: 'mesh',
    },
    {
      id: 'mesh_type',
      type: 'select',
      label: 'Default Mesh Type',
      options: [
        { value: 'SL62', label: 'SL62' },
        { value: 'SL72', label: 'SL72' },
        { value: 'SL82', label: 'SL82' },
        { value: 'SL92', label: 'SL92' },
        { value: 'SL102', label: 'SL102' },
        { value: 'RL718', label: 'RL718' },
        { value: 'RL818', label: 'RL818' },
        { value: 'RL918', label: 'RL918' },
        { value: 'RL1018', label: 'RL1018' },
      ],
      defaultValue: 'SL82',
      showIf: (answers) => answers.slab_reo_type === 'mesh',
    },
    {
      id: 'mesh_lap_allowance',
      type: 'number',
      label: 'Lap Allowance',
      defaultValue: 12.5,
      min: 0,
      max: 30,
      unit: '%',
      showIf: (answers) => answers.slab_reo_type === 'mesh',
    },
    {
      id: 'mesh_price_per_sheet',
      type: 'currency',
      label: 'Price/Sheet',
      defaultValue: 95,
      unit: '/sheet',
      showIf: (answers) => answers.slab_reo_type === 'mesh',
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const meshType = moduleAnswers.mesh_type || 'SL82';
        return priceMap?.['mesh']?.[meshType];
      },
    },
    {
      id: 'bar_size',
      type: 'select',
      label: 'Default Bar Size',
      options: [
        { value: 'N10', label: 'N10' },
        { value: 'N12', label: 'N12' },
        { value: 'N16', label: 'N16' },
        { value: 'N20', label: 'N20' },
      ],
      defaultValue: 'N12',
      showIf: (answers) => answers.slab_reo_type === 'bar',
    },
    {
      id: 'bar_spacing',
      type: 'select',
      label: 'Default Bar Spacing',
      options: [
        { value: '100', label: '100mm' },
        { value: '150', label: '150mm' },
        { value: '200', label: '200mm' },
        { value: '250', label: '250mm' },
      ],
      defaultValue: '200',
      showIf: (answers) => answers.slab_reo_type === 'bar',
    },
    {
      id: 'bar_layers',
      type: 'select',
      label: 'Default Layers',
      options: [
        { value: '1', label: 'Single (bottom)' },
        { value: '2', label: 'Double (top & bottom)' },
      ],
      defaultValue: '2',
      showIf: (answers) => answers.slab_reo_type === 'bar',
    },
    {
      id: 'rebar_price_per_tonne',
      type: 'currency',
      label: 'Price/Tonne',
      defaultValue: 2100,
      unit: '/t',
      showIf: (answers) => answers.slab_reo_type === 'bar',
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const barSize = moduleAnswers.bar_size || 'N12';
        return priceMap?.['rebar']?.[`${barSize} CB`];
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // SECTION 2: ACCESSORIES
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
    // SECTION 3: EDGE BEAM DEFAULTS
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'edge_beam_reo',
      type: 'boolean',
      label: 'Include Edge Beam Reinforcement',
      defaultValue: true,
      sectionLabel: 'Edge Beams (Defaults)',
    },
    {
      id: 'edge_beam_tm_type',
      type: 'select',
      label: 'Default TM Type',
      helpText: 'Override per beam below',
      options: [
        { value: 'L8TM3', label: 'L8TM3 (300mm)' },
        { value: 'L8TM4', label: 'L8TM4 (400mm)' },
        { value: 'L11TM3', label: 'L11TM3 (300mm)' },
        { value: 'L11TM4', label: 'L11TM4 (400mm)' },
        { value: 'L12TM3', label: 'L12TM3 (300mm)' },
        { value: 'L12TM4', label: 'L12TM4 (400mm)' },
        { value: 'L12TM5', label: 'L12TM5 (500mm)' },
        { value: 'L16TM3', label: 'L16TM3 (300mm)' },
      ],
      defaultValue: 'L11TM4',
      showIf: (answers) => answers.edge_beam_reo === true,
    },
    {
      id: 'edge_beam_tm_price',
      type: 'currency',
      label: 'TM Price/Sheet',
      defaultValue: 108,
      unit: '/sheet',
      showIf: (answers) => answers.edge_beam_reo === true,
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const tmType = moduleAnswers.edge_beam_tm_type || 'L11TM4';
        return priceMap?.['trench_mesh']?.[tmType];
      },
    },
    {
      id: 'edge_beam_add_ligs',
      type: 'boolean',
      label: 'Default: Add Ligatures',
      defaultValue: false,
      showIf: (answers) => answers.edge_beam_reo === true,
    },
    {
      id: 'edge_beam_lig_size',
      type: 'select',
      label: 'Default Lig Size',
      options: [
        { value: 'R10', label: 'R10' },
        { value: 'R12', label: 'R12' },
      ],
      defaultValue: 'R10',
      showIf: (answers) => answers.edge_beam_reo === true && answers.edge_beam_add_ligs === true,
    },
    {
      id: 'edge_beam_lig_centres',
      type: 'number',
      label: 'Default Lig Centres',
      defaultValue: 200,
      min: 100,
      max: 600,
      unit: 'mm',
      showIf: (answers) => answers.edge_beam_reo === true && answers.edge_beam_add_ligs === true,
    },
    {
      id: 'edge_beam_lig_price',
      type: 'currency',
      label: 'Lig Price/Tonne',
      defaultValue: 2100,
      unit: '/t',
      showIf: (answers) => answers.edge_beam_reo === true && answers.edge_beam_add_ligs === true,
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const ligSize = moduleAnswers.edge_beam_lig_size || 'R10';
        return priceMap?.['rebar']?.[`${ligSize} COIL`];
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // SECTION 4: INTERNAL BEAM DEFAULTS
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'internal_beam_reo',
      type: 'boolean',
      label: 'Include Internal Beam Reinforcement',
      defaultValue: true,
      sectionLabel: 'Internal Beams (Defaults)',
    },
    {
      id: 'internal_beam_tm_type',
      type: 'select',
      label: 'Default TM Type',
      helpText: 'Override per beam below',
      options: [
        { value: 'L8TM3', label: 'L8TM3 (300mm)' },
        { value: 'L8TM4', label: 'L8TM4 (400mm)' },
        { value: 'L11TM3', label: 'L11TM3 (300mm)' },
        { value: 'L11TM4', label: 'L11TM4 (400mm)' },
        { value: 'L12TM3', label: 'L12TM3 (300mm)' },
        { value: 'L12TM4', label: 'L12TM4 (400mm)' },
        { value: 'L12TM5', label: 'L12TM5 (500mm)' },
        { value: 'L16TM3', label: 'L16TM3 (300mm)' },
      ],
      defaultValue: 'L11TM4',
      showIf: (answers) => answers.internal_beam_reo === true,
    },
    {
      id: 'internal_beam_tm_price',
      type: 'currency',
      label: 'TM Price/Sheet',
      defaultValue: 108,
      unit: '/sheet',
      showIf: (answers) => answers.internal_beam_reo === true,
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const tmType = moduleAnswers.internal_beam_tm_type || 'L11TM4';
        return priceMap?.['trench_mesh']?.[tmType];
      },
    },
    {
      id: 'internal_beam_add_ligs',
      type: 'boolean',
      label: 'Default: Add Ligatures',
      defaultValue: false,
      showIf: (answers) => answers.internal_beam_reo === true,
    },
    {
      id: 'internal_beam_lig_size',
      type: 'select',
      label: 'Default Lig Size',
      options: [
        { value: 'R10', label: 'R10' },
        { value: 'R12', label: 'R12' },
      ],
      defaultValue: 'R10',
      showIf: (answers) => answers.internal_beam_reo === true && answers.internal_beam_add_ligs === true,
    },
    {
      id: 'internal_beam_lig_centres',
      type: 'number',
      label: 'Default Lig Centres',
      defaultValue: 200,
      min: 100,
      max: 600,
      unit: 'mm',
      showIf: (answers) => answers.internal_beam_reo === true && answers.internal_beam_add_ligs === true,
    },
    {
      id: 'internal_beam_lig_price',
      type: 'currency',
      label: 'Lig Price/Tonne',
      defaultValue: 2100,
      unit: '/t',
      showIf: (answers) => answers.internal_beam_reo === true && answers.internal_beam_add_ligs === true,
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const ligSize = moduleAnswers.internal_beam_lig_size || 'R10';
        return priceMap?.['rebar']?.[`${ligSize} COIL`];
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

    // Default settings from module answers
    const defaultSlabReoType = answers.slab_reo_type || 'mesh';
    const defaultMeshType = answers.mesh_type || 'SL82';
    const defaultBarSize = answers.bar_size || 'N12';
    const defaultBarSpacing = answers.bar_spacing || '200';
    const defaultBarLayers = answers.bar_layers || '2';

    // Get areas and beams from scope data
    const areas: MeasurementArea[] = scopeData?.areas || [];
    const edgeBeams: BeamConfig[] = scopeData?.edgeBeams || [];
    const internalBeams: BeamConfig[] = scopeData?.beams || [];
    const totalArea = Number(scopeData?.area) || 0;

    // Check if any area has reinforcement
    const hasAnySlabReo = areas.length > 0 
      ? areas.some(a => (a.reo_type || defaultSlabReoType) !== 'none' && (a.reo_type || defaultSlabReoType) !== 'fiber')
      : defaultSlabReoType !== 'none' && defaultSlabReoType !== 'fiber';

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
    const pricePerTonne = Number(answers.rebar_price_per_tonne) || getPrice(priceMap, 'rebar', `${defaultBarSize} CB`, 2100);

    if (areas.length > 0) {
      areas.forEach((area) => {
        const reoType = area.reo_type || defaultSlabReoType;
        const areaValue = area._actualArea || (Number(area.length) || 0) * (Number(area.width) || 0);
        
        if (areaValue <= 0 || reoType === 'none' || reoType === 'fiber') return;

        if (reoType === 'mesh') {
          const meshType = area.mesh_type || defaultMeshType;
          const pricePerSheet = Number(answers.mesh_price_per_sheet) || getPrice(priceMap, 'mesh', meshType, 95);
          const totalMeshArea = areaValue * lapPercent;
          const sheets = Math.ceil(totalMeshArea / sheetArea);
          const cost = sheets * pricePerSheet;

          lineItems.push({
            id: `mesh_${area.id}`,
            description: `${area.name} – ${meshType} (${sheets} sheets)`,
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
    } else if (totalArea > 0 && defaultSlabReoType !== 'none' && defaultSlabReoType !== 'fiber') {
      // Fallback for single area without per-area breakdown
      if (defaultSlabReoType === 'mesh') {
        const pricePerSheet = Number(answers.mesh_price_per_sheet) || getPrice(priceMap, 'mesh', defaultMeshType, 95);
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
    // EDGE BEAMS (per beam)
    // ═══════════════════════════════════════════════════════════════
    if (answers.edge_beam_reo && edgeBeams.length > 0) {
      const defaultTmType = answers.edge_beam_tm_type || 'L11TM4';
      const defaultAddLigs = answers.edge_beam_add_ligs || false;
      const defaultLigSize = answers.edge_beam_lig_size || 'R10';
      const defaultLigCentres = Number(answers.edge_beam_lig_centres) || 200;

      edgeBeams.forEach((beam) => {
        const length = Number(beam.length) || 0;
        if (length <= 0) return;

        const tmType = beam.tm_type || defaultTmType;
        const addLigs = beam.add_ligs ?? defaultAddLigs;
        const ligSize = beam.lig_size || defaultLigSize;
        const ligCentres = beam.lig_centres ?? defaultLigCentres;

        const tmPrice = getPrice(priceMap, 'trench_mesh', tmType, 108);
        const tmLengthWithLap = length * LAP_ALLOWANCE;
        const tmSheets = Math.ceil(tmLengthWithLap / 6);
        const tmCost = tmSheets * tmPrice;

        lineItems.push({
          id: `edge_tm_${beam.id}`,
          description: `${beam.name} – ${tmType} (${tmSheets} sheets)`,
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
        const tmType = answers.edge_beam_tm_type || 'L11TM4';
        const tmPrice = Number(answers.edge_beam_tm_price) || getPrice(priceMap, 'trench_mesh', tmType, 108);
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
    // INTERNAL BEAMS (per beam)
    // ═══════════════════════════════════════════════════════════════
    if (answers.internal_beam_reo && internalBeams.length > 0) {
      const defaultTmType = answers.internal_beam_tm_type || 'L11TM4';
      const defaultAddLigs = answers.internal_beam_add_ligs || false;
      const defaultLigSize = answers.internal_beam_lig_size || 'R10';
      const defaultLigCentres = Number(answers.internal_beam_lig_centres) || 200;

      internalBeams.forEach((beam) => {
        const length = Number(beam.length) || 0;
        if (length <= 0) return;

        const tmType = beam.tm_type || defaultTmType;
        const addLigs = beam.add_ligs ?? defaultAddLigs;
        const ligSize = beam.lig_size || defaultLigSize;
        const ligCentres = beam.lig_centres ?? defaultLigCentres;

        const tmPrice = getPrice(priceMap, 'trench_mesh', tmType, 108);
        const tmLengthWithLap = length * LAP_ALLOWANCE;
        const tmSheets = Math.ceil(tmLengthWithLap / 6);
        const tmCost = tmSheets * tmPrice;

        lineItems.push({
          id: `internal_tm_${beam.id}`,
          description: `${beam.name} – ${tmType} (${tmSheets} sheets)`,
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
        const tmType = answers.internal_beam_tm_type || 'L11TM4';
        const tmPrice = Number(answers.internal_beam_tm_price) || getPrice(priceMap, 'trench_mesh', tmType, 108);
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
