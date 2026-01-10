import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem } from '../types';

export const marginModule: EstimateModule = {
  id: 'margin',
  name: 'Margin',
  description: 'Profit margin applied to total cost',
  icon: 'Percent',

  questions: [
    {
      id: 'margin_percent',
      type: 'number',
      label: 'Margin percentage',
      defaultValue: 15,
      min: 0,
      max: 100,
      unit: '%',
      required: true,
      helpText: 'Cannot complete estimate without margin',
    },
  ],

  calculate: (answers, _priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    
    // Margin is calculated at the estimate level, not here
    // This module just captures the percentage
    const marginPercent = Number(answers.margin_percent) || 15;
    
    // If we have a subtotal from scope data, we can show the margin amount
    const subtotalBeforeMargin = Number(scopeData.subtotal_before_margin) || 0;
    const marginAmount = subtotalBeforeMargin * (marginPercent / 100);

    if (marginAmount > 0) {
      lineItems.push({
        id: 'margin',
        description: `Margin (${marginPercent}%)`,
        quantity: 1,
        unit: '%',
        unitPrice: marginPercent,
        total: Math.round(marginAmount * 100) / 100,
        category: 'other',
      });
    }

    return {
      moduleId: 'margin',
      moduleName: 'Margin',
      lineItems,
      subtotal: Math.round(marginAmount * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (_answers): ExclusionItem[] => {
    return [];
  },

  validate: (answers) => {
    const errors: string[] = [];

    if (answers.margin_percent === undefined || answers.margin_percent === null || answers.margin_percent === '') {
      errors.push('Margin percentage is required to complete the estimate');
    } else if (Number(answers.margin_percent) < 0) {
      errors.push('Margin percentage cannot be negative');
    }

    return { valid: errors.length === 0, errors };
  },
};
