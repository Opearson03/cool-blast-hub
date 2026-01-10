import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice } from '../types';

export const jointsFoamModule: EstimateModule = {
  id: 'joints-foam',
  name: 'Expansion Foam',
  description: 'Compressible foam for expansion joints at structures',
  icon: 'Square',

  questions: [
    {
      id: 'foam_required',
      type: 'boolean',
      label: 'Is expansion foam required?',
      defaultValue: false,
      required: true,
      helpText: 'Where concrete meets existing structures, walls, or slabs',
    },
    {
      id: 'foam_type',
      type: 'select',
      label: 'Foam Type',
      options: [
        { value: 'sticky_back', label: 'Sticky Back (Self-Adhesive)' },
        { value: 'standard', label: 'Standard (Non-Adhesive)' },
      ],
      defaultValue: 'sticky_back',
      showIf: (answers) => answers.foam_required === true,
    },
    {
      id: 'foam_height',
      type: 'select',
      label: 'Foam Height',
      options: [
        { value: '50', label: '50mm' },
        { value: '75', label: '75mm' },
        { value: '100', label: '100mm' },
        { value: '125', label: '125mm' },
        { value: '150', label: '150mm' },
        { value: '200', label: '200mm' },
        { value: '250', label: '250mm' },
        { value: '300', label: '300mm' },
      ],
      defaultValue: '100',
      showIf: (answers) => answers.foam_required === true,
    },
    {
      id: 'foam_length',
      type: 'number',
      label: 'Total Length Required',
      unit: 'm',
      min: 1,
      helpText: 'Linear metres of expansion foam needed',
      showIf: (answers) => answers.foam_required === true,
    },
    {
      id: 'foam_price_per_m',
      type: 'currency',
      label: 'Price per Metre',
      defaultValue: 8,
      unit: '/m',
      showIf: (answers) => answers.foam_required === true,
    },
  ],

  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    if (!answers.foam_required) {
      return {
        moduleId: 'joints-foam',
        moduleName: 'Expansion Foam',
        lineItems: [],
        subtotal: 0,
        exclusions: [],
      };
    }

    const foamLength = Number(answers.foam_length) || 10;
    const foamHeight = answers.foam_height || '100';
    const foamType = answers.foam_type || 'sticky_back';
    
    // Build price list key based on selections
    // Format: EJA{height}SB for sticky back, EJ10{height} for standard
    let priceListKey = '';
    if (foamType === 'sticky_back') {
      priceListKey = `EJA10${foamHeight}SB`;
    } else {
      priceListKey = `EJ10${foamHeight}`;
    }
    
    const pricePerM = Number(answers.foam_price_per_m) || getPrice(priceMap, 'joint_foam', priceListKey, 8);
    const foamCost = foamLength * pricePerM;

    const typeLabel = foamType === 'sticky_back' ? 'Sticky Back' : 'Standard';

    lineItems.push({
      id: 'expansion_foam',
      description: `Expansion Foam ${foamHeight}mm × 10mm ${typeLabel} (${foamLength}m)`,
      quantity: foamLength,
      unit: 'm',
      unitPrice: pricePerM,
      total: Math.round(foamCost * 100) / 100,
      category: 'materials',
    });
    subtotal += foamCost;

    return {
      moduleId: 'joints-foam',
      moduleName: 'Expansion Foam',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (answers): ExclusionItem[] => {
    const exclusions: ExclusionItem[] = [];
    
    if (!answers.foam_required) {
      exclusions.push({
        id: 'no_expansion_foam',
        text: 'Expansion foam/compressible filler at abutments is not included.',
        moduleId: 'joints-foam',
      });
    }

    return exclusions;
  },

  validate: (answers) => {
    const errors: string[] = [];

    if (answers.foam_required) {
      if (!answers.foam_length || answers.foam_length < 1) {
        errors.push('Please specify the length of expansion foam required');
      }
    }

    return { valid: errors.length === 0, errors };
  },
};
