import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice } from '../types';

export const cleanupModule: EstimateModule = {
  id: 'cleanup',
  name: 'Cleanup',
  description: 'Site cleanup and waste disposal',
  icon: 'Trash2',

  questions: [
    {
      id: 'cleanup_men',
      type: 'number',
      label: 'How many men for cleanup?',
      defaultValue: 2,
      min: 1,
      max: 10,
    },
    {
      id: 'cleanup_hours',
      type: 'number',
      label: 'How many hours?',
      defaultValue: 2,
      min: 0.5,
      step: 0.5,
      unit: 'hrs',
    },
    {
      id: 'cleanup_labour_rate',
      type: 'currency',
      label: 'Labour rate per hour',
      defaultValue: 75,
      priceListKey: 'labour.LABOUR HR',
      unit: '/hr',
    },
    {
      id: 'disposal_cost',
      type: 'currency',
      label: 'Disposal / tip cost',
      defaultValue: 100,
      priceListKey: 'materials.DISPOSAL',
      helpText: 'Waste removal and tip fees',
    },
  ],

  calculate: (answers, priceMap, _scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    const men = Number(answers.cleanup_men) || 2;
    const hours = Number(answers.cleanup_hours) || 2;
    const labourRate = Number(answers.cleanup_labour_rate) || getPrice(priceMap, 'labour', 'LABOUR HR', 75);
    const disposalCost = Number(answers.disposal_cost) || 0;

    const totalHours = men * hours;
    const labourCost = totalHours * labourRate;

    if (labourCost > 0) {
      lineItems.push({
        id: 'cleanup_labour',
        description: `Cleanup Labour (${men} men × ${hours} hrs)`,
        quantity: totalHours,
        unit: 'hrs',
        unitPrice: labourRate,
        total: labourCost,
        category: 'labour',
      });
      subtotal += labourCost;
    }

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

  validate: (answers) => {
    const errors: string[] = [];

    if (!answers.cleanup_men || answers.cleanup_men < 1) {
      errors.push('Please specify the number of men for cleanup');
    }
    if (!answers.cleanup_hours || answers.cleanup_hours < 0.5) {
      errors.push('Please specify cleanup hours');
    }

    return { valid: errors.length === 0, errors };
  },
};
