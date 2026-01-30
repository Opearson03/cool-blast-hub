// ============= PODS MODULE =============
// Handles waffle pod material costs (pods, accessories, spacers)
// This module is separate from reinforcement as pods are structural void-formers

import { EstimateModule, ComponentCost, CostLineItem, ExclusionItem, PriceMap } from '../types';

// Helper to get price with fallback
function getPrice(priceMap: PriceMap, category: string, itemCode: string, defaultPrice: number): number {
  return priceMap[category]?.[itemCode] ?? defaultPrice;
}

export const podsModule: EstimateModule = {
  id: 'pods',
  name: 'Pods',
  description: 'Waffle pod materials and accessories',
  questions: [
    // Pod Count - auto-calculated from area
    {
      id: 'pod_count_display',
      type: 'number',
      label: 'Pod Count',
      derivedReadOnly: true,
      helpText: 'Calculated from slab area ÷ module pitch²',
      deriveFrom: (scopeData) => {
        return Number(scopeData?.pod_count) || 0;
      },
    },
    // Pod supply toggle
    {
      id: 'include_pod_supply',
      type: 'boolean',
      label: 'Include Pod Supply',
      defaultValue: true,
      helpText: 'Toggle off if pods are supplied by others',
    },
    // Pod unit price
    {
      id: 'pod_unit_price',
      type: 'currency',
      label: 'Pod Unit Price',
      defaultValue: 14,
      priceListKey: 'sundries.WAFFLEPOD',
      showIf: (answers) => answers.include_pod_supply === true,
    },
    // Accessories toggle
    {
      id: 'include_accessories',
      type: 'boolean',
      label: 'Include Accessories',
      defaultValue: true,
      helpText: 'TM chairs, bar chairs, pod rails, spacers',
    },
    // TM Chair price
    {
      id: 'tm_chair_price',
      type: 'currency',
      label: 'TM Chair Price (per bag)',
      defaultValue: 12.50,
      priceListKey: 'consumables.TMCHAIR',
      showIf: (answers) => answers.include_accessories === true,
    },
    // Bar Chair price
    {
      id: 'bar_chair_price',
      type: 'currency',
      label: 'Bar Chair Price (per bag)',
      defaultValue: 18,
      priceListKey: 'consumables.BARCHAIR',
      showIf: (answers) => answers.include_accessories === true,
    },
    // Pod Rail price
    {
      id: 'pod_rail_price',
      type: 'currency',
      label: 'Pod Rail Price (per pack)',
      defaultValue: 45,
      priceListKey: 'sundries.PODRAIL',
      showIf: (answers) => answers.include_accessories === true,
    },
    // Spacer 4-way price
    {
      id: 'spacer_4way_price',
      type: 'currency',
      label: '4-Way Spacer Price',
      defaultValue: 2.50,
      showIf: (answers) => answers.include_accessories === true,
    },
    // Spacer 2-way price
    {
      id: 'spacer_2way_price',
      type: 'currency',
      label: '2-Way Spacer Price',
      defaultValue: 1.80,
      showIf: (answers) => answers.include_accessories === true,
    },
  ],
  calculate: (answers, priceMap, scopeData) => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    // Skip if not waffle pod scope
    if (scopeData?.scopeId !== 'waffle_pod') {
      return { moduleId: 'pods', moduleName: 'Pods', lineItems, subtotal, exclusions: [] };
    }

    const podCount = Number(scopeData?.pod_count) || 0;
    const perimeter = Number(scopeData?.perimeter) || 0;
    const topSlabThickness = Number(scopeData?.top_slab_thickness) || 85;
    const tmChairsCount = Number(scopeData?.tm_chairs_count) || 0;
    const barChairsCount = Number(scopeData?.bar_chairs_count) || 0;
    const spacer4WayCount = Number(scopeData?.spacer_4way_count) || 0;
    const spacer2WayCount = Number(scopeData?.spacer_2way_count) || 0;
    const podRailsRequired = scopeData?.pod_rails_required === true;
    const podRailPacks = Number(scopeData?.pod_rail_packs) || 0;

    // ═══════════════════════════════════════════════════════════════
    // POD SUPPLY
    // ═══════════════════════════════════════════════════════════════
    if (answers.include_pod_supply !== false && podCount > 0) {
      const podPrice = Number(answers.pod_unit_price) || getPrice(priceMap, 'sundries', 'WAFFLEPOD', 14);
      const podCost = podCount * podPrice;
      
      lineItems.push({
        id: 'waffle_pods',
        description: `Waffle Pods (${podCount} units)`,
        quantity: podCount,
        unit: 'pods',
        unitPrice: podPrice,
        total: Math.round(podCost * 100) / 100,
        category: 'materials',
      });
      subtotal += podCost;
    }

    // ═══════════════════════════════════════════════════════════════
    // ACCESSORIES
    // ═══════════════════════════════════════════════════════════════
    if (answers.include_accessories !== false) {
      // TM Chairs (for perimeter beams)
      if (tmChairsCount > 0) {
        const tmChairPrice = Number(answers.tm_chair_price) || getPrice(priceMap, 'consumables', 'TMCHAIR', 12.50);
        const bags = Math.ceil(tmChairsCount / 25);
        const cost = bags * tmChairPrice;
        
        lineItems.push({
          id: 'tm_chairs',
          description: `TM Chairs (${bags} bags of 25, ~${tmChairsCount} chairs)`,
          quantity: bags,
          unit: 'bags',
          unitPrice: tmChairPrice,
          total: Math.round(cost * 100) / 100,
          category: 'materials',
        });
        subtotal += cost;
      }

      // Bar Chairs (for rib reinforcement support)
      if (barChairsCount > 0) {
        const barChairPrice = Number(answers.bar_chair_price) || getPrice(priceMap, 'consumables', 'BARCHAIR', 18);
        const bags = Math.ceil(barChairsCount / 50);
        const cost = bags * barChairPrice;
        
        lineItems.push({
          id: 'bar_chairs',
          description: `Bar Chairs (${bags} bags of 50, ~${barChairsCount} chairs)`,
          quantity: bags,
          unit: 'bags',
          unitPrice: barChairPrice,
          total: Math.round(cost * 100) / 100,
          category: 'materials',
        });
        subtotal += cost;
      }

      // Pod Rails (for thicker slabs, 100mm+)
      if (podRailsRequired && podRailPacks > 0) {
        const podRailPrice = Number(answers.pod_rail_price) || getPrice(priceMap, 'sundries', 'PODRAIL', 45);
        const cost = podRailPacks * podRailPrice;
        
        lineItems.push({
          id: 'pod_rails',
          description: `Pod Rails (${podRailPacks} packs of 20, for ${topSlabThickness}mm topping)`,
          quantity: podRailPacks,
          unit: 'packs',
          unitPrice: podRailPrice,
          total: Math.round(cost * 100) / 100,
          category: 'materials',
        });
        subtotal += cost;
      }

      // 4-Way Spacers
      if (spacer4WayCount > 0) {
        const spacerPrice = Number(answers.spacer_4way_price) || 2.50;
        const cost = spacer4WayCount * spacerPrice;
        
        lineItems.push({
          id: 'spacers_4way',
          description: `4-Way Spacers (${spacer4WayCount} units)`,
          quantity: spacer4WayCount,
          unit: 'ea',
          unitPrice: spacerPrice,
          total: Math.round(cost * 100) / 100,
          category: 'materials',
        });
        subtotal += cost;
      }

      // 2-Way Spacers
      if (spacer2WayCount > 0) {
        const spacerPrice = Number(answers.spacer_2way_price) || 1.80;
        const cost = spacer2WayCount * spacerPrice;
        
        lineItems.push({
          id: 'spacers_2way',
          description: `2-Way Spacers (${spacer2WayCount} units)`,
          quantity: spacer2WayCount,
          unit: 'ea',
          unitPrice: spacerPrice,
          total: Math.round(cost * 100) / 100,
          category: 'materials',
        });
        subtotal += cost;
      }
    }

    return {
      moduleId: 'pods',
      moduleName: 'Pods',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },
  getExclusions: (answers, scopeData) => {
    const exclusions: ExclusionItem[] = [];
    
    if (scopeData?.scopeId !== 'waffle_pod') {
      return exclusions;
    }

    if (answers.include_pod_supply === false) {
      exclusions.push({
        id: 'pods-supply-excluded',
        text: 'Waffle pod supply (by others)',
        moduleId: 'pods',
      });
    }

    if (answers.include_accessories === false) {
      exclusions.push({
        id: 'pods-accessories-excluded',
        text: 'Pod accessories (TM chairs, bar chairs, spacers, rails)',
        moduleId: 'pods',
      });
    }

    return exclusions;
  },
  validate: () => ({ valid: true, errors: [] }),
};
