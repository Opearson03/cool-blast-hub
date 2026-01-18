import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';

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

    return {
      moduleId: 'formwork',
      moduleName: 'Formwork',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (answers): ExclusionItem[] => {
    if (!answers.formwork_required) {
      return [
        {
          id: 'no_formwork',
          text: 'Formwork and edge forms are not included in this quote.',
          moduleId: 'formwork',
        },
      ];
    }
    return [];
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
