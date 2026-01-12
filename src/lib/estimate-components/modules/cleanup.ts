import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice } from '../types';

export const cleanupModule: EstimateModule = {
  id: 'cleanup',
  name: 'Cleanup',
  description: 'Site cleanup and waste disposal',
  icon: 'Trash2',

  questions: [
    {
      id: 'disposal_cost',
      type: 'currency',
      label: 'Disposal / tip cost',
      priceListKey: 'materials.DISPOSAL',
      helpText: 'Waste removal and tip fees',
    },
  ],

  calculate: (answers, priceMap, _scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    const disposalCost = Number(answers.disposal_cost) || 0;

    if (disposalCost > 0) {
      lineItems.push({
        id: 'disposal',
        description: 'Waste Disposal / Tip Fees',
        quantity: 1,
        unit: 'lot',
        unitPrice: disposalCost,
        total: disposalCost,
        category: 'other',
      });
      subtotal += disposalCost;
    }

    return {
      moduleId: 'cleanup',
      moduleName: 'Cleanup',
      lineItems,
      subtotal,
      exclusions: [],
    };
  },

  getExclusions: (_answers): ExclusionItem[] => {
    // Cleanup is always included if this module is used
    return [];
  },

  validate: (_answers) => {
    // No required fields - disposal is optional
    return { valid: true, errors: [] };
  },
};
