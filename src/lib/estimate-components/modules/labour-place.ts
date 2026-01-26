import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, LabourPlacement } from '../types';
import { getPrice } from '../types';

export const labourPlaceModule: EstimateModule = {
  id: 'labour-place',
  name: 'Labour - Place',
  description: 'Crew labour for concrete placement and finishing',
  icon: 'HardHat',

  questions: [
    {
      id: 'placements',
      type: 'text', // Custom rendering in ModuleSection
      label: 'Placement Pours',
      helpText: 'Configure labour for each concrete pour',
    },
  ],

  calculate: (answers, priceMap, _scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    // Get placements array
    const placements: LabourPlacement[] = answers.placements || [];
    
    if (placements.length === 0) {
      return {
        moduleId: 'labour-place',
        moduleName: 'Labour - Place',
        lineItems: [],
        subtotal: 0,
        exclusions: [],
      };
    }

    // Process each placement
    placements.forEach((placement, index) => {
      const hourlyRate = Number(placement.hourly_rate) || getPrice(priceMap, 'labour', 'LABOUR PLACE HR', 75);
      const crewSize = Number(placement.crew_size) || 0;
      const hours = Number(placement.hours) || 0;

      if (crewSize === 0 || hours === 0) return;

      const totalHours = crewSize * hours;
      const totalCost = totalHours * hourlyRate;

      const pourName = placement.name || `Pour ${index + 1}`;
      const label = placements.length > 1 ? `${pourName}: ` : '';

      lineItems.push({
        id: `labour_place_${index}`,
        description: `${label}Labour - Place (${crewSize} workers × ${hours} hrs @ $${hourlyRate}/hr)`,
        quantity: totalHours,
        unit: 'hrs',
        unitPrice: hourlyRate,
        total: Math.round(totalCost * 100) / 100,
        category: 'labour-place',
      });
      subtotal += totalCost;
    });

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

    const placements: LabourPlacement[] = answers.placements || [];
    
    placements.forEach((placement, i) => {
      const pourName = placement.name || `Pour ${i + 1}`;
      if (!placement.hourly_rate || placement.hourly_rate < 1) {
        errors.push(`${pourName}: Please specify the hourly rate`);
      }
      if (!placement.crew_size || placement.crew_size < 1) {
        errors.push(`${pourName}: Please specify the number of workers`);
      }
      if (!placement.hours || placement.hours < 0.5) {
        errors.push(`${pourName}: Please specify hours`);
      }
    });

    return { valid: errors.length === 0, errors };
  },
};
