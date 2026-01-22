import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap, PierGroup } from '../types';
import { getPrice, REBAR_WEIGHTS } from '../types';

// Default values for pier reinforcement
const DEFAULT_STARTER_COUNT = 4;
const DEFAULT_STARTER_SIZE = 'N16';
const DEFAULT_STARTER_LENGTH = 1200;
const DEFAULT_VERTICAL_BARS_COUNT = 6;
const DEFAULT_VERTICAL_BAR_SIZE = 'N16';
const DEFAULT_LIG_SIZE = 'R10';
const DEFAULT_LIG_CENTRES = 200;
const DEFAULT_LAP_MARGIN = 12.5;

export const reinforcementPiersModule: EstimateModule = {
  id: 'reinforcement-piers',
  name: 'Reinforcement',
  description: 'Starter bars, vertical bars, and ligatures for piers',
  icon: 'Grid3X3',

  questions: [
    // Starter bars toggle
    {
      id: 'has_starters',
      type: 'boolean',
      label: 'Include Starter Bars?',
      defaultValue: false,
      required: true,
      sectionLabel: 'Starter Bars',
    },
    // Cage reinforcement toggle  
    {
      id: 'is_reinforced',
      type: 'boolean',
      label: 'Include Cage Reinforcement?',
      defaultValue: false,
      sectionLabel: 'Cage Reinforcement',
    },
    // Pricing section
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
      sectionLabel: 'Pricing & Delivery',
    },
    {
      id: 'rebar_price_per_tonne',
      type: 'currency',
      label: 'Rebar price per tonne',
      defaultValue: 2100,
      unit: '/tonne',
      showIf: (answers) => answers.has_starters === true || answers.is_reinforced === true,
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const barSize = DEFAULT_STARTER_SIZE;
        const supplyType = moduleAnswers.rebar_type === 'cut_bend' ? 'CB' : 'STOCK';
        return priceMap?.['rebar']?.[`${barSize} ${supplyType}`];
      },
    },
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
  ],

  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    const pierGroups = (scopeData.pierGroups || []) as PierGroup[];
    const lapMargin = 1 + DEFAULT_LAP_MARGIN / 100;
    const pricePerTonne = Number(answers.rebar_price_per_tonne) || 2100;

    // Process each pier group (all piers in a group are identical)
    pierGroups.forEach((group) => {
      const quantity = group.quantity || 1;
      const pierDepthM = (group.depth || 600) / 1000;
      const pierDiameterM = (group.diameter || 450) / 1000;
      
      // Starter bars for this group
      const hasStarters = group.has_starters ?? answers.has_starters;
      if (hasStarters) {
        const starterCount = group.starter_count ?? DEFAULT_STARTER_COUNT;
        const starterSize = group.starter_size || DEFAULT_STARTER_SIZE;
        const starterLength = (group.starter_length ?? DEFAULT_STARTER_LENGTH) / 1000;
        
        const weightPerMetre = REBAR_WEIGHTS[starterSize] || 1.58;
        // Calculate for single pier then multiply by quantity
        const singlePierStarterWeight = starterCount * starterLength * lapMargin * weightPerMetre;
        const totalStarterWeight = singlePierStarterWeight * quantity;
        const starterCost = (totalStarterWeight / 1000) * pricePerTonne;

        if (starterCost > 0) {
          lineItems.push({
            id: `starter_${group.id}`,
            description: `${group.name} - Starters ${starterSize} (${starterCount} bars × ${quantity} piers)`,
            quantity: Math.round(totalStarterWeight),
            unit: 'kg',
            unitPrice: pricePerTonne / 1000,
            total: Math.round(starterCost * 100) / 100,
            category: 'materials',
          });
          subtotal += starterCost;
        }
      }

      // Cage reinforcement for this group
      const isReinforced = group.is_reinforced ?? answers.is_reinforced;
      if (isReinforced) {
        const verticalBars = group.vertical_bars_count ?? DEFAULT_VERTICAL_BARS_COUNT;
        const verticalSize = group.vertical_bar_size || DEFAULT_VERTICAL_BAR_SIZE;
        const ligSize = group.lig_size || DEFAULT_LIG_SIZE;
        const ligCentres = group.lig_centres ?? DEFAULT_LIG_CENTRES;

        // Calculate lig count from depth and centres
        const ligCount = Math.ceil((group.depth || 600) / ligCentres);

        // Vertical bars weight per pier
        const verticalWeightPerM = REBAR_WEIGHTS[verticalSize] || 1.58;
        const singlePierVerticalWeight = verticalBars * pierDepthM * lapMargin * verticalWeightPerM;

        // Ligature weight per pier (circumference based on diameter)
        const ligCircumference = Math.PI * (pierDiameterM - 0.05); // Allow for cover
        const ligWeightPerM = REBAR_WEIGHTS[ligSize] || 0.617;
        const singlePierLigWeight = ligCount * ligCircumference * lapMargin * ligWeightPerM;

        const singlePierCageWeight = singlePierVerticalWeight + singlePierLigWeight;
        const totalCageWeight = singlePierCageWeight * quantity;
        const cageCost = (totalCageWeight / 1000) * pricePerTonne;

        if (cageCost > 0) {
          lineItems.push({
            id: `cage_${group.id}`,
            description: `${group.name} - Cage ${verticalSize}/${ligSize} @ ${ligCentres}mm (${quantity} piers)`,
            quantity: Math.round(totalCageWeight),
            unit: 'kg',
            unitPrice: pricePerTonne / 1000,
            total: Math.round(cageCost * 100) / 100,
            category: 'materials',
          });
          subtotal += cageCost;
        }
      }
    });

    // Delivery and sundries
    const hasAnyReo = answers.has_starters || answers.is_reinforced || 
      pierGroups.some(g => g.has_starters || g.is_reinforced);
    if (hasAnyReo && lineItems.length > 0) {
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

  getExclusions: (answers, scopeData): ExclusionItem[] => {
    const exclusions: ExclusionItem[] = [];
    const pierGroups = (scopeData?.pierGroups || []) as PierGroup[];
    
    // Check if any group has reinforcement
    const anyStartersEnabled = answers.has_starters || pierGroups.some(g => g.has_starters);
    const anyReinforcementEnabled = answers.is_reinforced || pierGroups.some(g => g.is_reinforced);
    
    if (!anyStartersEnabled && !anyReinforcementEnabled) {
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
    return { valid: errors.length === 0, errors };
  },
};