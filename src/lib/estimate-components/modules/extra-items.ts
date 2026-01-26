import type { EstimateModule, ComponentCost, CostLineItem, ExclusionItem, ExtraItem } from '../types';

export const extraItemsModule: EstimateModule = {
  id: 'extra-items',
  name: 'Extra Items',
  description: 'Custom line items not covered by other modules',
  icon: 'Plus',

  questions: [
    {
      id: 'extra_items',
      type: 'text', // Custom rendering in ModuleSection
      label: 'Extra Items',
      helpText: 'Add custom items with description, quantity, rate, and total',
    },
  ],

  calculate: (answers, _priceMap, _scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    const extraItems: ExtraItem[] = answers.extra_items || [];

    extraItems.forEach((item, index) => {
      if (item.description && item.total > 0) {
        lineItems.push({
          id: `extra-item-${index}`,
          description: item.description,
          quantity: item.quantity || 1,
          unit: item.unit || 'ea',
          unitPrice: item.rate || 0,
          total: item.total,
          category: 'other',
        });
        subtotal += item.total;
      }
    });

    return {
      moduleId: 'extra-items',
      moduleName: 'Extra Items',
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
