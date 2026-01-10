import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice, REBAR_WEIGHTS } from '../types';

export const reinforcementSlabModule: EstimateModule = {
  id: 'reinforcement-slab',
  name: 'Reinforcement',
  description: 'Steel mesh or bar reinforcement for slabs and flatwork',
  icon: 'Grid3X3',

  questions: [
    {
      id: 'reo_type',
      type: 'select',
      label: 'Reinforcement Type',
      required: true,
      options: [
        { value: 'none', label: 'No Reinforcement' },
        { value: 'mesh', label: 'Steel Mesh' },
        { value: 'bar', label: 'Bar Reinforcement' },
        { value: 'fiber', label: 'Fiber Only (added to concrete)' },
      ],
      defaultValue: 'mesh',
    },
    // Mesh options
    {
      id: 'mesh_type',
      type: 'select',
      label: 'Mesh Type',
      options: [
        { value: 'SL62', label: 'SL62 (6mm @ 200mm)' },
        { value: 'SL72', label: 'SL72 (7mm @ 200mm)' },
        { value: 'SL82', label: 'SL82 (8mm @ 200mm)' },
        { value: 'SL92', label: 'SL92 (9mm @ 200mm)' },
        { value: 'SL102', label: 'SL102 (10mm @ 200mm)' },
        { value: 'RL718', label: 'RL718 (7mm @ 100mm x 200mm)' },
        { value: 'RL818', label: 'RL818 (8mm @ 100mm x 200mm)' },
        { value: 'RL918', label: 'RL918 (9mm @ 100mm x 200mm)' },
        { value: 'RL1018', label: 'RL1018 (10mm @ 100mm x 200mm)' },
      ],
      defaultValue: 'SL72',
      showIf: (answers) => answers.reo_type === 'mesh',
    },
    {
      id: 'mesh_area',
      type: 'number',
      label: 'Mesh Area Required',
      unit: 'm²',
      min: 1,
      deriveFrom: (scopeData) => scopeData.area || undefined,
      showIf: (answers) => answers.reo_type === 'mesh',
    },
    {
      id: 'mesh_lap_allowance',
      type: 'number',
      label: 'Lap Allowance',
      defaultValue: 15,
      min: 0,
      max: 30,
      unit: '%',
      helpText: 'Extra mesh for overlaps',
      showIf: (answers) => answers.reo_type === 'mesh',
    },
    {
      id: 'mesh_price_per_sheet',
      type: 'currency',
      label: 'Mesh Price per Sheet',
      defaultValue: 95,
      unit: '/sheet',
      helpText: 'Standard sheet is 6m x 2.4m (14.4m²)',
      showIf: (answers) => answers.reo_type === 'mesh',
    },
    // Bar reinforcement options
    {
      id: 'bar_size',
      type: 'select',
      label: 'Bar Size',
      options: [
        { value: 'N12', label: 'N12 (12mm)' },
        { value: 'N16', label: 'N16 (16mm)' },
        { value: 'N20', label: 'N20 (20mm)' },
      ],
      defaultValue: 'N12',
      showIf: (answers) => answers.reo_type === 'bar',
    },
    {
      id: 'bar_spacing',
      type: 'select',
      label: 'Bar Spacing',
      options: [
        { value: '100', label: '100mm centres' },
        { value: '150', label: '150mm centres' },
        { value: '200', label: '200mm centres' },
        { value: '250', label: '250mm centres' },
        { value: '300', label: '300mm centres' },
      ],
      defaultValue: '200',
      showIf: (answers) => answers.reo_type === 'bar',
    },
    {
      id: 'bar_layers',
      type: 'select',
      label: 'Number of Layers',
      options: [
        { value: '1', label: 'Single layer (bottom only)' },
        { value: '2', label: 'Double layer (top and bottom)' },
      ],
      defaultValue: '1',
      showIf: (answers) => answers.reo_type === 'bar',
    },
    {
      id: 'bar_area',
      type: 'number',
      label: 'Slab Area',
      unit: 'm²',
      min: 1,
      deriveFrom: (scopeData) => scopeData.area || undefined,
      showIf: (answers) => answers.reo_type === 'bar',
    },
    {
      id: 'rebar_price_per_tonne',
      type: 'currency',
      label: 'Rebar Price per Tonne',
      defaultValue: 2100,
      unit: '/tonne',
      showIf: (answers) => answers.reo_type === 'bar',
    },
    // Bar chairs
    {
      id: 'bar_chairs',
      type: 'boolean',
      label: 'Include Bar Chairs/Spacers',
      defaultValue: true,
      showIf: (answers) => answers.reo_type === 'mesh' || answers.reo_type === 'bar',
    },
    {
      id: 'chairs_per_m2',
      type: 'number',
      label: 'Chairs per m²',
      defaultValue: 4,
      min: 1,
      max: 10,
      showIf: (answers) => (answers.reo_type === 'mesh' || answers.reo_type === 'bar') && answers.bar_chairs === true,
    },
    {
      id: 'chair_price_each',
      type: 'currency',
      label: 'Chair Price Each',
      defaultValue: 0.35,
      unit: '/each',
      showIf: (answers) => (answers.reo_type === 'mesh' || answers.reo_type === 'bar') && answers.bar_chairs === true,
    },
    // Labour
    {
      id: 'reo_men',
      type: 'number',
      label: 'How many men for reo fixing?',
      defaultValue: 2,
      min: 1,
      max: 10,
      showIf: (answers) => answers.reo_type === 'mesh' || answers.reo_type === 'bar',
    },
    {
      id: 'reo_hours_per_man',
      type: 'number',
      label: 'How many hours per man?',
      defaultValue: 4,
      min: 0.5,
      step: 0.5,
      unit: 'hrs',
      showIf: (answers) => answers.reo_type === 'mesh' || answers.reo_type === 'bar',
    },
    {
      id: 'reo_labour_rate',
      type: 'currency',
      label: 'Labour Rate per Hour',
      defaultValue: 75,
      priceListKey: 'labour.LABOUR HR',
      unit: '/hr',
      showIf: (answers) => answers.reo_type === 'mesh' || answers.reo_type === 'bar',
    },
    // Delivery
    {
      id: 'reo_delivery',
      type: 'currency',
      label: 'Reinforcement Delivery',
      defaultValue: 150,
      showIf: (answers) => answers.reo_type === 'mesh' || answers.reo_type === 'bar',
    },
  ],

  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    const reoType = answers.reo_type || 'none';

    if (reoType === 'none' || reoType === 'fiber') {
      return {
        moduleId: 'reinforcement-slab',
        moduleName: 'Reinforcement',
        lineItems: [],
        subtotal: 0,
        exclusions: [],
      };
    }

    // Mesh calculation
    if (reoType === 'mesh') {
      const meshArea = Number(answers.mesh_area) || Number(scopeData.area) || 100;
      const lapAllowance = 1 + (Number(answers.mesh_lap_allowance) || 15) / 100;
      const totalMeshArea = meshArea * lapAllowance;
      
      const sheetArea = 14.4; // 6m x 2.4m standard sheet
      const sheetsRequired = Math.ceil(totalMeshArea / sheetArea);
      const pricePerSheet = Number(answers.mesh_price_per_sheet) || 95;
      const meshCost = sheetsRequired * pricePerSheet;

      lineItems.push({
        id: 'steel_mesh',
        description: `Steel Mesh ${answers.mesh_type || 'SL72'} (${sheetsRequired} sheets)`,
        quantity: sheetsRequired,
        unit: 'sheets',
        unitPrice: pricePerSheet,
        total: meshCost,
        category: 'materials',
      });
      subtotal += meshCost;
    }

    // Bar reinforcement calculation
    if (reoType === 'bar') {
      const barArea = Number(answers.bar_area) || Number(scopeData.area) || 100;
      const spacing = Number(answers.bar_spacing) || 200;
      const layers = Number(answers.bar_layers) || 1;
      const barSize = answers.bar_size || 'N12';
      
      // Calculate total bar length (both directions)
      const barsPerMetre = 1000 / spacing;
      const sideLength = Math.sqrt(barArea); // Approximate square
      const barsPerDirection = Math.ceil(sideLength * barsPerMetre);
      const totalBarLength = barsPerDirection * sideLength * 2 * layers; // Both directions
      
      const weightPerMetre = REBAR_WEIGHTS[barSize] || 0.888;
      const totalWeight = totalBarLength * weightPerMetre * 1.1; // 10% lap allowance
      const totalTonnes = totalWeight / 1000;
      
      const pricePerTonne = Number(answers.rebar_price_per_tonne) || 2100;
      const barCost = totalTonnes * pricePerTonne;

      lineItems.push({
        id: 'bar_reinforcement',
        description: `Bar Reinforcement ${barSize} @ ${spacing}mm centres (${layers} layer${layers > 1 ? 's' : ''})`,
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
      const area = Number(answers.mesh_area) || Number(answers.bar_area) || Number(scopeData.area) || 100;
      const chairsPerM2 = Number(answers.chairs_per_m2) || 4;
      const totalChairs = Math.ceil(area * chairsPerM2);
      const chairPrice = Number(answers.chair_price_each) || 0.35;
      const chairCost = totalChairs * chairPrice;

      lineItems.push({
        id: 'bar_chairs',
        description: `Bar Chairs/Spacers (${totalChairs} pcs)`,
        quantity: totalChairs,
        unit: 'pcs',
        unitPrice: chairPrice,
        total: Math.round(chairCost * 100) / 100,
        category: 'materials',
      });
      subtotal += chairCost;
    }

    // Labour
    if (reoType === 'mesh' || reoType === 'bar') {
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
    }

    return {
      moduleId: 'reinforcement-slab',
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
        moduleId: 'reinforcement-slab',
      });
    }

    if (answers.reo_type === 'fiber') {
      exclusions.push({
        id: 'fiber_only',
        text: 'Steel reinforcement is not included - fiber reinforcement is added to the concrete mix.',
        moduleId: 'reinforcement-slab',
      });
    }

    return exclusions;
  },

  validate: (answers) => {
    const errors: string[] = [];

    if (answers.reo_type === 'mesh') {
      if (!answers.mesh_area || answers.mesh_area < 1) {
        errors.push('Please specify the mesh area');
      }
    }

    if (answers.reo_type === 'bar') {
      if (!answers.bar_area || answers.bar_area < 1) {
        errors.push('Please specify the slab area');
      }
    }

    return { valid: errors.length === 0, errors };
  },
};
