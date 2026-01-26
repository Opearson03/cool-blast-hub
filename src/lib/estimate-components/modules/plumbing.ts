import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice } from '../types';

export const plumbingModule: EstimateModule = {
  id: 'plumbing',
  name: 'Plumbing',
  description: 'Plumbing and drainage for strip drains',
  icon: 'Waves',

  questions: [
    {
      id: 'plumbing_required',
      type: 'boolean',
      label: 'Is plumbing/drainage required?',
      defaultValue: false,
      required: true,
      helpText: 'Strip drain installation with plumber allowance',
    },
    // Strip drain section
    {
      id: 'strip_drain_required',
      type: 'boolean',
      label: 'Include strip drain?',
      defaultValue: false,
      showIf: (answers) => answers.plumbing_required === true,
    },
    {
      id: 'strip_drain_length',
      type: 'number',
      label: 'Strip Drain Length',
      unit: 'm',
      min: 0.5,
      defaultValue: 0,
      helpText: 'Linear metres of strip drain required',
      showIf: (answers) => answers.plumbing_required === true && answers.strip_drain_required === true,
    },
    {
      id: 'strip_drain_price',
      type: 'currency',
      label: 'Strip Drain Price per Metre',
      defaultValue: 85,
      unit: '/m',
      priceListKey: 'plumbing.STRIP DRAIN 1M',
      showIf: (answers) => answers.plumbing_required === true && answers.strip_drain_required === true,
    },
    // Plumber allowance section
    {
      id: 'plumber_allowance',
      type: 'boolean',
      label: 'Include plumber labour allowance?',
      defaultValue: false,
      helpText: 'Allowance for plumber installation hours',
      showIf: (answers) => answers.plumbing_required === true,
    },
    {
      id: 'plumber_hours',
      type: 'number',
      label: 'Estimated Plumber Hours',
      min: 0,
      defaultValue: 0,
      helpText: 'Allowance for plumber on site',
      showIf: (answers) => answers.plumbing_required === true && answers.plumber_allowance === true,
    },
    {
      id: 'plumber_rate',
      type: 'currency',
      label: 'Plumber Hourly Rate',
      defaultValue: 95,
      unit: '/h',
      priceListKey: 'plumbing.PLUMBER HR',
      showIf: (answers) => answers.plumbing_required === true && answers.plumber_allowance === true,
    },
    // Plumber sundries section
    {
      id: 'plumber_sundries',
      type: 'boolean',
      label: 'Include plumber sundries allowance?',
      defaultValue: false,
      helpText: 'Miscellaneous plumbing materials and fittings',
      showIf: (answers) => answers.plumbing_required === true,
    },
    {
      id: 'sundries_amount',
      type: 'currency',
      label: 'Sundries Allowance',
      defaultValue: 150,
      unit: '/item',
      priceListKey: 'plumbing.PLUMBER SUNDRIES',
      showIf: (answers) => answers.plumbing_required === true && answers.plumber_sundries === true,
    },
  ],

  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    if (!answers.plumbing_required) {
      return {
        moduleId: 'plumbing',
        moduleName: 'Plumbing',
        lineItems: [],
        subtotal: 0,
        exclusions: [],
      };
    }

    // Strip drain cost
    if (answers.strip_drain_required) {
      const length = Number(answers.strip_drain_length) || 0;
      const pricePerMetre = Number(answers.strip_drain_price) || getPrice(priceMap, 'plumbing', 'STRIP DRAIN 1M', 85);
      
      if (length > 0) {
        const stripDrainCost = length * pricePerMetre;
        lineItems.push({
          id: 'strip_drain',
          description: `Strip Drain Supply (${length}m)`,
          quantity: length,
          unit: 'm',
          unitPrice: pricePerMetre,
          total: Math.round(stripDrainCost * 100) / 100,
          category: 'materials',
        });
        subtotal += stripDrainCost;
      }
    }

    // Plumber labour allowance
    if (answers.plumber_allowance) {
      const hours = Number(answers.plumber_hours) || 0;
      const rate = Number(answers.plumber_rate) || getPrice(priceMap, 'plumbing', 'PLUMBER HR', 95);
      
      if (hours > 0) {
        const labourCost = hours * rate;
        lineItems.push({
          id: 'plumber_labour',
          description: `Plumber Labour Allowance (${hours}h)`,
          quantity: hours,
          unit: 'h',
          unitPrice: rate,
          total: Math.round(labourCost * 100) / 100,
          category: 'labour',
        });
        subtotal += labourCost;
      }
    }

    // Plumber sundries
    if (answers.plumber_sundries) {
      const sundriesAmount = Number(answers.sundries_amount) || getPrice(priceMap, 'plumbing', 'PLUMBER SUNDRIES', 150);
      
      if (sundriesAmount > 0) {
        lineItems.push({
          id: 'plumber_sundries',
          description: 'Plumber Sundries Allowance',
          quantity: 1,
          unit: 'allowance',
          unitPrice: sundriesAmount,
          total: Math.round(sundriesAmount * 100) / 100,
          category: 'materials',
        });
        subtotal += sundriesAmount;
      }
    }

    return {
      moduleId: 'plumbing',
      moduleName: 'Plumbing',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (answers): ExclusionItem[] => {
    const exclusions: ExclusionItem[] = [];
    
    if (!answers.plumbing_required) {
      exclusions.push({
        id: 'no_plumbing',
        text: 'Plumbing and drainage works are not included.',
        moduleId: 'plumbing',
      });
    } else {
      if (!answers.strip_drain_required) {
        exclusions.push({
          id: 'no_strip_drain',
          text: 'Strip drain supply and installation not included.',
          moduleId: 'plumbing',
        });
      }
      
      if (!answers.plumber_allowance) {
        exclusions.push({
          id: 'no_plumber_labour',
          text: 'Plumber labour not included - plumbing works by others.',
          moduleId: 'plumbing',
        });
      }
    }

    return exclusions;
  },

  validate: (answers) => {
    const errors: string[] = [];

    if (answers.plumbing_required) {
      if (answers.strip_drain_required && (!answers.strip_drain_length || answers.strip_drain_length < 0.5)) {
        errors.push('Please specify the strip drain length (minimum 0.5m)');
      }
    }

    return { valid: errors.length === 0, errors };
  },
};
