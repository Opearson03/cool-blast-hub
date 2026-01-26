import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice, PUMP_RECOMMENDATIONS, roundUpToM3 } from '../types';

// Helper function to get pump recommendation based on volume
function getPumpRecommendation(volume: number): { type: string; label: string } {
  if (volume <= 0) return { type: '', label: '' };
  if (volume <= PUMP_RECOMMENDATIONS.directChute.maxVolume) {
    return { type: 'DIRECT', label: PUMP_RECOMMENDATIONS.directChute.label };
  }
  if (volume <= PUMP_RECOMMENDATIONS.linePump.maxVolume) {
    return { type: 'LINE PUMP', label: PUMP_RECOMMENDATIONS.linePump.label };
  }
  if (volume <= PUMP_RECOMMENDATIONS.smallBoom.maxVolume) {
    return { type: '32M BOOM', label: PUMP_RECOMMENDATIONS.smallBoom.label };
  }
  if (volume <= PUMP_RECOMMENDATIONS.largeBoom.maxVolume) {
    return { type: '42M BOOM', label: PUMP_RECOMMENDATIONS.largeBoom.label };
  }
  return { type: '56M BOOM', label: PUMP_RECOMMENDATIONS.multiple.label };
}

export const concretePumpingModule: EstimateModule = {
  id: 'concrete-pumping',
  name: 'Concrete Pumping',
  description: 'Pump hire, travel, and associated costs',
  icon: 'Truck',

  questions: [
    {
      id: 'pump_required',
      type: 'boolean',
      label: 'Do you require a concrete pump?',
      defaultValue: false,
      required: true,
    },
    {
      id: 'number_of_visits',
      type: 'number',
      label: 'Number of pump visits',
      defaultValue: 1,
      min: 1,
      max: 10,
      step: 1,
      helpText: 'For multi-pour projects requiring separate pump bookings',
      showIf: (answers) => answers.pump_required === true,
    },
    {
      id: 'pump_recommendation',
      type: 'text',
      label: 'Recommended Pump',
      helpText: 'Based on calculated concrete volume',
      derivedReadOnly: true,
      deriveFrom: (scopeData) => {
        const volume = Number(scopeData.concrete_volume) || Number(scopeData.volume) || 0;
        if (volume <= 0) return undefined;
        const rec = getPumpRecommendation(volume);
        // If user chose to pump, don't show "direct from chute" - recommend line pump as minimum
        if (rec.type === 'DIRECT') {
          return PUMP_RECOMMENDATIONS.linePump.label;
        }
        return rec.label || undefined;
      },
      showIf: (answers) => answers.pump_required === true,
    },
    {
      id: 'pump_type',
      type: 'select',
      label: 'What pump size?',
      options: [
        { value: 'LINE PUMP', label: 'Line Pump', priceKey: 'pumping.LINE PUMP' },
        { value: '20M BOOM', label: '20M Boom Pump', priceKey: 'pumping.20M BOOM' },
        { value: '32M BOOM', label: '32M Boom Pump', priceKey: 'pumping.32M BOOM' },
        { value: '36M BOOM', label: '36M Boom Pump', priceKey: 'pumping.36M BOOM' },
        { value: '38M BOOM', label: '38M Boom Pump', priceKey: 'pumping.38M BOOM' },
        { value: '42M BOOM', label: '42M Boom Pump', priceKey: 'pumping.42M BOOM' },
        { value: '48M BOOM', label: '48M Boom Pump', priceKey: 'pumping.48M BOOM' },
        { value: '56M BOOM', label: '56M Boom Pump', priceKey: 'pumping.56M BOOM' },
      ],
      required: true,
      helpText: 'Select based on site access and volume',
      showIf: (answers) => answers.pump_required === true,
      deriveFrom: (scopeData, moduleAnswers) => {
        // Only suggest if user hasn't already selected
        if (moduleAnswers?.pump_type) return undefined;
        const volume = Number(scopeData.concrete_volume) || Number(scopeData.volume) || 0;
        if (volume <= 0) return undefined;
        const rec = getPumpRecommendation(volume);
        // Don't auto-select direct chute option
        if (rec.type === 'DIRECT' || rec.type === '') return undefined;
        return rec.type;
      },
    },
    {
      id: 'pump_rate',
      type: 'currency',
      label: 'Pump hourly rate',
      defaultValue: 180,
      unit: '/hr',
      helpText: 'Auto-fills from price list based on pump type',
      showIf: (answers) => answers.pump_required === true,
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const pumpType = moduleAnswers.pump_type || 'LINE PUMP';
        return priceMap['pumping']?.[pumpType];
      },
    },
    {
      id: 'standard_travel_sufficient',
      type: 'boolean',
      label: 'Is standard 1 hr travel sufficient?',
      defaultValue: true,
      helpText: 'Travel is charged at the pump hourly rate',
      showIf: (answers) => answers.pump_required === true,
    },
    {
      id: 'travel_hours',
      type: 'number',
      label: 'Travel hours required',
      defaultValue: 2,
      min: 0.5,
      step: 0.5,
      unit: 'hrs',
      showIf: (answers) => answers.pump_required === true && answers.standard_travel_sufficient === false,
      deriveFrom: () => 2, // Standard 2 hours travel
    },
    {
      id: 'pump_hours_on_site',
      type: 'number',
      label: 'How many hours do you expect the pump to be on site?',
      defaultValue: 4,
      min: 1,
      step: 0.5,
      unit: 'hrs',
      helpText: 'Minimum 4 hours for boom pumps',
      showIf: (answers) => answers.pump_required === true,
      deriveFrom: () => 4, // Standard 4 hours on site
    },
    {
      id: 'primer_count',
      type: 'number',
      label: 'Primer charge (count)',
      defaultValue: 1,
      min: 0,
      max: 5,
      showIf: (answers) => answers.pump_required === true,
      deriveFrom: () => 1, // Standard 1 primer
    },
    {
      id: 'primer_cost',
      type: 'currency',
      label: 'Primer cost each',
      defaultValue: 20,
      priceListKey: 'pumping.PRIMER',
      showIf: (answers) => answers.pump_required === true,
    },
    {
      id: 'offsite_washout',
      type: 'boolean',
      label: 'Do you require offsite washout?',
      defaultValue: false,
      showIf: (answers) => answers.pump_required === true,
    },
    {
      id: 'washout_cost',
      type: 'currency',
      label: 'Offsite washout cost',
      defaultValue: 250,
      priceListKey: 'pumping.PUMP WASH',
      showIf: (answers) => answers.pump_required === true && answers.offsite_washout === true,
    },
    {
      id: 'additional_pumpy',
      type: 'boolean',
      label: 'Will you need an additional man (pumpy)?',
      defaultValue: true,
      helpText: 'Charged same hours as pump hire',
      showIf: (answers) => answers.pump_required === true,
    },
    {
      id: 'pumpy_rate',
      type: 'currency',
      label: 'Additional man rate per hour',
      defaultValue: 95,
      priceListKey: 'pumping.PUMP LAB',
      unit: '/hr',
      showIf: (answers) => answers.pump_required === true && answers.additional_pumpy === true,
    },
    {
      id: 'm3_rate',
      type: 'currency',
      label: 'Pumping charge per m³',
      defaultValue: 8,
      priceListKey: 'pumping.PUMP M3',
      unit: '/m³',
      helpText: 'Applied to total volume including wastage',
      showIf: (answers) => answers.pump_required === true,
    },
    {
      id: 'wastage_percent',
      type: 'number',
      label: 'Wastage allowance',
      defaultValue: 10,
      min: 0,
      max: 30,
      unit: '%',
      helpText: 'Should match concrete supply wastage',
      showIf: (answers) => answers.pump_required === true,
    },
  ],

  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    if (!answers.pump_required) {
      return {
        moduleId: 'concrete-pumping',
        moduleName: 'Concrete Pumping',
        lineItems,
        subtotal: 0,
        exclusions: [],
      };
    }

    const pumpType = answers.pump_type || 'LINE PUMP';
    const pumpRate = Number(answers.pump_rate) || getPrice(priceMap, 'pumping', pumpType, 180);
    const numberOfVisits = Number(answers.number_of_visits) || 1;
    
    // Travel time (per visit)
    const travelHoursPerVisit = answers.standard_travel_sufficient ? 1 : (Number(answers.travel_hours) || 2);
    const totalTravelHours = travelHoursPerVisit * numberOfVisits;
    const travelCost = totalTravelHours * pumpRate;
    
    const visitLabel = numberOfVisits > 1 ? `${numberOfVisits} visits × ` : '';
    lineItems.push({
      id: 'pump_travel',
      description: `Pump Travel (${visitLabel}${travelHoursPerVisit} hr${travelHoursPerVisit > 1 ? 's' : ''})`,
      quantity: totalTravelHours,
      unit: 'hr',
      unitPrice: pumpRate,
      total: travelCost,
      category: 'plant',
    });
    subtotal += travelCost;

    // Pump hours on site (per visit)
    const pumpHoursPerVisit = Number(answers.pump_hours_on_site) || 4;
    const totalPumpHours = pumpHoursPerVisit * numberOfVisits;
    const pumpHireCost = totalPumpHours * pumpRate;

    lineItems.push({
      id: 'pump_hire',
      description: `${pumpType} Hire (${visitLabel}${pumpHoursPerVisit} hrs on site)`,
      quantity: totalPumpHours,
      unit: 'hr',
      unitPrice: pumpRate,
      total: pumpHireCost,
      category: 'plant',
    });
    subtotal += pumpHireCost;

    // Primer (per visit)
    const primerCountPerVisit = Number(answers.primer_count) || 1;
    const totalPrimerCount = primerCountPerVisit * numberOfVisits;
    if (primerCountPerVisit > 0) {
      const primerCost = Number(answers.primer_cost) || getPrice(priceMap, 'pumping', 'PRIMER', 20);
      const totalPrimerCost = totalPrimerCount * primerCost;

      lineItems.push({
        id: 'primer',
        description: `Primer Charge (${visitLabel}${primerCountPerVisit} primer${primerCountPerVisit > 1 ? 's' : ''})`,
        quantity: totalPrimerCount,
        unit: 'each',
        unitPrice: primerCost,
        total: totalPrimerCost,
        category: 'materials',
      });
      subtotal += totalPrimerCost;
    }

    // Offsite washout (per visit)
    if (answers.offsite_washout) {
      const washoutCostPerVisit = Number(answers.washout_cost) || getPrice(priceMap, 'pumping', 'PUMP WASH', 250);
      const totalWashoutCost = washoutCostPerVisit * numberOfVisits;
      
      lineItems.push({
        id: 'washout',
        description: `Offsite Washout${numberOfVisits > 1 ? ` (×${numberOfVisits})` : ''}`,
        quantity: numberOfVisits,
        unit: 'each',
        unitPrice: washoutCostPerVisit,
        total: totalWashoutCost,
        category: 'plant',
      });
      subtotal += totalWashoutCost;
    }

    // Additional man (pumpy) - per visit
    if (answers.additional_pumpy) {
      const pumpyRate = Number(answers.pumpy_rate) || getPrice(priceMap, 'pumping', 'PUMP LAB', 95);
      const totalPumpyHours = totalPumpHours; // Same as total pump hours
      const pumpyCost = totalPumpyHours * pumpyRate;

      lineItems.push({
        id: 'pumpy_labour',
        description: `Additional Man / Pumpy (${visitLabel}${pumpHoursPerVisit} hrs)`,
        quantity: totalPumpyHours,
        unit: 'hr',
        unitPrice: pumpyRate,
        total: pumpyCost,
        category: 'labour',
      });
      subtotal += pumpyCost;
    }

    // Per m³ charge - always applied when pumping is required
    let volume = Number(scopeData.concrete_volume) || Number(scopeData.volume) || 0;
    
    // Calculate volume for piers if scope provides dimensions
    if (scopeData.num_piers && scopeData.diameter && scopeData.depth) {
      const numPiers = Number(scopeData.num_piers);
      const diameter = Number(scopeData.diameter) / 1000;
      const depth = Number(scopeData.depth) / 1000;
      const radius = diameter / 2;
      volume = numPiers * Math.PI * radius * radius * depth;
    }

    if (volume > 0) {
      // Apply wastage to match concrete supply
      const wastagePercent = Number(answers.wastage_percent) || 10;
      const volumeWithWastage = volume * (1 + wastagePercent / 100);
      const roundedVolume = roundUpToM3(volumeWithWastage);
      const m3Rate = Number(answers.m3_rate) || getPrice(priceMap, 'pumping', 'PUMP M3', 8);
      const m3Cost = roundedVolume * m3Rate;

      lineItems.push({
        id: 'pump_per_m3',
        description: `Pumping Charge (${roundedVolume} m³ incl. wastage)`,
        quantity: roundedVolume,
        unit: 'm³',
        unitPrice: m3Rate,
        total: Math.round(m3Cost * 100) / 100,
        category: 'plant',
      });
      subtotal += m3Cost;
    }

    return {
      moduleId: 'concrete-pumping',
      moduleName: 'Concrete Pumping',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (answers): ExclusionItem[] => {
    if (!answers.pump_required) {
      return [
        {
          id: 'no_pumping',
          text: 'Concrete pumping is not included. Alternative placement method to be confirmed.',
          moduleId: 'concrete-pumping',
        },
      ];
    }
    return [];
  },

  validate: (answers) => {
    const errors: string[] = [];

    if (answers.pump_required) {
      if (!answers.pump_type) {
        errors.push('Please select a pump type');
      }
      if (!answers.pump_hours_on_site || answers.pump_hours_on_site < 1) {
        errors.push('Please specify pump hours on site');
      }
    }

    return { valid: errors.length === 0, errors };
  },
};
