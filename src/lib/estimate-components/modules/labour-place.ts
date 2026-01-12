import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice } from '../types';

export const labourPlaceModule: EstimateModule = {
  id: 'labour-place',
  name: 'Labour - Place',
  description: 'Crew labour for concrete placement and finishing',
  icon: 'HardHat',

  questions: [
    {
      id: 'crew_size',
      type: 'number',
      label: 'How many workers for pour?',
      min: 1,
      max: 20,
      required: true,
      placeholder: 'Enter crew size',
      helpText: 'Total number of workers for placement works',
    },
    {
      id: 'total_hours',
      type: 'number',
      label: 'Total placement hours',
      min: 0.5,
      step: 0.5,
      unit: 'hrs',
      required: true,
      placeholder: 'Enter hours',
      helpText: 'e.g., 8 hrs = 1 day, 16 hrs = 2 days',
    },
    {
      id: 'lead_rate',
      type: 'currency',
      label: 'Lead worker hourly rate',
      helpText: 'Rate for foreman/highest paid worker (incl. super, insurance, etc.)',
      priceListKey: 'labour.LABOUR PLACE LEAD',
      unit: '/hr',
      required: true,
      placeholder: 'Enter rate',
    },
    {
      id: 'use_mixed_rates',
      type: 'boolean',
      label: 'Use different rates for lead vs crew?',
      helpText: 'If yes, lead rate applies to 1 worker, crew rate to others',
      defaultValue: false,
    },
    {
      id: 'crew_rate',
      type: 'currency',
      label: 'Crew member hourly rate',
      defaultValue: 75,
      priceListKey: 'labour.LABOUR PLACE HR',
      unit: '/hr',
      showIf: (answers) => answers.use_mixed_rates === true,
    },
    {
      id: 'overtime_required',
      type: 'boolean',
      label: 'Overtime required?',
      helpText: 'Weekend, after-hours, or extended work',
      defaultValue: false,
    },
    {
      id: 'overtime_hours',
      type: 'number',
      label: 'Overtime hours',
      min: 0.5,
      step: 0.5,
      unit: 'hrs',
      showIf: (answers) => answers.overtime_required === true,
      placeholder: 'Enter overtime hours',
    },
    {
      id: 'overtime_multiplier',
      type: 'number',
      label: 'Overtime multiplier',
      defaultValue: 1.5,
      min: 1,
      max: 3,
      step: 0.1,
      helpText: '1.5 = time-and-a-half, 2 = double-time',
      showIf: (answers) => answers.overtime_required === true,
    },
  ],

  calculate: (answers, priceMap, _scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    const crewSize = Number(answers.crew_size) || 0;
    const totalHours = Number(answers.total_hours) || 0;
    const leadRate = Number(answers.lead_rate) || getPrice(priceMap, 'labour', 'LABOUR PLACE LEAD', 95);
    const useMixedRates = answers.use_mixed_rates === true;
    const crewRate = Number(answers.crew_rate) || getPrice(priceMap, 'labour', 'LABOUR PLACE HR', 75);

    // Don't calculate if no labour inputs provided
    if (crewSize === 0 || totalHours === 0) {
      return {
        moduleId: 'labour-place',
        moduleName: 'Labour - Place',
        lineItems: [],
        subtotal: 0,
        exclusions: [],
      };
    }

    // Regular labour calculation
    if (useMixedRates && crewSize > 1) {
      // 1 lead worker at lead rate
      const leadCost = totalHours * leadRate;
      lineItems.push({
        id: 'lead_labour_place',
        description: `Lead Worker - Place (${totalHours} hrs @ $${leadRate}/hr)`,
        quantity: totalHours,
        unit: 'hrs',
        unitPrice: leadRate,
        total: leadCost,
        category: 'labour-place',
      });
      subtotal += leadCost;

      // Rest of crew at crew rate
      const otherWorkers = crewSize - 1;
      const crewTotalHours = otherWorkers * totalHours;
      const crewCost = crewTotalHours * crewRate;
      lineItems.push({
        id: 'crew_labour_place',
        description: `Crew Labour - Place (${otherWorkers} workers × ${totalHours} hrs @ $${crewRate}/hr)`,
        quantity: crewTotalHours,
        unit: 'hrs',
        unitPrice: crewRate,
        total: crewCost,
        category: 'labour-place',
      });
      subtotal += crewCost;
    } else {
      // All workers at lead rate
      const totalWorkerHours = crewSize * totalHours;
      const totalCost = totalWorkerHours * leadRate;

      lineItems.push({
        id: 'regular_labour_place',
        description: `Labour - Place (${crewSize} workers × ${totalHours} hrs @ $${leadRate}/hr)`,
        quantity: totalWorkerHours,
        unit: 'hrs',
        unitPrice: leadRate,
        total: totalCost,
        category: 'labour-place',
      });
      subtotal += totalCost;
    }

    // Overtime calculation
    if (answers.overtime_required) {
      const overtimeHours = Number(answers.overtime_hours) || 0;
      const overtimeMultiplier = Number(answers.overtime_multiplier) || 1.5;
      
      if (overtimeHours > 0) {
        // Calculate average rate for overtime (weighted if mixed rates)
        let avgRate: number;
        if (useMixedRates && crewSize > 1) {
          avgRate = ((leadRate * 1) + (crewRate * (crewSize - 1))) / crewSize;
        } else {
          avgRate = leadRate;
        }
        
        const overtimeRate = avgRate * overtimeMultiplier;
        const totalOvertimeHours = crewSize * overtimeHours;
        const overtimeCost = totalOvertimeHours * overtimeRate;

        lineItems.push({
          id: 'overtime_labour_place',
          description: `Overtime - Place (${crewSize} workers × ${overtimeHours} hrs @ ${overtimeMultiplier}x)`,
          quantity: totalOvertimeHours,
          unit: 'hrs',
          unitPrice: overtimeRate,
          total: overtimeCost,
          category: 'labour-place',
        });
        subtotal += overtimeCost;
      }
    }

    return {
      moduleId: 'labour-place',
      moduleName: 'Labour - Place',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (_answers): ExclusionItem[] => {
    return [];
  },

  validate: (answers) => {
    const errors: string[] = [];

    if (!answers.crew_size || answers.crew_size < 1) {
      errors.push('Please specify the placement crew size');
    }
    if (!answers.total_hours || answers.total_hours < 0.5) {
      errors.push('Please specify the placement hours');
    }
    if (!answers.lead_rate || answers.lead_rate < 1) {
      errors.push('Please specify the lead worker rate');
    }

    return { valid: errors.length === 0, errors };
  },
};
