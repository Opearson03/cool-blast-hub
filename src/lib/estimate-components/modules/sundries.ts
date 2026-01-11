import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem } from '../types';

export const sundriesModule: EstimateModule = {
  id: 'sundries',
  name: 'Sundry Materials',
  description: 'Miscellaneous materials and consumables',
  icon: 'Package',

  questions: [
    {
      id: 'sundries_amount',
      type: 'currency',
      label: 'Sundry materials allowance',
      helpText: 'Miscellaneous items: fuel, small tools, safety gear, etc.',
      placeholder: 'Enter amount',
    },
  ],

  calculate: (answers, _priceMap, _scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    const sundriesAmount = Number(answers.sundries_amount) || 100;

    if (sundriesAmount > 0) {
      lineItems.push({
        id: 'sundries',
        description: 'Sundry Materials & Consumables',
        quantity: 1,
        unit: 'lot',
        unitPrice: sundriesAmount,
        total: sundriesAmount,
        category: 'materials',
      });
      subtotal += sundriesAmount;
    }

    return {
      moduleId: 'sundries',
      moduleName: 'Sundry Materials',
      lineItems,
      subtotal,
      exclusions: [],
    };
  },

  getExclusions: (_answers): ExclusionItem[] => {
    return [];
  },

  validate: (_answers) => {
    return { valid: true, errors: [] };
  },
};
