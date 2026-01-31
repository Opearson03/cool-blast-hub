import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap, PumpVisit } from '../types';
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

// Helper to get default pump visit from price map
function getDefaultPumpVisit(priceMap: PriceMap, pumpType: string = 'LINE PUMP'): PumpVisit {
  return {
    id: `visit_${Date.now()}`,
    pump_type: pumpType,
    pump_rate: priceMap['pumping']?.[pumpType] ?? 180,
    travel_hours: 1,
    pump_hours_on_site: 4,
    primer_count: 1,
    primer_cost: priceMap['pumping']?.['PRIMER'] ?? 20,
    offsite_washout: false,
    washout_cost: priceMap['pumping']?.['PUMP WASH'] ?? 250,
    additional_pumpy: true,
    pumpy_rate: priceMap['pumping']?.['PUMP LAB'] ?? 95,
  };
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
      id: 'pump_visits',
      type: 'text', // Custom rendering in ModuleSection
      label: 'Pump Visits',
      helpText: 'Configure details for each pump visit',
      showIf: (answers) => answers.pump_required === true,
    },
    {
      id: 'm3_rate',
      type: 'currency',
      label: 'Pumping charge per m³',
      defaultValue: 8,
      priceListKey: 'pumping.PUMP M3',
      unit: '/m³',
      helpText: 'Applied to total concrete volume',
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

    // Get pump visits array (or create default if empty) - ensure it's actually an array
    let pumpVisits: PumpVisit[] = Array.isArray(answers.pump_visits) ? answers.pump_visits : [];
    if (pumpVisits.length === 0) {
      // Create default visit based on recommended pump type
      const volume = Number(scopeData.concrete_volume) || Number(scopeData.volume) || 0;
      const rec = getPumpRecommendation(volume);
      const defaultType = rec.type === 'DIRECT' || rec.type === '' ? 'LINE PUMP' : rec.type;
      pumpVisits = [getDefaultPumpVisit(priceMap, defaultType)];
    }

    // Process each visit
    pumpVisits.forEach((visit, visitIndex) => {
      const visitLabel = pumpVisits.length > 1 ? `Visit ${visitIndex + 1}: ` : '';
      const pumpLabel = visit.pump_type || 'Pump';

      // Travel time
      const travelCost = visit.travel_hours * visit.pump_rate;
      lineItems.push({
        id: `pump_travel_${visitIndex}`,
        description: `${visitLabel}${pumpLabel} Travel (${visit.travel_hours} hr${visit.travel_hours > 1 ? 's' : ''})`,
        quantity: visit.travel_hours,
        unit: 'hr',
        unitPrice: visit.pump_rate,
        total: Math.round(travelCost * 100) / 100,
        category: 'plant',
      });
      subtotal += travelCost;

      // Pump hours on site
      const pumpHireCost = visit.pump_hours_on_site * visit.pump_rate;
      lineItems.push({
        id: `pump_hire_${visitIndex}`,
        description: `${visitLabel}${pumpLabel} Hire (${visit.pump_hours_on_site} hrs on site)`,
        quantity: visit.pump_hours_on_site,
        unit: 'hr',
        unitPrice: visit.pump_rate,
        total: Math.round(pumpHireCost * 100) / 100,
        category: 'plant',
      });
      subtotal += pumpHireCost;

      // Primer
      if (visit.primer_count > 0) {
        const primerCost = visit.primer_count * visit.primer_cost;
        lineItems.push({
          id: `primer_${visitIndex}`,
          description: `${visitLabel}Primer Charge (${visit.primer_count} primer${visit.primer_count > 1 ? 's' : ''})`,
          quantity: visit.primer_count,
          unit: 'each',
          unitPrice: visit.primer_cost,
          total: Math.round(primerCost * 100) / 100,
          category: 'materials',
        });
        subtotal += primerCost;
      }

      // Offsite washout
      if (visit.offsite_washout) {
        lineItems.push({
          id: `washout_${visitIndex}`,
          description: `${visitLabel}Offsite Washout`,
          quantity: 1,
          unit: 'each',
          unitPrice: visit.washout_cost,
          total: Math.round(visit.washout_cost * 100) / 100,
          category: 'plant',
        });
        subtotal += visit.washout_cost;
      }

      // Additional man (pumpy)
      if (visit.additional_pumpy) {
        const pumpyCost = visit.pump_hours_on_site * visit.pumpy_rate;
        lineItems.push({
          id: `pumpy_labour_${visitIndex}`,
          description: `${visitLabel}Additional Man / Pumpy (${visit.pump_hours_on_site} hrs)`,
          quantity: visit.pump_hours_on_site,
          unit: 'hr',
          unitPrice: visit.pumpy_rate,
          total: Math.round(pumpyCost * 100) / 100,
          category: 'labour',
        });
        subtotal += pumpyCost;
      }
    });

    // Per m³ charge - always applied when pumping is required
    // Use pre-calculated concrete_volume from scope (already handles pierGroups, beams, etc.)
    const volume = Number(scopeData.concrete_volume) || Number(scopeData.volume) || 0;

    // Get wastage from concrete-supply module answers (default 10%)
    const concreteSupplyAnswers = (scopeData as any).moduleAnswers?.['concrete-supply'] || {};
    const wastagePercent = Number(concreteSupplyAnswers.wastage_percent) ?? 10;
    const volumeWithWastage = volume * (1 + wastagePercent / 100);

    if (volume > 0) {
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
      const pumpVisits: PumpVisit[] = answers.pump_visits || [];
      if (pumpVisits.length === 0) {
        errors.push('Please add at least one pump visit');
      } else {
        pumpVisits.forEach((visit, i) => {
          if (!visit.pump_type) {
            errors.push(`Visit ${i + 1}: Please select a pump type`);
          }
          if (!visit.pump_hours_on_site || visit.pump_hours_on_site < 1) {
            errors.push(`Visit ${i + 1}: Please specify pump hours on site`);
          }
        });
      }
    }

    return { valid: errors.length === 0, errors };
  },
};
