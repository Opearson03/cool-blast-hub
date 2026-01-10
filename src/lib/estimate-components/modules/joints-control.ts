import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice } from '../types';

export const jointsControlModule: EstimateModule = {
  id: 'joints-control',
  name: 'Control Joints',
  description: 'Saw cutting and caulking for control joints',
  icon: 'Scissors',

  questions: [
    // Saw Cutting
    {
      id: 'saw_cutting_required',
      type: 'boolean',
      label: 'Is saw cutting required?',
      defaultValue: false,
      required: true,
      helpText: 'Cut control joints after concrete has cured',
    },
    {
      id: 'saw_cutting_method',
      type: 'select',
      label: 'Saw Cutting Pricing Method',
      options: [
        { value: 'per_metre', label: 'Price per Linear Metre' },
        { value: 'hourly', label: 'Hourly Rate' },
      ],
      defaultValue: 'per_metre',
      showIf: (answers) => answers.saw_cutting_required === true,
    },
    {
      id: 'saw_cut_length',
      type: 'number',
      label: 'Total Saw Cut Length',
      unit: 'm',
      min: 1,
      showIf: (answers) => answers.saw_cutting_required === true && answers.saw_cutting_method === 'per_metre',
    },
    {
      id: 'saw_cut_price_per_m',
      type: 'currency',
      label: 'Saw Cutting Price per Metre',
      defaultValue: 4.50,
      priceListKey: 'joint_saw_cutting.JOINTCUT',
      unit: '/m',
      showIf: (answers) => answers.saw_cutting_required === true && answers.saw_cutting_method === 'per_metre',
    },
    {
      id: 'saw_cut_hours',
      type: 'number',
      label: 'Saw Cutting Hours',
      unit: 'hrs',
      min: 0.5,
      step: 0.5,
      defaultValue: 4,
      showIf: (answers) => answers.saw_cutting_required === true && answers.saw_cutting_method === 'hourly',
    },
    {
      id: 'saw_cut_hourly_rate',
      type: 'currency',
      label: 'Saw Cutting Hourly Rate',
      defaultValue: 75,
      priceListKey: 'joint_saw_cutting.JOINTCUT HR',
      unit: '/hr',
      showIf: (answers) => answers.saw_cutting_required === true && answers.saw_cutting_method === 'hourly',
    },
    // Caulking
    {
      id: 'caulking_required',
      type: 'boolean',
      label: 'Is joint caulking required?',
      defaultValue: false,
      required: true,
      helpText: 'Seal saw cut joints with polyurethane',
    },
    {
      id: 'caulking_method',
      type: 'select',
      label: 'Caulking Pricing Method',
      options: [
        { value: 'per_metre', label: 'Price per Linear Metre' },
        { value: 'hourly', label: 'Hourly Rate' },
      ],
      defaultValue: 'per_metre',
      showIf: (answers) => answers.caulking_required === true,
    },
    {
      id: 'caulking_length',
      type: 'number',
      label: 'Total Caulking Length',
      unit: 'm',
      min: 1,
      deriveFrom: (scopeData, moduleAnswers) => moduleAnswers.saw_cut_length || undefined,
      showIf: (answers) => answers.caulking_required === true && answers.caulking_method === 'per_metre',
    },
    {
      id: 'caulking_price_per_m',
      type: 'currency',
      label: 'Caulking Price per Metre',
      defaultValue: 8,
      priceListKey: 'joint_saw_cutting.CAULKING',
      unit: '/m',
      showIf: (answers) => answers.caulking_required === true && answers.caulking_method === 'per_metre',
    },
    {
      id: 'caulking_hours',
      type: 'number',
      label: 'Caulking Hours',
      unit: 'hrs',
      min: 0.5,
      step: 0.5,
      defaultValue: 4,
      showIf: (answers) => answers.caulking_required === true && answers.caulking_method === 'hourly',
    },
    {
      id: 'caulking_hourly_rate',
      type: 'currency',
      label: 'Caulking Hourly Rate',
      defaultValue: 75,
      priceListKey: 'joint_saw_cutting.CAULKING HRS',
      unit: '/hr',
      showIf: (answers) => answers.caulking_required === true && answers.caulking_method === 'hourly',
    },
  ],

  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    // Saw cutting
    if (answers.saw_cutting_required) {
      if (answers.saw_cutting_method === 'per_metre') {
        const length = Number(answers.saw_cut_length) || 50;
        const pricePerM = Number(answers.saw_cut_price_per_m) || getPrice(priceMap, 'joint_saw_cutting', 'JOINTCUT', 4.50);
        const sawCost = length * pricePerM;

        lineItems.push({
          id: 'saw_cutting',
          description: `Saw Cutting Control Joints (${length}m)`,
          quantity: length,
          unit: 'm',
          unitPrice: pricePerM,
          total: Math.round(sawCost * 100) / 100,
          category: 'labour',
        });
        subtotal += sawCost;
      } else {
        const hours = Number(answers.saw_cut_hours) || 4;
        const hourlyRate = Number(answers.saw_cut_hourly_rate) || getPrice(priceMap, 'joint_saw_cutting', 'JOINTCUT HR', 75);
        const sawCost = hours * hourlyRate;

        lineItems.push({
          id: 'saw_cutting',
          description: `Saw Cutting Control Joints (${hours} hrs)`,
          quantity: hours,
          unit: 'hrs',
          unitPrice: hourlyRate,
          total: Math.round(sawCost * 100) / 100,
          category: 'labour',
        });
        subtotal += sawCost;
      }
    }

    // Caulking
    if (answers.caulking_required) {
      if (answers.caulking_method === 'per_metre') {
        const length = Number(answers.caulking_length) || Number(answers.saw_cut_length) || 50;
        const pricePerM = Number(answers.caulking_price_per_m) || getPrice(priceMap, 'joint_saw_cutting', 'CAULKING', 8);
        const caulkCost = length * pricePerM;

        lineItems.push({
          id: 'joint_caulking',
          description: `Joint Caulking/Sealing (${length}m)`,
          quantity: length,
          unit: 'm',
          unitPrice: pricePerM,
          total: Math.round(caulkCost * 100) / 100,
          category: 'labour',
        });
        subtotal += caulkCost;
      } else {
        const hours = Number(answers.caulking_hours) || 4;
        const hourlyRate = Number(answers.caulking_hourly_rate) || getPrice(priceMap, 'joint_saw_cutting', 'CAULKING HRS', 75);
        const caulkCost = hours * hourlyRate;

        lineItems.push({
          id: 'joint_caulking',
          description: `Joint Caulking/Sealing (${hours} hrs)`,
          quantity: hours,
          unit: 'hrs',
          unitPrice: hourlyRate,
          total: Math.round(caulkCost * 100) / 100,
          category: 'labour',
        });
        subtotal += caulkCost;
      }
    }

    return {
      moduleId: 'joints-control',
      moduleName: 'Control Joints',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (answers): ExclusionItem[] => {
    const exclusions: ExclusionItem[] = [];
    
    if (!answers.saw_cutting_required) {
      exclusions.push({
        id: 'no_saw_cutting',
        text: 'Saw cutting of control joints is not included.',
        moduleId: 'joints-control',
      });
    }

    if (!answers.caulking_required) {
      exclusions.push({
        id: 'no_caulking',
        text: 'Caulking/sealing of joints is not included.',
        moduleId: 'joints-control',
      });
    }

    return exclusions;
  },

  validate: (answers) => {
    const errors: string[] = [];

    if (answers.saw_cutting_required && answers.saw_cutting_method === 'per_metre') {
      if (!answers.saw_cut_length || answers.saw_cut_length < 1) {
        errors.push('Please specify the total saw cut length');
      }
    }

    if (answers.caulking_required && answers.caulking_method === 'per_metre') {
      if (!answers.caulking_length || answers.caulking_length < 1) {
        errors.push('Please specify the total caulking length');
      }
    }

    return { valid: errors.length === 0, errors };
  },
};
