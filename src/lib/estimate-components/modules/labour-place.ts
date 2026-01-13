import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem } from '../types';
import { getPrice } from '../types';

export const labourPlaceModule: EstimateModule = {
  id: 'labour-place',
  name: 'Labour - Place',
  description: 'Crew labour for concrete placement and finishing',
  icon: 'HardHat',

  questions: [
    {
      id: 'hourly_rate',
      type: 'currency',
      label: 'Hourly rate',
      helpText: 'Rate per worker (incl. super, insurance, etc.)',
      priceListKey: 'labour.LABOUR PLACE HR',
      unit: '/hr',
      required: true,
      placeholder: 'Enter rate',
    },
    {
      id: 'crew_size',
      type: 'number',
      label: 'Number of workers',
      min: 1,
      max: 20,
      required: true,
      placeholder: 'Enter crew size',
    },
    {
      id: 'hours_per_man',
      type: 'number',
      label: 'Hours per worker',
      min: 0.5,
      step: 0.5,
      unit: 'hrs',
      required: true,
      placeholder: 'Enter hours',
      helpText: 'e.g., 8 hrs = 1 day',
    },
  ],

  calculate: (answers, priceMap, _scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    const hourlyRate = Number(answers.hourly_rate) || getPrice(priceMap, 'labour', 'LABOUR PLACE HR', 75);
    const crewSize = Number(answers.crew_size) || 0;
    const hoursPerMan = Number(answers.hours_per_man) || 0;

    // Don't calculate if no labour inputs provided
    if (crewSize === 0 || hoursPerMan === 0) {
      return {
        moduleId: 'labour-place',
        moduleName: 'Labour - Place',
        lineItems: [],
        subtotal: 0,
        exclusions: [],
      };
    }

    const totalHours = crewSize * hoursPerMan;
    const totalCost = totalHours * hourlyRate;

    lineItems.push({
      id: 'labour_place',
      description: `Labour - Place (${crewSize} workers × ${hoursPerMan} hrs @ $${hourlyRate}/hr)`,
      quantity: totalHours,
      unit: 'hrs',
      unitPrice: hourlyRate,
      total: totalCost,
      category: 'labour-place',
    });
    subtotal += totalCost;

    return {
      moduleId: 'labour-place',
      moduleName: 'Labour - Place',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (_answers): ExclusionItem[] => {
    return [];
  },

  validate: (answers) => {
    const errors: string[] = [];

    if (!answers.hourly_rate || answers.hourly_rate < 1) {
      errors.push('Please specify the hourly rate');
    }
    if (!answers.crew_size || answers.crew_size < 1) {
      errors.push('Please specify the number of workers');
    }
    if (!answers.hours_per_man || answers.hours_per_man < 0.5) {
      errors.push('Please specify hours per worker');
    }

    return { valid: errors.length === 0, errors };
  },
};
