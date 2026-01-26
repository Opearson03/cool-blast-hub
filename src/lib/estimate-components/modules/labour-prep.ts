import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem } from '../types';
import { getPrice } from '../types';

export const labourPrepModule: EstimateModule = {
  id: 'labour-prep',
  name: 'Labour - Prep',
  description: 'Crew labour for preparation works (formwork, excavation, reinforcement)',
  icon: 'Hammer',

  questions: [
    {
      id: 'hourly_rate',
      type: 'currency',
      label: 'Hourly rate',
      helpText: 'Rate per worker (incl. super, insurance, etc.)',
      priceListKey: 'labour.LABOUR PREP HR',
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
      id: 'hours_per_day',
      type: 'number',
      label: 'Hours per day',
      min: 0.5,
      max: 24,
      step: 0.5,
      unit: 'hrs',
      required: true,
      placeholder: 'Enter hours',
      defaultValue: 8,
    },
    {
      id: 'number_of_days',
      type: 'number',
      label: 'Number of days',
      min: 0.5,
      step: 0.5,
      unit: 'days',
      required: true,
      placeholder: 'Enter days',
    },
  ],

  calculate: (answers, priceMap, _scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    const hourlyRate = Number(answers.hourly_rate) || getPrice(priceMap, 'labour', 'LABOUR PREP HR', 75);
    const crewSize = Number(answers.crew_size) || 0;
    const hoursPerDay = Number(answers.hours_per_day) || 8;
    const numberOfDays = Number(answers.number_of_days) || 0;

    // Don't calculate if no labour inputs provided
    if (crewSize === 0 || numberOfDays === 0) {
      return {
        moduleId: 'labour-prep',
        moduleName: 'Labour - Prep',
        lineItems: [],
        subtotal: 0,
        exclusions: [],
      };
    }

    const totalHours = crewSize * hoursPerDay * numberOfDays;
    const totalCost = totalHours * hourlyRate;

    lineItems.push({
      id: 'labour_prep',
      description: `Labour - Prep (${crewSize} workers × ${hoursPerDay} hrs/day × ${numberOfDays} days @ $${hourlyRate}/hr)`,
      quantity: totalHours,
      unit: 'hrs',
      unitPrice: hourlyRate,
      total: totalCost,
      category: 'labour-prep',
    });
    subtotal += totalCost;

    return {
      moduleId: 'labour-prep',
      moduleName: 'Labour - Prep',
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
    if (!answers.hours_per_day || answers.hours_per_day < 0.5) {
      errors.push('Please specify hours per day');
    }
    if (!answers.number_of_days || answers.number_of_days < 0.5) {
      errors.push('Please specify number of days');
    }

    return { valid: errors.length === 0, errors };
  },
};
