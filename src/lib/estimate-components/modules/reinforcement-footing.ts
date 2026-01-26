import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap, LinearSection } from '../types';
import { getPrice, REBAR_WEIGHTS } from '../types';

/**
 * Footing Reinforcement Module (Unified)
 * 
 * Supports per-section reinforcement configuration:
 * - Each linear section (strip footing, retaining wall) can have different TM/bar settings
 * - Follows the same architecture as reinforcement-raft for consistency
 */

// Default values for footing reinforcement
const DEFAULT_TM_TYPE = 'L11TM4';
const DEFAULT_BAR_SIZE = 'N16';
const DEFAULT_BAR_SPACING = '200';
const DEFAULT_BAR_CONFIG = 'bottom';
const DEFAULT_LIG_SIZE = 'R10';
const DEFAULT_LIG_CENTRES = 200;
const DEFAULT_VERTICAL_BAR_SIZE = 'N16';
const DEFAULT_VERTICAL_BAR_CENTRES = 400;
const DEFAULT_LAP_ALLOWANCE = 12.5;
const LAP_ALLOWANCE = 1.125;

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

    // Check if any section has reinforcement
    const hasAnyReo = sections.length > 0 
      ? sections.some(s => {
          const reoType = s.reo_type || 'none';
          return reoType !== 'none';
        })
      : false;

    if (!hasAnyReo) {
      return {
        moduleId: 'reinforcement-footing',
        moduleName: 'Reinforcement',
        lineItems: [],
        subtotal: 0,
        exclusions: [],
      };
    }

    // ═══════════════════════════════════════════════════════════════
    // TRENCH MESH & BAR REINFORCEMENT (per section)
    // ═══════════════════════════════════════════════════════════════
    if (sections.length > 0) {
      sections.forEach((section) => {
        const length = section._actualLength || section.length;
        if (length <= 0) return;

        const reoType = section.reo_type || 'none';
        if (reoType === 'none') return;

        const showTm = reoType === 'trench_mesh' || reoType === 'both';
        const showBar = reoType === 'bar' || reoType === 'both';
        
        // Trench Mesh
        if (showTm) {
          const tmType = section.tm_type || DEFAULT_TM_TYPE;
          if (tmType !== 'none') {
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
          }
        }

        // Bar Reinforcement
        if (showBar) {
          const barSize = section.bar_size || DEFAULT_BAR_SIZE;
          const spacing = Number(section.bar_spacing || DEFAULT_BAR_SPACING);
          const barConfig = section.bar_config || DEFAULT_BAR_CONFIG;
          const layers = barConfig === 'top_bottom' ? 2 : 1;
          
          const pricePerTonne = getPrice(priceMap, 'rebar', `${barSize} CB`, 2100);
          const weightPerMetre = REBAR_WEIGHTS[barSize] || 1.58;
          
          // Calculate number of bars based on section width (dimension1)
          const sectionWidth = section.dimension1 / 1000; // convert mm to m
          const barsPerMetre = 1000 / spacing;
          const barsAcross = Math.ceil(sectionWidth * barsPerMetre);
          const totalBarLength = barsAcross * length * layers * lapPercent;
          const totalWeight = totalBarLength * weightPerMetre;
          const barCost = (totalWeight / 1000) * pricePerTonne;

          lineItems.push({
            id: `bar_${section.id}`,
            description: `${section.name} – ${barSize} @ ${spacing}mm (${layers}L, ${Math.round(totalWeight)}kg)`,
            quantity: Math.round(totalWeight),
            unit: 'kg',
            unitPrice: pricePerTonne / 1000,
            total: Math.round(barCost * 100) / 100,
            category: 'materials',
          });
          subtotal += barCost;
        }
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // TM CHAIRS (per-section configuration)
    // ═══════════════════════════════════════════════════════════════
    if (sections.length > 0) {
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
    // VERTICAL STARTERS (per section)
    // ═══════════════════════════════════════════════════════════════
    if (sections.length > 0) {
      // Aggregate starters by bar size
      const startersBySize: Record<string, { count: number; weight: number }> = {};
      
      sections.forEach((section) => {
        const addVertical = section.add_vertical_bars ?? false;
        if (!addVertical) return;
        
        const length = section._actualLength || section.length;
        if (length <= 0) return;
        
        const barSize = section.vertical_bar_size || DEFAULT_VERTICAL_BAR_SIZE;
        const barCentres = section.vertical_bar_centres ?? DEFAULT_VERTICAL_BAR_CENTRES;
        const barCount = Math.ceil((length * 1000) / barCentres);
        
        // Default starter length: 1200mm
        const barLength = 1.2;
        const totalBarLength = barCount * barLength * lapPercent;
        const weightPerMetre = REBAR_WEIGHTS[barSize] || 1.58;
        const totalWeight = totalBarLength * weightPerMetre;
        
        if (!startersBySize[barSize]) {
          startersBySize[barSize] = { count: 0, weight: 0 };
        }
        startersBySize[barSize].count += barCount;
        startersBySize[barSize].weight += totalWeight;
      });
      
      // Generate line items for each bar size
      Object.entries(startersBySize).forEach(([barSize, { count, weight }]) => {
        const pricePerTonne = getPrice(priceMap, 'rebar', `${barSize} CB`, 2100);
        const starterCost = (weight / 1000) * pricePerTonne;
        
        lineItems.push({
          id: `starters_${barSize}`,
          description: `Vertical Starters ${barSize} (${count} × 1200mm, ${Math.round(weight)}kg)`,
          quantity: count,
          unit: 'pcs',
          unitPrice: Math.round((starterCost / count) * 100) / 100,
          total: Math.round(starterCost * 100) / 100,
          category: 'materials',
        });
        subtotal += starterCost;
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
    
    // Default settings from module answers
    const defaultReoType = answers.include_trench_mesh ? 'trench_mesh' : 'none';
    const defaultAddLigs = answers.add_ligs ?? false;
    const defaultAddVerticalBars = answers.add_vertical_bars ?? false;

    // Check if any section has reinforcement
    const sectionsWithNoReo = sections.filter(s => (s.reo_type || defaultReoType) === 'none');
    const anyTmEnabled = sections.some(s => {
      const reoType = s.reo_type || defaultReoType;
      return reoType === 'trench_mesh' || reoType === 'both';
    }) || answers.include_trench_mesh;
    const anyLigsEnabled = sections.some(s => s.add_ligs ?? defaultAddLigs) || defaultAddLigs;
    const anyStartersEnabled = sections.some(s => s.add_vertical_bars ?? defaultAddVerticalBars) || defaultAddVerticalBars;

    if (!anyTmEnabled && !anyLigsEnabled && !anyStartersEnabled) {
      exclusions.push({
        id: 'no_reinforcement',
        text: 'Steel reinforcement is not included in this quote.',
        moduleId: 'reinforcement-footing',
      });
    } else if (sectionsWithNoReo.length > 0 && sectionsWithNoReo.length < sections.length) {
      exclusions.push({
        id: 'partial_no_reo',
        text: `Steel reinforcement excluded for: ${sectionsWithNoReo.map(s => s.name).join(', ')}.`,
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

    if (!anyStartersEnabled && sections.length > 0) {
      exclusions.push({
        id: 'no_starters',
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
