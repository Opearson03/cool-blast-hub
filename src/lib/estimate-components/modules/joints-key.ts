import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice } from '../types';

export const jointsKeyModule: EstimateModule = {
  id: 'joints-key',
  name: 'Key Joints',
  description: 'Key joints for construction joints between pours',
  icon: 'Key',

  questions: [
    {
      id: 'key_joints_required',
      type: 'boolean',
      label: 'Are key joints required?',
      defaultValue: false,
      required: true,
      helpText: 'For construction joints between pours',
    },
    {
      id: 'key_depth',
      type: 'select',
      label: 'Key Joint Depth',
      options: [
        { value: '100', label: '100mm' },
        { value: '150', label: '150mm' },
        { value: '200', label: '200mm' },
        { value: '300', label: '300mm' },
      ],
      defaultValue: '100',
      showIf: (answers) => answers.key_joints_required === true,
    },
    {
      id: 'key_length',
      type: 'select',
      label: 'Key Joint Length',
      options: [
        { value: '3000', label: '3000mm (3m)' },
        { value: '6000', label: '6000mm (6m)' },
      ],
      defaultValue: '3000',
      showIf: (answers) => answers.key_joints_required === true,
    },
    {
      id: 'key_quantity',
      type: 'number',
      label: 'Number of Key Joints',
      min: 1,
      defaultValue: 5,
      showIf: (answers) => answers.key_joints_required === true,
    },
    {
      id: 'key_price_each',
      type: 'currency',
      label: 'Price per Key Joint',
      defaultValue: 25,
      unit: '/each',
      showIf: (answers) => answers.key_joints_required === true,
    },
  ],

  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    if (!answers.key_joints_required) {
      return {
        moduleId: 'joints-key',
        moduleName: 'Key Joints',
        lineItems: [],
        subtotal: 0,
        exclusions: [],
      };
    }

    const keyDepth = answers.key_depth || '100';
    const keyLengthMM = answers.key_length || '3000';
    const keyQty = Number(answers.key_quantity) || 5;
    
    // Build price list key: KEY{depth}{length/100} e.g. KEY10030
    const priceListKey = `KEY${keyDepth}${keyLengthMM === '3000' ? '30' : '60'}`;
    
    const pricePerKey = Number(answers.key_price_each) || getPrice(priceMap, 'joints_key', priceListKey, 25);
    const keyCost = keyQty * pricePerKey;

    lineItems.push({
      id: 'key_joints',
      description: `Key Joints ${keyDepth}mm × ${Number(keyLengthMM) / 1000}m (${keyQty} pcs)`,
      quantity: keyQty,
      unit: 'pcs',
      unitPrice: pricePerKey,
      total: Math.round(keyCost * 100) / 100,
      category: 'materials',
    });
    subtotal += keyCost;

    return {
      moduleId: 'joints-key',
      moduleName: 'Key Joints',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (answers): ExclusionItem[] => {
    const exclusions: ExclusionItem[] = [];
    
    if (!answers.key_joints_required) {
      exclusions.push({
        id: 'no_key_joints',
        text: 'Key joints for construction joints are not included.',
        moduleId: 'joints-key',
      });
    }

    return exclusions;
  },

  validate: (answers) => {
    const errors: string[] = [];

    if (answers.key_joints_required) {
      if (!answers.key_quantity || answers.key_quantity < 1) {
        errors.push('Please specify the number of key joints');
      }
    }

    return { valid: errors.length === 0, errors };
  },
};
