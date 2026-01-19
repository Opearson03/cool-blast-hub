import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice } from '../types';

export const cleanupModule: EstimateModule = {
  id: 'cleanup',
  name: 'Cleanup',
  description: 'Site cleanup, formwork stripping, and return visits',
  icon: 'Trash2',

  questions: [
    {
      id: 'disposal_cost',
      type: 'currency',
      label: 'Disposal / tip cost',
      priceListKey: 'materials.DISPOSAL',
      helpText: 'Waste removal and tip fees',
    },
    // ============ STRIPPING LABOUR SECTION ============
    {
      id: 'stripping_required',
      type: 'boolean',
      label: 'Include formwork stripping labour?',
      defaultValue: false,
      helpText: 'Labour for removing formwork after pour',
    },
    {
      id: 'stripping_crew',
      type: 'number',
      label: 'Stripping Crew Size',
      min: 1,
      defaultValue: 2,
      showIf: (answers) => answers.stripping_required === true,
    },
    {
      id: 'stripping_hours',
      type: 'number',
      label: 'Stripping Hours',
      min: 0.5,
      step: 0.5,
      defaultValue: 2,
      unit: 'hrs',
      showIf: (answers) => answers.stripping_required === true,
    },
    {
      id: 'stripping_rate',
      type: 'currency',
      label: 'Stripping Labour Rate',
      defaultValue: 75,
      priceListKey: 'labour.LABOUR HR',
      unit: '/hr',
      showIf: (answers) => answers.stripping_required === true,
    },
    // ============ RETURN VISITS SECTION ============
    {
      id: 'return_visits_required',
      type: 'boolean',
      label: 'Include return visit(s)?',
      defaultValue: false,
      helpText: 'For site cleanup, touch-ups, or final inspection',
    },
    {
      id: 'return_visits_count',
      type: 'number',
      label: 'Number of Return Visits',
      min: 1,
      defaultValue: 1,
      showIf: (answers) => answers.return_visits_required === true,
    },
    {
      id: 'return_visit_crew',
      type: 'number',
      label: 'Return Visit Crew Size',
      min: 1,
      defaultValue: 2,
      showIf: (answers) => answers.return_visits_required === true,
    },
    {
      id: 'return_visit_hours',
      type: 'number',
      label: 'Hours per Return Visit',
      min: 0.5,
      step: 0.5,
      defaultValue: 2,
      unit: 'hrs',
      showIf: (answers) => answers.return_visits_required === true,
    },
    {
      id: 'return_visit_rate',
      type: 'currency',
      label: 'Return Visit Labour Rate',
      defaultValue: 75,
      priceListKey: 'labour.LABOUR HR',
      unit: '/hr',
      showIf: (answers) => answers.return_visits_required === true,
    },
  ],

  calculate: (answers, priceMap, _scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    const disposalCost = Number(answers.disposal_cost) || 0;

    if (disposalCost > 0) {
      lineItems.push({
        id: 'disposal',
        description: 'Waste Disposal / Tip Fees',
        quantity: 1,
        unit: 'lot',
        unitPrice: disposalCost,
        total: disposalCost,
        category: 'other',
      });
      subtotal += disposalCost;
    }

    // Stripping labour
    if (answers.stripping_required) {
      const crew = Number(answers.stripping_crew) || 2;
      const hours = Number(answers.stripping_hours) || 2;
      const rate = Number(answers.stripping_rate) || getPrice(priceMap, 'labour', 'LABOUR HR', 75);
      const strippingTotal = crew * hours * rate;

      if (strippingTotal > 0) {
        lineItems.push({
          id: 'stripping_labour',
          description: `Formwork Stripping Labour (${crew} men × ${hours} hrs @ $${rate}/hr)`,
          quantity: crew * hours,
          unit: 'hrs',
          unitPrice: rate,
          total: Math.round(strippingTotal * 100) / 100,
          category: 'labour',
        });
        subtotal += strippingTotal;
      }
    }

    // Return visits
    if (answers.return_visits_required) {
      const visits = Number(answers.return_visits_count) || 1;
      const crew = Number(answers.return_visit_crew) || 2;
      const hoursPerVisit = Number(answers.return_visit_hours) || 2;
      const rate = Number(answers.return_visit_rate) || getPrice(priceMap, 'labour', 'LABOUR HR', 75);
      const returnTotal = visits * crew * hoursPerVisit * rate;

      if (returnTotal > 0) {
        const visitLabel = visits === 1 ? '1 visit' : `${visits} visits`;
        lineItems.push({
          id: 'return_visits',
          description: `Return Visit - Site Cleanup (${visitLabel} × ${crew} men × ${hoursPerVisit} hrs @ $${rate}/hr)`,
          quantity: visits * crew * hoursPerVisit,
          unit: 'hrs',
          unitPrice: rate,
          total: Math.round(returnTotal * 100) / 100,
          category: 'labour',
        });
        subtotal += returnTotal;
      }
    }

    return {
      moduleId: 'cleanup',
      moduleName: 'Cleanup',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (answers): ExclusionItem[] => {
    const exclusions: ExclusionItem[] = [];

    if (!answers.stripping_required) {
      exclusions.push({
        id: 'no_stripping',
        text: 'Formwork stripping labour is not included.',
        moduleId: 'cleanup',
      });
    }

    if (!answers.return_visits_required) {
      exclusions.push({
        id: 'no_return_visits',
        text: 'Return visits for site cleanup are not included.',
        moduleId: 'cleanup',
      });
    }

    return exclusions;
  },

  validate: (_answers) => {
    // No required fields - all cleanup options are optional
    return { valid: true, errors: [] };
  },
};
