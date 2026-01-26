import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice, roundUpToM3 } from '../types';

export const concreteSupplyModule: EstimateModule = {
  id: 'concrete-supply',
  name: 'Concrete Supply',
  description: 'Readymix concrete, testing, and waiting time',
  icon: 'Droplets',

  questions: [
    {
      id: 'concrete_type',
      type: 'select',
      label: 'Type of concrete',
      options: [
        { value: '15MPA', label: '15 MPa', priceKey: 'concrete.15MPA' },
        { value: '20MPA', label: '20 MPa', priceKey: 'concrete.20MPA' },
        { value: '25MPA', label: '25 MPa', priceKey: 'concrete.25MPA' },
        { value: '32MPA', label: '32 MPa', priceKey: 'concrete.32MPA' },
        { value: '40MPA', label: '40 MPa', priceKey: 'concrete.40MPA' },
        { value: '25MPA EXP', label: '25 MPa Exposed Aggregate', priceKey: 'concrete.25MPA EXP' },
        { value: '32MPA EXP', label: '32 MPa Exposed Aggregate', priceKey: 'concrete.32MPA EXP' },
        { value: '25MPA COL', label: '25 MPa Colour Mix', priceKey: 'concrete.25MPA COL' },
        { value: '32MPA COL', label: '32 MPa Colour Mix', priceKey: 'concrete.32MPA COL' },
        { value: '40MPA COL', label: '40 MPa Colour Mix', priceKey: 'concrete.40MPA COL' },
      ],
      defaultValue: '32MPA',
      required: true,
    },
    {
      id: 'concrete_price',
      type: 'currency',
      label: 'Concrete price per m³',
      defaultValue: 245,
      unit: '/m³',
      helpText: 'Auto-fills from price list based on concrete type',
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const concreteType = moduleAnswers.concrete_type || '32MPA';
        return priceMap['concrete']?.[concreteType];
      },
    },
    {
      id: 'calculated_volume',
      type: 'number',
      label: 'Calculated volume (m³)',
      helpText: 'Auto-calculated from scope dimensions',
      defaultValue: 0,
      derivedReadOnly: true,
      deriveFrom: (scopeData) => {
        const volume = Number(scopeData.volume) || 0;
        return volume > 0 ? Math.round(volume * 100) / 100 : undefined;
      },
    },
    {
      id: 'wastage_percent',
      type: 'number',
      label: 'What wastage do you anticipate?',
      defaultValue: 10,
      min: 0,
      max: 50,
      unit: '%',
      deriveFrom: () => 10, // Standard 10% wastage
    },
    {
      id: 'allow_waiting_time',
      type: 'boolean',
      label: 'Do you want to allow for waiting time?',
      defaultValue: false,
    },
    {
      id: 'waiting_minutes',
      type: 'number',
      label: 'Expected waiting time (minutes)',
      defaultValue: 30,
      min: 0,
      max: 240,
      unit: 'mins',
      showIf: (answers) => answers.allow_waiting_time === true,
      deriveFrom: () => 30, // Standard 30 minutes
    },
    {
      id: 'waiting_rate',
      type: 'currency',
      label: 'Waiting time rate per minute',
      defaultValue: 4,
      priceListKey: 'concrete.WAITING',
      unit: '/min',
      showIf: (answers) => answers.allow_waiting_time === true,
    },
    {
      id: 'require_testing',
      type: 'boolean',
      label: 'Do you want to include concrete testing?',
      defaultValue: false,
    },
    {
      id: 'testing_cost',
      type: 'currency',
      label: 'Testing cost per 50m³',
      defaultValue: 850,
      priceListKey: 'concrete.TESTING',
      showIf: (answers) => answers.require_testing === true,
    },
    {
      id: 'include_special_mix',
      type: 'boolean',
      label: 'Do you want to include a special concrete mix?',
      defaultValue: false,
      sectionLabel: 'Special Concrete Mix',
    },
    {
      id: 'special_mix_name',
      type: 'text',
      label: 'Special mix description',
      defaultValue: 'Special Concrete Mix',
      placeholder: 'e.g. Polished Concrete, High-Flow Mix',
      showIf: (answers) => answers.include_special_mix === true,
    },
    {
      id: 'special_mix_rate',
      type: 'currency',
      label: 'Special mix rate per m³',
      defaultValue: 400,
      unit: '/m³',
      showIf: (answers) => answers.include_special_mix === true,
    },
  ],

  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    // Get volume from scope data or calculated
    let volume = Number(scopeData.concrete_volume) || Number(answers.calculated_volume) || 0;
    
    // Calculate volume for piers if scope provides dimensions
    if (scopeData.num_piers && scopeData.diameter && scopeData.depth) {
      const numPiers = Number(scopeData.num_piers);
      const diameter = Number(scopeData.diameter) / 1000; // mm to m
      const depth = Number(scopeData.depth) / 1000; // mm to m
      const radius = diameter / 2;
      volume = numPiers * Math.PI * radius * radius * depth;
    }

    // Apply wastage and round up to nearest 0.1 m³
    const wastagePercent = Number(answers.wastage_percent) || 10;
    const volumeWithWastage = volume * (1 + wastagePercent / 100);
    const roundedVolume = roundUpToM3(volumeWithWastage);

    // Concrete cost
    const concreteType = answers.concrete_type || '32MPA';
    const concretePrice = Number(answers.concrete_price) || getPrice(priceMap, 'concrete', concreteType, 245);
    const concreteCost = roundedVolume * concretePrice;

    if (concreteCost > 0) {
      lineItems.push({
        id: 'concrete_supply',
        description: `${concreteType} Readymix Concrete (${roundUpToM3(volume)}m³ + ${wastagePercent}% wastage)`,
        quantity: roundedVolume,
        unit: 'm³',
        unitPrice: concretePrice,
        total: Math.round(concreteCost * 100) / 100,
        category: 'materials',
      });
      subtotal += concreteCost;
    }

    // Waiting time
    if (answers.allow_waiting_time) {
      const waitingMinutes = Number(answers.waiting_minutes) || 30;
      const waitingRate = Number(answers.waiting_rate) || getPrice(priceMap, 'concrete', 'WAITING', 4);
      const waitingCost = waitingMinutes * waitingRate;

      if (waitingCost > 0) {
        lineItems.push({
          id: 'waiting_time',
          description: `Waiting Time Allowance (${waitingMinutes} mins)`,
          quantity: waitingMinutes,
          unit: 'min',
          unitPrice: waitingRate,
          total: waitingCost,
          category: 'materials',
        });
        subtotal += waitingCost;
      }
    }

    // Testing
    if (answers.require_testing) {
      const testingCost = Number(answers.testing_cost) || getPrice(priceMap, 'concrete', 'TESTING', 850);
      const testsRequired = Math.ceil(volumeWithWastage / 50);

      lineItems.push({
        id: 'concrete_testing',
        description: `Concrete Testing (per 50m³)`,
        quantity: testsRequired,
        unit: 'test',
        unitPrice: testingCost,
        total: testsRequired * testingCost,
        category: 'other',
      });
      subtotal += testsRequired * testingCost;
    }

    // Special concrete mix
    if (answers.include_special_mix) {
      const specialMixName = answers.special_mix_name || 'Special Concrete Mix';
      const specialMixRate = Number(answers.special_mix_rate) || 400;
      const specialMixCost = roundedVolume * specialMixRate;

      if (specialMixCost > 0) {
        lineItems.push({
          id: 'special_concrete_mix',
          description: `${specialMixName} Premium`,
          quantity: roundedVolume,
          unit: 'm³',
          unitPrice: specialMixRate,
          total: Math.round(specialMixCost * 100) / 100,
          category: 'materials',
        });
        subtotal += specialMixCost;
      }
    }

    return {
      moduleId: 'concrete-supply',
      moduleName: 'Concrete Supply',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (answers): ExclusionItem[] => {
    const exclusions: ExclusionItem[] = [];

    if (!answers.require_testing) {
      exclusions.push({
        id: 'no_testing',
        text: 'Concrete testing is not included.',
        moduleId: 'concrete-supply',
      });
    }

    return exclusions;
  },

  validate: (answers) => {
    const errors: string[] = [];

    if (!answers.concrete_type) {
      errors.push('Please select a concrete type');
    }

    return { valid: errors.length === 0, errors };
  },
};
