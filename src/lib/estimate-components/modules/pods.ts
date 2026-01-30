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
    // Pod Rails toggle
    {
      id: 'include_pod_rails',
      type: 'boolean',
      label: 'Include Pod Rails',
      defaultValue: true,
      helpText: 'Rails for thicker topping slabs (100mm+)',
    },
    // Pod Rail price
    {
      id: 'pod_rail_price',
      type: 'currency',
      label: 'Pod Rail Price (per pack)',
      defaultValue: 45,
      priceListKey: 'sundries.PODRAIL',
      showIf: (answers) => answers.include_pod_rails === true,
    },
    // Spacers toggle
    {
      id: 'include_spacers',
      type: 'boolean',
      label: 'Include Spacers',
      defaultValue: true,
      helpText: '4-way and 2-way pod spacers',
    },
    // Spacer 4-way price
    {
      id: 'spacer_4way_price',
      type: 'currency',
      label: '4-Way Spacer Price',
      defaultValue: 2.50,
      showIf: (answers) => answers.include_spacers === true,
    },
    // Spacer 2-way price
    {
      id: 'spacer_2way_price',
      type: 'currency',
      label: '2-Way Spacer Price',
      defaultValue: 1.80,
      showIf: (answers) => answers.include_spacers === true,
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
    // POD RAILS (for thicker slabs, 100mm+)
    // ═══════════════════════════════════════════════════════════════
    if (answers.include_pod_rails !== false && podRailsRequired && podRailPacks > 0) {
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

    // ═══════════════════════════════════════════════════════════════
    // SPACERS
    // ═══════════════════════════════════════════════════════════════
    if (answers.include_spacers !== false) {

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

    if (answers.include_pod_rails === false) {
      exclusions.push({
        id: 'pods-rails-excluded',
        text: 'Pod rails (by others)',
        moduleId: 'pods',
      });
    }

    if (answers.include_spacers === false) {
      exclusions.push({
        id: 'pods-spacers-excluded',
        text: 'Pod spacers (by others)',
        moduleId: 'pods',
      });
    }

    return exclusions;
  },
  validate: () => ({ valid: true, errors: [] }),
};
