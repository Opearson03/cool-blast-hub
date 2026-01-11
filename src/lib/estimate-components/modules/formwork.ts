import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice, FORMWORK_CONSTANTS } from '../types';

export const formworkModule: EstimateModule = {
  id: 'formwork',
  name: 'Formwork',
  description: 'Edge forms, boxing, and formwork setup',
  icon: 'Box',

  questions: [
    {
      id: 'formwork_required',
      type: 'boolean',
      label: 'Is formwork required?',
      defaultValue: false,
      required: true,
    },
    {
      id: 'formwork_metres',
      type: 'number',
      label: 'Linear metres of formwork',
      unit: 'm',
      min: 1,
      helpText: 'Auto-fills from perimeter',
      deriveFrom: (scopeData) => scopeData.perimeter || undefined,
      showIf: (answers) => answers.formwork_required === true,
    },
    {
      id: 'form_height',
      type: 'number',
      label: 'Form height (mm)',
      defaultValue: 100,
      min: 50,
      max: 500,
      unit: 'mm',
      helpText: 'Typically slab thickness + 20mm',
      deriveFrom: (scopeData) => {
        const thickness = Number(scopeData.thickness) || 0;
        if (thickness > 0) return thickness + 20;
        return undefined;
      },
      showIf: (answers) => answers.formwork_required === true,
    },
    {
      id: 'timber_type',
      type: 'select',
      label: 'Timber Type',
      options: [
        { value: '90x45', label: '90x45 Pine' },
        { value: '70x35', label: '70x35 Pine' },
        { value: '100x50', label: '100x50 Pine' },
      ],
      defaultValue: '90x45',
      showIf: (answers) => answers.formwork_required === true,
    },
    {
      id: 'timber_price',
      type: 'currency',
      label: 'Timber price per metre',
      defaultValue: 8,
      priceListKey: 'formwork.FORM TIMBER',
      unit: '/m',
      showIf: (answers) => answers.formwork_required === true,
    },
    {
      id: 'stakes_included',
      type: 'boolean',
      label: 'Include timber stakes?',
      defaultValue: true,
      showIf: (answers) => answers.formwork_required === true,
    },
    {
      id: 'stake_price',
      type: 'currency',
      label: 'Stake price each',
      defaultValue: 3,
      priceListKey: 'formwork.FORM STAKE',
      unit: '/each',
      showIf: (answers) => answers.formwork_required === true && answers.stakes_included === true,
    },
    {
      id: 'sundry_fixings',
      type: 'currency',
      label: 'Sundry fixings (nails, screws)',
      defaultValue: 50,
      helpText: 'Auto-calculated from perimeter if not overridden',
      showIf: (answers) => answers.formwork_required === true,
    },
    {
      id: 'formwork_men',
      type: 'number',
      label: 'How many men?',
      defaultValue: 2,
      min: 1,
      max: 20,
      showIf: (answers) => answers.formwork_required === true,
    },
    {
      id: 'formwork_hours_per_man',
      type: 'number',
      label: 'How many hours per man?',
      defaultValue: 4,
      min: 0.5,
      step: 0.5,
      unit: 'hrs',
      showIf: (answers) => answers.formwork_required === true,
    },
    {
      id: 'formwork_labour_rate',
      type: 'currency',
      label: 'Labour rate per hour',
      defaultValue: 75,
      priceListKey: 'labour.LABOUR HR',
      unit: '/hr',
      showIf: (answers) => answers.formwork_required === true,
    },
  ],

  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    if (answers.formwork_required) {
      // Calculate formwork linear metres (from scope perimeter or user input)
      const formworkMetres = Number(answers.formwork_metres) || Number(scopeData.perimeter) || 0;
      
      if (formworkMetres > 0) {
        // Timber calculation with waste allowance
        const timberType = answers.timber_type || '90x45';
        const timberPricePerM = Number(answers.timber_price) || getPrice(priceMap, 'formwork', 'FORM TIMBER', 8);
        const timberMetresWithWaste = formworkMetres * (1 + FORMWORK_CONSTANTS.timberWastePercent / 100);
        const timberCost = timberMetresWithWaste * timberPricePerM;

        lineItems.push({
          id: 'formwork_timber',
          description: `Formwork Timber ${timberType} (${Math.ceil(timberMetresWithWaste)}m incl. waste)`,
          quantity: Math.ceil(timberMetresWithWaste),
          unit: 'm',
          unitPrice: timberPricePerM,
          total: Math.round(timberCost * 100) / 100,
          category: 'materials',
        });
        subtotal += timberCost;

        // Stakes calculation (at spacing intervals)
        if (answers.stakes_included) {
          const stakesRequired = Math.ceil(formworkMetres / FORMWORK_CONSTANTS.stakeSpacing) + 1;
          const stakePrice = Number(answers.stake_price) || getPrice(priceMap, 'formwork', 'FORM STAKE', 3);
          const stakeCost = stakesRequired * stakePrice;

          lineItems.push({
            id: 'formwork_stakes',
            description: `Timber Stakes (${stakesRequired} @ ${FORMWORK_CONSTANTS.stakeSpacing}m spacing)`,
            quantity: stakesRequired,
            unit: 'each',
            unitPrice: stakePrice,
            total: Math.round(stakeCost * 100) / 100,
            category: 'materials',
          });
          subtotal += stakeCost;
        }

        // Sundry fixings (based on perimeter)
        const sundryFixings = Number(answers.sundry_fixings) || Math.ceil(formworkMetres * 1.5);
        if (sundryFixings > 0) {
          lineItems.push({
            id: 'formwork_fixings',
            description: 'Sundry Fixings (nails, screws, etc.)',
            quantity: 1,
            unit: 'lot',
            unitPrice: sundryFixings,
            total: sundryFixings,
            category: 'materials',
          });
          subtotal += sundryFixings;
        }
      }

      // Labour
      const men = Number(answers.formwork_men) || 2;
      const hoursPerMan = Number(answers.formwork_hours_per_man) || 4;
      const labourRate = Number(answers.formwork_labour_rate) || getPrice(priceMap, 'labour', 'LABOUR HR', 75);
      const totalHours = men * hoursPerMan;
      const labourCost = totalHours * labourRate;

      if (labourCost > 0) {
        lineItems.push({
          id: 'formwork_labour',
          description: `Formwork Labour (${men} men × ${hoursPerMan} hrs)`,
          quantity: totalHours,
          unit: 'hrs',
          unitPrice: labourRate,
          total: labourCost,
          category: 'labour',
        });
        subtotal += labourCost;
      }
    }

    return {
      moduleId: 'formwork',
      moduleName: 'Formwork',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (answers): ExclusionItem[] => {
    if (!answers.formwork_required) {
      return [
        {
          id: 'no_formwork',
          text: 'Formwork and edge forms are not included in this quote.',
          moduleId: 'formwork',
        },
      ];
    }
    return [];
  },

  validate: (answers) => {
    const errors: string[] = [];
    
    if (answers.formwork_required) {
      if (!answers.formwork_metres || answers.formwork_metres < 1) {
        errors.push('Please specify the linear metres of formwork');
      }
      if (!answers.formwork_men || answers.formwork_men < 1) {
        errors.push('Please specify the number of men for formwork');
      }
      if (!answers.formwork_hours_per_man || answers.formwork_hours_per_man < 0.5) {
        errors.push('Please specify hours per man for formwork');
      }
    }

    return { valid: errors.length === 0, errors };
  },
};
