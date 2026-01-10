import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice } from '../types';

export const excavationModule: EstimateModule = {
  id: 'excavation',
  name: 'Excavation',
  description: 'Site preparation, setout, and excavation works',
  icon: 'Shovel',

  questions: [
    {
      id: 'excavation_required',
      type: 'boolean',
      label: 'Are you doing excavation?',
      defaultValue: false,
      required: true,
    },
    // Setout section
    {
      id: 'setout_men',
      type: 'number',
      label: 'How many men for setout?',
      defaultValue: 2,
      min: 1,
      max: 10,
      showIf: (answers) => answers.excavation_required === true,
    },
    {
      id: 'setout_hours_per_man',
      type: 'number',
      label: 'How many hours per man for setout?',
      defaultValue: 2,
      min: 0.5,
      step: 0.5,
      unit: 'hrs',
      showIf: (answers) => answers.excavation_required === true,
    },
    {
      id: 'setout_materials',
      type: 'currency',
      label: 'Setout materials',
      defaultValue: 80,
      helpText: 'Pegs, string lines, spray paint, etc.',
      showIf: (answers) => answers.excavation_required === true,
    },
    // Machine section
    {
      id: 'machine_type',
      type: 'select',
      label: 'Select machine required',
      options: [
        { value: 'EXC 1.4T', label: '1.4T Excavator', priceKey: 'excavation.EXC 1.4T' },
        { value: 'EXC 3.2T', label: '3.2T Excavator', priceKey: 'excavation.EXC 3.2T' },
        { value: 'EXC 4T', label: '4T Excavator', priceKey: 'excavation.EXC 4T' },
        { value: 'EXC 6T', label: '6T Excavator', priceKey: 'excavation.EXC 6T' },
        { value: 'EXC 9T', label: '9T Excavator', priceKey: 'excavation.EXC 9T' },
        { value: 'POSI TRACK', label: 'Posi Track', priceKey: 'excavation.POSI TRACK' },
      ],
      defaultValue: 'EXC 3.2T',
      showIf: (answers) => answers.excavation_required === true,
    },
    {
      id: 'machine_rate',
      type: 'currency',
      label: 'Machine hourly rate',
      defaultValue: 150,
      unit: '/hr',
      helpText: 'Auto-fills from price list based on machine selected',
      showIf: (answers) => answers.excavation_required === true,
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const machineType = moduleAnswers.machine_type || 'EXC 3.2T';
        return priceMap['excavation']?.[machineType];
      },
    },
    {
      id: 'float_charge',
      type: 'currency',
      label: 'Float charge to site',
      defaultValue: 150,
      priceListKey: 'excavation.FLOAT',
      showIf: (answers) => answers.excavation_required === true,
    },
    {
      id: 'excavation_hours',
      type: 'number',
      label: 'How many hours do you expect excavation to take?',
      defaultValue: 4,
      min: 0.5,
      step: 0.5,
      unit: 'hrs',
      showIf: (answers) => answers.excavation_required === true,
    },
    {
      id: 'spotter_required',
      type: 'boolean',
      label: 'Will the machine require a spotter?',
      defaultValue: false,
      showIf: (answers) => answers.excavation_required === true,
    },
    {
      id: 'spotter_rate',
      type: 'currency',
      label: 'Spotter hourly rate',
      defaultValue: 75,
      priceListKey: 'excavation.SPOTTER',
      unit: '/hr',
      showIf: (answers) => answers.excavation_required === true && answers.spotter_required === true,
    },
    // Auger options
    {
      id: 'auger_required',
      type: 'boolean',
      label: 'Is an auger required?',
      defaultValue: false,
      showIf: (answers) => answers.excavation_required === true,
    },
    {
      id: 'auger_hire_cost',
      type: 'currency',
      label: 'Auger hire cost per day',
      defaultValue: 100,
      priceListKey: 'excavation.AUGER HIRE',
      showIf: (answers) => answers.excavation_required === true && answers.auger_required === true,
    },
    {
      id: 'auger_drive_cost',
      type: 'currency',
      label: 'Auger drive attachment cost per day',
      defaultValue: 100,
      priceListKey: 'excavation.AUGER DRIVE',
      showIf: (answers) => answers.excavation_required === true && answers.auger_required === true,
    },
  ],

  calculate: (answers, priceMap, _scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    if (!answers.excavation_required) {
      return {
        moduleId: 'excavation',
        moduleName: 'Excavation',
        lineItems,
        subtotal: 0,
        exclusions: [],
      };
    }

    const labourRate = getPrice(priceMap, 'labour', 'LABOUR HR', 75);

    // Setout labour
    const setoutMen = Number(answers.setout_men) || 2;
    const setoutHoursPerMan = Number(answers.setout_hours_per_man) || 2;
    const setoutTotalHours = setoutMen * setoutHoursPerMan;
    const setoutLabourCost = setoutTotalHours * labourRate;

    if (setoutLabourCost > 0) {
      lineItems.push({
        id: 'setout_labour',
        description: `Setout Labour (${setoutMen} men × ${setoutHoursPerMan} hrs)`,
        quantity: setoutTotalHours,
        unit: 'hrs',
        unitPrice: labourRate,
        total: setoutLabourCost,
        category: 'labour',
      });
      subtotal += setoutLabourCost;
    }

    // Setout materials
    const setoutMaterials = Number(answers.setout_materials) || 80;
    if (setoutMaterials > 0) {
      lineItems.push({
        id: 'setout_materials',
        description: 'Setout Materials',
        quantity: 1,
        unit: 'lot',
        unitPrice: setoutMaterials,
        total: setoutMaterials,
        category: 'materials',
      });
      subtotal += setoutMaterials;
    }

    // Machine hire
    const machineType = answers.machine_type || 'EXC 3.2T';
    const machineRate = Number(answers.machine_rate) || getPrice(priceMap, 'excavation', machineType, 150);
    const excavationHours = Number(answers.excavation_hours) || 4;
    const machineCost = excavationHours * machineRate;

    lineItems.push({
      id: 'machine_hire',
      description: `${machineType} Excavator (${excavationHours} hrs)`,
      quantity: excavationHours,
      unit: 'hrs',
      unitPrice: machineRate,
      total: machineCost,
      category: 'plant',
    });
    subtotal += machineCost;

    // Float charge
    const floatCharge = Number(answers.float_charge) || getPrice(priceMap, 'excavation', 'FLOAT', 150);
    if (floatCharge > 0) {
      lineItems.push({
        id: 'float_charge',
        description: 'Float Charge to Site',
        quantity: 1,
        unit: 'item',
        unitPrice: floatCharge,
        total: floatCharge,
        category: 'plant',
      });
      subtotal += floatCharge;
    }

    // Spotter
    if (answers.spotter_required) {
      const spotterRate = Number(answers.spotter_rate) || getPrice(priceMap, 'excavation', 'SPOTTER', 75);
      const spotterCost = excavationHours * spotterRate;

      lineItems.push({
        id: 'spotter',
        description: `Excavation Spotter (${excavationHours} hrs)`,
        quantity: excavationHours,
        unit: 'hrs',
        unitPrice: spotterRate,
        total: spotterCost,
        category: 'labour',
      });
      subtotal += spotterCost;
    }

    // Auger
    if (answers.auger_required) {
      const augerHire = Number(answers.auger_hire_cost) || getPrice(priceMap, 'excavation', 'AUGER HIRE', 100);
      const augerDrive = Number(answers.auger_drive_cost) || getPrice(priceMap, 'excavation', 'AUGER DRIVE', 100);
      const augerTotal = augerHire + augerDrive;

      lineItems.push({
        id: 'auger_hire',
        description: 'Auger Hire & Drive Attachment',
        quantity: 1,
        unit: 'day',
        unitPrice: augerTotal,
        total: augerTotal,
        category: 'plant',
      });
      subtotal += augerTotal;
    }

    return {
      moduleId: 'excavation',
      moduleName: 'Excavation',
      lineItems,
      subtotal,
      exclusions: [],
    };
  },

  getExclusions: (answers): ExclusionItem[] => {
    if (!answers.excavation_required) {
      return [
        {
          id: 'no_excavation',
          text: 'Excavation and site preparation works are not included. Site to be prepared by others prior to commencement.',
          moduleId: 'excavation',
        },
      ];
    }
    return [];
  },

  validate: (answers) => {
    const errors: string[] = [];

    if (answers.excavation_required) {
      if (!answers.excavation_hours || answers.excavation_hours < 0.5) {
        errors.push('Please specify expected excavation hours');
      }
      if (!answers.machine_type) {
        errors.push('Please select a machine type');
      }
    }

    return { valid: errors.length === 0, errors };
  },
};
