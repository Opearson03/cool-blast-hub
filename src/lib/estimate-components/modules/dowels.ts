import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice } from '../types';

export const dowelsModule: EstimateModule = {
  id: 'dowels',
  name: 'Dowels',
  description: 'Galvanized dowel bars for connecting to existing concrete',
  icon: 'Link',

  questions: [
    {
      id: 'dowels_required',
      type: 'boolean',
      label: 'Are dowels required?',
      defaultValue: false,
      required: true,
      helpText: 'For tying into existing concrete slabs',
    },
    {
      id: 'dowel_purpose',
      type: 'select',
      label: 'Dowel Purpose',
      options: [
        { value: 'tie_in', label: 'Tying into existing slab' },
        { value: 'load_transfer', label: 'Load transfer at construction joints' },
      ],
      defaultValue: 'tie_in',
      showIf: (answers) => answers.dowels_required === true,
    },
    {
      id: 'dowel_size',
      type: 'select',
      label: 'Dowel Diameter & Length',
      options: [
        { value: 'R12-300 GAL', label: 'R12 × 300mm Galvanised' },
        { value: 'R12-450 GAL', label: 'R12 × 450mm Galvanised' },
        { value: 'R16-300 GAL', label: 'R16 × 300mm Galvanised' },
        { value: 'R16-450 GAL', label: 'R16 × 450mm Galvanised' },
        { value: 'R20-450 GAL', label: 'R20 × 450mm Galvanised' },
        { value: 'R20-600 GAL', label: 'R20 × 600mm Galvanised' },
        { value: 'R24-450 GAL', label: 'R24 × 450mm Galvanised' },
      ],
      defaultValue: 'R12-300 GAL',
      showIf: (answers) => answers.dowels_required === true,
    },
    {
      id: 'dowel_calculation_method',
      type: 'select',
      label: 'Quantity Method',
      options: [
        { value: 'manual', label: 'Enter number of dowels' },
        { value: 'spacing', label: 'Calculate from length and spacing' },
      ],
      defaultValue: 'manual',
      showIf: (answers) => answers.dowels_required === true,
    },
    {
      id: 'dowel_count',
      type: 'number',
      label: 'Number of Dowels',
      min: 1,
      defaultValue: 10,
      showIf: (answers) => answers.dowels_required === true && answers.dowel_calculation_method === 'manual',
    },
    {
      id: 'connection_length',
      type: 'number',
      label: 'Length of Connection',
      unit: 'm',
      min: 1,
      helpText: 'Linear metres where dowels are needed',
      showIf: (answers) => answers.dowels_required === true && answers.dowel_calculation_method === 'spacing',
    },
    {
      id: 'dowel_spacing',
      type: 'select',
      label: 'Dowel Spacing',
      options: [
        { value: '200', label: '200mm centres' },
        { value: '250', label: '250mm centres' },
        { value: '300', label: '300mm centres' },
        { value: '400', label: '400mm centres' },
        { value: '450', label: '450mm centres' },
        { value: '600', label: '600mm centres' },
      ],
      defaultValue: '300',
      showIf: (answers) => answers.dowels_required === true && answers.dowel_calculation_method === 'spacing',
    },
    {
      id: 'dowel_price_each',
      type: 'currency',
      label: 'Price per Dowel',
      defaultValue: 3.50,
      unit: '/each',
      showIf: (answers) => answers.dowels_required === true,
    },
    // Chemical anchor option
    {
      id: 'chemical_anchor',
      type: 'boolean',
      label: 'Include chemical anchoring?',
      defaultValue: true,
      helpText: 'Epoxy or chemical anchor system for drilling into existing concrete',
      showIf: (answers) => answers.dowels_required === true,
    },
    {
      id: 'chemical_cartridges',
      type: 'number',
      label: 'Number of Chemical Cartridges',
      min: 1,
      defaultValue: 2,
      helpText: 'Each cartridge typically does 10-20 holes',
      showIf: (answers) => answers.dowels_required === true && answers.chemical_anchor === true,
    },
    {
      id: 'chemical_price',
      type: 'currency',
      label: 'Chemical Anchor Price per Cartridge',
      defaultValue: 45,
      unit: '/each',
      showIf: (answers) => answers.dowels_required === true && answers.chemical_anchor === true,
    },
  ],

  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    if (!answers.dowels_required) {
      return {
        moduleId: 'dowels',
        moduleName: 'Dowels',
        lineItems: [],
        subtotal: 0,
        exclusions: [],
      };
    }

    // Calculate number of dowels
    let dowelCount: number;
    if (answers.dowel_calculation_method === 'spacing') {
      const connectionLength = Number(answers.connection_length) || 10;
      const spacingMM = Number(answers.dowel_spacing) || 300;
      const spacingM = spacingMM / 1000;
      dowelCount = Math.ceil(connectionLength / spacingM) + 1;
    } else {
      dowelCount = Number(answers.dowel_count) || 10;
    }

    const dowelSize = answers.dowel_size || 'R12-300 GAL';
    
    // Get price from price list or use default
    const pricePerDowel = Number(answers.dowel_price_each) || getPrice(priceMap, 'dowel', dowelSize, 3.50);
    const dowelCost = dowelCount * pricePerDowel;

    const sizeLabels: Record<string, string> = {
      'R12-300 GAL': 'R12 × 300mm Galv',
      'R12-450 GAL': 'R12 × 450mm Galv',
      'R16-300 GAL': 'R16 × 300mm Galv',
      'R16-450 GAL': 'R16 × 450mm Galv',
      'R20-450 GAL': 'R20 × 450mm Galv',
      'R20-600 GAL': 'R20 × 600mm Galv',
      'R24-450 GAL': 'R24 × 450mm Galv',
    };

    lineItems.push({
      id: 'dowel_bars',
      description: `Dowel Bars ${sizeLabels[dowelSize] || dowelSize} (${dowelCount} pcs)`,
      quantity: dowelCount,
      unit: 'pcs',
      unitPrice: pricePerDowel,
      total: Math.round(dowelCost * 100) / 100,
      category: 'materials',
    });
    subtotal += dowelCost;

    // Chemical anchoring
    if (answers.chemical_anchor) {
      const cartridges = Number(answers.chemical_cartridges) || 2;
      const chemicalPrice = Number(answers.chemical_price) || 45;
      const chemicalCost = cartridges * chemicalPrice;

      lineItems.push({
        id: 'chemical_anchor',
        description: `Chemical Anchor Cartridges (${cartridges} pcs)`,
        quantity: cartridges,
        unit: 'pcs',
        unitPrice: chemicalPrice,
        total: Math.round(chemicalCost * 100) / 100,
        category: 'materials',
      });
      subtotal += chemicalCost;
    }

    return {
      moduleId: 'dowels',
      moduleName: 'Dowels',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (answers): ExclusionItem[] => {
    const exclusions: ExclusionItem[] = [];
    
    if (!answers.dowels_required) {
      exclusions.push({
        id: 'no_dowels',
        text: 'Dowel bars for connection to existing concrete are not included.',
        moduleId: 'dowels',
      });
    }

    if (answers.dowels_required && !answers.chemical_anchor) {
      exclusions.push({
        id: 'no_chemical_anchor',
        text: 'Chemical anchoring for dowels is not included - dowels to be cast in.',
        moduleId: 'dowels',
      });
    }

    return exclusions;
  },

  validate: (answers) => {
    const errors: string[] = [];

    if (answers.dowels_required) {
      if (answers.dowel_calculation_method === 'spacing') {
        if (!answers.connection_length || answers.connection_length < 1) {
          errors.push('Please specify the connection length');
        }
      } else {
        if (!answers.dowel_count || answers.dowel_count < 1) {
          errors.push('Please specify the number of dowels');
        }
      }
    }

    return { valid: errors.length === 0, errors };
  },
};
