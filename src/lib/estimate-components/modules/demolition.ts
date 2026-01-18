import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice } from '../types';

// Constants
const CONCRETE_DENSITY = 2.4; // tonnes per m³

export interface DemolitionArea {
  id: string;
  name: string;
  length: number;    // metres
  width: number;     // metres
  thickness: number; // mm
}

export const demolitionModule: EstimateModule = {
  id: 'demolition',
  name: 'Demolition',
  description: 'Demolition and removal of existing concrete',
  icon: 'Hammer',

  questions: [
    {
      id: 'demolition_required',
      type: 'boolean',
      label: 'Do you need to demolish existing concrete?',
      defaultValue: false,
      required: true,
    },
    // Note: demolition_areas is handled by custom MultiDemolitionInput component
    // These hidden fields store the aggregated data
    {
      id: 'demolition_areas',
      type: 'text',
      label: 'Demolition Areas',
      showIf: () => false, // Hidden - managed by custom component
    },
    {
      id: 'breaking_rate',
      type: 'currency',
      label: 'Concrete Breaking Rate',
      defaultValue: 150,
      priceListKey: 'demolition.DEMO_BREAK',
      unit: '/m³',
      helpText: 'Labour cost to break up concrete',
      showIf: () => false, // Hidden - managed by custom component
    },
    {
      id: 'tip_rate',
      type: 'currency',
      label: 'Tip / Disposal Rate',
      defaultValue: 400,
      priceListKey: 'demolition.TIP_RATE',
      unit: '/t',
      helpText: 'Cost per tonne at the tip',
      showIf: () => false, // Hidden - managed by custom component
    },
    {
      id: 'rock_breaker_required',
      type: 'boolean',
      label: 'Is a rock breaker required?',
      defaultValue: false,
      showIf: () => false, // Hidden - managed by custom component
    },
    {
      id: 'rock_breaker_cost',
      type: 'currency',
      label: 'Rock Breaker Hire',
      defaultValue: 200,
      priceListKey: 'demolition.ROCK_BREAKER',
      unit: '/day',
      showIf: () => false, // Hidden - managed by custom component
    },
    // Calculated display fields
    {
      id: 'total_volume_display',
      type: 'text',
      label: 'Total Volume',
      deriveFrom: (_scopeData, answers) => {
        const areas = answers?.demolition_areas as DemolitionArea[] | undefined;
        if (!areas || !Array.isArray(areas)) return '';
        const volume = areas.reduce((sum, area) => {
          const l = Number(area.length) || 0;
          const w = Number(area.width) || 0;
          const thicknessM = (Number(area.thickness) || 100) / 1000;
          return sum + l * w * thicknessM;
        }, 0);
        return volume > 0 ? `${volume.toFixed(2)} m³` : '';
      },
      derivedReadOnly: true,
      showIf: (answers) => answers.demolition_required === true,
    },
    {
      id: 'total_weight_display',
      type: 'text',
      label: 'Total Weight',
      deriveFrom: (_scopeData, answers) => {
        const areas = answers?.demolition_areas as DemolitionArea[] | undefined;
        if (!areas || !Array.isArray(areas)) return '';
        const volume = areas.reduce((sum, area) => {
          const l = Number(area.length) || 0;
          const w = Number(area.width) || 0;
          const thicknessM = (Number(area.thickness) || 100) / 1000;
          return sum + l * w * thicknessM;
        }, 0);
        const weight = volume * CONCRETE_DENSITY;
        return weight > 0 ? `${weight.toFixed(1)} t` : '';
      },
      derivedReadOnly: true,
      showIf: (answers) => answers.demolition_required === true,
    },
  ],

  calculate: (answers, priceMap, _scopeData): ComponentCost => {
    if (!answers.demolition_required) {
      return {
        moduleId: 'demolition',
        moduleName: 'Demolition',
        lineItems: [],
        subtotal: 0,
        exclusions: [],
      };
    }

    const areas = answers.demolition_areas as DemolitionArea[] | undefined;
    
    // Calculate totals from all demolition areas
    let totalVolume = 0;
    if (areas && Array.isArray(areas)) {
      totalVolume = areas.reduce((sum, area) => {
        const l = Number(area.length) || 0;
        const w = Number(area.width) || 0;
        const thicknessM = (Number(area.thickness) || 100) / 1000;
        return sum + l * w * thicknessM;
      }, 0);
    }

    const totalWeight = totalVolume * CONCRETE_DENSITY;

    const breakingRate = Number(answers.breaking_rate) || getPrice(priceMap, 'demolition', 'DEMO_BREAK', 150);
    const tipRate = Number(answers.tip_rate) || getPrice(priceMap, 'demolition', 'TIP_RATE', 400);
    const rockBreakerRequired = answers.rock_breaker_required === true;
    const rockBreakerCost = Number(answers.rock_breaker_cost) || getPrice(priceMap, 'demolition', 'ROCK_BREAKER', 200);

    const lineItems: CostLineItem[] = [];

    // Line 1: Concrete Breaking Labour
    if (totalVolume > 0) {
      const breakingTotal = totalVolume * breakingRate;
      lineItems.push({
        id: 'demo_breaking',
        description: `Concrete Breaking Labour (${totalVolume.toFixed(2)}m³)`,
        quantity: Math.round(totalVolume * 100) / 100,
        unit: 'm³',
        unitPrice: breakingRate,
        total: Math.round(breakingTotal * 100) / 100,
        category: 'subcontractor',
      });
    }

    // Line 2: Waste Disposal
    if (totalWeight > 0) {
      const tipTotal = totalWeight * tipRate;
      lineItems.push({
        id: 'demo_disposal',
        description: `Waste Disposal (${totalWeight.toFixed(1)}t @ $${tipRate}/t)`,
        quantity: Math.round(totalWeight * 10) / 10,
        unit: 't',
        unitPrice: tipRate,
        total: Math.round(tipTotal * 100) / 100,
        category: 'subcontractor',
      });
    }

    // Line 3: Rock Breaker (if required)
    if (rockBreakerRequired) {
      lineItems.push({
        id: 'rock_breaker',
        description: 'Rock Breaker Attachment Hire',
        quantity: 1,
        unit: 'day',
        unitPrice: rockBreakerCost,
        total: rockBreakerCost,
        category: 'plant',
      });
    }

    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);

    return {
      moduleId: 'demolition',
      moduleName: 'Demolition',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (answers): ExclusionItem[] => {
    if (!answers.demolition_required) {
      return [{
        id: 'no_demolition',
        text: 'Demolition and removal of existing concrete is not included. Site to be cleared by others.',
        moduleId: 'demolition',
      }];
    }
    return [];
  },

  validate: (answers) => {
    const errors: string[] = [];
    
    if (answers.demolition_required) {
      const areas = answers.demolition_areas as DemolitionArea[] | undefined;
      
      if (!areas || !Array.isArray(areas) || areas.length === 0) {
        errors.push('Please add at least one demolition area');
      } else {
        // Check if at least one area has valid dimensions
        const hasValidArea = areas.some(area => {
          const l = Number(area.length) || 0;
          const w = Number(area.width) || 0;
          return l > 0 && w > 0;
        });
        
        if (!hasValidArea) {
          errors.push('Please specify dimensions for at least one demolition area');
        }
      }
    }

    return { valid: errors.length === 0, errors };
  },
};
