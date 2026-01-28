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
    // Pod Rails are included when top_slab_thickness >= 100mm
    // ═══════════════════════════════════════════════════════════════
    const isWafflePod = scopeData?.scopeId === 'waffle_pod';
    if (isWafflePod) {
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
    
    // Waffle pod specific exclusion for pods (already in scope defaults, but reinforce here)
    const isWafflePod = scopeData?.scopeId === 'waffle_pod';
    if (isWafflePod) {
      // Pods and spacers are typically supplied by others
      exclusions.push({
        id: 'pods_by_others',
        text: 'Supply of waffle pods and spacers (by others)',
        moduleId: 'formwork',
      });
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
