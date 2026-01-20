import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice, REBAR_WEIGHTS } from '../types';

export const reinforcementPiersModule: EstimateModule = {
  id: 'reinforcement-piers',
  name: 'Reinforcement',
  description: 'Starter bars, vertical bars, and ligatures for piers',
  icon: 'Grid3X3',

  questions: [
    // Starter bars section
    {
      id: 'has_starters',
      type: 'boolean',
      label: 'Do the piers have starter bars?',
      defaultValue: false,
      required: true,
    },
    {
      id: 'starter_count',
      type: 'number',
      label: 'How many starters per pier?',
      defaultValue: 4,
      min: 1,
      max: 20,
      showIf: (answers) => answers.has_starters === true,
    },
    {
      id: 'starter_size',
      type: 'select',
      label: 'Starter bar size',
      options: [
        { value: 'N12', label: 'N12 (12mm)' },
        { value: 'N16', label: 'N16 (16mm)' },
        { value: 'N20', label: 'N20 (20mm)' },
        { value: 'N24', label: 'N24 (24mm)' },
        { value: 'N28', label: 'N28 (28mm)' },
      ],
      defaultValue: 'N16',
      showIf: (answers) => answers.has_starters === true,
    },
    {
      id: 'starter_length',
      type: 'number',
      label: 'Total length of starters (mm)',
      defaultValue: 1200,
      helpText: 'Including embedment and projection',
      unit: 'mm',
      showIf: (answers) => answers.has_starters === true,
    },
    {
      id: 'starter_lap_margin',
      type: 'number',
      label: 'Lap/bending/rolling margin (%)',
      defaultValue: 12.5,
      min: 0,
      max: 50,
      step: 0.5,
      unit: '%',
      showIf: (answers) => answers.has_starters === true,
    },
    // Main reinforcement section
    {
      id: 'is_reinforced',
      type: 'boolean',
      label: 'Are the piers reinforced (cages)?',
      defaultValue: false,
    },
    {
      id: 'vertical_bars_count',
      type: 'number',
      label: 'Number of vertical bars per pier',
      defaultValue: 6,
      min: 1,
      max: 20,
      showIf: (answers) => answers.is_reinforced === true,
    },
    {
      id: 'vertical_bar_size',
      type: 'select',
      label: 'Vertical bar size',
      options: [
        { value: 'N12', label: 'N12 (12mm)' },
        { value: 'N16', label: 'N16 (16mm)' },
        { value: 'N20', label: 'N20 (20mm)' },
        { value: 'N24', label: 'N24 (24mm)' },
      ],
      defaultValue: 'N16',
      showIf: (answers) => answers.is_reinforced === true,
    },
    {
      id: 'lig_size',
      type: 'select',
      label: 'Ligature bar size',
      options: [
        { value: 'R10', label: 'R10 (10mm)' },
        { value: 'R12', label: 'R12 (12mm)' },
      ],
      defaultValue: 'R10',
      showIf: (answers) => answers.is_reinforced === true,
    },
    {
      id: 'lig_centres',
      type: 'number',
      label: 'Ligature centres (mm)',
      defaultValue: 200,
      min: 50,
      max: 500,
      step: 25,
      unit: 'mm',
      helpText: 'Spacing between ligatures',
      showIf: (answers) => answers.is_reinforced === true,
    },
    {
      id: 'calculated_ligs',
      type: 'text',
      label: 'Calculated ligatures per pier',
      derivedReadOnly: true,
      deriveFrom: (scopeData, moduleAnswers) => {
        const pierDepth = Number(scopeData.depth) || Number(scopeData.averageExcavationDepth) || 600;
        const ligCentres = Number(moduleAnswers.lig_centres) || 200;
        const ligCount = Math.ceil(pierDepth / ligCentres);
        const ligSize = moduleAnswers.lig_size || 'R10';
        return `${ligSize} @ ${ligCentres}mm = ${ligCount} ligs`;
      },
      showIf: (answers) => answers.is_reinforced === true,
    },
    {
      id: 'cage_lap_margin',
      type: 'number',
      label: 'Lap/bending margin (%)',
      defaultValue: 12.5,
      min: 0,
      max: 50,
      step: 0.5,
      unit: '%',
      showIf: (answers) => answers.is_reinforced === true,
    },
    // Delivery and sundries
    {
      id: 'reo_delivery',
      type: 'currency',
      label: 'Reo delivery charge',
      defaultValue: 150,
      priceListKey: 'rebar.REO DELIVERY',
      showIf: (answers) => answers.has_starters === true || answers.is_reinforced === true,
    },
    {
      id: 'reo_sundries',
      type: 'currency',
      label: 'Sundry materials for reinforcement',
      defaultValue: 200,
      helpText: 'Tie wire, bar chairs, spacers, etc.',
      showIf: (answers) => answers.has_starters === true || answers.is_reinforced === true,
    },
    // Rebar pricing - default to cut and bend
    {
      id: 'rebar_type',
      type: 'select',
      label: 'Rebar supply type',
      options: [
        { value: 'cut_bend', label: 'Cut & Bend' },
        { value: 'stock', label: 'Stock Lengths' },
      ],
      defaultValue: 'cut_bend',
      showIf: (answers) => answers.has_starters === true || answers.is_reinforced === true,
    },
    {
      id: 'rebar_price_per_tonne',
      type: 'currency',
      label: 'Rebar price per tonne',
      defaultValue: 2100,
      unit: '/tonne',
      showIf: (answers) => answers.has_starters === true || answers.is_reinforced === true,
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const barSize = moduleAnswers.starter_size || moduleAnswers.vertical_bar_size || 'N16';
        const supplyType = moduleAnswers.rebar_type === 'cut_bend' ? 'CB' : 'STOCK';
        return priceMap?.['rebar']?.[`${barSize} ${supplyType}`];
      },
    },
  ],

  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    const numPiers = Number(scopeData.num_piers) || 1;
    const pierDepth = (Number(scopeData.depth) || 600) / 1000; // Convert mm to m

    // Calculate starter bar weight
    if (answers.has_starters) {
      const starterCount = Number(answers.starter_count) || 4;
      const starterSize = answers.starter_size || 'N16';
      const starterLength = (Number(answers.starter_length) || 1200) / 1000; // mm to m
      const lapMargin = 1 + (Number(answers.starter_lap_margin) || 12.5) / 100;

      const weightPerMetre = REBAR_WEIGHTS[starterSize] || 1.58;
      const totalStarterWeight = numPiers * starterCount * starterLength * lapMargin * weightPerMetre;
      const totalStarterTonnes = totalStarterWeight / 1000;

      const rebarType = answers.rebar_type === 'cut_bend' ? 'CB' : 'STOCK';
      const priceKey = `${starterSize} ${rebarType}`;
      const pricePerTonne = Number(answers.rebar_price_per_tonne) || getPrice(priceMap, 'rebar', priceKey, 2100);
      const starterCost = totalStarterTonnes * pricePerTonne;

      if (starterCost > 0) {
        lineItems.push({
          id: 'starter_bars',
          description: `Starter Bars ${starterSize} (${numPiers} piers × ${starterCount} starters)`,
          quantity: Math.round(totalStarterWeight),
          unit: 'kg',
          unitPrice: pricePerTonne / 1000,
          total: Math.round(starterCost * 100) / 100,
          category: 'materials',
        });
        subtotal += starterCost;
      }
    }

    // Calculate cage reinforcement weight
    if (answers.is_reinforced) {
      const verticalBars = Number(answers.vertical_bars_count) || 6;
      const verticalSize = answers.vertical_bar_size || 'N16';
      const ligSize = answers.lig_size || 'R10';
      const ligCentres = Number(answers.lig_centres) || 200;
      const lapMargin = 1 + (Number(answers.cage_lap_margin) || 12.5) / 100;
      
      // Calculate lig count from depth and centres
      const pierDepthMm = Number(scopeData.depth) || 600;
      const ligCount = Math.ceil(pierDepthMm / ligCentres);

      // Vertical bars weight
      const verticalWeightPerM = REBAR_WEIGHTS[verticalSize] || 1.58;
      const totalVerticalWeight = numPiers * verticalBars * pierDepth * lapMargin * verticalWeightPerM;

      // Ligature weight (approximate circumference based on pier diameter)
      const pierDiameter = (Number(scopeData.diameter) || 450) / 1000;
      const ligCircumference = Math.PI * (pierDiameter - 0.05); // Allow for cover
      const ligWeightPerM = REBAR_WEIGHTS[ligSize] || 0.617;
      const totalLigWeight = numPiers * ligCount * ligCircumference * lapMargin * ligWeightPerM;

      const totalCageWeight = totalVerticalWeight + totalLigWeight;
      const totalCageTonnes = totalCageWeight / 1000;

      const rebarType = answers.rebar_type === 'cut_bend' ? 'CB' : 'STOCK';
      const priceKey = `${verticalSize} ${rebarType}`;
      const pricePerTonne = Number(answers.rebar_price_per_tonne) || getPrice(priceMap, 'rebar', priceKey, 2100);
      const cageCost = totalCageTonnes * pricePerTonne;

      if (cageCost > 0) {
        lineItems.push({
          id: 'cage_reinforcement',
          description: `Pier Cages ${verticalSize}/${ligSize} @ ${ligCentres}mm (${numPiers} piers × ${ligCount} ligs)`,
          quantity: Math.round(totalCageWeight),
          unit: 'kg',
          unitPrice: pricePerTonne / 1000,
          total: Math.round(cageCost * 100) / 100,
          category: 'materials',
        });
        subtotal += cageCost;
      }
    }

    // Delivery and sundries (materials only, no labour)
    if (answers.has_starters || answers.is_reinforced) {
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

      // Sundries
      const sundries = Number(answers.reo_sundries) || 200;
      if (sundries > 0) {
        lineItems.push({
          id: 'reo_sundries',
          description: 'Reinforcement Sundries (tie wire, chairs, spacers)',
          quantity: 1,
          unit: 'lot',
          unitPrice: sundries,
          total: sundries,
          category: 'materials',
        });
        subtotal += sundries;
      }
    }

    return {
      moduleId: 'reinforcement-piers',
      moduleName: 'Reinforcement',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (answers): ExclusionItem[] => {
    const exclusions: ExclusionItem[] = [];
    
    if (!answers.has_starters && !answers.is_reinforced) {
      exclusions.push({
        id: 'no_reinforcement',
        text: 'Reinforcement and starter bars are not included in this quote.',
        moduleId: 'reinforcement-piers',
      });
    }

    return exclusions;
  },

  validate: (answers) => {
    const errors: string[] = [];

    if (answers.has_starters) {
      if (!answers.starter_count || answers.starter_count < 1) {
        errors.push('Please specify the number of starter bars');
      }
      if (!answers.starter_size) {
        errors.push('Please select a starter bar size');
      }
    }

    if (answers.is_reinforced) {
      if (!answers.vertical_bars_count || answers.vertical_bars_count < 1) {
        errors.push('Please specify the number of vertical bars');
      }
      if (!answers.lig_centres || answers.lig_centres < 50) {
        errors.push('Please specify ligature centres');
      }
    }

    return { valid: errors.length === 0, errors };
  },
};
