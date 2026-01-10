import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice } from '../types';

export const jointsExpansionModule: EstimateModule = {
  id: 'joints-expansion',
  name: 'Expansion Joints',
  description: 'Preformed expansion joints for slabs',
  icon: 'Minus',

  questions: [
    {
      id: 'expansion_joints_required',
      type: 'boolean',
      label: 'Are expansion joints required?',
      defaultValue: false,
      required: true,
      helpText: 'For movement joints in large slabs',
    },
    {
      id: 'joint_depth',
      type: 'select',
      label: 'Joint Depth (Slab Thickness)',
      options: [
        { value: '100', label: '100mm' },
        { value: '125', label: '125mm' },
        { value: '150', label: '150mm' },
        { value: '200', label: '200mm' },
      ],
      defaultValue: '100',
      showIf: (answers) => answers.expansion_joints_required === true,
    },
    {
      id: 'joint_length',
      type: 'select',
      label: 'Joint Length',
      options: [
        { value: '3000', label: '3000mm (3m)' },
        { value: '6000', label: '6000mm (6m)' },
      ],
      defaultValue: '3000',
      showIf: (answers) => answers.expansion_joints_required === true,
    },
    {
      id: 'joint_quantity',
      type: 'number',
      label: 'Number of Joint Pieces',
      min: 1,
      defaultValue: 5,
      showIf: (answers) => answers.expansion_joints_required === true,
    },
    {
      id: 'joint_price_each',
      type: 'currency',
      label: 'Price per Joint Piece',
      defaultValue: 35,
      unit: '/each',
      showIf: (answers) => answers.expansion_joints_required === true,
    },
    // Capping mould
    {
      id: 'capping_required',
      type: 'boolean',
      label: 'Is joint capping mould required?',
      defaultValue: true,
      helpText: 'Creates a clean finish on top of expansion joint',
      showIf: (answers) => answers.expansion_joints_required === true,
    },
    {
      id: 'capping_type',
      type: 'select',
      label: 'Capping Type',
      options: [
        { value: 'EXJ CAP B', label: 'Black Capping Mould' },
        { value: 'EXJ CAP G', label: 'Grey Capping Mould' },
        { value: 'EXJ CAP RBM', label: 'Removable Capping Mould' },
      ],
      defaultValue: 'EXJ CAP B',
      showIf: (answers) => answers.expansion_joints_required === true && answers.capping_required === true,
    },
    {
      id: 'capping_length',
      type: 'number',
      label: 'Total Capping Length',
      unit: 'm',
      min: 1,
      deriveFrom: (scopeData, moduleAnswers) => {
        const jointQty = Number(moduleAnswers.joint_quantity) || 5;
        const jointLength = Number(moduleAnswers.joint_length) || 3000;
        return jointQty * (jointLength / 1000);
      },
      showIf: (answers) => answers.expansion_joints_required === true && answers.capping_required === true,
    },
    {
      id: 'capping_price_per_m',
      type: 'currency',
      label: 'Capping Price per Metre',
      defaultValue: 4.50,
      unit: '/m',
      showIf: (answers) => answers.expansion_joints_required === true && answers.capping_required === true,
    },
  ],

  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    if (!answers.expansion_joints_required) {
      return {
        moduleId: 'joints-expansion',
        moduleName: 'Expansion Joints',
        lineItems: [],
        subtotal: 0,
        exclusions: [],
      };
    }

    // Expansion joints
    const jointDepth = answers.joint_depth || '100';
    const jointLengthMM = answers.joint_length || '3000';
    const jointQty = Number(answers.joint_quantity) || 5;
    
    // Build price list key: EXJ{depth}{length/100} e.g. EXJ10030
    const priceListKey = `EXJ${jointDepth}${jointLengthMM === '3000' ? '30' : '60'}`;
    
    const pricePerJoint = Number(answers.joint_price_each) || getPrice(priceMap, 'joints_expansion', priceListKey, 35);
    const jointCost = jointQty * pricePerJoint;

    lineItems.push({
      id: 'expansion_joints',
      description: `Expansion Joints ${jointDepth}mm × ${Number(jointLengthMM) / 1000}m (${jointQty} pcs)`,
      quantity: jointQty,
      unit: 'pcs',
      unitPrice: pricePerJoint,
      total: Math.round(jointCost * 100) / 100,
      category: 'materials',
    });
    subtotal += jointCost;

    // Capping mould
    if (answers.capping_required) {
      const cappingType = answers.capping_type || 'EXJ CAP B';
      const cappingLength = Number(answers.capping_length) || (jointQty * Number(jointLengthMM) / 1000);
      const pricePerM = Number(answers.capping_price_per_m) || getPrice(priceMap, 'joints_expansion', cappingType, 4.50);
      const cappingCost = cappingLength * pricePerM;

      const cappingLabels: Record<string, string> = {
        'EXJ CAP B': 'Black',
        'EXJ CAP G': 'Grey',
        'EXJ CAP RBM': 'Removable',
      };

      lineItems.push({
        id: 'joint_capping',
        description: `Joint Capping Mould ${cappingLabels[cappingType] || ''} (${cappingLength}m)`,
        quantity: cappingLength,
        unit: 'm',
        unitPrice: pricePerM,
        total: Math.round(cappingCost * 100) / 100,
        category: 'materials',
      });
      subtotal += cappingCost;
    }

    return {
      moduleId: 'joints-expansion',
      moduleName: 'Expansion Joints',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (answers): ExclusionItem[] => {
    const exclusions: ExclusionItem[] = [];
    
    if (!answers.expansion_joints_required) {
      exclusions.push({
        id: 'no_expansion_joints',
        text: 'Expansion joints are not included in this quote.',
        moduleId: 'joints-expansion',
      });
    }

    return exclusions;
  },

  validate: (answers) => {
    const errors: string[] = [];

    if (answers.expansion_joints_required) {
      if (!answers.joint_quantity || answers.joint_quantity < 1) {
        errors.push('Please specify the number of expansion joints');
      }
    }

    return { valid: errors.length === 0, errors };
  },
};
