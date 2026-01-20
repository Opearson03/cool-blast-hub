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
    // ============ EXCAVATOR HIRE SECTION ============
    {
      id: 'excavator_required',
      type: 'boolean',
      label: 'Is an excavator required?',
      defaultValue: false,
      showIf: () => false, // Hidden - managed by custom component
    },
    {
      id: 'excavator_type',
      type: 'select',
      label: 'Excavator type',
      options: [
        { value: 'EXC 1.4T', label: '1.4T Excavator' },
        { value: 'EXC 3.2T', label: '3.2T Excavator' },
        { value: 'EXC 4T', label: '4T Excavator' },
        { value: 'EXC 6T', label: '6T Excavator' },
        { value: 'EXC 9T', label: '9T Excavator' },
        { value: 'POSI TRACK', label: 'Posi Track' },
      ],
      defaultValue: 'EXC 3.2T',
      showIf: () => false, // Hidden - managed by custom component
    },
    {
      id: 'excavator_rate',
      type: 'currency',
      label: 'Excavator hourly rate',
      defaultValue: 150,
      unit: '/hr',
      showIf: () => false, // Hidden - managed by custom component
    },
    {
      id: 'excavator_hours',
      type: 'number',
      label: 'Excavator hours',
      defaultValue: 4,
      min: 0.5,
      step: 0.5,
      unit: 'hrs',
      showIf: () => false, // Hidden - managed by custom component
    },
    {
      id: 'excavator_float',
      type: 'currency',
      label: 'Float charge to site',
      defaultValue: 150,
      priceListKey: 'excavation.FLOAT',
      showIf: () => false, // Hidden - managed by custom component
    },
    // ============ SAW CUTTING SECTION ============
    {
      id: 'saw_cutting_required',
      type: 'boolean',
      label: 'Is saw cutting required?',
      defaultValue: false,
      showIf: () => false, // Hidden - managed by custom component
    },
    {
      id: 'saw_cutting_method',
      type: 'select',
      label: 'Saw cutting pricing method',
      options: [
        { value: 'linear', label: 'Linear metre rate' },
        { value: 'hourly', label: 'Hourly rate' },
      ],
      defaultValue: 'linear',
      showIf: () => false, // Hidden - managed by custom component
    },
    {
      id: 'saw_cutting_length',
      type: 'number',
      label: 'Saw Cutting Length',
      unit: 'm',
      min: 0,
      defaultValue: 0,
      helpText: 'Linear metres of saw cutting required',
      showIf: () => false, // Hidden - managed by custom component
    },
    {
      id: 'saw_cutting_rate',
      type: 'currency',
      label: 'Saw Cutting Rate',
      defaultValue: 25,
      priceListKey: 'joint_saw_cutting.SAWCUT_LM',
      unit: '/m',
      showIf: () => false, // Hidden - managed by custom component
    },
    {
      id: 'saw_cutting_hours',
      type: 'number',
      label: 'Saw Cutting Hours',
      min: 0.5,
      step: 0.5,
      defaultValue: 2,
      unit: 'hrs',
      showIf: () => false, // Hidden - managed by custom component
    },
    {
      id: 'saw_cutting_hourly_rate',
      type: 'currency',
      label: 'Saw Cutting Hourly Rate',
      defaultValue: 180,
      priceListKey: 'joint_saw_cutting.SAWCUT_HR',
      unit: '/hr',
      showIf: () => false, // Hidden - managed by custom component
    },
    // ============ LABOUR HOURS SECTION ============
    {
      id: 'demo_labour_required',
      type: 'boolean',
      label: 'Include demolition labour hours?',
      defaultValue: false,
      showIf: () => false, // Hidden - managed by custom component
    },
    {
      id: 'demo_crew_size',
      type: 'number',
      label: 'Number of Labourers',
      min: 1,
      defaultValue: 2,
      showIf: () => false, // Hidden - managed by custom component
    },
    {
      id: 'demo_hours',
      type: 'number',
      label: 'Demolition Hours',
      min: 0.5,
      step: 0.5,
      defaultValue: 4,
      showIf: () => false, // Hidden - managed by custom component
    },
    {
      id: 'demo_labour_rate',
      type: 'currency',
      label: 'Labour Rate',
      defaultValue: 75,
      priceListKey: 'labour.LABOUR HR',
      unit: '/hr',
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
    const tipRate = Number(answers.tip_rate) || getPrice(priceMap, 'demolition', 'TIP_RATE', 400);
    const rockBreakerRequired = answers.rock_breaker_required === true;
    const rockBreakerCost = Number(answers.rock_breaker_cost) || getPrice(priceMap, 'demolition', 'ROCK_BREAKER', 200);

    const lineItems: CostLineItem[] = [];

    // Line 1: Waste Disposal
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

    // Line 2: Rock Breaker (if required)
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

    // Line 3: Excavator Hire (if required)
    if (answers.excavator_required) {
      const excavatorType = answers.excavator_type || 'EXC 3.2T';
      const excavatorRate = Number(answers.excavator_rate) || getPrice(priceMap, 'excavation', excavatorType, 150);
      const excavatorHours = Number(answers.excavator_hours) || 4;
      const excavatorTotal = excavatorHours * excavatorRate;

      lineItems.push({
        id: 'excavator_hire',
        description: `${excavatorType} Excavator (${excavatorHours} hrs @ $${excavatorRate}/hr)`,
        quantity: excavatorHours,
        unit: 'hrs',
        unitPrice: excavatorRate,
        total: Math.round(excavatorTotal * 100) / 100,
        category: 'plant',
      });

      const floatCharge = Number(answers.excavator_float) || getPrice(priceMap, 'excavation', 'FLOAT', 150);
      if (floatCharge > 0) {
        lineItems.push({
          id: 'excavator_float',
          description: 'Float Charge to Site',
          quantity: 1,
          unit: 'item',
          unitPrice: floatCharge,
          total: floatCharge,
          category: 'plant',
        });
      }
    }

    // Line 4: Saw Cutting (if required)
    if (answers.saw_cutting_required) {
      const sawCuttingMethod = answers.saw_cutting_method || 'linear';
      
      if (sawCuttingMethod === 'linear') {
        const sawCuttingLength = Number(answers.saw_cutting_length) || 0;
        const sawCuttingRate = Number(answers.saw_cutting_rate) || getPrice(priceMap, 'joint_saw_cutting', 'SAWCUT_LM', 25);
        
        if (sawCuttingLength > 0) {
          const sawCuttingTotal = sawCuttingLength * sawCuttingRate;
          lineItems.push({
            id: 'saw_cutting',
            description: `Saw Cutting (${sawCuttingLength}m @ $${sawCuttingRate}/m)`,
            quantity: sawCuttingLength,
            unit: 'm',
            unitPrice: sawCuttingRate,
            total: Math.round(sawCuttingTotal * 100) / 100,
            category: 'subcontractor',
          });
        }
      } else {
        // Hourly rate method
        const sawCuttingHours = Number(answers.saw_cutting_hours) || 2;
        const sawCuttingHourlyRate = Number(answers.saw_cutting_hourly_rate) || getPrice(priceMap, 'joint_saw_cutting', 'SAWCUT_HR', 180);
        
        if (sawCuttingHours > 0) {
          const sawCuttingTotal = sawCuttingHours * sawCuttingHourlyRate;
          lineItems.push({
            id: 'saw_cutting',
            description: `Saw Cutting (${sawCuttingHours} hrs @ $${sawCuttingHourlyRate}/hr)`,
            quantity: sawCuttingHours,
            unit: 'hrs',
            unitPrice: sawCuttingHourlyRate,
            total: Math.round(sawCuttingTotal * 100) / 100,
            category: 'subcontractor',
          });
        }
      }
    }

    // Line 5: Demolition Labour Hours (if required)
    if (answers.demo_labour_required) {
      const crewSize = Number(answers.demo_crew_size) || 2;
      const hours = Number(answers.demo_hours) || 4;
      const labourRate = Number(answers.demo_labour_rate) || getPrice(priceMap, 'labour', 'LABOUR HR', 75);
      const labourTotal = crewSize * hours * labourRate;

      if (labourTotal > 0) {
        lineItems.push({
          id: 'demo_labour',
          description: `Demolition Labour (${crewSize} men × ${hours} hrs @ $${labourRate}/hr)`,
          quantity: crewSize * hours,
          unit: 'hrs',
          unitPrice: labourRate,
          total: Math.round(labourTotal * 100) / 100,
          category: 'labour',
        });
      }
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
    const exclusions: ExclusionItem[] = [];
    
    if (!answers.demolition_required) {
      exclusions.push({
        id: 'no_demolition',
        text: 'Demolition and removal of existing concrete is not included. Site to be cleared by others.',
        moduleId: 'demolition',
      });
    } else {
      // Add service scanning exclusion when demolition IS included
      exclusions.push({
        id: 'no_service_scanning',
        text: 'No allowance for service scanning or locating. Location of underground services to be confirmed by others prior to commencement.',
        moduleId: 'demolition',
      });
    }
    
    if (answers.demolition_required && !answers.saw_cutting_required) {
      exclusions.push({
        id: 'no_saw_cutting',
        text: 'Saw cutting of existing concrete is not included.',
        moduleId: 'demolition',
      });
    }
    
    return exclusions;
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
