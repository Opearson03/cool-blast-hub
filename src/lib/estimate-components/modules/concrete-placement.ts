import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice } from '../types';

export const concretePlacementModule: EstimateModule = {
  id: 'concrete_placement',
  name: 'Concrete Placement',
  description: 'Labour for placing and finishing concrete',
  icon: 'Users',

  questions: [
    {
      id: 'placement_men',
      type: 'number',
      label: 'How many men for concrete placement?',
      defaultValue: 3,
      min: 1,
      max: 20,
      required: true,
    },
    {
      id: 'placement_hours_per_man',
      type: 'number',
      label: 'How many hours per man?',
      defaultValue: 4,
      min: 0.5,
      step: 0.5,
      unit: 'hrs',
      required: true,
    },
    {
      id: 'highest_rate',
      type: 'currency',
      label: 'What is your highest paid man costing per hour?',
      helpText: 'Including all expenses (super, insurance, tools, etc.)',
      defaultValue: 95,
      unit: '/hr',
      required: true,
    },
    {
      id: 'use_average_rate',
      type: 'boolean',
      label: 'Use average rate for all workers?',
      helpText: 'If no, highest rate applies to 1 worker, labour rate to others',
      defaultValue: true,
    },
    {
      id: 'standard_labour_rate',
      type: 'currency',
      label: 'Standard labour rate per hour',
      defaultValue: 75,
      priceListKey: 'labour.LABOUR HR',
      unit: '/hr',
      showIf: (answers) => answers.use_average_rate === false,
    },
  ],

  calculate: (answers, priceMap, _scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    const men = Number(answers.placement_men) || 3;
    const hoursPerMan = Number(answers.placement_hours_per_man) || 4;
    const highestRate = Number(answers.highest_rate) || 95;
    const useAverageRate = answers.use_average_rate !== false;
    const standardRate = Number(answers.standard_labour_rate) || getPrice(priceMap, 'labour', 'LABOUR HR', 75);

    if (useAverageRate) {
      // All workers at the highest rate
      const totalHours = men * hoursPerMan;
      const totalCost = totalHours * highestRate;

      lineItems.push({
        id: 'placement_labour',
        description: `Concrete Placement Labour (${men} men × ${hoursPerMan} hrs @ $${highestRate}/hr)`,
        quantity: totalHours,
        unit: 'hrs',
        unitPrice: highestRate,
        total: totalCost,
        category: 'labour',
      });
      subtotal += totalCost;
    } else {
      // 1 worker at highest rate, rest at standard rate
      const leadWorkerCost = hoursPerMan * highestRate;
      const otherWorkers = men - 1;
      const otherWorkersCost = otherWorkers * hoursPerMan * standardRate;

      lineItems.push({
        id: 'lead_placement_labour',
        description: `Lead Worker Concrete Placement (${hoursPerMan} hrs @ $${highestRate}/hr)`,
        quantity: hoursPerMan,
        unit: 'hrs',
        unitPrice: highestRate,
        total: leadWorkerCost,
        category: 'labour',
      });
      subtotal += leadWorkerCost;

      if (otherWorkers > 0) {
        lineItems.push({
          id: 'other_placement_labour',
          description: `Other Workers Concrete Placement (${otherWorkers} men × ${hoursPerMan} hrs @ $${standardRate}/hr)`,
          quantity: otherWorkers * hoursPerMan,
          unit: 'hrs',
          unitPrice: standardRate,
          total: otherWorkersCost,
          category: 'labour',
        });
        subtotal += otherWorkersCost;
      }
    }

    return {
      moduleId: 'concrete_placement',
      moduleName: 'Concrete Placement',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (_answers): ExclusionItem[] => {
    // Concrete placement is always included if this module is used
    return [];
  },

  validate: (answers) => {
    const errors: string[] = [];

    if (!answers.placement_men || answers.placement_men < 1) {
      errors.push('Please specify the number of men for concrete placement');
    }
    if (!answers.placement_hours_per_man || answers.placement_hours_per_man < 0.5) {
      errors.push('Please specify hours per man for concrete placement');
    }
    if (!answers.highest_rate || answers.highest_rate < 1) {
      errors.push('Please specify the highest hourly rate');
    }

    return { valid: errors.length === 0, errors };
  },
};
