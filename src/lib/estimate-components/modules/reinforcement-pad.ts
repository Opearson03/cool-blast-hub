import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice, REBAR_WEIGHTS } from '../types';

/**
 * Calculate bar length with crank for deep footings
 * Cover: 50mm standard
 * Crank: 80% of depth for footings > 300mm
 */
const calculateBarLengthWithCrank = (
  footingDimMm: number,
  depthMm: number,
  coverMm: number = 50
): { clearSpan: number; crankPerSide: number; totalLength: number } => {
  const clearSpan = footingDimMm - (coverMm * 2);
  const needsCrank = depthMm > 300;
  const crankPerSide = needsCrank ? Math.round(depthMm * 0.8) : 0;
  const totalLength = clearSpan + (crankPerSide * 2);
  return { clearSpan, crankPerSide, totalLength };
};

/**
 * Calculate bar count from spacing
 */
const calculateBarCount = (
  perpDimMm: number,
  centresMm: number,
  coverMm: number = 50
): number => {
  const availableWidth = perpDimMm - (coverMm * 2);
  return Math.floor(availableWidth / centresMm) + 1;
};

export const reinforcementPadModule: EstimateModule = {
  id: 'reinforcement-pad',
  name: 'Reinforcement',
  description: 'Grid reinforcement for pad footings (Bottom & Top Bar A/B with auto crank)',
  icon: 'Grid3X3',

  questions: [
    // ============ BOTTOM REINFORCEMENT ============
    {
      id: 'has_bottom_reo',
      type: 'boolean',
      label: 'Include Bottom Reinforcement?',
      defaultValue: true,
    },
    
    // Bottom Bar A (spans Length direction)
    {
      id: 'bottom_a_size',
      type: 'select',
      label: 'Bottom Bar A Size',
      options: [
        { value: 'N12', label: 'N12 (12mm)' },
        { value: 'N16', label: 'N16 (16mm)' },
        { value: 'N20', label: 'N20 (20mm)' },
        { value: 'N24', label: 'N24 (24mm)' },
        { value: 'N28', label: 'N28 (28mm)' },
        { value: 'N32', label: 'N32 (32mm)' },
      ],
      defaultValue: 'N16',
      showIf: (answers) => answers.has_bottom_reo === true,
    },
    {
      id: 'bottom_a_centres',
      type: 'number',
      label: 'Bottom Bar A Centres',
      defaultValue: 200,
      unit: 'mm',
      min: 100,
      max: 600,
      helpText: 'Bars span length direction, spaced across width',
      showIf: (answers) => answers.has_bottom_reo === true,
    },
    {
      id: 'calculated_bottom_a',
      type: 'text',
      label: 'Calculated Bottom A',
      derivedReadOnly: true,
      deriveFrom: (scopeData, moduleAnswers) => {
        const numPads = Number(scopeData.total_num_pads) || 1;
        const padLength = Number(scopeData.total_length) || 2400;
        const padWidth = Number(scopeData.total_width) || 2400;
        const padDepth = Number(scopeData.total_depth) || 300;
        const centres = Number(moduleAnswers.bottom_a_centres) || 200;
        const barSize = moduleAnswers.bottom_a_size || 'N16';
        
        // Bar count: spaced across width
        const barCountPerPad = calculateBarCount(padWidth, centres);
        const totalBars = barCountPerPad * numPads;
        
        // Bar length: spans length + cranks
        const { totalLength, crankPerSide } = calculateBarLengthWithCrank(padLength, padDepth);
        
        const crankNote = crankPerSide > 0 ? ` (inc. ${crankPerSide}mm crank each end)` : '';
        return `${totalBars} × ${barSize} @ ${totalLength}mm${crankNote}`;
      },
      showIf: (answers) => answers.has_bottom_reo === true,
    },
    
    // Bottom Bar B (spans Width direction)
    {
      id: 'bottom_b_size',
      type: 'select',
      label: 'Bottom Bar B Size',
      options: [
        { value: 'N12', label: 'N12 (12mm)' },
        { value: 'N16', label: 'N16 (16mm)' },
        { value: 'N20', label: 'N20 (20mm)' },
        { value: 'N24', label: 'N24 (24mm)' },
        { value: 'N28', label: 'N28 (28mm)' },
        { value: 'N32', label: 'N32 (32mm)' },
      ],
      defaultValue: 'N16',
      showIf: (answers) => answers.has_bottom_reo === true,
    },
    {
      id: 'bottom_b_centres',
      type: 'number',
      label: 'Bottom Bar B Centres',
      defaultValue: 200,
      unit: 'mm',
      min: 100,
      max: 600,
      helpText: 'Bars span width direction, spaced across length',
      showIf: (answers) => answers.has_bottom_reo === true,
    },
    {
      id: 'calculated_bottom_b',
      type: 'text',
      label: 'Calculated Bottom B',
      derivedReadOnly: true,
      deriveFrom: (scopeData, moduleAnswers) => {
        const numPads = Number(scopeData.total_num_pads) || 1;
        const padLength = Number(scopeData.total_length) || 2400;
        const padWidth = Number(scopeData.total_width) || 2400;
        const padDepth = Number(scopeData.total_depth) || 300;
        const centres = Number(moduleAnswers.bottom_b_centres) || 200;
        const barSize = moduleAnswers.bottom_b_size || 'N16';
        
        // Bar count: spaced across length
        const barCountPerPad = calculateBarCount(padLength, centres);
        const totalBars = barCountPerPad * numPads;
        
        // Bar length: spans width + cranks
        const { totalLength, crankPerSide } = calculateBarLengthWithCrank(padWidth, padDepth);
        
        const crankNote = crankPerSide > 0 ? ` (inc. ${crankPerSide}mm crank each end)` : '';
        return `${totalBars} × ${barSize} @ ${totalLength}mm${crankNote}`;
      },
      showIf: (answers) => answers.has_bottom_reo === true,
    },
    
    // ============ TOP REINFORCEMENT ============
    {
      id: 'has_top_reo',
      type: 'boolean',
      label: 'Include Top Reinforcement?',
      defaultValue: false,
      helpText: 'For deeper footings requiring top mat',
    },
    
    // Top Bar A
    {
      id: 'top_a_size',
      type: 'select',
      label: 'Top Bar A Size',
      options: [
        { value: 'N12', label: 'N12 (12mm)' },
        { value: 'N16', label: 'N16 (16mm)' },
        { value: 'N20', label: 'N20 (20mm)' },
        { value: 'N24', label: 'N24 (24mm)' },
        { value: 'N28', label: 'N28 (28mm)' },
        { value: 'N32', label: 'N32 (32mm)' },
      ],
      defaultValue: 'N16',
      showIf: (answers) => answers.has_top_reo === true,
    },
    {
      id: 'top_a_centres',
      type: 'number',
      label: 'Top Bar A Centres',
      defaultValue: 200,
      unit: 'mm',
      min: 100,
      max: 600,
      showIf: (answers) => answers.has_top_reo === true,
    },
    {
      id: 'calculated_top_a',
      type: 'text',
      label: 'Calculated Top A',
      derivedReadOnly: true,
      deriveFrom: (scopeData, moduleAnswers) => {
        const numPads = Number(scopeData.total_num_pads) || 1;
        const padLength = Number(scopeData.total_length) || 2400;
        const padWidth = Number(scopeData.total_width) || 2400;
        const padDepth = Number(scopeData.total_depth) || 300;
        const centres = Number(moduleAnswers.top_a_centres) || 200;
        const barSize = moduleAnswers.top_a_size || 'N16';
        
        const barCountPerPad = calculateBarCount(padWidth, centres);
        const totalBars = barCountPerPad * numPads;
        const { totalLength, crankPerSide } = calculateBarLengthWithCrank(padLength, padDepth);
        
        const crankNote = crankPerSide > 0 ? ` (inc. ${crankPerSide}mm crank each end)` : '';
        return `${totalBars} × ${barSize} @ ${totalLength}mm${crankNote}`;
      },
      showIf: (answers) => answers.has_top_reo === true,
    },
    
    // Top Bar B
    {
      id: 'top_b_size',
      type: 'select',
      label: 'Top Bar B Size',
      options: [
        { value: 'N12', label: 'N12 (12mm)' },
        { value: 'N16', label: 'N16 (16mm)' },
        { value: 'N20', label: 'N20 (20mm)' },
        { value: 'N24', label: 'N24 (24mm)' },
        { value: 'N28', label: 'N28 (28mm)' },
        { value: 'N32', label: 'N32 (32mm)' },
      ],
      defaultValue: 'N16',
      showIf: (answers) => answers.has_top_reo === true,
    },
    {
      id: 'top_b_centres',
      type: 'number',
      label: 'Top Bar B Centres',
      defaultValue: 200,
      unit: 'mm',
      min: 100,
      max: 600,
      showIf: (answers) => answers.has_top_reo === true,
    },
    {
      id: 'calculated_top_b',
      type: 'text',
      label: 'Calculated Top B',
      derivedReadOnly: true,
      deriveFrom: (scopeData, moduleAnswers) => {
        const numPads = Number(scopeData.total_num_pads) || 1;
        const padLength = Number(scopeData.total_length) || 2400;
        const padWidth = Number(scopeData.total_width) || 2400;
        const padDepth = Number(scopeData.total_depth) || 300;
        const centres = Number(moduleAnswers.top_b_centres) || 200;
        const barSize = moduleAnswers.top_b_size || 'N16';
        
        const barCountPerPad = calculateBarCount(padLength, centres);
        const totalBars = barCountPerPad * numPads;
        const { totalLength, crankPerSide } = calculateBarLengthWithCrank(padWidth, padDepth);
        
        const crankNote = crankPerSide > 0 ? ` (inc. ${crankPerSide}mm crank each end)` : '';
        return `${totalBars} × ${barSize} @ ${totalLength}mm${crankNote}`;
      },
      showIf: (answers) => answers.has_top_reo === true,
    },
    
    // ============ ADDITIONAL HORIZONTAL BARS ============
    {
      id: 'has_additional_horizontal',
      type: 'boolean',
      label: 'Add Additional Horizontal Bars?',
      defaultValue: false,
      helpText: 'For extra bars in the horizontal face (as per structural drawing)',
    },
    {
      id: 'additional_h_count',
      type: 'number',
      label: 'Number of Additional Bars per Pad',
      defaultValue: 2,
      min: 1,
      max: 20,
      showIf: (answers) => answers.has_additional_horizontal === true,
    },
    {
      id: 'additional_h_size',
      type: 'select',
      label: 'Additional Bar Size',
      options: [
        { value: 'N12', label: 'N12 (12mm)' },
        { value: 'N16', label: 'N16 (16mm)' },
        { value: 'N20', label: 'N20 (20mm)' },
        { value: 'N24', label: 'N24 (24mm)' },
      ],
      defaultValue: 'N16',
      showIf: (answers) => answers.has_additional_horizontal === true,
    },
    {
      id: 'additional_h_length',
      type: 'number',
      label: 'Additional Bar Length (mm)',
      unit: 'mm',
      min: 100,
      deriveFrom: (scopeData) => {
        // Default to pad length minus cover
        const padLength = Number(scopeData.total_length) || 2400;
        return padLength - 100;
      },
      showIf: (answers) => answers.has_additional_horizontal === true,
    },
    {
      id: 'calculated_additional_h',
      type: 'text',
      label: 'Calculated Additional Bars',
      derivedReadOnly: true,
      deriveFrom: (scopeData, moduleAnswers) => {
        const numPads = Number(scopeData.total_num_pads) || 1;
        const barsPerPad = Number(moduleAnswers.additional_h_count) || 2;
        const barSize = moduleAnswers.additional_h_size || 'N16';
        const barLength = Number(moduleAnswers.additional_h_length) || 2300;
        const totalBars = barsPerPad * numPads;
        return `${totalBars} × ${barSize} @ ${barLength}mm`;
      },
      showIf: (answers) => answers.has_additional_horizontal === true,
    },
    
    // ============ PRICING ============
    {
      id: 'rebar_type',
      type: 'select',
      label: 'Rebar Supply Type',
      options: [
        { value: 'cut_bend', label: 'Cut & Bend' },
        { value: 'stock', label: 'Stock Lengths' },
      ],
      defaultValue: 'cut_bend',
    },
    {
      id: 'rebar_price_per_tonne',
      type: 'currency',
      label: 'Rebar Price per Tonne',
      defaultValue: 2100,
      unit: '/tonne',
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const isCutBend = moduleAnswers.rebar_type === 'cut_bend';
        const barSize = moduleAnswers.bottom_a_size || 'N16';
        const priceKey = isCutBend ? `${barSize} CUT BEND` : `${barSize} STOCK`;
        return priceMap?.['rebar']?.[priceKey];
      },
    },
    {
      id: 'bar_chairs',
      type: 'boolean',
      label: 'Include Bar Chairs?',
      defaultValue: true,
    },
    {
      id: 'chairs_per_sqm',
      type: 'number',
      label: 'Chairs per m²',
      defaultValue: 4,
      min: 1,
      max: 10,
      showIf: (answers) => answers.bar_chairs === true,
    },
    {
      id: 'chair_price_per_100',
      type: 'currency',
      label: 'Chair Price per 100',
      defaultValue: 45,
      unit: '/100',
      showIf: (answers) => answers.bar_chairs === true,
      deriveFrom: (_scopeData, _moduleAnswers, priceMap) => {
        return priceMap?.['consumables']?.['BARCHAIR'];
      },
    },
    {
      id: 'reo_delivery',
      type: 'currency',
      label: 'Reo Delivery',
      defaultValue: 150,
    },
    {
      id: 'reo_sundries',
      type: 'currency',
      label: 'Reo Sundries (tie wire, etc.)',
      defaultValue: 200,
    },
  ],

  calculate: (answers: Record<string, any>, priceMap: PriceMap, scopeData: Record<string, any>): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let totalCost = 0;
    let itemIdx = 0;
    
    const numPads = Number(scopeData.total_num_pads) || 1;
    const padLength = Number(scopeData.total_length) || 2400;
    const padWidth = Number(scopeData.total_width) || 2400;
    const padDepth = Number(scopeData.total_depth) || 300;
    const pricePerTonne = Number(answers.rebar_price_per_tonne) || 2100;
    
    let totalWeightKg = 0;
    
    // Helper to calculate weight
    const getBarWeight = (size: string, lengthMm: number, count: number): number => {
      const weightPerM = REBAR_WEIGHTS[size] || 1.58;
      return (lengthMm / 1000) * weightPerM * count;
    };
    
    // Bottom Reinforcement
    if (answers.has_bottom_reo) {
      // Bottom Bar A
      const bottomASize = answers.bottom_a_size || 'N16';
      const bottomACentres = Number(answers.bottom_a_centres) || 200;
      const bottomACountPerPad = calculateBarCount(padWidth, bottomACentres);
      const bottomATotalBars = bottomACountPerPad * numPads;
      const { totalLength: bottomALength } = calculateBarLengthWithCrank(padLength, padDepth);
      const bottomAWeightKg = getBarWeight(bottomASize, bottomALength, bottomATotalBars);
      totalWeightKg += bottomAWeightKg;
      const bottomACost = (bottomAWeightKg / 1000) * pricePerTonne;
      totalCost += bottomACost;
      
      lineItems.push({
        id: `reo-pad-${itemIdx++}`,
        description: `Bottom Bar A: ${bottomATotalBars} × ${bottomASize} @ ${bottomALength}mm`,
        quantity: bottomAWeightKg,
        unit: 'kg',
        unitPrice: pricePerTonne / 1000,
        total: bottomACost,
        category: 'materials',
      });
      
      // Bottom Bar B
      const bottomBSize = answers.bottom_b_size || 'N16';
      const bottomBCentres = Number(answers.bottom_b_centres) || 200;
      const bottomBCountPerPad = calculateBarCount(padLength, bottomBCentres);
      const bottomBTotalBars = bottomBCountPerPad * numPads;
      const { totalLength: bottomBLength } = calculateBarLengthWithCrank(padWidth, padDepth);
      const bottomBWeightKg = getBarWeight(bottomBSize, bottomBLength, bottomBTotalBars);
      totalWeightKg += bottomBWeightKg;
      const bottomBCost = (bottomBWeightKg / 1000) * pricePerTonne;
      totalCost += bottomBCost;
      
      lineItems.push({
        id: `reo-pad-${itemIdx++}`,
        description: `Bottom Bar B: ${bottomBTotalBars} × ${bottomBSize} @ ${bottomBLength}mm`,
        quantity: bottomBWeightKg,
        unit: 'kg',
        unitPrice: pricePerTonne / 1000,
        total: bottomBCost,
        category: 'materials',
      });
    }
    
    // Top Reinforcement
    if (answers.has_top_reo) {
      // Top Bar A
      const topASize = answers.top_a_size || 'N16';
      const topACentres = Number(answers.top_a_centres) || 200;
      const topACountPerPad = calculateBarCount(padWidth, topACentres);
      const topATotalBars = topACountPerPad * numPads;
      const { totalLength: topALength } = calculateBarLengthWithCrank(padLength, padDepth);
      const topAWeightKg = getBarWeight(topASize, topALength, topATotalBars);
      totalWeightKg += topAWeightKg;
      const topACost = (topAWeightKg / 1000) * pricePerTonne;
      totalCost += topACost;
      
      lineItems.push({
        id: `reo-pad-${itemIdx++}`,
        description: `Top Bar A: ${topATotalBars} × ${topASize} @ ${topALength}mm`,
        quantity: topAWeightKg,
        unit: 'kg',
        unitPrice: pricePerTonne / 1000,
        total: topACost,
        category: 'materials',
      });
      
      // Top Bar B
      const topBSize = answers.top_b_size || 'N16';
      const topBCentres = Number(answers.top_b_centres) || 200;
      const topBCountPerPad = calculateBarCount(padLength, topBCentres);
      const topBTotalBars = topBCountPerPad * numPads;
      const { totalLength: topBLength } = calculateBarLengthWithCrank(padWidth, padDepth);
      const topBWeightKg = getBarWeight(topBSize, topBLength, topBTotalBars);
      totalWeightKg += topBWeightKg;
      const topBCost = (topBWeightKg / 1000) * pricePerTonne;
      totalCost += topBCost;
      
      lineItems.push({
        id: `reo-pad-${itemIdx++}`,
        description: `Top Bar B: ${topBTotalBars} × ${topBSize} @ ${topBLength}mm`,
        quantity: topBWeightKg,
        unit: 'kg',
        unitPrice: pricePerTonne / 1000,
        total: topBCost,
        category: 'materials',
      });
    }
    
    // Additional Horizontal Bars
    if (answers.has_additional_horizontal) {
      const addHSize = answers.additional_h_size || 'N16';
      const addHCount = Number(answers.additional_h_count) || 2;
      const addHLength = Number(answers.additional_h_length) || (padLength - 100);
      const addHTotalBars = addHCount * numPads;
      const addHWeightKg = getBarWeight(addHSize, addHLength, addHTotalBars);
      totalWeightKg += addHWeightKg;
      const addHCost = (addHWeightKg / 1000) * pricePerTonne;
      totalCost += addHCost;
      
      lineItems.push({
        id: `reo-pad-${itemIdx++}`,
        description: `Additional Horizontal: ${addHTotalBars} × ${addHSize} @ ${addHLength}mm`,
        quantity: addHWeightKg,
        unit: 'kg',
        unitPrice: pricePerTonne / 1000,
        total: addHCost,
        category: 'materials',
      });
    }
    
    // Bar chairs
    if (answers.bar_chairs) {
      const padAreaSqm = (padLength / 1000) * (padWidth / 1000) * numPads;
      const chairsPerSqm = Number(answers.chairs_per_sqm) || 4;
      const totalChairs = Math.ceil(padAreaSqm * chairsPerSqm);
      const chairPrice = Number(answers.chair_price_per_100) || 45;
      const chairCost = (totalChairs / 100) * chairPrice;
      totalCost += chairCost;
      
      lineItems.push({
        id: `reo-pad-${itemIdx++}`,
        description: `Bar Chairs: ${totalChairs} chairs`,
        quantity: totalChairs,
        unit: 'ea',
        unitPrice: chairPrice / 100,
        total: chairCost,
        category: 'materials',
      });
    }
    
    // Delivery
    const delivery = Number(answers.reo_delivery) || 150;
    if (delivery > 0) {
      totalCost += delivery;
      lineItems.push({
        id: `reo-pad-${itemIdx++}`,
        description: 'Reo Delivery',
        quantity: 1,
        unit: 'ea',
        unitPrice: delivery,
        total: delivery,
        category: 'other',
      });
    }
    
    // Sundries
    const sundries = Number(answers.reo_sundries) || 200;
    if (sundries > 0) {
      totalCost += sundries;
      lineItems.push({
        id: `reo-pad-${itemIdx++}`,
        description: 'Reo Sundries (tie wire, etc.)',
        quantity: 1,
        unit: 'ea',
        unitPrice: sundries,
        total: sundries,
        category: 'materials',
      });
    }
    
    // Get exclusions
    const exclusions: ExclusionItem[] = [];
    if (!answers.has_bottom_reo && !answers.has_top_reo) {
      exclusions.push({
        id: 'no-reinforcement',
        text: 'Steel reinforcement not included',
        moduleId: 'reinforcement-pad',
      });
    }
    if (!answers.bar_chairs) {
      exclusions.push({
        id: 'no-chairs',
        text: 'Bar chairs/spacers not included',
        moduleId: 'reinforcement-pad',
      });
    }
    
    return {
      moduleId: 'reinforcement-pad',
      moduleName: 'Reinforcement',
      lineItems,
      subtotal: totalCost,
      exclusions,
    };
  },

  getExclusions: (answers: Record<string, any>, scopeData?: Record<string, any>): ExclusionItem[] => {
    const exclusions: ExclusionItem[] = [];
    
    if (!answers.has_bottom_reo && !answers.has_top_reo) {
      exclusions.push({
        id: 'no-reinforcement',
        text: 'Steel reinforcement not included',
        moduleId: 'reinforcement-pad',
      });
    }
    
    if (!answers.bar_chairs) {
      exclusions.push({
        id: 'no-chairs',
        text: 'Bar chairs/spacers not included',
        moduleId: 'reinforcement-pad',
      });
    }
    
    return exclusions;
  },

  validate: (answers: Record<string, any>): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (answers.has_bottom_reo) {
      if (!answers.bottom_a_centres || answers.bottom_a_centres <= 0) {
        errors.push('Bottom Bar A centres is required');
      }
      if (!answers.bottom_b_centres || answers.bottom_b_centres <= 0) {
        errors.push('Bottom Bar B centres is required');
      }
    }
    
    if (answers.has_top_reo) {
      if (!answers.top_a_centres || answers.top_a_centres <= 0) {
        errors.push('Top Bar A centres is required');
      }
      if (!answers.top_b_centres || answers.top_b_centres <= 0) {
        errors.push('Top Bar B centres is required');
      }
    }
    
    return { valid: errors.length === 0, errors };
  },
};
