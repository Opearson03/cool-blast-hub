import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice } from '../types';

export const demolitionModule: EstimateModule = {
  id: 'demolition',
  name: 'Demolition',
  description: 'Demolition and removal of existing concrete',
  icon: 'Hammer',

  questions: [
    {
      id: 'demolition_required',
      type: 'boolean',
      label: 'Do you need to demolish existing concrete?',
      defaultValue: false,
      required: true,
    },
    {
      id: 'demolition_length',
      type: 'number',
      label: 'Length of area to demolish',
      unit: 'm',
      min: 0.1,
      showIf: (answers) => answers.demolition_required === true,
    },
    {
      id: 'demolition_width',
      type: 'number',
      label: 'Width of area to demolish',
      unit: 'm',
      min: 0.1,
      showIf: (answers) => answers.demolition_required === true,
    },
    {
      id: 'demolition_thickness',
      type: 'number',
      label: 'Thickness of existing concrete',
      unit: 'mm',
      min: 50,
      defaultValue: 100,
      showIf: (answers) => answers.demolition_required === true,
    },
    {
      id: 'demolition_volume_display',
      type: 'text',
      label: 'Calculated Volume',
      deriveFrom: (scopeData, answers) => {
        const length = Number(answers?.demolition_length) || 0;
        const width = Number(answers?.demolition_width) || 0;
        const thicknessM = (Number(answers?.demolition_thickness) || 100) / 1000;
        const volume = length * width * thicknessM;
        return volume > 0 ? `~${volume.toFixed(2)} m³` : '';
      },
      showIf: (answers) => answers.demolition_required === true && (answers.demolition_length > 0 || answers.demolition_width > 0),
    },
    {
      id: 'demolition_price',
      type: 'currency',
      label: 'Demolition Rate',
      defaultValue: 2400,
      priceListKey: 'demolition.DEMOLITION',
      unit: '/m³',
      helpText: 'Includes labour and disposal',
      showIf: (answers) => answers.demolition_required === true,
    },
  ],

  calculate: (answers, priceMap, _scopeData): ComponentCost => {
    if (!answers.demolition_required) {
      return {
        moduleId: 'demolition',
        moduleName: 'Demolition',
        lineItems: [],
        subtotal: 0,
        exclusions: [],
      };
    }

    const length = Number(answers.demolition_length) || 0;
    const width = Number(answers.demolition_width) || 0;
    const thicknessM = (Number(answers.demolition_thickness) || 100) / 1000;
    const volume = length * width * thicknessM;
    const rate = Number(answers.demolition_price) || getPrice(priceMap, 'demolition', 'DEMOLITION', 2400);
    const total = volume * rate;

    const lineItems: CostLineItem[] = [];

    if (volume > 0) {
      lineItems.push({
        id: 'demolition',
        description: `Concrete Demolition & Disposal (${length}m × ${width}m × ${Math.round(thicknessM * 1000)}mm = ${volume.toFixed(2)}m³)`,
        quantity: Math.round(volume * 100) / 100,
        unit: 'm³',
        unitPrice: rate,
        total: Math.round(total * 100) / 100,
        category: 'subcontractor',
      });
    }

    return {
      moduleId: 'demolition',
      moduleName: 'Demolition',
      lineItems,
      subtotal: Math.round(total * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (answers): ExclusionItem[] => {
    if (!answers.demolition_required) {
      return [{
        id: 'no_demolition',
        text: 'Demolition and removal of existing concrete is not included. Site to be cleared by others.',
        moduleId: 'demolition',
      }];
    }
    return [];
  },

  validate: (answers) => {
    const errors: string[] = [];
    
    if (answers.demolition_required) {
      if (!answers.demolition_length || Number(answers.demolition_length) <= 0) {
        errors.push('Please specify the length of area to demolish');
      }
      if (!answers.demolition_width || Number(answers.demolition_width) <= 0) {
        errors.push('Please specify the width of area to demolish');
      }
    }

    return { valid: errors.length === 0, errors };
  },
};
