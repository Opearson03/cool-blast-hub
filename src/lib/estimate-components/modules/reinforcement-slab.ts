import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice, REBAR_WEIGHTS } from '../types';

// Auto-select chair size based on slab thickness
const getChairTypeFromThickness = (thickness: number): string => {
  if (thickness < 100) return '2540C'; // 25-40mm chairs
  if (thickness < 125) return '5065C'; // 50-65mm chairs
  if (thickness < 175) return '7590C'; // 75-90mm chairs
  if (thickness < 250) return '100120C'; // 100-120mm chairs
  return '125150C'; // 125-150mm chairs
};

// Trench mesh weight per metre (kg/m)
const TRENCH_MESH_WEIGHTS: Record<string, number> = {
  'L8TM3': 1.18,
  'L11TM4': 2.23,
  'L12TM5': 2.82,
};

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
      defaultValue: 12.5,
      min: 0,
      max: 30,
      unit: '%',
      helpText: 'Extra mesh for overlaps (12.5% standard)',
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
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const meshType = moduleAnswers.mesh_type || 'SL72';
        return priceMap?.['mesh']?.[meshType];
      },
    },
    // Bar reinforcement options
    {
      id: 'bar_size',
      type: 'select',
      label: 'Bar Size',
      options: [
        { value: 'N10', label: 'N10 (10mm)' },
        { value: 'N12', label: 'N12 (12mm)' },
        { value: 'N16', label: 'N16 (16mm)' },
        { value: 'N20', label: 'N20 (20mm)' },
        { value: 'N24', label: 'N24 (24mm)' },
        { value: 'N28', label: 'N28 (28mm)' },
        { value: 'N32', label: 'N32 (32mm)' },
        { value: 'N36', label: 'N36 (36mm)' },
        { value: 'N40', label: 'N40 (40mm)' },
      ],
      defaultValue: 'N12',
      showIf: (answers) => answers.reo_type === 'bar',
    },
    {
      id: 'bar_supply_type',
      type: 'select',
      label: 'Rebar Supply Type',
      options: [
        { value: 'cut_bend', label: 'Cut & Bend (Scheduled)' },
        { value: 'stock', label: 'Stock Lengths' },
      ],
      defaultValue: 'cut_bend',
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
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const barSize = moduleAnswers.bar_size || 'N12';
        const supplyType = moduleAnswers.bar_supply_type === 'stock' ? 'STOCK' : 'CB';
        return priceMap?.['rebar']?.[`${barSize} ${supplyType}`];
      },
    },
    // Bar chairs - enhanced with auto-selection based on thickness
    {
      id: 'bar_chairs',
      type: 'boolean',
      label: 'Include Bar Chairs/Spacers',
      defaultValue: true,
      showIf: (answers) => answers.reo_type === 'mesh' || answers.reo_type === 'bar',
    },
    {
      id: 'chair_type',
      type: 'select',
      label: 'Chair Size',
      options: [
        { value: '2540C', label: '25-40mm (Paths/Surrounds)' },
        { value: '5065C', label: '50-65mm (Standard Slabs)' },
        { value: '7590C', label: '75-90mm (Driveways)' },
        { value: '100120C', label: '100-120mm (Industrial)' },
        { value: '125150C', label: '125-150mm (Heavy Duty)' },
      ],
      defaultValue: '5065C',
      showIf: (answers) => (answers.reo_type === 'mesh' || answers.reo_type === 'bar') && answers.bar_chairs === true,
      deriveFrom: (scopeData) => {
        const thickness = Number(scopeData?.thickness) || 100;
        return getChairTypeFromThickness(thickness);
      },
    },
    {
      id: 'chairs_per_m2',
      type: 'number',
      label: 'Chairs per m²',
      defaultValue: 4,
      min: 1,
      max: 10,
      showIf: (answers) => (answers.reo_type === 'mesh' || answers.reo_type === 'bar') && answers.bar_chairs === true,
      deriveFrom: () => 4, // Standard 4 chairs per m²
    },
    {
      id: 'chair_price_per_100',
      type: 'currency',
      label: 'Chair Price per 100',
      defaultValue: 35,
      unit: '/100',
      helpText: 'Price per bag of 100 chairs',
      showIf: (answers) => (answers.reo_type === 'mesh' || answers.reo_type === 'bar') && answers.bar_chairs === true,
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const chairType = moduleAnswers.chair_type || '5065C';
        return priceMap?.['consumables']?.[chairType];
      },
    },
    // Tie Wire
    {
      id: 'tie_wire',
      type: 'boolean',
      label: 'Include Tie Wire',
      defaultValue: true,
      showIf: (answers) => answers.reo_type === 'mesh' || answers.reo_type === 'bar',
    },
    {
      id: 'tie_wire_type',
      type: 'select',
      label: 'Tie Wire Type',
      options: [
        { value: 'TIE WIRE', label: 'Standard Black Tie Wire' },
        { value: 'TIE WIRE GAL', label: 'Galvanised Tie Wire' },
      ],
      defaultValue: 'TIE WIRE',
      showIf: (answers) => (answers.reo_type === 'mesh' || answers.reo_type === 'bar') && answers.tie_wire === true,
    },
    {
      id: 'tie_wire_coils',
      type: 'number',
      label: 'Number of Coils',
      defaultValue: 2,
      min: 1,
      showIf: (answers) => (answers.reo_type === 'mesh' || answers.reo_type === 'bar') && answers.tie_wire === true,
      deriveFrom: () => 2, // Standard 2 coils
    },
    {
      id: 'tie_wire_price',
      type: 'currency',
      label: 'Tie Wire Price per Coil',
      defaultValue: 15,
      unit: '/coil',
      showIf: (answers) => (answers.reo_type === 'mesh' || answers.reo_type === 'bar') && answers.tie_wire === true,
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const wireType = moduleAnswers.tie_wire_type || 'TIE WIRE';
        return priceMap?.['consumables']?.[wireType];
      },
    },
    // Rebar Caps
    {
      id: 'rebar_caps',
      type: 'boolean',
      label: 'Include Rebar Safety Caps',
      defaultValue: false,
      helpText: 'Protective caps for exposed bar ends',
      showIf: (answers) => answers.reo_type === 'bar',
    },
    {
      id: 'rebar_caps_count',
      type: 'number',
      label: 'Number of Rebar Caps',
      defaultValue: 50,
      min: 1,
      showIf: (answers) => answers.reo_type === 'bar' && answers.rebar_caps === true,
    },
    {
      id: 'rebar_cap_price',
      type: 'currency',
      label: 'Rebar Cap Price Each',
      defaultValue: 0.55,
      unit: '/each',
      helpText: 'Price per cap (derived from bag of 100)',
      showIf: (answers) => answers.reo_type === 'bar' && answers.rebar_caps === true,
      deriveFrom: (_scopeData, _moduleAnswers, priceMap) => {
        const bagPrice = priceMap?.['consumables']?.['REBAR CAP'];
        // Bags contain 100 caps
        return bagPrice ? bagPrice / 100 : undefined;
      },
    },
    // Additional Rebar Section (for specifying extra bar beyond mesh)
    {
      id: 'additional_rebar',
      type: 'boolean',
      label: 'Include Additional Rebar',
      defaultValue: false,
      helpText: 'Add bar reinforcement in addition to mesh (e.g., starters, chairs, penetrations)',
      showIf: (answers) => answers.reo_type === 'mesh',
    },
    {
      id: 'additional_rebar_size',
      type: 'select',
      label: 'Additional Bar Size',
      options: [
        { value: 'N10', label: 'N10 (10mm)' },
        { value: 'N12', label: 'N12 (12mm)' },
        { value: 'N16', label: 'N16 (16mm)' },
        { value: 'N20', label: 'N20 (20mm)' },
        { value: 'N24', label: 'N24 (24mm)' },
      ],
      defaultValue: 'N12',
      showIf: (answers) => answers.reo_type === 'mesh' && answers.additional_rebar === true,
    },
    {
      id: 'additional_rebar_length',
      type: 'number',
      label: 'Total Bar Length',
      unit: 'm',
      min: 1,
      helpText: 'Total linear metres of additional bar (e.g., 25m section with 3m bars @ 400mm = ~25m)',
      showIf: (answers) => answers.reo_type === 'mesh' && answers.additional_rebar === true,
    },
    {
      id: 'additional_rebar_spacing',
      type: 'select',
      label: 'Bar Spacing',
      options: [
        { value: '150', label: '150mm centres' },
        { value: '200', label: '200mm centres' },
        { value: '250', label: '250mm centres' },
        { value: '300', label: '300mm centres' },
        { value: '400', label: '400mm centres' },
        { value: 'custom', label: 'Custom (enter below)' },
      ],
      defaultValue: '400',
      helpText: 'Spacing between bars',
      showIf: (answers) => answers.reo_type === 'mesh' && answers.additional_rebar === true,
    },
    {
      id: 'additional_rebar_bar_length',
      type: 'number',
      label: 'Individual Bar Length',
      unit: 'm',
      min: 0.5,
      max: 12,
      defaultValue: 3,
      helpText: 'Length of each bar (e.g., 3m)',
      showIf: (answers) => answers.reo_type === 'mesh' && answers.additional_rebar === true,
    },
    {
      id: 'additional_rebar_price',
      type: 'currency',
      label: 'Additional Bar Price per Tonne',
      defaultValue: 2100,
      unit: '/tonne',
      showIf: (answers) => answers.reo_type === 'mesh' && answers.additional_rebar === true,
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const barSize = moduleAnswers.additional_rebar_size || 'N12';
        return priceMap?.['rebar']?.[`${barSize} C&B`];
      },
    },
    // Edge Beam / Thickening Reinforcement (Trench Mesh)
    {
      id: 'edge_beam_reo',
      type: 'boolean',
      label: 'Include Edge Beam Reinforcement',
      defaultValue: false,
      helpText: 'Trench mesh for thickenings and edge beams',
      showIf: (answers, scopeData) => 
        (answers.reo_type === 'mesh' || answers.reo_type === 'bar') && scopeData?.hasThickening === true,
    },
    {
      id: 'edge_trench_mesh_type',
      type: 'select',
      label: 'Edge Beam Trench Mesh Type',
      options: [
        { value: 'L8TM3', label: 'L8TM3 (8mm @ 200mm)' },
        { value: 'L11TM4', label: 'L11TM4 (11mm @ 200mm)' },
        { value: 'L12TM5', label: 'L12TM5 (12mm @ 200mm)' },
      ],
      defaultValue: 'L11TM4',
      showIf: (answers, scopeData) => 
        (answers.reo_type === 'mesh' || answers.reo_type === 'bar') && 
        scopeData?.hasThickening === true && 
        answers.edge_beam_reo === true,
    },
    {
      id: 'edge_trench_mesh_length',
      type: 'number',
      label: 'Edge Beam Length',
      unit: 'm',
      min: 1,
      helpText: 'Total length of edge beams/thickenings',
      deriveFrom: (scopeData) => scopeData.perimeter || undefined,
      showIf: (answers, scopeData) => 
        (answers.reo_type === 'mesh' || answers.reo_type === 'bar') && 
        scopeData?.hasThickening === true && 
        answers.edge_beam_reo === true,
    },
    {
      id: 'edge_trench_mesh_lap',
      type: 'number',
      label: 'Trench Mesh Lap Allowance',
      defaultValue: 12.5,
      min: 0,
      max: 30,
      unit: '%',
      helpText: '12.5% standard for corners and joins',
      showIf: (answers, scopeData) => 
        (answers.reo_type === 'mesh' || answers.reo_type === 'bar') && 
        scopeData?.hasThickening === true && 
        answers.edge_beam_reo === true,
    },
    {
      id: 'calculated_edge_tm_sheets',
      type: 'text',
      label: 'Calculated Sheets (6m)',
      derivedReadOnly: true,
      deriveFrom: (scopeData, moduleAnswers) => {
        const length = Number(moduleAnswers.edge_trench_mesh_length) || Number(scopeData?.perimeter) || 0;
        if (length <= 0) return undefined;
        const lapPercent = Number(moduleAnswers.edge_trench_mesh_lap) || 12.5;
        const totalWithLap = length * (1 + lapPercent / 100);
        const sheets = Math.ceil(totalWithLap / 6);
        return `${length}m + ${lapPercent}% = ${totalWithLap.toFixed(2)}m ÷ 6m = ${sheets} sheets`;
      },
      showIf: (answers, scopeData) => 
        (answers.reo_type === 'mesh' || answers.reo_type === 'bar') && 
        scopeData?.hasThickening === true && 
        answers.edge_beam_reo === true,
    },
    {
      id: 'edge_trench_mesh_price',
      type: 'currency',
      label: 'Trench Mesh Price per Sheet (6m)',
      defaultValue: 108,
      unit: '/sheet',
      showIf: (answers, scopeData) => 
        (answers.reo_type === 'mesh' || answers.reo_type === 'bar') && 
        scopeData?.hasThickening === true && 
        answers.edge_beam_reo === true,
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const tmType = moduleAnswers.edge_trench_mesh_type || 'L11TM4';
        return priceMap?.['trench_mesh']?.[tmType];
      },
    },
    {
      id: 'edge_tm_chairs',
      type: 'boolean',
      label: 'Include Trench Mesh Chairs',
      defaultValue: true,
      showIf: (answers, scopeData) => 
        (answers.reo_type === 'mesh' || answers.reo_type === 'bar') && 
        scopeData?.hasThickening === true && 
        answers.edge_beam_reo === true,
    },
    {
      id: 'edge_tm_chairs_per_m',
      type: 'number',
      label: 'TM Chairs per Linear Metre',
      defaultValue: 2,
      min: 1,
      max: 5,
      deriveFrom: () => 2,
      showIf: (answers, scopeData) => 
        (answers.reo_type === 'mesh' || answers.reo_type === 'bar') && 
        scopeData?.hasThickening === true && 
        answers.edge_beam_reo === true &&
        answers.edge_tm_chairs === true,
    },
    {
      id: 'edge_tm_chair_price',
      type: 'currency',
      label: 'TM Chair Price per Bag (25)',
      defaultValue: 12.50,
      unit: '/bag',
      showIf: (answers, scopeData) => 
        (answers.reo_type === 'mesh' || answers.reo_type === 'bar') && 
        scopeData?.hasThickening === true && 
        answers.edge_beam_reo === true &&
        answers.edge_tm_chairs === true,
      deriveFrom: (_scopeData, _moduleAnswers, priceMap) => {
        return priceMap?.['consumables']?.['TM CHAIRS'];
      },
    },
    // Delivery
    {
      id: 'reo_delivery',
      type: 'currency',
      label: 'Reinforcement Delivery',
      defaultValue: 150,
      priceListKey: 'rebar.REO DELIVERY',
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
      const meshType = answers.mesh_type || 'SL72';
      const pricePerSheet = Number(answers.mesh_price_per_sheet) || getPrice(priceMap, 'mesh', meshType, 95);
      const meshCost = sheetsRequired * pricePerSheet;

      lineItems.push({
        id: 'steel_mesh',
        description: `Steel Mesh ${meshType} (${sheetsRequired} sheets)`,
        quantity: sheetsRequired,
        unit: 'sheets',
        unitPrice: pricePerSheet,
        total: meshCost,
        category: 'materials',
      });
      subtotal += meshCost;

      // Additional rebar (when mesh is selected but extra bar is needed)
      if (answers.additional_rebar) {
        const addBarSize = answers.additional_rebar_size || 'N12';
        const sectionLength = Number(answers.additional_rebar_length) || 25;
        const spacing = Number(answers.additional_rebar_spacing) || 400;
        const barLength = Number(answers.additional_rebar_bar_length) || 3;
        
        // Calculate number of bars based on section length and spacing
        const numBars = Math.ceil((sectionLength * 1000) / spacing);
        const totalBarLengthM = numBars * barLength;
        
        const weightPerMetre = REBAR_WEIGHTS[addBarSize] || 0.888;
        const totalWeight = totalBarLengthM * weightPerMetre * 1.1; // 10% lap allowance
        const totalTonnes = totalWeight / 1000;
        
        const pricePerTonne = Number(answers.additional_rebar_price) || getPrice(priceMap, 'rebar', `${addBarSize} C&B`, 2100);
        const addBarCost = totalTonnes * pricePerTonne;

        lineItems.push({
          id: 'additional_rebar',
          description: `Additional ${addBarSize} Bar @ ${spacing}mm c/c (${numBars} × ${barLength}m = ${Math.round(totalBarLengthM)}m)`,
          quantity: Math.round(totalWeight),
          unit: 'kg',
          unitPrice: pricePerTonne / 1000,
          total: Math.round(addBarCost * 100) / 100,
          category: 'materials',
        });
        subtotal += addBarCost;
      }
    }

    // Bar reinforcement calculation
    if (reoType === 'bar') {
      const barArea = Number(answers.bar_area) || Number(scopeData.area) || 100;
      const spacing = Number(answers.bar_spacing) || 200;
      const layers = Number(answers.bar_layers) || 1;
      const barSize = answers.bar_size || 'N12';
      const supplyType = answers.bar_supply_type || 'cut_bend';
      
      // Calculate total bar length (both directions)
      const barsPerMetre = 1000 / spacing;
      const sideLength = Math.sqrt(barArea); // Approximate square
      const barsPerDirection = Math.ceil(sideLength * barsPerMetre);
      const totalBarLength = barsPerDirection * sideLength * 2 * layers; // Both directions
      
      const weightPerMetre = REBAR_WEIGHTS[barSize] || 0.888;
      const totalWeight = totalBarLength * weightPerMetre * 1.1; // 10% lap allowance
      const totalTonnes = totalWeight / 1000;
      
      // Get price based on supply type
      let pricePerTonne = Number(answers.rebar_price_per_tonne) || 2100;
      const priceListKey = supplyType === 'cut_bend' ? `${barSize} C&B` : `${barSize} Stock`;
      const catalogPrice = getPrice(priceMap, 'rebar', priceListKey, 0);
      if (catalogPrice > 0) {
        pricePerTonne = catalogPrice;
      }
      
      const barCost = totalTonnes * pricePerTonne;

      lineItems.push({
        id: 'bar_reinforcement',
        description: `Bar Reinforcement ${barSize} @ ${spacing}mm centres (${layers} layer${layers > 1 ? 's' : ''}) - ${supplyType === 'cut_bend' ? 'Cut & Bend' : 'Stock'}`,
        quantity: Math.round(totalWeight),
        unit: 'kg',
        unitPrice: pricePerTonne / 1000,
        total: Math.round(barCost * 100) / 100,
        category: 'materials',
      });
      subtotal += barCost;
    }

    // Bar chairs - rounded to full bags of 100
    if (answers.bar_chairs) {
      const area = Number(answers.mesh_area) || Number(answers.bar_area) || Number(scopeData.area) || 100;
      const chairsPerM2 = Number(answers.chairs_per_m2) || 4;
      const totalChairs = Math.ceil(area * chairsPerM2);
      const chairType = answers.chair_type || getChairTypeFromThickness(Number(scopeData?.thickness) || 100);
      const bagPricePer100 = Number(answers.chair_price_per_100) || getPrice(priceMap, 'consumables', chairType, 35);
      const bagsNeeded = Math.ceil(totalChairs / 100);
      const chairCost = bagsNeeded * bagPricePer100;

      const chairLabels: Record<string, string> = {
        '2540C': '25-40mm',
        '5065C': '50-65mm',
        '7590C': '75-90mm',
        '100120C': '100-120mm',
        '125150C': '125-150mm',
      };

      lineItems.push({
        id: 'bar_chairs',
        description: `Bar Chairs ${chairLabels[chairType] || chairType} (${bagsNeeded} bags of 100)`,
        quantity: bagsNeeded,
        unit: 'bags',
        unitPrice: bagPricePer100,
        total: Math.round(chairCost * 100) / 100,
        category: 'materials',
      });
      subtotal += chairCost;
    }

    // Tie Wire
    if (answers.tie_wire) {
      const wireType = answers.tie_wire_type || 'TIE WIRE';
      const coils = Number(answers.tie_wire_coils) || 2;
      const pricePerCoil = Number(answers.tie_wire_price) || getPrice(priceMap, 'consumables', wireType, 15);
      const wireCost = coils * pricePerCoil;

      lineItems.push({
        id: 'tie_wire',
        description: `Tie Wire ${wireType === 'TIE WIRE GAL' ? 'Galvanised' : 'Black'} (${coils} coils)`,
        quantity: coils,
        unit: 'coils',
        unitPrice: pricePerCoil,
        total: Math.round(wireCost * 100) / 100,
        category: 'materials',
      });
      subtotal += wireCost;
    }

    // Rebar Caps
    if (answers.rebar_caps && reoType === 'bar') {
      const capCount = Number(answers.rebar_caps_count) || 50;
      const capPrice = Number(answers.rebar_cap_price) || getPrice(priceMap, 'consumables', 'REBAR CAP', 0.25);
      const capCost = capCount * capPrice;

      lineItems.push({
        id: 'rebar_caps',
        description: `Rebar Safety Caps (${capCount} pcs)`,
        quantity: capCount,
        unit: 'pcs',
        unitPrice: capPrice,
        total: Math.round(capCost * 100) / 100,
        category: 'materials',
      });
      subtotal += capCost;
    }

    // Edge Beam Trench Mesh - using 6m sheet quantities
    if (answers.edge_beam_reo && scopeData?.hasThickening) {
      const tmType = answers.edge_trench_mesh_type || 'L11TM4';
      const tmLength = Number(answers.edge_trench_mesh_length) || Number(scopeData.perimeter) || 20;
      const lapAllowance = 1 + (Number(answers.edge_trench_mesh_lap) || 12.5) / 100;
      const totalTmLength = tmLength * lapAllowance;
      const sheetsRequired = Math.ceil(totalTmLength / 6);
      const pricePerSheet = Number(answers.edge_trench_mesh_price) || getPrice(priceMap, 'trench_mesh', tmType, 108);
      const tmCost = sheetsRequired * pricePerSheet;

      lineItems.push({
        id: 'edge_trench_mesh',
        description: `Edge Beam Trench Mesh ${tmType} (${sheetsRequired} × 6m sheets)`,
        quantity: sheetsRequired,
        unit: 'sheets',
        unitPrice: pricePerSheet,
        total: Math.round(tmCost * 100) / 100,
        category: 'materials',
      });
      subtotal += tmCost;

      // TM Chairs for edge beams - rounded to bags of 25
      if (answers.edge_tm_chairs) {
        const chairsPerM = Number(answers.edge_tm_chairs_per_m) || 2;
        const totalTmChairs = Math.ceil(tmLength * chairsPerM);
        const bagsNeeded = Math.ceil(totalTmChairs / 25);
        const tmChairPrice = Number(answers.edge_tm_chair_price) || getPrice(priceMap, 'consumables', 'TM CHAIRS', 12.50);
        const tmChairCost = bagsNeeded * tmChairPrice;

        lineItems.push({
          id: 'edge_tm_chairs',
          description: `Edge Beam TM Chairs (${bagsNeeded} bags of 25)`,
          quantity: bagsNeeded,
          unit: 'bags',
          unitPrice: tmChairPrice,
          total: Math.round(tmChairCost * 100) / 100,
          category: 'materials',
        });
        subtotal += tmChairCost;
      }
    }

    // Delivery
    if (reoType === 'mesh' || reoType === 'bar') {
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

  getExclusions: (answers, scopeData): ExclusionItem[] => {
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

    // Add exclusion if thickening exists but edge beam reo is not included
    if (scopeData?.hasThickening && !answers.edge_beam_reo && answers.reo_type !== 'none' && answers.reo_type !== 'fiber') {
      exclusions.push({
        id: 'no_edge_beam_reo',
        text: 'Edge beam/thickening reinforcement is not included.',
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

    if (answers.edge_beam_reo) {
      if (!answers.edge_trench_mesh_length || answers.edge_trench_mesh_length < 1) {
        errors.push('Please specify the edge beam length');
      }
    }

    return { valid: errors.length === 0, errors };
  },
};
