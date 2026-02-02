// ============= PODS MODULE =============
// Handles waffle pod material costs (pods, accessories, spacers)
// Supports multi-zone waffle pods with different pod depths per zone

import { EstimateModule, ComponentCost, CostLineItem, ExclusionItem, PriceMap, WafflePodZone } from '../types';

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

    // Check for multi-zone support
    const podZones: WafflePodZone[] = scopeData?.podZones || [];
    const hasZones = podZones.length > 0;

    // ═══════════════════════════════════════════════════════════════
    // MULTI-ZONE CALCULATION
    // ═══════════════════════════════════════════════════════════════
    if (hasZones) {
      // Aggregate totals per pod thickness for grouped line items
      const podsByThickness: Record<string, { count: number; zones: string[] }> = {};
      let totalSpacer4Way = 0;
      let totalSpacer2Way = 0;
      let totalPodRailPacks = 0;
      let anyRailsRequired = false;

      podZones.forEach(zone => {
        const podCount = Number(zone.pod_count) || 0;
        const thickness = zone.pod_thickness || '225';
        
        // Group pods by thickness
        if (!podsByThickness[thickness]) {
          podsByThickness[thickness] = { count: 0, zones: [] };
        }
        podsByThickness[thickness].count += podCount;
        podsByThickness[thickness].zones.push(zone.name);

        // Accumulate accessories
        totalSpacer4Way += Number(zone.spacer_4way_count) || podCount;
        // 2-way spacers: use stored value, or calculate from perimeter (1 per 1.2m inside perimeter)
        const zonePerimeter = Number(zone.perimeter) || 0;
        const calculated2Way = Math.ceil(Math.max(0, zonePerimeter - 1.6) / 1.2);
        totalSpacer2Way += Number(zone.spacer_2way_count) || calculated2Way;
        
        if (zone.pod_rails_required || (zone.top_slab_thickness || 85) >= 100) {
          anyRailsRequired = true;
          totalPodRailPacks += Number(zone.pod_rail_packs) || Math.ceil((podCount * 2) / 20);
        }
      });

      // POD SUPPLY - grouped by thickness
      if (answers.include_pod_supply !== false) {
        const podPrice = Number(answers.pod_unit_price) || getPrice(priceMap, 'sundries', 'WAFFLEPOD', 14);
        
        Object.entries(podsByThickness).forEach(([thickness, data]) => {
          if (data.count > 0) {
            const podCost = data.count * podPrice;
            const zoneNames = data.zones.length <= 2 ? data.zones.join(' & ') : `${data.zones.length} zones`;
            
            lineItems.push({
              id: `waffle_pods_${thickness}`,
              description: `Waffle Pods ${thickness}mm (${data.count} units) – ${zoneNames}`,
              quantity: data.count,
              unit: 'pods',
              unitPrice: podPrice,
              total: Math.round(podCost * 100) / 100,
              category: 'materials',
            });
            subtotal += podCost;
          }
        });
      }

      // POD RAILS (aggregated across zones)
      if (answers.include_pod_rails !== false && anyRailsRequired && totalPodRailPacks > 0) {
        const podRailPrice = Number(answers.pod_rail_price) || getPrice(priceMap, 'sundries', 'PODRAIL', 45);
        const cost = totalPodRailPacks * podRailPrice;
        
        lineItems.push({
          id: 'pod_rails',
          description: `Pod Rails (${totalPodRailPacks} packs of 20)`,
          quantity: totalPodRailPacks,
          unit: 'packs',
          unitPrice: podRailPrice,
          total: Math.round(cost * 100) / 100,
          category: 'materials',
        });
        subtotal += cost;
      }

      // SPACERS (aggregated)
      if (answers.include_spacers !== false) {
        if (totalSpacer4Way > 0) {
          const spacerPrice = Number(answers.spacer_4way_price) || 2.50;
          const cost = totalSpacer4Way * spacerPrice;
          
          lineItems.push({
            id: 'spacers_4way',
            description: `4-Way Spacers (${totalSpacer4Way} units)`,
            quantity: totalSpacer4Way,
            unit: 'ea',
            unitPrice: spacerPrice,
            total: Math.round(cost * 100) / 100,
            category: 'materials',
          });
          subtotal += cost;
        }

        if (totalSpacer2Way > 0) {
          const spacerPrice = Number(answers.spacer_2way_price) || 1.80;
          const cost = totalSpacer2Way * spacerPrice;
          
          lineItems.push({
            id: 'spacers_2way',
            description: `2-Way Spacers (${totalSpacer2Way} units)`,
            quantity: totalSpacer2Way,
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
    }

    // ═══════════════════════════════════════════════════════════════
    // LEGACY SINGLE-ZONE CALCULATION (backward compatibility)
    // ═══════════════════════════════════════════════════════════════
    const podCount = Number(scopeData?.pod_count) || 0;
    const perimeter = Number(scopeData?.perimeter) || 0;
    const topSlabThickness = Number(scopeData?.top_slab_thickness) || 85;
    const spacer4WayCount = Number(scopeData?.spacer_4way_count) || podCount;
    // 2-way spacers: use stored value, or calculate from perimeter (1 per 1.2m inside perimeter)
    const calculated2Way = Math.ceil(Math.max(0, perimeter - 1.6) / 1.2);
    const spacer2WayCount = Number(scopeData?.spacer_2way_count) || calculated2Way;
    const podRailsRequired = scopeData?.pod_rails_required === true || topSlabThickness >= 100;
    const podRailPacks = Number(scopeData?.pod_rail_packs) || Math.ceil((podCount * 2) / 20);

    // POD SUPPLY
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

    // POD RAILS (for thicker slabs, 100mm+)
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

    // SPACERS
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
