import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap, FootingConfig, LinearSection } from '../types';
import { getPrice, REBAR_WEIGHTS } from '../types';

// Default values for footing reinforcement
const DEFAULT_TM_TYPE = 'L11TM4';
const DEFAULT_LIG_SIZE = 'R10';
const DEFAULT_LIG_CENTRES = 200;
const DEFAULT_VERTICAL_BAR_SIZE = 'N16';
const DEFAULT_VERTICAL_BAR_CENTRES = 400;
const DEFAULT_LAP_ALLOWANCE = 12.5;

type FootingOrSection = FootingConfig | LinearSection;

export const reinforcementFootingModule: EstimateModule = {
  id: 'reinforcement-footing',
  name: 'Reinforcement',
  description: 'Trench mesh and bar reinforcement for footings',
  icon: 'Grid3X3',

  questions: [
    // Main reinforcement toggle
    {
      id: 'include_trench_mesh',
      type: 'boolean',
      label: 'Include Trench Mesh?',
      defaultValue: false,
      sectionLabel: 'Trench Mesh',
    },
    // Ligatures toggle
    {
      id: 'add_ligs',
      type: 'boolean',
      label: 'Include Ligatures?',
      defaultValue: false,
      sectionLabel: 'Ligatures',
    },
    // Vertical starters toggle
    {
      id: 'add_vertical_bars',
      type: 'boolean',
      label: 'Include Vertical Starters?',
      defaultValue: false,
      helpText: 'For blockwork starter bars in the footing',
      sectionLabel: 'Vertical Starters',
    },
    // Pricing section
    {
      id: 'rebar_type',
      type: 'select',
      label: 'Rebar supply type',
      options: [
        { value: 'cut_bend', label: 'Cut & Bend' },
        { value: 'stock', label: 'Stock Lengths' },
      ],
      defaultValue: 'cut_bend',
      showIf: (answers) => answers.include_trench_mesh || answers.add_ligs || answers.add_vertical_bars,
      sectionLabel: 'Pricing & Delivery',
    },
    {
      id: 'trench_mesh_price_per_sheet',
      type: 'currency',
      label: 'Trench Mesh price per sheet (6m)',
      defaultValue: 108,
      unit: '/sheet',
      showIf: (answers) => answers.include_trench_mesh,
      deriveFrom: (_scopeData, _moduleAnswers, priceMap) => {
        return priceMap?.['trench_mesh']?.[DEFAULT_TM_TYPE];
      },
    },
    {
      id: 'rebar_price_per_tonne',
      type: 'currency',
      label: 'Rebar price per tonne',
      defaultValue: 2100,
      unit: '/tonne',
      showIf: (answers) => answers.add_ligs || answers.add_vertical_bars,
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const supplyType = moduleAnswers.rebar_type === 'cut_bend' ? 'CB' : 'STOCK';
        return priceMap?.['rebar']?.[`${DEFAULT_VERTICAL_BAR_SIZE} ${supplyType}`];
      },
    },
    {
      id: 'tie_wire',
      type: 'boolean',
      label: 'Include Tie Wire',
      defaultValue: false,
      showIf: (answers) => answers.include_trench_mesh || answers.add_ligs || answers.add_vertical_bars,
    },
    {
      id: 'tie_wire_price',
      type: 'currency',
      label: 'Tie Wire price per coil',
      defaultValue: 6,
      unit: '/coil',
      showIf: (answers) => answers.tie_wire,
      deriveFrom: (_scopeData, _moduleAnswers, priceMap) => {
        return priceMap?.['consumables']?.['TIE WIRE'];
      },
    },
    {
      id: 'reo_delivery',
      type: 'currency',
      label: 'Reinforcement Delivery',
      defaultValue: 150,
      priceListKey: 'rebar.REO DELIVERY',
      showIf: (answers) => answers.include_trench_mesh || answers.add_ligs || answers.add_vertical_bars,
    },
  ],

  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    // Get footings from scope data (could be FootingConfig[] or LinearSection[])
    const footings = (scopeData.footings || scopeData.linearSections || []) as FootingOrSection[];
    const lapAllowance = 1 + DEFAULT_LAP_ALLOWANCE / 100;
    const pricePerTonne = Number(answers.rebar_price_per_tonne) || 2100;

    // If no per-item footings, use aggregate values
    if (footings.length === 0) {
      const totalLength = Number(scopeData.total_length) || Number(scopeData.perimeter) || 0;
      
      if (totalLength > 0 && answers.include_trench_mesh) {
        const sheetsRequired = Math.ceil((totalLength * lapAllowance) / 6);
        const pricePerSheet = Number(answers.trench_mesh_price_per_sheet) || 108;
        const meshCost = sheetsRequired * pricePerSheet;

        lineItems.push({
          id: 'trench_mesh_aggregate',
          description: `Trench Mesh ${DEFAULT_TM_TYPE} (${sheetsRequired} × 6m sheets)`,
          quantity: sheetsRequired,
          unit: 'sheets',
          unitPrice: pricePerSheet,
          total: Math.round(meshCost * 100) / 100,
          category: 'materials',
        });
        subtotal += meshCost;
      }

      // Add delivery and accessories if needed
      if (answers.include_trench_mesh || answers.add_ligs || answers.add_vertical_bars) {
        if (answers.tie_wire) {
          const pricePerCoil = Number(answers.tie_wire_price) || 6;
          const wireCost = 2 * pricePerCoil;
          lineItems.push({
            id: 'tie_wire',
            description: 'Tie Wire (2 coils)',
            quantity: 2,
            unit: 'coils',
            unitPrice: pricePerCoil,
            total: wireCost,
            category: 'materials',
          });
          subtotal += wireCost;
        }

        const delivery = Number(answers.reo_delivery) || 150;
        if (delivery > 0) {
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
      }

      return {
        moduleId: 'reinforcement-footing',
        moduleName: 'Reinforcement',
        lineItems,
        subtotal: Math.round(subtotal * 100) / 100,
        exclusions: [],
      };
    }

    // Process each footing/section individually
    footings.forEach((footing) => {
      const length = footing._actualLength || footing.length;
      const reoType = footing.reo_type || (answers.include_trench_mesh ? 'trench_mesh' : 'none');
      
      if (reoType === 'none') return;

      const tmType = footing.tm_type || DEFAULT_TM_TYPE;
      const showTm = (reoType === 'trench_mesh' || reoType === 'both') && tmType !== 'none';
      const showLigs = footing.add_ligs ?? answers.add_ligs;
      const showVerticalBars = footing.add_vertical_bars ?? answers.add_vertical_bars;

      // Trench Mesh
      if (showTm) {
        const tmType = footing.tm_type || DEFAULT_TM_TYPE;
        const tmLayers = Number((footing as any).tm_layers) || 1;
        const tmTypeTop = (footing as any).tm_type_top || tmType;
        const sheetsPerLayer = Math.ceil((length * lapAllowance) / 6);
        const pricePerSheet = Number(answers.trench_mesh_price_per_sheet) || getPrice(priceMap, 'trench_mesh', tmType, 108);
        
        // Bottom layer (always present)
        const bottomCost = sheetsPerLayer * pricePerSheet;

        lineItems.push({
          id: `tm_${footing.id}_bottom`,
          description: tmLayers > 1 
            ? `${footing.name} - ${tmType} (${sheetsPerLayer} sheets) – Bottom`
            : `${footing.name} - ${tmType} (${sheetsPerLayer} sheets)`,
          quantity: sheetsPerLayer,
          unit: 'sheets',
          unitPrice: pricePerSheet,
          total: Math.round(bottomCost * 100) / 100,
          category: 'materials',
        });
        subtotal += bottomCost;
        
        // Top layer (only if 2 layers)
        if (tmLayers > 1) {
          const pricePerSheetTop = getPrice(priceMap, 'trench_mesh', tmTypeTop, 108);
          const topCost = sheetsPerLayer * pricePerSheetTop;
          
          lineItems.push({
            id: `tm_${footing.id}_top`,
            description: `${footing.name} - ${tmTypeTop} (${sheetsPerLayer} sheets) – Top`,
            quantity: sheetsPerLayer,
            unit: 'sheets',
            unitPrice: pricePerSheetTop,
            total: Math.round(topCost * 100) / 100,
            category: 'materials',
          });
          subtotal += topCost;
        }
      }

      // Ligatures
      if (showLigs) {
        const ligSize = footing.lig_size || DEFAULT_LIG_SIZE;
        const ligCentres = footing.lig_centres ?? DEFAULT_LIG_CENTRES;
        const ligCount = Math.ceil((length * 1000) / ligCentres);
        
        // Estimate lig perimeter from footing dimensions
        const footingWidth = 'width' in footing ? footing.width : footing.dimension1;
        const footingDepth = 'depth' in footing ? footing.depth : footing.dimension2;
        const ligPerimeter = ((footingWidth + footingDepth) * 2) / 1000; // Convert to metres
        
        const totalLigLength = ligCount * ligPerimeter;
        const weightPerMetre = REBAR_WEIGHTS[ligSize] || 0.617;
        const totalWeight = totalLigLength * weightPerMetre * lapAllowance;
        const ligCost = (totalWeight / 1000) * pricePerTonne;

        lineItems.push({
          id: `ligs_${footing.id}`,
          description: `${footing.name} - Ligs ${ligSize} @ ${ligCentres}mm (${ligCount}×)`,
          quantity: Math.round(totalWeight),
          unit: 'kg',
          unitPrice: pricePerTonne / 1000,
          total: Math.round(ligCost * 100) / 100,
          category: 'materials',
        });
        subtotal += ligCost;
      }

      // Vertical Starters
      if (showVerticalBars) {
        const barSize = footing.vertical_bar_size || DEFAULT_VERTICAL_BAR_SIZE;
        const barCentres = footing.vertical_bar_centres ?? DEFAULT_VERTICAL_BAR_CENTRES;
        const barCount = Math.ceil((length * 1000) / barCentres);
        
        // Default starter length: 1200mm
        const barLength = 1.2;
        const totalBarLength = barCount * barLength * lapAllowance;
        const weightPerMetre = REBAR_WEIGHTS[barSize] || 1.58;
        const totalWeight = totalBarLength * weightPerMetre;
        const barCost = (totalWeight / 1000) * pricePerTonne;

        lineItems.push({
          id: `starters_${footing.id}`,
          description: `${footing.name} - Starters ${barSize} @ ${barCentres}mm (${barCount}×)`,
          quantity: Math.round(totalWeight),
          unit: 'kg',
          unitPrice: pricePerTonne / 1000,
          total: Math.round(barCost * 100) / 100,
          category: 'materials',
        });
        subtotal += barCost;
      }
    });

    // Accessories (consolidated)
    if (lineItems.length > 0) {
      // Tie Wire
      if (answers.tie_wire) {
        const pricePerCoil = Number(answers.tie_wire_price) || 6;
        const coils = Math.max(2, Math.ceil(footings.length / 3));
        const wireCost = coils * pricePerCoil;

        lineItems.push({
          id: 'tie_wire',
          description: `Tie Wire (${coils} coils)`,
          quantity: coils,
          unit: 'coils',
          unitPrice: pricePerCoil,
          total: Math.round(wireCost * 100) / 100,
          category: 'materials',
        });
        subtotal += wireCost;
      }

      // Delivery
      const delivery = Number(answers.reo_delivery) || 150;
      if (delivery > 0) {
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
    }

    return {
      moduleId: 'reinforcement-footing',
      moduleName: 'Reinforcement',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (answers, scopeData): ExclusionItem[] => {
    const exclusions: ExclusionItem[] = [];
    const footings = (scopeData?.footings || scopeData?.linearSections || []) as FootingOrSection[];
    
    // Check if any footing has reinforcement
    const anyTmEnabled = answers.include_trench_mesh || footings.some(f => 
      f.reo_type === 'trench_mesh' || f.reo_type === 'both'
    );
    const anyLigsEnabled = answers.add_ligs || footings.some(f => f.add_ligs);
    const anyStartersEnabled = answers.add_vertical_bars || footings.some(f => f.add_vertical_bars);
    
    if (!anyTmEnabled && !anyLigsEnabled && !anyStartersEnabled) {
      exclusions.push({
        id: 'no_reinforcement',
        text: 'Steel reinforcement is not included in this quote.',
        moduleId: 'reinforcement-footing',
      });
    }

    return exclusions;
  },

  validate: (answers) => {
    const errors: string[] = [];
    // Validation is now per-footing, minimal module-level validation needed
    return { valid: errors.length === 0, errors };
  },
};
