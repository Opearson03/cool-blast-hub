import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice } from '../types';

export const labourModule: EstimateModule = {
  id: 'labour',
  name: 'Labour',
  description: 'Crew labour for the entire scope',
  icon: 'Users',

  questions: [
    {
      id: 'crew_size',
      type: 'number',
      label: 'How many workers on site?',
      min: 1,
      max: 20,
      required: true,
      placeholder: 'Enter crew size',
      helpText: 'Total number of workers for this scope',
    },
    {
      id: 'total_hours',
      type: 'number',
      label: 'Total hours for the job',
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
      priceListKey: 'labour.LABOUR LEAD',
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
      priceListKey: 'labour.LABOUR HR',
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
      deriveFrom: () => 1.5, // Standard time-and-a-half
    },
  ],

  calculate: (answers, priceMap, _scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    const crewSize = Number(answers.crew_size) || 0;
    const totalHours = Number(answers.total_hours) || 0;
    const leadRate = Number(answers.lead_rate) || getPrice(priceMap, 'labour', 'LABOUR LEAD', 95);
    const useMixedRates = answers.use_mixed_rates === true;
    const crewRate = Number(answers.crew_rate) || getPrice(priceMap, 'labour', 'LABOUR HR', 75);

    // Don't calculate if no labour inputs provided
    if (crewSize === 0 || totalHours === 0) {
      return {
        moduleId: 'labour',
        moduleName: 'Labour',
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
        id: 'lead_labour',
        description: `Lead Worker (${totalHours} hrs @ $${leadRate}/hr)`,
        quantity: totalHours,
        unit: 'hrs',
        unitPrice: leadRate,
        total: leadCost,
        category: 'labour',
      });
      subtotal += leadCost;

      // Rest of crew at crew rate
      const otherWorkers = crewSize - 1;
      const crewTotalHours = otherWorkers * totalHours;
      const crewCost = crewTotalHours * crewRate;
      lineItems.push({
        id: 'crew_labour',
        description: `Crew Labour (${otherWorkers} workers × ${totalHours} hrs @ $${crewRate}/hr)`,
        quantity: crewTotalHours,
        unit: 'hrs',
        unitPrice: crewRate,
        total: crewCost,
        category: 'labour',
      });
      subtotal += crewCost;
    } else {
      // All workers at lead rate
      const totalWorkerHours = crewSize * totalHours;
      const totalCost = totalWorkerHours * leadRate;

      lineItems.push({
        id: 'regular_labour',
        description: `Labour (${crewSize} workers × ${totalHours} hrs @ $${leadRate}/hr)`,
        quantity: totalWorkerHours,
        unit: 'hrs',
        unitPrice: leadRate,
        total: totalCost,
        category: 'labour',
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
          id: 'overtime_labour',
          description: `Overtime (${crewSize} workers × ${overtimeHours} hrs @ ${overtimeMultiplier}x)`,
          quantity: totalOvertimeHours,
          unit: 'hrs',
          unitPrice: overtimeRate,
          total: overtimeCost,
          category: 'labour',
        });
        subtotal += overtimeCost;
      }
    }

    return {
      moduleId: 'labour',
      moduleName: 'Labour',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (_answers): ExclusionItem[] => {
    // Labour is always included if this module is used
    return [];
  },

  validate: (answers) => {
    const errors: string[] = [];

    if (!answers.crew_size || answers.crew_size < 1) {
      errors.push('Please specify the crew size');
    }
    if (!answers.total_hours || answers.total_hours < 0.5) {
      errors.push('Please specify the total hours');
    }
    if (!answers.lead_rate || answers.lead_rate < 1) {
      errors.push('Please specify the lead worker rate');
    }

    return { valid: errors.length === 0, errors };
  },
};
