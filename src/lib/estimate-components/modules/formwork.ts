import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice } from '../types';

export const formworkModule: EstimateModule = {
  id: 'formwork',
  name: 'Formwork',
  description: 'Additional formwork costs allowance',
  icon: 'Box',

  questions: [
    {
      id: 'formwork_required',
      type: 'boolean',
      label: 'Are there any additional formwork costs required?',
      defaultValue: false,
      required: true,
      helpText: 'e.g., formply for drop edge beam, boxing, etc.',
    },
    {
      id: 'formwork_allowance',
      type: 'currency',
      label: 'Formwork Cost Allowance',
      defaultValue: 0,
      min: 0,
      helpText: 'Enter total allowance for formwork materials and setup',
      showIf: (answers) => answers.formwork_required === true,
    },
    // Waffle Pod specific: pods/spacers supply question
    {
      id: 'pods_supplied_by_concreter',
      type: 'boolean',
      label: 'Pods & Spacers Supplied by Concreter?',
      defaultValue: false,
      helpText: 'If Yes, pods and spacers will be included in quote. If No, they are excluded (supply by others).',
      showIf: (_answers, scopeData) => scopeData?.scopeId === 'waffle_pod',
    },
  ],

  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    // Standard formwork allowance
    if (answers.formwork_required) {
      const allowance = Number(answers.formwork_allowance) || 0;
      
      if (allowance > 0) {
        lineItems.push({
          id: 'formwork_allowance',
          description: 'Formwork Allowance',
          quantity: 1,
          unit: 'lot',
          unitPrice: allowance,
          total: allowance,
          category: 'materials',
        });
        subtotal += allowance;
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // WAFFLE POD SPECIFIC FORMWORK ITEMS
    // Pods, spacers, and rails when supplied by concreter
    // ═══════════════════════════════════════════════════════════════
    const isWafflePod = scopeData?.scopeId === 'waffle_pod';
    if (isWafflePod) {
      const podsSuppliedByConcreter = answers.pods_supplied_by_concreter === true || scopeData?.pods_supplied_by_concreter === true;
      
      // Waffle Pods (only when supplied by concreter)
      if (podsSuppliedByConcreter) {
        const podCount = Number(scopeData?.pod_count) || 0;
        const podSize = Number(scopeData?.pod_size) || 1090;
        const podThickness = Number(scopeData?.pod_thickness) || 225;
        
        if (podCount > 0) {
          const podPrice = getPrice(priceMap, 'consumables', 'WAFFLE POD', 12); // Default $12 per pod
          const podCost = podCount * podPrice;
          
          lineItems.push({
            id: 'waffle_pods',
            description: `Waffle Pods (${podSize}×${podSize}×${podThickness}mm)`,
            quantity: podCount,
            unit: 'units',
            unitPrice: podPrice,
            total: Math.round(podCost * 100) / 100,
            category: 'materials',
          });
          subtotal += podCost;
        }
        
        // 4-Way Spacers
        const spacer4WayCount = Number(scopeData?.spacer_4way_count) || 0;
        if (spacer4WayCount > 0) {
          const spacer4WayPrice = getPrice(priceMap, 'consumables', '4-WAY SPACER', 1.50);
          const spacer4WayCost = spacer4WayCount * spacer4WayPrice;
          
          lineItems.push({
            id: 'waffle_spacers_4way',
            description: '4-Way Waffle Pod Spacers',
            quantity: spacer4WayCount,
            unit: 'units',
            unitPrice: spacer4WayPrice,
            total: Math.round(spacer4WayCost * 100) / 100,
            category: 'materials',
          });
          subtotal += spacer4WayCost;
        }
        
        // 2-Way Spacers
        const spacer2WayCount = Number(scopeData?.spacer_2way_count) || 0;
        if (spacer2WayCount > 0) {
          const spacer2WayPrice = getPrice(priceMap, 'consumables', '2-WAY SPACER', 1.00);
          const spacer2WayCost = spacer2WayCount * spacer2WayPrice;
          
          lineItems.push({
            id: 'waffle_spacers_2way',
            description: '2-Way Waffle Pod Spacers',
            quantity: spacer2WayCount,
            unit: 'units',
            unitPrice: spacer2WayPrice,
            total: Math.round(spacer2WayCost * 100) / 100,
            category: 'materials',
          });
          subtotal += spacer2WayCost;
        }
      }
      
      // Pod Rails (always included if required, regardless of supply question)
      const podRailsRequired = scopeData?.pod_rails_required === true;
      const podRailPacks = Number(scopeData?.pod_rail_packs) || 0;
      
      if (podRailsRequired && podRailPacks > 0) {
        const podRailPrice = getPrice(priceMap, 'consumables', 'POD RAIL', 26);
        const podRailCost = podRailPacks * podRailPrice;
        
        lineItems.push({
          id: 'waffle_pod_rails',
          description: `Pod Rail Spacers (${podRailPacks} × 20)`,
          quantity: podRailPacks,
          unit: 'packs',
          unitPrice: podRailPrice,
          total: Math.round(podRailCost * 100) / 100,
          category: 'materials',
        });
        subtotal += podRailCost;
      }
    }

    return {
      moduleId: 'formwork',
      moduleName: 'Formwork',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (answers, scopeData): ExclusionItem[] => {
    const exclusions: ExclusionItem[] = [];
    
    if (!answers.formwork_required) {
      exclusions.push({
        id: 'no_formwork',
        text: 'Formwork and edge forms are not included in this quote.',
        moduleId: 'formwork',
      });
    }
    
    // Waffle pod specific exclusion for pods (only if NOT supplied by concreter)
    const isWafflePod = scopeData?.scopeId === 'waffle_pod';
    if (isWafflePod) {
      const podsSuppliedByConcreter = answers.pods_supplied_by_concreter === true || scopeData?.pods_supplied_by_concreter === true;
      
      if (!podsSuppliedByConcreter) {
        exclusions.push({
          id: 'pods_by_others',
          text: 'Supply of waffle pods and spacers (by others)',
          moduleId: 'formwork',
        });
      }
    }
    
    return exclusions;
  },

  validate: (answers) => {
    const errors: string[] = [];
    
    if (answers.formwork_required) {
      const allowance = Number(answers.formwork_allowance) || 0;
      if (allowance <= 0) {
        errors.push('Please enter a formwork cost allowance');
      }
    }

    return { valid: errors.length === 0, errors };
  },
};
