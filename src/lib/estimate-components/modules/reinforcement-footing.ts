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
      defaultValue: 12.5,
      min: 0,
      max: 30,
      unit: '%',
      helpText: 'Extra for overlaps at corners and joins (12.5% standard)',
      showIf: (answers) => answers.reo_type === 'trench_mesh' || answers.reo_type === 'both',
    },
    {
      id: 'calculated_sheets',
      type: 'text',
      label: 'Calculated Trench Mesh Sheets (6m)',
      derivedReadOnly: true,
      deriveFrom: (_scopeData, moduleAnswers) => {
        const length = Number(moduleAnswers.trench_mesh_length) || 0;
        if (length <= 0) return undefined;
        const lapPercent = Number(moduleAnswers.trench_mesh_lap) || 12.5;
        const totalWithLap = length * (1 + lapPercent / 100);
        const sheets = Math.ceil(totalWithLap / 6);
        return `${length}m + ${lapPercent}% = ${totalWithLap.toFixed(2)}m ÷ 6m = ${sheets} sheets`;
      },
      showIf: (answers) => answers.reo_type === 'trench_mesh' || answers.reo_type === 'both',
    },
    {
      id: 'trench_mesh_price_per_sheet',
      type: 'currency',
      label: 'Trench Mesh Price per Sheet (6m)',
      defaultValue: 108,
      unit: '/sheet',
      helpText: 'Price per 6m sheet',
      showIf: (answers) => answers.reo_type === 'trench_mesh' || answers.reo_type === 'both',
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const meshType = moduleAnswers.trench_mesh_type || 'L11TM4';
        return priceMap?.['trench_mesh']?.[meshType];
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
      deriveFrom: () => 2, // Standard 2 chairs per metre
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
    
    // ============ ADDITIONAL REINFORCEMENT SECTION ============
    
    // Horizontal Reo 1 (Additional Trench Mesh Layer)
    {
      id: 'add_horizontal_reo_1',
      type: 'boolean',
      label: 'Add Horizontal Reo 1 (Trench Mesh)',
      defaultValue: false,
      helpText: 'Add an additional layer of trench mesh',
      showIf: (answers) => answers.reo_type !== 'none',
    },
    {
      id: 'horizontal_tm_type',
      type: 'select',
      label: 'Horizontal TM Type',
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
      showIf: (answers) => answers.add_horizontal_reo_1 === true,
    },
    {
      id: 'horizontal_tm_length',
      type: 'number',
      label: 'Horizontal TM Length',
      unit: 'm',
      min: 1,
      deriveFrom: (scopeData) => scopeData.perimeter || scopeData.total_length || undefined,
      showIf: (answers) => answers.add_horizontal_reo_1 === true,
    },
    {
      id: 'horizontal_tm_lap',
      type: 'number',
      label: 'Lap Allowance',
      defaultValue: 12.5,
      min: 0,
      max: 30,
      unit: '%',
      showIf: (answers) => answers.add_horizontal_reo_1 === true,
    },
    {
      id: 'calculated_horizontal_tm_sheets',
      type: 'text',
      label: 'Calculated Sheets',
      derivedReadOnly: true,
      deriveFrom: (_scopeData, moduleAnswers) => {
        const length = Number(moduleAnswers.horizontal_tm_length) || 0;
        if (length <= 0) return undefined;
        const lapPercent = Number(moduleAnswers.horizontal_tm_lap) || 12.5;
        const totalWithLap = length * (1 + lapPercent / 100);
        const sheets = Math.ceil(totalWithLap / 6);
        return `${sheets} sheets`;
      },
      showIf: (answers) => answers.add_horizontal_reo_1 === true,
    },
    {
      id: 'horizontal_tm_price_per_sheet',
      type: 'currency',
      label: 'Price per Sheet (6m)',
      defaultValue: 108,
      unit: '/sheet',
      showIf: (answers) => answers.add_horizontal_reo_1 === true,
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const meshType = moduleAnswers.horizontal_tm_type || 'L11TM4';
        return priceMap?.['trench_mesh']?.[meshType];
      },
    },
    
    // Horizontal Reo 2 (Bar Reinforcement)
    {
      id: 'add_horizontal_reo_2',
      type: 'boolean',
      label: 'Add Horizontal Reo 2 (Bars)',
      defaultValue: false,
      helpText: 'Add horizontal bar reinforcement (e.g., 2 × N16)',
      showIf: (answers) => answers.reo_type !== 'none',
    },
    {
      id: 'horizontal_bar_count',
      type: 'number',
      label: 'Number of Bars',
      defaultValue: 2,
      min: 1,
      max: 10,
      helpText: 'E.g., 2 for "2 × N16"',
      showIf: (answers) => answers.add_horizontal_reo_2 === true,
    },
    {
      id: 'horizontal_bar_size',
      type: 'select',
      label: 'Bar Size',
      options: [
        { value: 'N12', label: 'N12 (12mm)' },
        { value: 'N16', label: 'N16 (16mm)' },
        { value: 'N20', label: 'N20 (20mm)' },
        { value: 'N24', label: 'N24 (24mm)' },
      ],
      defaultValue: 'N16',
      showIf: (answers) => answers.add_horizontal_reo_2 === true,
    },
    {
      id: 'horizontal_bar_length',
      type: 'number',
      label: 'Total Length',
      unit: 'm',
      min: 1,
      deriveFrom: (scopeData) => scopeData.perimeter || scopeData.total_length || undefined,
      showIf: (answers) => answers.add_horizontal_reo_2 === true,
    },
    {
      id: 'horizontal_bar_lap',
      type: 'number',
      label: 'Lap Allowance',
      defaultValue: 12.5,
      min: 0,
      max: 30,
      unit: '%',
      showIf: (answers) => answers.add_horizontal_reo_2 === true,
    },
    {
      id: 'horizontal_bar_price',
      type: 'currency',
      label: 'Rebar Price per Tonne',
      defaultValue: 2100,
      unit: '/tonne',
      showIf: (answers) => answers.add_horizontal_reo_2 === true,
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const barSize = moduleAnswers.horizontal_bar_size || 'N16';
        return priceMap?.['rebar']?.[`${barSize} STOCK`];
      },
    },
    
    // Ligatures
    {
      id: 'add_ligs',
      type: 'boolean',
      label: 'Add Ligatures',
      defaultValue: false,
      helpText: 'Add ligature ties around the bars',
      showIf: (answers) => answers.reo_type !== 'none',
    },
    {
      id: 'lig_size',
      type: 'select',
      label: 'Ligature Size',
      options: [
        { value: 'R10', label: 'R10 (10mm)' },
        { value: 'R12', label: 'R12 (12mm)' },
      ],
      defaultValue: 'R10',
      showIf: (answers) => answers.add_ligs === true,
    },
    {
      id: 'lig_centres',
      type: 'number',
      label: 'Ligature Centres',
      defaultValue: 200,
      unit: 'mm',
      min: 100,
      max: 600,
      showIf: (answers) => answers.add_ligs === true,
    },
    {
      id: 'calculated_ligs',
      type: 'text',
      label: 'Calculated Ligatures',
      derivedReadOnly: true,
      deriveFrom: (scopeData, moduleAnswers) => {
        const length = Number(scopeData.perimeter) || Number(scopeData.total_length) || 0;
        if (length <= 0) return undefined;
        const centres = Number(moduleAnswers.lig_centres) || 200;
        const centresM = centres / 1000;
        const ligCount = Math.ceil(length / centresM);
        const ligSize = moduleAnswers.lig_size || 'R10';
        return `${ligSize} @ ${centres}mm = ${ligCount} ligs`;
      },
      showIf: (answers) => answers.add_ligs === true,
    },
    {
      id: 'lig_perimeter',
      type: 'number',
      label: 'Ligature Perimeter (mm)',
      defaultValue: 600,
      unit: 'mm',
      helpText: 'Perimeter of each ligature (approx. footing width × 2 + depth × 2)',
      showIf: (answers) => answers.add_ligs === true,
    },
    {
      id: 'lig_price',
      type: 'currency',
      label: 'Rebar Price per Tonne',
      defaultValue: 2100,
      unit: '/tonne',
      showIf: (answers) => answers.add_ligs === true,
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const ligSize = moduleAnswers.lig_size || 'R10';
        return priceMap?.['rebar']?.[`${ligSize} COIL`];
      },
    },
    
    // Vertical Starter Bars
    {
      id: 'add_vertical_bars',
      type: 'boolean',
      label: 'Add Vertical Starter Bars',
      defaultValue: false,
      helpText: 'For blockwork starter bars in the footing',
      showIf: (answers) => answers.reo_type !== 'none',
    },
    {
      id: 'vertical_bar_size',
      type: 'select',
      label: 'Bar Size',
      options: [
        { value: 'N12', label: 'N12 (12mm)' },
        { value: 'N16', label: 'N16 (16mm)' },
        { value: 'N20', label: 'N20 (20mm)' },
        { value: 'N24', label: 'N24 (24mm)' },
      ],
      defaultValue: 'N16',
      showIf: (answers) => answers.add_vertical_bars === true,
    },
    {
      id: 'vertical_bar_centres',
      type: 'number',
      label: 'Bar Centres',
      defaultValue: 400,
      unit: 'mm',
      min: 100,
      max: 1200,
      helpText: 'E.g., 400mm for blockwork',
      showIf: (answers) => answers.add_vertical_bars === true,
    },
    {
      id: 'vertical_bar_length',
      type: 'number',
      label: 'Bar Length',
      defaultValue: 1000,
      unit: 'mm',
      helpText: 'Total length including embedment',
      showIf: (answers) => answers.add_vertical_bars === true,
    },
    {
      id: 'calculated_vertical_bars',
      type: 'text',
      label: 'Calculated Vertical Bars',
      derivedReadOnly: true,
      deriveFrom: (scopeData, moduleAnswers) => {
        const length = Number(scopeData.perimeter) || Number(scopeData.total_length) || 0;
        if (length <= 0) return undefined;
        const centres = Number(moduleAnswers.vertical_bar_centres) || 400;
        const centresM = centres / 1000;
        const barCount = Math.ceil(length / centresM);
        const barSize = moduleAnswers.vertical_bar_size || 'N16';
        const barLength = Number(moduleAnswers.vertical_bar_length) || 1000;
        return `${barCount} × ${barSize} @ ${barLength}mm length`;
      },
      showIf: (answers) => answers.add_vertical_bars === true,
    },
    {
      id: 'vertical_bar_lap',
      type: 'number',
      label: 'Lap/Bending Margin',
      defaultValue: 12.5,
      min: 0,
      max: 30,
      unit: '%',
      showIf: (answers) => answers.add_vertical_bars === true,
    },
    {
      id: 'vertical_bar_price',
      type: 'currency',
      label: 'Rebar Price per Tonne',
      defaultValue: 2100,
      unit: '/tonne',
      showIf: (answers) => answers.add_vertical_bars === true,
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const barSize = moduleAnswers.vertical_bar_size || 'N16';
        return priceMap?.['rebar']?.[`${barSize} STOCK`];
      },
    },
    
    // ============ END ADDITIONAL REINFORCEMENT ============
    
    // Longitudinal bar options (original)
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
      deriveFrom: () => 2, // Standard 2 coils
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

    // Trench mesh calculation - using 6m sheet quantities
    if (reoType === 'trench_mesh' || reoType === 'both') {
      const trenchLength = Number(answers.trench_mesh_length) || Number(scopeData.perimeter) || Number(scopeData.total_length) || 50;
      const lapAllowance = 1 + (Number(answers.trench_mesh_lap) || 12.5) / 100;
      const totalLength = trenchLength * lapAllowance;
      const sheetsRequired = Math.ceil(totalLength / 6);
      const meshType = answers.trench_mesh_type || 'L11TM4';
      const pricePerSheet = Number(answers.trench_mesh_price_per_sheet) || getPrice(priceMap, 'trench_mesh', meshType, 108);
      const meshCost = sheetsRequired * pricePerSheet;

      lineItems.push({
        id: 'trench_mesh',
        description: `Trench Mesh ${meshType} (${sheetsRequired} × 6m sheets)`,
        quantity: sheetsRequired,
        unit: 'sheets',
        unitPrice: pricePerSheet,
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

    // Additional Horizontal Reo 1 (Trench Mesh)
    if (answers.add_horizontal_reo_1) {
      const tmLength = Number(answers.horizontal_tm_length) || Number(scopeData.perimeter) || Number(scopeData.total_length) || 50;
      const lapAllowance = 1 + (Number(answers.horizontal_tm_lap) || 12.5) / 100;
      const totalLength = tmLength * lapAllowance;
      const sheetsRequired = Math.ceil(totalLength / 6);
      const meshType = answers.horizontal_tm_type || 'L11TM4';
      const pricePerSheet = Number(answers.horizontal_tm_price_per_sheet) || getPrice(priceMap, 'trench_mesh', meshType, 108);
      const meshCost = sheetsRequired * pricePerSheet;

      lineItems.push({
        id: 'horizontal_tm',
        description: `Horizontal Reo 1 - ${meshType} (${sheetsRequired} × 6m sheets)`,
        quantity: sheetsRequired,
        unit: 'sheets',
        unitPrice: pricePerSheet,
        total: Math.round(meshCost * 100) / 100,
        category: 'materials',
      });
      subtotal += meshCost;
    }

    // Additional Horizontal Reo 2 (Bars)
    if (answers.add_horizontal_reo_2) {
      const barCount = Number(answers.horizontal_bar_count) || 2;
      const barLength = Number(answers.horizontal_bar_length) || Number(scopeData.perimeter) || Number(scopeData.total_length) || 50;
      const lapAllowance = 1 + (Number(answers.horizontal_bar_lap) || 12.5) / 100;
      const totalBarLength = barCount * barLength * lapAllowance;
      const barSize = answers.horizontal_bar_size || 'N16';
      const weightPerMetre = REBAR_WEIGHTS[barSize] || 1.58;
      const totalWeight = totalBarLength * weightPerMetre;
      const totalTonnes = totalWeight / 1000;
      const pricePerTonne = Number(answers.horizontal_bar_price) || getPrice(priceMap, 'rebar', `${barSize} STOCK`, 2100);
      const barCost = totalTonnes * pricePerTonne;

      lineItems.push({
        id: 'horizontal_bars',
        description: `Horizontal Reo 2 - ${barCount} × ${barSize} (${Math.round(totalWeight)}kg)`,
        quantity: Math.round(totalWeight),
        unit: 'kg',
        unitPrice: pricePerTonne / 1000,
        total: Math.round(barCost * 100) / 100,
        category: 'materials',
      });
      subtotal += barCost;
    }

    // Ligatures
    if (answers.add_ligs) {
      const footingLength = Number(scopeData.perimeter) || Number(scopeData.total_length) || 50;
      const ligCentres = Number(answers.lig_centres) || 200;
      const ligCount = Math.ceil((footingLength * 1000) / ligCentres);
      const ligPerimeter = Number(answers.lig_perimeter) || 600;
      const ligSize = answers.lig_size || 'R10';
      
      const totalLigLength = (ligCount * ligPerimeter) / 1000; // Convert to metres
      const weightPerMetre = REBAR_WEIGHTS[ligSize] || 0.617;
      const totalWeight = totalLigLength * weightPerMetre;
      const totalTonnes = totalWeight / 1000;
      const pricePerTonne = Number(answers.lig_price) || getPrice(priceMap, 'rebar', `${ligSize} COIL`, 2100);
      const ligCost = totalTonnes * pricePerTonne;

      lineItems.push({
        id: 'ligatures',
        description: `Ligatures ${ligSize} @ ${ligCentres}mm (${ligCount} ligs, ${Math.round(totalWeight)}kg)`,
        quantity: ligCount,
        unit: 'ligs',
        unitPrice: Math.round((ligCost / ligCount) * 100) / 100,
        total: Math.round(ligCost * 100) / 100,
        category: 'materials',
      });
      subtotal += ligCost;
    }

    // Vertical Starter Bars
    if (answers.add_vertical_bars) {
      const footingLength = Number(scopeData.perimeter) || Number(scopeData.total_length) || 50;
      const barCentres = Number(answers.vertical_bar_centres) || 400;
      const barCount = Math.ceil((footingLength * 1000) / barCentres);
      const barLength = (Number(answers.vertical_bar_length) || 1000) / 1000; // Convert to metres
      const lapAllowance = 1 + (Number(answers.vertical_bar_lap) || 12.5) / 100;
      const barSize = answers.vertical_bar_size || 'N16';
      
      const totalBarLength = barCount * barLength * lapAllowance;
      const weightPerMetre = REBAR_WEIGHTS[barSize] || 1.58;
      const totalWeight = totalBarLength * weightPerMetre;
      const totalTonnes = totalWeight / 1000;
      const pricePerTonne = Number(answers.vertical_bar_price) || getPrice(priceMap, 'rebar', `${barSize} STOCK`, 2100);
      const barCost = totalTonnes * pricePerTonne;

      lineItems.push({
        id: 'vertical_starters',
        description: `Vertical Starters ${barSize} @ ${barCentres}mm (${barCount} × ${Math.round(barLength * 1000)}mm, ${Math.round(totalWeight)}kg)`,
        quantity: barCount,
        unit: 'bars',
        unitPrice: Math.round((barCost / barCount) * 100) / 100,
        total: Math.round(barCost * 100) / 100,
        category: 'materials',
      });
      subtotal += barCost;
    }

    // Longitudinal bars calculation (original)
    if ((reoType === 'bar' || reoType === 'both') && answers.long_bars) {
      const footingLength = Number(answers.footing_length) || Number(scopeData.perimeter) || Number(scopeData.total_length) || 50;
      const barSize = answers.long_bar_size || 'N16';
      const topBars = Number(answers.long_bars_top) || 2;
      const bottomBars = Number(answers.long_bars_bottom) || 2;
      const totalBars = topBars + bottomBars;
      
      const totalBarLength = footingLength * totalBars * 1.125; // 12.5% lap allowance
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
