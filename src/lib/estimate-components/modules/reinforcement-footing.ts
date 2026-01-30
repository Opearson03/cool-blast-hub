import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap, LinearSection, HorizontalBarConfig, VerticalBarConfig } from '../types';
import { getPrice, REBAR_WEIGHTS } from '../types';

/**
 * Footing Reinforcement Module (Unified)
 * 
 * Aligned with raft slab edge beam reinforcement pattern:
 * - TM Type with None option + 1-2 layers
 * - Ligatures toggle with size + centres
 * - Horizontal bars array (add/remove rows)
 * - Vertical bars array (add/remove rows)
 */

// Default values for footing reinforcement
const DEFAULT_TM_TYPE = 'L11TM4';
const DEFAULT_LIG_SIZE = 'R10';
const DEFAULT_LIG_CENTRES = 200;
const DEFAULT_LAP_ALLOWANCE = 12.5;

export const reinforcementFootingModule: EstimateModule = {
  id: 'reinforcement-footing',
  name: 'Reinforcement',
  description: 'Trench mesh and bar reinforcement for footings',
  icon: 'Grid3X3',

  questions: [
    // ═══════════════════════════════════════════════════════════════
    // SECTION 1: FOOTING REINFORCEMENT
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'rebar_lap_allowance',
      type: 'number',
      label: 'Rebar Lap Allowance',
      defaultValue: DEFAULT_LAP_ALLOWANCE,
      min: 0,
      max: 30,
      unit: '%',
      sectionLabel: 'Footing Reinforcement',
    },
    
    // ═══════════════════════════════════════════════════════════════
    // SECTION 2: OTHER ACCESSORIES
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'tie_wire',
      type: 'boolean',
      label: 'Include Tie Wire',
      defaultValue: false,
      sectionLabel: 'Other Accessories',
    },
    {
      id: 'tie_wire_coils',
      type: 'number',
      label: 'Coils',
      defaultValue: 2,
      min: 1,
      showIf: (answers) => answers.tie_wire === true,
    },
    {
      id: 'tie_wire_price',
      type: 'currency',
      label: 'Price/Coil',
      defaultValue: 15,
      showIf: (answers) => answers.tie_wire === true,
      deriveFrom: (_scopeData, _moduleAnswers, priceMap) => {
        return priceMap?.['consumables']?.['TIE WIRE'];
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // SECTION 3: DELIVERY
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'reo_delivery',
      type: 'currency',
      label: 'Reinforcement Delivery',
      defaultValue: 150,
      sectionLabel: 'Delivery',
      priceListKey: 'rebar.REO DELIVERY',
    },
  ],

  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    // Get linear sections from scope data
    const sections: LinearSection[] = scopeData?.linearSections || scopeData?.footings || [];
    const lapPercent = 1 + (Number(answers.rebar_lap_allowance) || DEFAULT_LAP_ALLOWANCE) / 100;

    // Check if any section has TM enabled (use default if not explicitly set)
    const hasAnyTm = sections.length > 0 
      ? sections.some(s => {
          // Use default TM type if not explicitly set; only exclude if explicitly 'none'
          const tmType = s.tm_type ?? DEFAULT_TM_TYPE;
          return tmType !== 'none';
        })
      : false;

    // Check for horizontal or vertical bars
    const hasAnyHBars = sections.some(s => s.horizontal_bars && s.horizontal_bars.length > 0);
    const hasAnyVBars = sections.some(s => s.vertical_bars && s.vertical_bars.length > 0);
    const hasAnyLigs = sections.some(s => s.add_ligs);
    const hasAnyChairs = sections.some(s => s.chairs_enabled);

    if (!hasAnyTm && !hasAnyHBars && !hasAnyVBars && !hasAnyLigs) {
      return {
        moduleId: 'reinforcement-footing',
        moduleName: 'Reinforcement',
        lineItems: [],
        subtotal: 0,
        exclusions: [],
      };
    }

    // ═══════════════════════════════════════════════════════════════
    // TRENCH MESH (per section, matching edge beam pattern)
    // ═══════════════════════════════════════════════════════════════
    if (sections.length > 0) {
      sections.forEach((section) => {
        const length = section._actualLength || section.length;
        if (length <= 0) return;

        // Apply default TM type if not explicitly set; skip only if explicitly 'none'
        const tmType = section.tm_type ?? DEFAULT_TM_TYPE;
        if (tmType === 'none') return;

        const tmLayers = Number(section.tm_layers) || 1;
        const tmTypeTop = section.tm_type_top || tmType;
        const tmLengthWithLap = length * lapPercent;
        const tmSheetsPerLayer = Math.ceil(tmLengthWithLap / 6);
        
        // Bottom layer (always present)
        const tmPriceBottom = section.tm_price ?? getPrice(priceMap, 'trench_mesh', tmType, 108);
        const bottomCost = tmSheetsPerLayer * tmPriceBottom;
        
        lineItems.push({
          id: `tm_${section.id}_bottom`,
          description: tmLayers > 1 
            ? `${section.name} – ${tmType} (${tmSheetsPerLayer} sheets) – Bottom`
            : `${section.name} – ${tmType} (${tmSheetsPerLayer} sheets)`,
          quantity: tmSheetsPerLayer,
          unit: 'sheets',
          unitPrice: tmPriceBottom,
          total: Math.round(bottomCost * 100) / 100,
          category: 'materials',
        });
        subtotal += bottomCost;
        
        // Top layer (only if 2 layers)
        if (tmLayers > 1) {
          const tmPriceTop = section.tm_price_top ?? getPrice(priceMap, 'trench_mesh', tmTypeTop, 108);
          const topCost = tmSheetsPerLayer * tmPriceTop;
          
          lineItems.push({
            id: `tm_${section.id}_top`,
            description: `${section.name} – ${tmTypeTop} (${tmSheetsPerLayer} sheets) – Top`,
            quantity: tmSheetsPerLayer,
            unit: 'sheets',
            unitPrice: tmPriceTop,
            total: Math.round(topCost * 100) / 100,
            category: 'materials',
          });
          subtotal += topCost;
        }
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // TM CHAIRS (per-section configuration)
    // ═══════════════════════════════════════════════════════════════
    if (sections.length > 0 && hasAnyChairs) {
      let totalChairs = 0;
      let totalLayerChairs = 0;
      let chairPrice = 12.50;
      let layerChairPrice = 12.50;
      
      sections.forEach((section) => {
        if (!section.chairs_enabled) return;
        const length = section._actualLength || section.length;
        if (length <= 0) return;
        
        const chairsPerM = section.chairs_per_m ?? 1.4;
        chairPrice = section.chair_price_per_bag ?? getPrice(priceMap, 'consumables', 'TMCHAIR', 12.50);
        totalChairs += Math.ceil(length * chairsPerM);
        
        // Layer chairs (between TM layers)
        const tmLayers = section.tm_layers || 1;
        if (section.layer_chairs_enabled && tmLayers > 1) {
          const layerChairsPerM = section.layer_chairs_per_m ?? 1;
          layerChairPrice = section.layer_chair_price ?? 12.50;
          totalLayerChairs += Math.ceil(length * layerChairsPerM);
        }
      });
      
      if (totalChairs > 0) {
        const bags = Math.ceil(totalChairs / 25);
        const cost = bags * chairPrice;
        
        lineItems.push({
          id: 'footing_chairs',
          description: `Footing TM Chairs (${bags} × 25)`,
          quantity: bags,
          unit: 'bags',
          unitPrice: chairPrice,
          total: Math.round(cost * 100) / 100,
          category: 'materials',
        });
        subtotal += cost;
      }
      
      if (totalLayerChairs > 0) {
        const bags = Math.ceil(totalLayerChairs / 25);
        const cost = bags * layerChairPrice;
        
        lineItems.push({
          id: 'footing_layer_chairs',
          description: `Footing TM Layer Chairs (${bags} × 25)`,
          quantity: bags,
          unit: 'bags',
          unitPrice: layerChairPrice,
          total: Math.round(cost * 100) / 100,
          category: 'materials',
        });
        subtotal += cost;
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // LIGATURES (per section)
    // ═══════════════════════════════════════════════════════════════
    if (sections.length > 0) {
      // Aggregate ligatures by size
      const ligsBySize: Record<string, { count: number; weight: number }> = {};
      
      sections.forEach((section) => {
        const addLigs = section.add_ligs ?? false;
        if (!addLigs) return;
        
        const length = section._actualLength || section.length;
        if (length <= 0) return;
        
        const ligSize = section.lig_size || DEFAULT_LIG_SIZE;
        const ligCentres = section.lig_centres ?? DEFAULT_LIG_CENTRES;
        const ligCount = Math.ceil((length * 1000) / ligCentres);
        
        // Estimate lig perimeter from footing dimensions
        const footingWidth = section.dimension1 / 1000; // mm to m
        const footingDepth = section.dimension2 / 1000; // mm to m
        const ligPerimeter = 2 * (footingWidth + footingDepth) + 0.1; // +0.1 for hooks
        
        const totalLigLength = ligCount * ligPerimeter;
        const weightPerMetre = REBAR_WEIGHTS[ligSize] || 0.617;
        const totalWeight = totalLigLength * weightPerMetre * lapPercent;
        
        if (!ligsBySize[ligSize]) {
          ligsBySize[ligSize] = { count: 0, weight: 0 };
        }
        ligsBySize[ligSize].count += ligCount;
        ligsBySize[ligSize].weight += totalWeight;
      });
      
      // Generate line items for each lig size
      Object.entries(ligsBySize).forEach(([ligSize, { count, weight }]) => {
        const pricePerTonne = getPrice(priceMap, 'rebar', `${ligSize} COIL`, 2100);
        const ligCost = (weight / 1000) * pricePerTonne;
        
        lineItems.push({
          id: `ligs_${ligSize}`,
          description: `Ligatures ${ligSize} (${count} pcs, ${Math.round(weight)}kg)`,
          quantity: count,
          unit: 'pcs',
          unitPrice: Math.round((ligCost / count) * 100) / 100,
          total: Math.round(ligCost * 100) / 100,
          category: 'materials',
        });
        subtotal += ligCost;
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // HORIZONTAL REINFORCEMENT (per section, array-based)
    // ═══════════════════════════════════════════════════════════════
    if (sections.length > 0) {
      // Aggregate horizontal bars by size and position
      const hBarsByKey: Record<string, { totalLength: number; count: number }> = {};
      
      sections.forEach((section) => {
        const hBars = section.horizontal_bars || [];
        if (hBars.length === 0) return;
        
        const length = section._actualLength || section.length;
        if (length <= 0) return;
        
        hBars.forEach((bar: HorizontalBarConfig) => {
          const key = `${bar.bar_size}_${bar.position}`;
          const barLength = length * (bar.quantity || 1) * lapPercent;
          
          if (!hBarsByKey[key]) {
            hBarsByKey[key] = { totalLength: 0, count: 0 };
          }
          hBarsByKey[key].totalLength += barLength;
          hBarsByKey[key].count += bar.quantity || 1;
        });
      });
      
      // Generate line items for each bar size/position
      Object.entries(hBarsByKey).forEach(([key, { totalLength, count }]) => {
        const [barSize, position] = key.split('_');
        const weightPerMetre = REBAR_WEIGHTS[barSize] || 1.58;
        const totalWeight = totalLength * weightPerMetre;
        const pricePerTonne = getPrice(priceMap, 'rebar', `${barSize} CB`, 2100);
        const cost = (totalWeight / 1000) * pricePerTonne;
        
        lineItems.push({
          id: `hbar_${key}`,
          description: `Horizontal ${barSize} ${position} (${Math.round(totalWeight)}kg)`,
          quantity: Math.round(totalWeight),
          unit: 'kg',
          unitPrice: pricePerTonne / 1000,
          total: Math.round(cost * 100) / 100,
          category: 'materials',
        });
        subtotal += cost;
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // VERTICAL REINFORCEMENT (per section, array-based)
    // ═══════════════════════════════════════════════════════════════
    if (sections.length > 0) {
      // Aggregate vertical bars by size
      const vBarsBySize: Record<string, { count: number; weight: number }> = {};
      
      sections.forEach((section) => {
        const vBars = section.vertical_bars || [];
        if (vBars.length === 0) return;
        
        const length = section._actualLength || section.length;
        if (length <= 0) return;
        
        vBars.forEach((bar: VerticalBarConfig) => {
          const barSize = bar.bar_size || 'N16';
          const centres = bar.centres || 400;
          const barLength = (bar.length || 1200) / 1000; // mm to m
          const barCount = Math.ceil((length * 1000) / centres);
          const weightPerMetre = REBAR_WEIGHTS[barSize] || 1.58;
          const totalWeight = barCount * barLength * weightPerMetre * lapPercent;
          
          if (!vBarsBySize[barSize]) {
            vBarsBySize[barSize] = { count: 0, weight: 0 };
          }
          vBarsBySize[barSize].count += barCount;
          vBarsBySize[barSize].weight += totalWeight;
        });
      });
      
      // Generate line items for each bar size
      Object.entries(vBarsBySize).forEach(([barSize, { count, weight }]) => {
        const pricePerTonne = getPrice(priceMap, 'rebar', `${barSize} CB`, 2100);
        const cost = (weight / 1000) * pricePerTonne;
        
        lineItems.push({
          id: `vbar_${barSize}`,
          description: `Vertical Starters ${barSize} (${count} pcs, ${Math.round(weight)}kg)`,
          quantity: count,
          unit: 'pcs',
          unitPrice: Math.round((cost / count) * 100) / 100,
          total: Math.round(cost * 100) / 100,
          category: 'materials',
        });
        subtotal += cost;
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // OTHER ACCESSORIES
    // ═══════════════════════════════════════════════════════════════
    if (answers.tie_wire && lineItems.length > 0) {
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
      moduleId: 'reinforcement-footing',
      moduleName: 'Reinforcement',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (answers, scopeData): ExclusionItem[] => {
    const exclusions: ExclusionItem[] = [];
    const sections: LinearSection[] = scopeData?.linearSections || scopeData?.footings || [];
    
    // Check which sections have TM, bars, etc.
    const sectionsWithNoTm = sections.filter(s => (s.tm_type || 'none') === 'none');
    const anyTmEnabled = sections.some(s => (s.tm_type || 'none') !== 'none');
    const anyLigsEnabled = sections.some(s => s.add_ligs);
    const anyHBarsEnabled = sections.some(s => s.horizontal_bars && s.horizontal_bars.length > 0);
    const anyVBarsEnabled = sections.some(s => s.vertical_bars && s.vertical_bars.length > 0);

    if (!anyTmEnabled && !anyHBarsEnabled && !anyVBarsEnabled && !anyLigsEnabled) {
      exclusions.push({
        id: 'no_reinforcement',
        text: 'Steel reinforcement is not included in this quote.',
        moduleId: 'reinforcement-footing',
      });
    } else if (sectionsWithNoTm.length > 0 && sectionsWithNoTm.length < sections.length) {
      exclusions.push({
        id: 'partial_no_tm',
        text: `Trench mesh excluded for: ${sectionsWithNoTm.map(s => s.name).join(', ')}.`,
        moduleId: 'reinforcement-footing',
      });
    }

    if (!anyLigsEnabled && sections.length > 0) {
      exclusions.push({
        id: 'no_ligatures',
        text: 'Ligatures are not included.',
        moduleId: 'reinforcement-footing',
      });
    }

    if (!anyVBarsEnabled && sections.length > 0) {
      exclusions.push({
        id: 'no_vertical_bars',
        text: 'Vertical starter bars are not included.',
        moduleId: 'reinforcement-footing',
      });
    }

    return exclusions;
  },

  validate: (answers: Record<string, any>) => {
    const errors: string[] = [];
    // Validation is now per-section, minimal module-level validation needed
    return { valid: errors.length === 0, errors };
  },
};
