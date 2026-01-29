import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap, PadFootingGroup } from '../types';
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
    // ============ PRICING ============
    {
      id: 'lap_percentage',
      type: 'number',
      label: 'Lap %',
      defaultValue: 12.5,
      unit: '%',
      helpText: 'Percentage added for lapping/overlaps',
      showIf: (_answers, scopeData) => {
        const padGroups = (scopeData?.padGroups || []) as PadFootingGroup[];
        return padGroups.some(g => g.has_bottom_reo || g.has_top_reo);
      },
      sectionLabel: 'Pricing & Delivery',
    },
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
        const priceKey = isCutBend ? 'N16 CUT BEND' : 'N16 STOCK';
        return priceMap?.['rebar']?.[priceKey];
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
    
    const padGroups = (scopeData.padGroups || []) as PadFootingGroup[];
    const lapPercentage = Number(answers.lap_percentage) || 12.5;
    const lapMargin = 1 + lapPercentage / 100;
    const pricePerTonne = Number(answers.rebar_price_per_tonne) || 2100;
    
    // Fallback for legacy data without groups
    const legacyNumPads = Number(scopeData.total_num_pads) || 1;
    const legacyPadLength = Number(scopeData.total_length) || 2400;
    const legacyPadWidth = Number(scopeData.total_width) || 2400;
    const legacyPadDepth = Number(scopeData.total_depth) || 300;
    
    let totalWeightKg = 0;
    
    // Helper to calculate weight (includes lap margin)
    const getBarWeight = (size: string, lengthMm: number, count: number): number => {
      const weightPerM = REBAR_WEIGHTS[size] || 1.58;
      return (lengthMm / 1000) * weightPerM * count * lapMargin;
    };
    
    // Process pad groups (or fallback to legacy single calculation)
    const groupsToProcess = padGroups.length > 0 
      ? padGroups 
      : [{
          id: 'legacy',
          name: 'Pad Footings',
          quantity: legacyNumPads,
          length: legacyPadLength,
          width: legacyPadWidth,
          depth: legacyPadDepth,
        } as PadFootingGroup];
    
    groupsToProcess.forEach((group) => {
      const groupName = group.name || 'Pad Footings';
      const numPads = group.quantity || 1;
      const padLength = Number(group.length) || 2400;
      const padWidth = Number(group.width) || 2400;
      const padDepth = Number(group.depth) || 300;
      
      // Get group-specific values (all reinforcement is now per-group)
      const hasBottomReo = group.has_bottom_reo ?? false;
      const bottomASize = group.bottom_a_size || 'N16';
      const bottomACentres = group.bottom_a_centres ?? 200;
      const bottomBSize = group.bottom_b_size || 'N16';
      const bottomBCentres = group.bottom_b_centres ?? 200;
      const hasTopReo = group.has_top_reo ?? false;
      const topASize = group.top_a_size || 'N16';
      const topACentres = group.top_a_centres ?? 200;
      const topBSize = group.top_b_size || 'N16';
      const topBCentres = group.top_b_centres ?? 200;
      
      // Bar Chairs (per-group)
      const chairsEnabled = group.chairs_enabled ?? false;
      const chairsPerSqm = group.chairs_per_sqm ?? 4;
      const chairPricePer100 = group.chair_price_per_100 ?? 45;
      
      // Bottom Reinforcement
      if (hasBottomReo) {
        // Bottom Bar A
        const bottomACountPerPad = calculateBarCount(padWidth, bottomACentres);
        const bottomATotalBars = bottomACountPerPad * numPads;
        const { totalLength: bottomALength } = calculateBarLengthWithCrank(padLength, padDepth);
        const bottomAWeightKg = getBarWeight(bottomASize, bottomALength, bottomATotalBars);
        totalWeightKg += bottomAWeightKg;
        const bottomACost = (bottomAWeightKg / 1000) * pricePerTonne;
        totalCost += bottomACost;
        
        lineItems.push({
          id: `reo-pad-${itemIdx++}`,
          description: `${groupName} - Bottom Bar A: ${bottomATotalBars} × ${bottomASize} @ ${bottomALength}mm`,
          quantity: bottomAWeightKg,
          unit: 'kg',
          unitPrice: pricePerTonne / 1000,
          total: bottomACost,
          category: 'materials',
        });
        
        // Bottom Bar B
        const bottomBCountPerPad = calculateBarCount(padLength, bottomBCentres);
        const bottomBTotalBars = bottomBCountPerPad * numPads;
        const { totalLength: bottomBLength } = calculateBarLengthWithCrank(padWidth, padDepth);
        const bottomBWeightKg = getBarWeight(bottomBSize, bottomBLength, bottomBTotalBars);
        totalWeightKg += bottomBWeightKg;
        const bottomBCost = (bottomBWeightKg / 1000) * pricePerTonne;
        totalCost += bottomBCost;
        
        lineItems.push({
          id: `reo-pad-${itemIdx++}`,
          description: `${groupName} - Bottom Bar B: ${bottomBTotalBars} × ${bottomBSize} @ ${bottomBLength}mm`,
          quantity: bottomBWeightKg,
          unit: 'kg',
          unitPrice: pricePerTonne / 1000,
          total: bottomBCost,
          category: 'materials',
        });
      }
      
      // Top Reinforcement
      if (hasTopReo) {
        // Top Bar A
        const topACountPerPad = calculateBarCount(padWidth, topACentres);
        const topATotalBars = topACountPerPad * numPads;
        const { totalLength: topALength } = calculateBarLengthWithCrank(padLength, padDepth);
        const topAWeightKg = getBarWeight(topASize, topALength, topATotalBars);
        totalWeightKg += topAWeightKg;
        const topACost = (topAWeightKg / 1000) * pricePerTonne;
        totalCost += topACost;
        
        lineItems.push({
          id: `reo-pad-${itemIdx++}`,
          description: `${groupName} - Top Bar A: ${topATotalBars} × ${topASize} @ ${topALength}mm`,
          quantity: topAWeightKg,
          unit: 'kg',
          unitPrice: pricePerTonne / 1000,
          total: topACost,
          category: 'materials',
        });
        
        // Top Bar B
        const topBCountPerPad = calculateBarCount(padLength, topBCentres);
        const topBTotalBars = topBCountPerPad * numPads;
        const { totalLength: topBLength } = calculateBarLengthWithCrank(padWidth, padDepth);
        const topBWeightKg = getBarWeight(topBSize, topBLength, topBTotalBars);
        totalWeightKg += topBWeightKg;
        const topBCost = (topBWeightKg / 1000) * pricePerTonne;
        totalCost += topBCost;
        
        lineItems.push({
          id: `reo-pad-${itemIdx++}`,
          description: `${groupName} - Top Bar B: ${topBTotalBars} × ${topBSize} @ ${topBLength}mm`,
          quantity: topBWeightKg,
          unit: 'kg',
          unitPrice: pricePerTonne / 1000,
          total: topBCost,
          category: 'materials',
        });
      }
      
      // Bar chairs (per-group)
      if (chairsEnabled) {
        const padAreaSqm = (padLength / 1000) * (padWidth / 1000) * numPads;
        const totalChairs = Math.ceil(padAreaSqm * chairsPerSqm);
        const chairCost = (totalChairs / 100) * chairPricePer100;
        totalCost += chairCost;
        
        lineItems.push({
          id: `reo-pad-${itemIdx++}`,
          description: `${groupName} - Bar Chairs: ${totalChairs} chairs`,
          quantity: totalChairs,
          unit: 'ea',
          unitPrice: chairPricePer100 / 100,
          total: chairCost,
          category: 'materials',
        });
      }
    });
    
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
    
    // Get exclusions based on all groups
    const exclusions: ExclusionItem[] = [];
    const hasAnyReo = groupsToProcess.some(g => g.has_bottom_reo || g.has_top_reo);
    const hasAnyChairs = groupsToProcess.some(g => g.chairs_enabled);
    
    if (!hasAnyReo) {
      exclusions.push({
        id: 'no-reinforcement',
        text: 'Steel reinforcement not included',
        moduleId: 'reinforcement-pad',
      });
    }
    if (!hasAnyChairs) {
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
    const padGroups = (scopeData?.padGroups || []) as PadFootingGroup[];
    
    // Check if any group has reinforcement
    const hasAnyReo = padGroups.some(g => g.has_bottom_reo || g.has_top_reo);
    const hasAnyChairs = padGroups.some(g => g.chairs_enabled);
    
    if (!hasAnyReo && padGroups.length > 0) {
      exclusions.push({
        id: 'no-reinforcement',
        text: 'Steel reinforcement not included',
        moduleId: 'reinforcement-pad',
      });
    }
    
    if (!hasAnyChairs && padGroups.length > 0) {
      exclusions.push({
        id: 'no-chairs',
        text: 'Bar chairs/spacers not included',
        moduleId: 'reinforcement-pad',
      });
    }
    
    return exclusions;
  },

  validate: (answers: Record<string, any>): { valid: boolean; errors: string[] } => {
    // Validation is now per-group, no global validation needed
    return { valid: true, errors: [] };
  },
};
