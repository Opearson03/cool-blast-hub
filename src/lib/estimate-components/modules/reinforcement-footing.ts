import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice, REBAR_WEIGHTS } from '../types';

export const reinforcementFootingModule: EstimateModule = {
  id: 'reinforcement-footing',
  name: 'Reinforcement',
  description: 'Trench mesh and bar reinforcement for footings',
  icon: 'Grid3X3',

  questions: [
    {
      id: 'reo_type',
      type: 'select',
      label: 'Reinforcement Type',
      required: true,
      options: [
        { value: 'none', label: 'No Reinforcement' },
        { value: 'trench_mesh', label: 'Trench Mesh' },
        { value: 'bar', label: 'Bar Reinforcement' },
        { value: 'both', label: 'Trench Mesh + Additional Bars' },
      ],
      defaultValue: 'trench_mesh',
    },
    // Trench mesh options
    {
      id: 'trench_mesh_type',
      type: 'select',
      label: 'Trench Mesh Type',
      options: [
        { value: 'L8TM', label: 'L8TM (8mm ligature)' },
        { value: 'L11TM', label: 'L11TM (11mm ligature)' },
        { value: 'L12TM', label: 'L12TM (12mm ligature)' },
      ],
      defaultValue: 'L11TM',
      showIf: (answers) => answers.reo_type === 'trench_mesh' || answers.reo_type === 'both',
    },
    {
      id: 'trench_mesh_length',
      type: 'number',
      label: 'Total Trench Length',
      unit: 'm',
      min: 1,
      deriveFrom: (scopeData) => scopeData.perimeter || undefined,
      showIf: (answers) => answers.reo_type === 'trench_mesh' || answers.reo_type === 'both',
    },
    {
      id: 'trench_mesh_lap',
      type: 'number',
      label: 'Lap Allowance',
      defaultValue: 15,
      min: 0,
      max: 30,
      unit: '%',
      helpText: 'Extra for overlaps at corners and joins',
      showIf: (answers) => answers.reo_type === 'trench_mesh' || answers.reo_type === 'both',
    },
    {
      id: 'trench_mesh_price_per_m',
      type: 'currency',
      label: 'Trench Mesh Price per Metre',
      defaultValue: 18,
      unit: '/m',
      showIf: (answers) => answers.reo_type === 'trench_mesh' || answers.reo_type === 'both',
    },
    // Longitudinal bar options
    {
      id: 'long_bars',
      type: 'boolean',
      label: 'Include Longitudinal Bars?',
      defaultValue: true,
      helpText: 'Top and bottom bars running length of footing',
      showIf: (answers) => answers.reo_type === 'bar' || answers.reo_type === 'both',
    },
    {
      id: 'long_bar_size',
      type: 'select',
      label: 'Longitudinal Bar Size',
      options: [
        { value: 'N12', label: 'N12 (12mm)' },
        { value: 'N16', label: 'N16 (16mm)' },
        { value: 'N20', label: 'N20 (20mm)' },
      ],
      defaultValue: 'N16',
      showIf: (answers) => (answers.reo_type === 'bar' || answers.reo_type === 'both') && answers.long_bars === true,
    },
    {
      id: 'long_bars_top',
      type: 'number',
      label: 'Number of Top Bars',
      defaultValue: 2,
      min: 0,
      max: 6,
      showIf: (answers) => (answers.reo_type === 'bar' || answers.reo_type === 'both') && answers.long_bars === true,
    },
    {
      id: 'long_bars_bottom',
      type: 'number',
      label: 'Number of Bottom Bars',
      defaultValue: 2,
      min: 0,
      max: 6,
      showIf: (answers) => (answers.reo_type === 'bar' || answers.reo_type === 'both') && answers.long_bars === true,
    },
    {
      id: 'footing_length',
      type: 'number',
      label: 'Total Footing Length',
      unit: 'm',
      min: 1,
      deriveFrom: (scopeData) => scopeData.perimeter || undefined,
      showIf: (answers) => answers.reo_type === 'bar' || answers.reo_type === 'both',
    },
    {
      id: 'rebar_price_per_tonne',
      type: 'currency',
      label: 'Rebar Price per Tonne',
      defaultValue: 2100,
      unit: '/tonne',
      showIf: (answers) => answers.reo_type === 'bar' || answers.reo_type === 'both',
    },
    // Bar chairs
    {
      id: 'bar_chairs',
      type: 'boolean',
      label: 'Include Bar Chairs/Spacers',
      defaultValue: true,
      showIf: (answers) => answers.reo_type !== 'none',
    },
    {
      id: 'chairs_allowance',
      type: 'currency',
      label: 'Bar Chairs Allowance',
      defaultValue: 100,
      showIf: (answers) => answers.reo_type !== 'none' && answers.bar_chairs === true,
    },
    // Labour
    {
      id: 'reo_men',
      type: 'number',
      label: 'How many men for reo fixing?',
      defaultValue: 2,
      min: 1,
      max: 10,
      showIf: (answers) => answers.reo_type !== 'none',
    },
    {
      id: 'reo_hours_per_man',
      type: 'number',
      label: 'How many hours per man?',
      defaultValue: 4,
      min: 0.5,
      step: 0.5,
      unit: 'hrs',
      showIf: (answers) => answers.reo_type !== 'none',
    },
    {
      id: 'reo_labour_rate',
      type: 'currency',
      label: 'Labour Rate per Hour',
      defaultValue: 75,
      priceListKey: 'labour.LABOUR HR',
      unit: '/hr',
      showIf: (answers) => answers.reo_type !== 'none',
    },
    // Delivery
    {
      id: 'reo_delivery',
      type: 'currency',
      label: 'Reinforcement Delivery',
      defaultValue: 150,
      showIf: (answers) => answers.reo_type !== 'none',
    },
  ],

  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    const reoType = answers.reo_type || 'none';

    if (reoType === 'none') {
      return {
        moduleId: 'reinforcement-footing',
        moduleName: 'Reinforcement',
        lineItems: [],
        subtotal: 0,
        exclusions: [],
      };
    }

    // Trench mesh calculation
    if (reoType === 'trench_mesh' || reoType === 'both') {
      const trenchLength = Number(answers.trench_mesh_length) || Number(scopeData.perimeter) || 50;
      const lapAllowance = 1 + (Number(answers.trench_mesh_lap) || 15) / 100;
      const totalLength = trenchLength * lapAllowance;
      const pricePerM = Number(answers.trench_mesh_price_per_m) || 18;
      const meshCost = totalLength * pricePerM;

      lineItems.push({
        id: 'trench_mesh',
        description: `Trench Mesh ${answers.trench_mesh_type || 'L11TM'} (${Math.round(totalLength)}m)`,
        quantity: Math.round(totalLength),
        unit: 'm',
        unitPrice: pricePerM,
        total: Math.round(meshCost * 100) / 100,
        category: 'materials',
      });
      subtotal += meshCost;
    }

    // Longitudinal bars calculation
    if ((reoType === 'bar' || reoType === 'both') && answers.long_bars) {
      const footingLength = Number(answers.footing_length) || Number(scopeData.perimeter) || 50;
      const barSize = answers.long_bar_size || 'N16';
      const topBars = Number(answers.long_bars_top) || 2;
      const bottomBars = Number(answers.long_bars_bottom) || 2;
      const totalBars = topBars + bottomBars;
      
      const totalBarLength = footingLength * totalBars * 1.1; // 10% lap allowance
      const weightPerMetre = REBAR_WEIGHTS[barSize] || 1.58;
      const totalWeight = totalBarLength * weightPerMetre;
      const totalTonnes = totalWeight / 1000;
      
      const pricePerTonne = Number(answers.rebar_price_per_tonne) || 2100;
      const barCost = totalTonnes * pricePerTonne;

      lineItems.push({
        id: 'longitudinal_bars',
        description: `Longitudinal Bars ${barSize} (${topBars}T + ${bottomBars}B)`,
        quantity: Math.round(totalWeight),
        unit: 'kg',
        unitPrice: pricePerTonne / 1000,
        total: Math.round(barCost * 100) / 100,
        category: 'materials',
      });
      subtotal += barCost;
    }

    // Bar chairs
    if (answers.bar_chairs) {
      const chairAllowance = Number(answers.chairs_allowance) || 100;
      
      lineItems.push({
        id: 'bar_chairs',
        description: 'Bar Chairs & Spacers',
        quantity: 1,
        unit: 'lot',
        unitPrice: chairAllowance,
        total: chairAllowance,
        category: 'materials',
      });
      subtotal += chairAllowance;
    }

    // Labour
    const reoMen = Number(answers.reo_men) || 2;
    const reoHoursPerMan = Number(answers.reo_hours_per_man) || 4;
    const reoRate = Number(answers.reo_labour_rate) || getPrice(priceMap, 'labour', 'LABOUR HR', 75);
    const totalReoHours = reoMen * reoHoursPerMan;
    const reoLabourCost = totalReoHours * reoRate;

    lineItems.push({
      id: 'reo_labour',
      description: `Reinforcement Fixing Labour (${reoMen} men × ${reoHoursPerMan} hrs)`,
      quantity: totalReoHours,
      unit: 'hrs',
      unitPrice: reoRate,
      total: reoLabourCost,
      category: 'labour',
    });
    subtotal += reoLabourCost;

    // Delivery
    const delivery = Number(answers.reo_delivery) || 150;
    if (delivery > 0) {
      lineItems.push({
        id: 'reo_delivery',
        description: 'Reinforcement Delivery',
        quantity: 1,
        unit: 'item',
        unitPrice: delivery,
        total: delivery,
        category: 'materials',
      });
      subtotal += delivery;
    }

    return {
      moduleId: 'reinforcement-footing',
      moduleName: 'Reinforcement',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (answers): ExclusionItem[] => {
    const exclusions: ExclusionItem[] = [];
    
    if (answers.reo_type === 'none') {
      exclusions.push({
        id: 'no_reinforcement',
        text: 'Steel reinforcement is not included in this quote.',
        moduleId: 'reinforcement-footing',
      });
    }

    return exclusions;
  },

  validate: (answers) => {
    const errors: string[] = [];

    if (answers.reo_type === 'trench_mesh' || answers.reo_type === 'both') {
      if (!answers.trench_mesh_length || answers.trench_mesh_length < 1) {
        errors.push('Please specify the trench length');
      }
    }

    if (answers.reo_type === 'bar' || answers.reo_type === 'both') {
      if (!answers.footing_length || answers.footing_length < 1) {
        errors.push('Please specify the footing length');
      }
    }

    return { valid: errors.length === 0, errors };
  },
};
