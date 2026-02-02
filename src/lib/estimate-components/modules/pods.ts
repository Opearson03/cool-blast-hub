// ============= PODS MODULE =============
// Handles waffle pod material costs (pods, accessories, spacers)
// Supports multi-zone waffle pods with different pod depths per zone

import { EstimateModule, ComponentCost, CostLineItem, ExclusionItem, PriceMap, WafflePodZone } from '../types';

// Helper to get price with fallback
function getPrice(priceMap: PriceMap, category: string, itemCode: string, defaultPrice: number): number {
  return priceMap[category]?.[itemCode] ?? defaultPrice;
}

// Map pod thickness to price list code
function getPodPriceCode(thickness: string): string {
  const thicknessNum = parseInt(thickness);
  if (thicknessNum <= 150) return 'POD150';
  if (thicknessNum <= 225) return 'POD225';
  if (thicknessNum <= 300) return 'POD300';
  return 'POD375';
}

// Default prices by pod depth
function getDefaultPodPrice(thickness: string): number {
  const thicknessNum = parseInt(thickness);
  if (thicknessNum <= 150) return 16;
  if (thicknessNum <= 225) return 18.70;
  if (thicknessNum <= 300) return 24.30;
  return 33;
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
    // Pod unit price (default to POD225)
    {
      id: 'pod_unit_price',
      type: 'currency',
      label: 'Pod Unit Price',
      defaultValue: 18.70,
      priceListKey: 'waffle_pods.POD225',
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
    // Pod Rail price (per bag of 20)
    {
      id: 'pod_rail_price',
      type: 'currency',
      label: 'Pod Rail Price (per bag of 20)',
      defaultValue: 26.60,
      priceListKey: 'waffle_pods.PODRAIL',
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
    // Spacer 4-way price (per bag of 25)
    {
      id: 'spacer_4way_price',
      type: 'currency',
      label: '4-Way Spacer Price (per bag of 25)',
      defaultValue: 59,
      priceListKey: 'waffle_pods.POD4',
      showIf: (answers) => answers.include_spacers === true,
    },
    // Spacer 2-way price (per bag of 20)
    {
      id: 'spacer_2way_price',
      type: 'currency',
      label: '2-Way Spacer Price (per bag of 20)',
      defaultValue: 66,
      priceListKey: 'waffle_pods.POD2',
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
        // Prefer takeoff-measured perimeter when available.
        const zonePerimeter = Number(zone._actualPerimeter ?? zone.perimeter) || 0;
        const calculated2Way = Math.ceil(Math.max(0, zonePerimeter - 1.6) / 1.2);
        totalSpacer2Way += Number(zone.spacer_2way_count) || calculated2Way;
        
        if (zone.pod_rails_required || (zone.top_slab_thickness || 85) >= 100) {
          anyRailsRequired = true;
          totalPodRailPacks += Number(zone.pod_rail_packs) || Math.ceil((podCount * 2) / 20);
        }
      });

      // POD SUPPLY - grouped by thickness with depth-based pricing
      if (answers.include_pod_supply !== false) {
        Object.entries(podsByThickness).forEach(([thickness, data]) => {
          if (data.count > 0) {
            const podCode = getPodPriceCode(thickness);
            const podPrice = getPrice(priceMap, 'waffle_pods', podCode, getDefaultPodPrice(thickness));
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
        const podRailPrice = Number(answers.pod_rail_price) || getPrice(priceMap, 'waffle_pods', 'PODRAIL', 26.60);
        const cost = totalPodRailPacks * podRailPrice;
        
        lineItems.push({
          id: 'pod_rails',
          description: `Pod Rails (${totalPodRailPacks} bags of 20)`,
          quantity: totalPodRailPacks,
          unit: 'bags',
          unitPrice: podRailPrice,
          total: Math.round(cost * 100) / 100,
          category: 'materials',
        });
        subtotal += cost;
      }

      // SPACERS (aggregated, priced per bag)
      if (answers.include_spacers !== false) {
        // 4-way spacers: 25 per bag
        if (totalSpacer4Way > 0) {
          const spacer4WayBags = Math.ceil(totalSpacer4Way / 25);
          const spacer4WayBagPrice = Number(answers.spacer_4way_price) || getPrice(priceMap, 'waffle_pods', 'POD4', 59);
          const cost = spacer4WayBags * spacer4WayBagPrice;
          
          lineItems.push({
            id: 'spacers_4way',
            description: `4-Way Spacers (${spacer4WayBags} bags of 25)`,
            quantity: spacer4WayBags,
            unit: 'bags',
            unitPrice: spacer4WayBagPrice,
            total: Math.round(cost * 100) / 100,
            category: 'materials',
          });
          subtotal += cost;
        }

        // 2-way spacers: 20 per bag
        if (totalSpacer2Way > 0) {
          const spacer2WayBags = Math.ceil(totalSpacer2Way / 20);
          const spacer2WayBagPrice = Number(answers.spacer_2way_price) || getPrice(priceMap, 'waffle_pods', 'POD2', 66);
          const cost = spacer2WayBags * spacer2WayBagPrice;
          
          lineItems.push({
            id: 'spacers_2way',
            description: `2-Way Spacers (${spacer2WayBags} bags of 20)`,
            quantity: spacer2WayBags,
            unit: 'bags',
            unitPrice: spacer2WayBagPrice,
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
    // Prefer takeoff-measured perimeter when available.
    const perimeter = Number(scopeData?._actualPerimeter ?? scopeData?.perimeter) || 0;
    const topSlabThickness = Number(scopeData?.top_slab_thickness) || 85;
    const podThickness = scopeData?.pod_thickness || '225';
    const spacer4WayCount = Number(scopeData?.spacer_4way_count) || podCount;
    // 2-way spacers: use stored value, or calculate from perimeter (1 per 1.2m inside perimeter)
    const calculated2Way = Math.ceil(Math.max(0, perimeter - 1.6) / 1.2);
    const spacer2WayCount = Number(scopeData?.spacer_2way_count) || calculated2Way;
    const podRailsRequired = scopeData?.pod_rails_required === true || topSlabThickness >= 100;
    const podRailPacks = Number(scopeData?.pod_rail_packs) || Math.ceil((podCount * 2) / 20);

    // POD SUPPLY - with depth-based pricing
    if (answers.include_pod_supply !== false && podCount > 0) {
      const podCode = getPodPriceCode(podThickness);
      const podPrice = Number(answers.pod_unit_price) || getPrice(priceMap, 'waffle_pods', podCode, getDefaultPodPrice(podThickness));
      const podCost = podCount * podPrice;
      
      lineItems.push({
        id: 'waffle_pods',
        description: `Waffle Pods ${podThickness}mm (${podCount} units)`,
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
      const podRailPrice = Number(answers.pod_rail_price) || getPrice(priceMap, 'waffle_pods', 'PODRAIL', 26.60);
      const cost = podRailPacks * podRailPrice;
      
      lineItems.push({
        id: 'pod_rails',
        description: `Pod Rails (${podRailPacks} bags of 20, for ${topSlabThickness}mm topping)`,
        quantity: podRailPacks,
        unit: 'bags',
        unitPrice: podRailPrice,
        total: Math.round(cost * 100) / 100,
        category: 'materials',
      });
      subtotal += cost;
    }

    // SPACERS (priced per bag)
    if (answers.include_spacers !== false) {
      // 4-Way Spacers: 25 per bag
      if (spacer4WayCount > 0) {
        const spacer4WayBags = Math.ceil(spacer4WayCount / 25);
        const spacer4WayBagPrice = Number(answers.spacer_4way_price) || getPrice(priceMap, 'waffle_pods', 'POD4', 59);
        const cost = spacer4WayBags * spacer4WayBagPrice;
        
        lineItems.push({
          id: 'spacers_4way',
          description: `4-Way Spacers (${spacer4WayBags} bags of 25)`,
          quantity: spacer4WayBags,
          unit: 'bags',
          unitPrice: spacer4WayBagPrice,
          total: Math.round(cost * 100) / 100,
          category: 'materials',
        });
        subtotal += cost;
      }

      // 2-Way Spacers: 20 per bag
      if (spacer2WayCount > 0) {
        const spacer2WayBags = Math.ceil(spacer2WayCount / 20);
        const spacer2WayBagPrice = Number(answers.spacer_2way_price) || getPrice(priceMap, 'waffle_pods', 'POD2', 66);
        const cost = spacer2WayBags * spacer2WayBagPrice;
        
        lineItems.push({
          id: 'spacers_2way',
          description: `2-Way Spacers (${spacer2WayBags} bags of 20)`,
          quantity: spacer2WayBags,
          unit: 'bags',
          unitPrice: spacer2WayBagPrice,
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
