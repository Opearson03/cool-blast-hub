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
    // Trench mesh options - enhanced with full type selection
    {
      id: 'trench_mesh_type',
      type: 'select',
      label: 'Trench Mesh Type',
      options: [
        { value: 'L8TM3', label: 'L8TM3 (8mm × 300mm wide)' },
        { value: 'L8TM4', label: 'L8TM4 (8mm × 400mm wide)' },
        { value: 'L11TM3', label: 'L11TM3 (11mm × 300mm wide)' },
        { value: 'L11TM4', label: 'L11TM4 (11mm × 400mm wide)' },
        { value: 'L12TM3', label: 'L12TM3 (12mm × 300mm wide)' },
        { value: 'L12TM4', label: 'L12TM4 (12mm × 400mm wide)' },
        { value: 'L12TM5', label: 'L12TM5 (12mm × 500mm wide)' },
        { value: 'L16TM3', label: 'L16TM3 (16mm × 300mm wide)' },
      ],
      defaultValue: 'L11TM4',
      showIf: (answers) => answers.reo_type === 'trench_mesh' || answers.reo_type === 'both',
    },
    {
      id: 'trench_mesh_length',
      type: 'number',
      label: 'Total Trench Length',
      unit: 'm',
      min: 1,
      deriveFrom: (scopeData) => scopeData.perimeter || scopeData.total_length || undefined,
      showIf: (answers) => answers.reo_type === 'trench_mesh' || answers.reo_type === 'both',
    },
    {
      id: 'trench_mesh_lap',
      type: 'number',
      label: 'Lap Allowance',
      defaultValue: 10,
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
      helpText: 'Price per metre (sheet price ÷ 6m)',
      showIf: (answers) => answers.reo_type === 'trench_mesh' || answers.reo_type === 'both',
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const meshType = moduleAnswers.trench_mesh_type || 'L11TM4';
        const sheetPrice = priceMap?.['trench_mesh']?.[meshType];
        // Trench mesh sheets are 6m long
        return sheetPrice ? sheetPrice / 6 : undefined;
      },
    },
    // Trench Mesh Chairs
    {
      id: 'trench_mesh_chairs',
      type: 'boolean',
      label: 'Include Trench Mesh Chairs',
      defaultValue: true,
      showIf: (answers) => answers.reo_type === 'trench_mesh' || answers.reo_type === 'both',
    },
    {
      id: 'tm_chairs_per_metre',
      type: 'number',
      label: 'Chairs per Linear Metre',
      defaultValue: 2,
      min: 1,
      max: 5,
      showIf: (answers) => (answers.reo_type === 'trench_mesh' || answers.reo_type === 'both') && answers.trench_mesh_chairs === true,
    },
    {
      id: 'tm_chair_price',
      type: 'currency',
      label: 'Trench Mesh Chair Price per 25',
      defaultValue: 12.50,
      unit: '/25',
      helpText: 'Price per bag of 25 chairs',
      showIf: (answers) => (answers.reo_type === 'trench_mesh' || answers.reo_type === 'both') && answers.trench_mesh_chairs === true,
      deriveFrom: (_scopeData, _moduleAnswers, priceMap) => {
        // Return the bag price directly (bag of 25)
        return priceMap?.['consumables']?.['TMCHAIR'];
      },
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
        { value: 'N24', label: 'N24 (24mm)' },
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
      deriveFrom: (scopeData) => scopeData.perimeter || scopeData.total_length || undefined,
      showIf: (answers) => answers.reo_type === 'bar' || answers.reo_type === 'both',
    },
    {
      id: 'rebar_price_per_tonne',
      type: 'currency',
      label: 'Rebar Price per Tonne',
      defaultValue: 2100,
      unit: '/tonne',
      showIf: (answers) => answers.reo_type === 'bar' || answers.reo_type === 'both',
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const barSize = moduleAnswers.long_bar_size || 'N16';
        // Footings typically use stock lengths
        return priceMap?.['rebar']?.[`${barSize} STOCK`];
      },
    },
    // Bar chairs
    {
      id: 'bar_chairs',
      type: 'boolean',
      label: 'Include Bar Chairs/Spacers',
      defaultValue: true,
      showIf: (answers) => answers.reo_type === 'bar' || answers.reo_type === 'both',
    },
    {
      id: 'chairs_allowance',
      type: 'currency',
      label: 'Bar Chairs Allowance',
      defaultValue: 100,
      showIf: (answers) => (answers.reo_type === 'bar' || answers.reo_type === 'both') && answers.bar_chairs === true,
    },
    // Tie Wire
    {
      id: 'tie_wire',
      type: 'boolean',
      label: 'Include Tie Wire',
      defaultValue: true,
      showIf: (answers) => answers.reo_type !== 'none',
    },
    {
      id: 'tie_wire_coils',
      type: 'number',
      label: 'Number of Coils',
      defaultValue: 2,
      min: 1,
      showIf: (answers) => answers.reo_type !== 'none' && answers.tie_wire === true,
    },
    {
      id: 'tie_wire_price',
      type: 'currency',
      label: 'Tie Wire Price per Coil',
      defaultValue: 6,
      unit: '/coil',
      showIf: (answers) => answers.reo_type !== 'none' && answers.tie_wire === true,
      deriveFrom: (_scopeData, _moduleAnswers, priceMap) => {
        return priceMap?.['consumables']?.['TIE WIRE'];
      },
    },
    // Delivery
    {
      id: 'reo_delivery',
      type: 'currency',
      label: 'Reinforcement Delivery',
      defaultValue: 150,
      priceListKey: 'rebar.REO DELIVERY',
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
      const trenchLength = Number(answers.trench_mesh_length) || Number(scopeData.perimeter) || Number(scopeData.total_length) || 50;
      const lapAllowance = 1 + (Number(answers.trench_mesh_lap) || 15) / 100;
      const totalLength = trenchLength * lapAllowance;
      const meshType = answers.trench_mesh_type || 'L11TM4';
      const pricePerM = Number(answers.trench_mesh_price_per_m) || getPrice(priceMap, 'trench_mesh', meshType, 18);
      const meshCost = totalLength * pricePerM;

      lineItems.push({
        id: 'trench_mesh',
        description: `Trench Mesh ${meshType} (${Math.round(totalLength)}m)`,
        quantity: Math.round(totalLength),
        unit: 'm',
        unitPrice: pricePerM,
        total: Math.round(meshCost * 100) / 100,
        category: 'materials',
      });
      subtotal += meshCost;

      // Trench mesh chairs
      if (answers.trench_mesh_chairs) {
        const chairsPerM = Number(answers.tm_chairs_per_metre) || 2;
        const totalChairs = Math.ceil(trenchLength * chairsPerM);
        const bagPricePer25 = Number(answers.tm_chair_price) || getPrice(priceMap, 'consumables', 'TMCHAIR', 12.50);
        const bagsNeeded = Math.ceil(totalChairs / 25);
        const chairCost = bagsNeeded * bagPricePer25;

        lineItems.push({
          id: 'trench_mesh_chairs',
          description: `Trench Mesh Chairs (${bagsNeeded} bags of 25)`,
          quantity: bagsNeeded,
          unit: 'bags',
          unitPrice: bagPricePer25,
          total: Math.round(chairCost * 100) / 100,
          category: 'materials',
        });
        subtotal += chairCost;
      }
    }

    // Longitudinal bars calculation
    if ((reoType === 'bar' || reoType === 'both') && answers.long_bars) {
      const footingLength = Number(answers.footing_length) || Number(scopeData.perimeter) || Number(scopeData.total_length) || 50;
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

    // Bar chairs (for bar reo only)
    if ((reoType === 'bar' || reoType === 'both') && answers.bar_chairs) {
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

    // Tie Wire
    if (answers.tie_wire) {
      const coils = Number(answers.tie_wire_coils) || 2;
      const pricePerCoil = Number(answers.tie_wire_price) || getPrice(priceMap, 'consumables', 'TIE WIRE', 15);
      const wireCost = coils * pricePerCoil;

      lineItems.push({
        id: 'tie_wire',
        description: `Tie Wire (${coils} coils)`,
        quantity: coils,
        unit: 'coils',
        unitPrice: pricePerCoil,
        total: Math.round(wireCost * 100) / 100,
        category: 'materials',
      });
      subtotal += wireCost;
    }

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
