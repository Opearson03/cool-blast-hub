import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice } from '../types';

export const basePreparationModule: EstimateModule = {
  id: 'base-preparation',
  name: 'Base Preparation',
  description: 'Road base, crusher dust and plastic membrane for slab preparation',
  icon: 'Layers',

  questions: [
    // Crusher Dust
    {
      id: 'crusher_dust_required',
      type: 'boolean',
      label: 'Is crusher dust required?',
      defaultValue: false,
      required: true,
    },
    {
      id: 'crusher_dust_depth',
      type: 'select',
      label: 'Crusher Dust Depth',
      options: [
        { value: '50', label: '50mm' },
        { value: '75', label: '75mm' },
        { value: '100', label: '100mm' },
        { value: '150', label: '150mm' },
      ],
      defaultValue: '75',
      showIf: (answers) => answers.crusher_dust_required === true,
    },
    {
      id: 'crusher_dust_area',
      type: 'number',
      label: 'Area to Cover',
      unit: 'm²',
      min: 1,
      deriveFrom: (scopeData) => scopeData.area || undefined,
      showIf: (answers) => answers.crusher_dust_required === true,
    },
    {
      id: 'crusher_dust_price',
      type: 'currency',
      label: 'Crusher Dust Price',
      defaultValue: 60,
      priceListKey: 'consumables.DUST',
      unit: '/m³',
      showIf: (answers) => answers.crusher_dust_required === true,
    },
    // Road Base
    {
      id: 'road_base_required',
      type: 'boolean',
      label: 'Is road base required?',
      defaultValue: false,
      required: true,
    },
    {
      id: 'road_base_type',
      type: 'select',
      label: 'Road Base Size',
      options: [
        { value: 'ROADBASE 20MM', label: '20mm (Class 2)' },
        { value: 'ROADBASE 40MM', label: '40mm (Class 3)' },
      ],
      defaultValue: 'ROADBASE 20MM',
      showIf: (answers) => answers.road_base_required === true,
    },
    {
      id: 'road_base_depth',
      type: 'select',
      label: 'Road Base Depth',
      options: [
        { value: '75', label: '75mm' },
        { value: '100', label: '100mm' },
        { value: '150', label: '150mm' },
        { value: '200', label: '200mm' },
      ],
      defaultValue: '100',
      showIf: (answers) => answers.road_base_required === true,
    },
    {
      id: 'road_base_area',
      type: 'number',
      label: 'Area to Cover',
      unit: 'm²',
      min: 1,
      deriveFrom: (scopeData) => scopeData.area || undefined,
      showIf: (answers) => answers.road_base_required === true,
    },
    {
      id: 'road_base_price',
      type: 'currency',
      label: 'Road Base Price',
      defaultValue: 55,
      unit: '/m³',
      showIf: (answers) => answers.road_base_required === true,
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const roadBaseType = String(moduleAnswers.road_base_type || 'ROADBASE 20MM');
        const price = priceMap?.['materials']?.[roadBaseType];
        return price ?? 55; // Fallback to default if price list not loaded
      },
    },
    // Plastic Membrane
    {
      id: 'membrane_required',
      type: 'boolean',
      label: 'Is plastic membrane required?',
      defaultValue: true,
      required: true,
    },
    {
      id: 'membrane_type',
      type: 'select',
      label: 'Membrane Type',
      options: [
        { value: 'PLASTIC 4X50 MED', label: 'Black 200um Medium' },
        { value: 'PLASTIC 4X50 HI', label: 'Black 200um High Impact' },
        { value: 'PLASTIC 4X25 ORG', label: 'Orange 300um (Builder\'s Film)' },
      ],
      defaultValue: 'PLASTIC 4X50 MED',
      showIf: (answers) => answers.membrane_required === true,
    },
    {
      id: 'membrane_area',
      type: 'number',
      label: 'Area to Cover',
      unit: 'm²',
      min: 1,
      deriveFrom: (scopeData) => scopeData.area || undefined,
      showIf: (answers) => answers.membrane_required === true,
    },
    {
      id: 'membrane_overlap',
      type: 'number',
      label: 'Overlap Allowance',
      defaultValue: 10,
      min: 0,
      max: 30,
      unit: '%',
      helpText: 'Extra for overlaps and edges',
      showIf: (answers) => answers.membrane_required === true,
      deriveFrom: () => 10, // Standard 10% overlap allowance
    },
    {
      id: 'membrane_price',
      type: 'currency',
      label: 'Membrane Price per Roll',
      defaultValue: 100,
      unit: '/roll',
      helpText: 'Standard roll is 4m x 50m = 200m²',
      showIf: (answers) => answers.membrane_required === true,
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const membraneType = moduleAnswers.membrane_type || 'PLASTIC 4X50 MED';
        return priceMap?.['consumables']?.[membraneType];
      },
    },
  ],

  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    // Crusher Dust
    if (answers.crusher_dust_required) {
      const area = Number(answers.crusher_dust_area) || Number(scopeData.area) || 100;
      const depthMM = Number(answers.crusher_dust_depth) || 75;
      const depthM = depthMM / 1000;
      const volume = area * depthM;
      const tonnes = volume * 1.6; // Crusher dust bulk density
      const pricePerM3 = Number(answers.crusher_dust_price) || getPrice(priceMap, 'materials', 'DUST', 60);
      const cost = volume * pricePerM3;

      lineItems.push({
        id: 'crusher_dust',
        description: `Crusher Dust ${depthMM}mm thick (${volume.toFixed(1)}m³ ≈ ${tonnes.toFixed(1)}t for ordering)`,
        quantity: Math.round(volume * 10) / 10,
        unit: 'm³',
        unitPrice: pricePerM3,
        total: Math.round(cost * 100) / 100,
        category: 'materials',
      });
      subtotal += cost;
    }

    // Road Base
    if (answers.road_base_required) {
      const area = Number(answers.road_base_area) || Number(scopeData.area) || 100;
      const depthMM = Number(answers.road_base_depth) || 100;
      const depthM = depthMM / 1000;
      const volume = area * depthM;
      const tonnes = volume * 1.8; // Road base bulk density ~1.8t/m³
      
      const roadBaseType = String(answers.road_base_type) || 'ROADBASE 20MM';
      const defaultPrice = roadBaseType === 'ROADBASE 40MM' ? 50 : 55;
      const pricePerM3 = Number(answers.road_base_price) || getPrice(priceMap, 'materials', roadBaseType, defaultPrice);
      const cost = volume * pricePerM3;

      const typeLabels: Record<string, string> = {
        'ROADBASE 20MM': '20mm (Class 2)',
        'ROADBASE 40MM': '40mm (Class 3)',
      };

      lineItems.push({
        id: 'road_base',
        description: `Road Base ${typeLabels[roadBaseType] || roadBaseType} ${depthMM}mm thick (${volume.toFixed(1)}m³ ≈ ${tonnes.toFixed(1)}t for ordering)`,
        quantity: Math.round(volume * 10) / 10,
        unit: 'm³',
        unitPrice: pricePerM3,
        total: Math.round(cost * 100) / 100,
        category: 'materials',
      });
      subtotal += cost;
    }

    // Plastic Membrane
    if (answers.membrane_required) {
      const area = Number(answers.membrane_area) || Number(scopeData.area) || 100;
      const overlapPercent = 1 + (Number(answers.membrane_overlap) || 15) / 100;
      const totalArea = area * overlapPercent;
      
      const rollArea = 200; // 4m x 50m
      const rollsRequired = Math.ceil(totalArea / rollArea);
      const pricePerRoll = Number(answers.membrane_price) || 180;
      const membraneType = answers.membrane_type || 'PLASTIC 4X50 MED';
      
      // Get price from price list if available
      let actualPrice = pricePerRoll;
      if (membraneType === 'PLASTIC 4X50 MED') {
        actualPrice = getPrice(priceMap, 'consumables', 'PLASTIC 4X50 MED', pricePerRoll);
      } else if (membraneType === 'PLASTIC 4X50 HI') {
        actualPrice = getPrice(priceMap, 'consumables', 'PLASTIC 4X50 HI', pricePerRoll);
      } else if (membraneType === 'PLASTIC 4X25 ORG') {
        actualPrice = getPrice(priceMap, 'consumables', 'PLASTIC 4X25 ORG', pricePerRoll);
      }
      
      const cost = rollsRequired * actualPrice;

      const typeLabels: Record<string, string> = {
        'PLASTIC 4X50 MED': 'Black 200um Medium',
        'PLASTIC 4X50 HI': 'Black 200um High Impact',
        'PLASTIC 4X25 ORG': 'Orange 300um Builder\'s Film',
      };

      lineItems.push({
        id: 'plastic_membrane',
        description: `Plastic Membrane ${typeLabels[membraneType] || membraneType} (${rollsRequired} rolls)`,
        quantity: rollsRequired,
        unit: 'rolls',
        unitPrice: actualPrice,
        total: Math.round(cost * 100) / 100,
        category: 'materials',
      });
      subtotal += cost;
    }

    return {
      moduleId: 'base-preparation',
      moduleName: 'Base Preparation',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (answers): ExclusionItem[] => {
    const exclusions: ExclusionItem[] = [];
    
    if (!answers.crusher_dust_required) {
      exclusions.push({
        id: 'no_crusher_dust',
        text: 'Crusher dust base material is not included.',
        moduleId: 'base-preparation',
      });
    }

    if (!answers.road_base_required) {
      exclusions.push({
        id: 'no_road_base',
        text: 'Road base/sub-base material is not included.',
        moduleId: 'base-preparation',
      });
    }

    if (!answers.membrane_required) {
      exclusions.push({
        id: 'no_membrane',
        text: 'Plastic membrane/vapour barrier is not included.',
        moduleId: 'base-preparation',
      });
    }

    return exclusions;
  },

  validate: (answers) => {
    const errors: string[] = [];

    if (answers.crusher_dust_required && (!answers.crusher_dust_area || answers.crusher_dust_area < 1)) {
      errors.push('Please specify the area for crusher dust');
    }

    if (answers.road_base_required && (!answers.road_base_area || answers.road_base_area < 1)) {
      errors.push('Please specify the area for road base');
    }

    if (answers.membrane_required && (!answers.membrane_area || answers.membrane_area < 1)) {
      errors.push('Please specify the area for membrane');
    }

    return { valid: errors.length === 0, errors };
  },
};
