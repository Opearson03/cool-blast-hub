import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice } from '../types';

export const formworkModule: EstimateModule = {
  id: 'formwork',
  name: 'Formwork',
  description: 'Edge forms, boxing, and formwork setup',
  icon: 'Box',

  questions: [
    {
      id: 'formwork_required',
      type: 'boolean',
      label: 'Is formwork required?',
      defaultValue: false,
      required: true,
    },
    {
      id: 'formwork_men',
      type: 'number',
      label: 'How many men?',
      defaultValue: 2,
      min: 1,
      max: 20,
      showIf: (answers) => answers.formwork_required === true,
    },
    {
      id: 'formwork_hours_per_man',
      type: 'number',
      label: 'How many hours per man?',
      defaultValue: 4,
      min: 0.5,
      step: 0.5,
      unit: 'hrs',
      showIf: (answers) => answers.formwork_required === true,
    },
    {
      id: 'formwork_labour_rate',
      type: 'currency',
      label: 'Labour rate per hour',
      defaultValue: 75,
      priceListKey: 'labour.LABOUR HR',
      unit: '/hr',
      showIf: (answers) => answers.formwork_required === true,
    },
    {
      id: 'formwork_material_cost',
      type: 'currency',
      label: 'Expected formwork material cost',
      defaultValue: 200,
      helpText: 'Timber, pins, nails, etc.',
      showIf: (answers) => answers.formwork_required === true,
    },
  ],

  calculate: (answers, priceMap, _scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    if (answers.formwork_required) {
      const men = Number(answers.formwork_men) || 2;
      const hoursPerMan = Number(answers.formwork_hours_per_man) || 4;
      const labourRate = Number(answers.formwork_labour_rate) || getPrice(priceMap, 'labour', 'LABOUR HR', 75);
      const materialCost = Number(answers.formwork_material_cost) || 0;

      const totalHours = men * hoursPerMan;
      const labourCost = totalHours * labourRate;

      if (labourCost > 0) {
        lineItems.push({
          id: 'formwork_labour',
          description: `Formwork Labour (${men} men × ${hoursPerMan} hrs)`,
          quantity: totalHours,
          unit: 'hrs',
          unitPrice: labourRate,
          total: labourCost,
          category: 'labour',
        });
        subtotal += labourCost;
      }

      if (materialCost > 0) {
        lineItems.push({
          id: 'formwork_materials',
          description: 'Formwork Materials',
          quantity: 1,
          unit: 'lot',
          unitPrice: materialCost,
          total: materialCost,
          category: 'materials',
        });
        subtotal += materialCost;
      }
    }

    return {
      moduleId: 'formwork',
      moduleName: 'Formwork',
      lineItems,
      subtotal,
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
      if (!answers.formwork_men || answers.formwork_men < 1) {
        errors.push('Please specify the number of men for formwork');
      }
      if (!answers.formwork_hours_per_man || answers.formwork_hours_per_man < 0.5) {
        errors.push('Please specify hours per man for formwork');
      }
    }

    return { valid: errors.length === 0, errors };
  },
};
