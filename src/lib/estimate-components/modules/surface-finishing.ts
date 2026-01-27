import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice } from '../types';

const MODULE_ID = 'surface-finishing';
const MODULE_NAME = 'Surface Finishing';

export const surfaceFinishingModule: EstimateModule = {
  id: MODULE_ID,
  name: MODULE_NAME,
  description: 'Surface finishes, curing, and sealing for concrete',
  icon: 'Paintbrush',

  questions: [
    // ========== Q1: Surface Finish Required? ==========
    {
      id: 'finish_required',
      type: 'boolean',
      label: 'Is a premium finish required?',
      defaultValue: false,
      required: true,
    },

    // ========== Q2: Finish Type (Single Select) ==========
    {
      id: 'finish_type',
      type: 'select',
      label: 'Select surface finish type',
      options: [
        { value: 'exposed_aggregate', label: 'Exposed aggregate' },
        { value: 'stencilled', label: 'Stencilled' },
        { value: 'sealed', label: 'Sealed' },
        { value: 'other', label: 'Other' },
      ],
      showIf: (answers) => answers.finish_required === true,
      required: true,
    },

    // ========== Q3: Universal - Area ==========
    {
      id: 'finish_area',
      type: 'number',
      label: 'Area to be finished (m²)',
      helpText: 'Defaults to scope area if not specified',
      min: 0.1,
      unit: 'm²',
      showIf: (answers) => answers.finish_required === true,
      deriveFrom: (scopeData) => scopeData.area || 0,
    },

    // ═══════════════════════════════════════════════════════════════
    // STENCILLED - Roll-based + Colour bags (no labour - included in pour)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'stencil_roll_price',
      type: 'currency',
      label: 'Stencil roll price',
      helpText: '1m wide × 100m rolls',
      defaultValue: 150,
      priceListKey: 'materials.STENCIL_ROLL',
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'stencilled',
    },
    {
      id: 'stencil_rolls_required',
      type: 'number',
      label: 'Rolls required',
      helpText: 'Auto-calculated: 100m² per roll + 10% waste',
      min: 1,
      unit: 'rolls',
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'stencilled',
      deriveFrom: (scopeData, moduleAnswers) => {
        const area = Number(moduleAnswers?.finish_area) || Number(scopeData.area) || 0;
        const areaWithWaste = area * 1.1; // 10% waste
        const rollCoverage = 100; // 1m × 100m = 100m²
        return Math.ceil(areaWithWaste / rollCoverage) || 1;
      },
      derivedReadOnly: false,
    },
    {
      id: 'stencil_colour_required',
      type: 'boolean',
      label: 'Colour hardener required?',
      defaultValue: true,
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'stencilled',
    },
    {
      id: 'stencil_colour_bag_price',
      type: 'currency',
      label: 'Colour price per bag (20kg)',
      defaultValue: 50,
      priceListKey: 'materials.COLOUR_BAG',
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'stencilled' && answers.stencil_colour_required === true,
    },
    {
      id: 'stencil_colour_bags_required',
      type: 'number',
      label: 'Colour bags required',
      helpText: 'Auto-calculated: 8m² per 20kg bag',
      min: 1,
      unit: 'bags',
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'stencilled' && answers.stencil_colour_required === true,
      deriveFrom: (scopeData, moduleAnswers) => {
        const area = Number(moduleAnswers?.finish_area) || Number(scopeData.area) || 0;
        const coveragePerBag = 8; // 8m² per bag
        return Math.ceil(area / coveragePerBag) || 1;
      },
      derivedReadOnly: false,
    },

    // ═══════════════════════════════════════════════════════════════
    // EXPOSED AGGREGATE - Drum-based (no separate labour)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'exposed_retarder_drum_price',
      type: 'currency',
      label: 'Retarder price per drum',
      helpText: '20L drum covers ~80m²',
      defaultValue: 150,
      priceListKey: 'materials.RETARDER_DRUM',
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'exposed_aggregate',
    },
    {
      id: 'exposed_retarder_drums_required',
      type: 'number',
      label: 'Drums required',
      helpText: 'Auto-calculated: 80m² per drum',
      min: 1,
      unit: 'drums',
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'exposed_aggregate',
      deriveFrom: (scopeData, moduleAnswers) => {
        const area = Number(moduleAnswers?.finish_area) || Number(scopeData.area) || 0;
        const coveragePerDrum = 80; // 80m² per drum
        return Math.ceil(area / coveragePerDrum) || 1;
      },
      derivedReadOnly: false,
    },

    // ═══════════════════════════════════════════════════════════════
    // SEALED - Colour sealer option
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'sealed_colour_required',
      type: 'boolean',
      label: 'Colour sealer required?',
      defaultValue: false,
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'sealed',
    },

    // ═══════════════════════════════════════════════════════════════
    // OTHER FINISH
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'other_finish_description',
      type: 'text',
      label: 'Describe other finish',
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'other',
    },
    {
      id: 'other_finish_material_cost',
      type: 'currency',
      label: 'Material cost',
      defaultValue: 0,
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'other',
    },
    {
      id: 'other_finish_labour_hours',
      type: 'number',
      label: 'Labour hours',
      defaultValue: 0,
      min: 0,
      unit: 'hrs',
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'other',
    },
    {
      id: 'other_finish_crew_size',
      type: 'number',
      label: 'Crew size',
      defaultValue: 1,
      min: 1,
      unit: 'men',
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'other',
    },

    // ═══════════════════════════════════════════════════════════════
    // CURING - Drum-based (no labour - included in pour)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'curing_required',
      type: 'boolean',
      label: 'Spray-on curing required?',
      defaultValue: false,
      showIf: (answers) => answers.finish_required === true,
    },
    {
      id: 'curing_drum_price',
      type: 'currency',
      label: 'Cure price per drum',
      defaultValue: 150,
      priceListKey: 'materials.CURE_DRUM',
      showIf: (answers) => answers.finish_required === true && answers.curing_required === true,
    },
    {
      id: 'curing_coverage_rate',
      type: 'number',
      label: 'Coverage rate (m²/L)',
      defaultValue: 5,
      min: 1,
      max: 20,
      step: 0.5,
      unit: 'm²/L',
      helpText: 'Typical: 5m²/L for spray application',
      showIf: (answers) => answers.finish_required === true && answers.curing_required === true,
    },
    {
      id: 'curing_drum_size',
      type: 'number',
      label: 'Cure drum size (L)',
      defaultValue: 20,
      min: 1,
      unit: 'L',
      showIf: (answers) => answers.finish_required === true && answers.curing_required === true,
    },
    {
      id: 'curing_drums_required',
      type: 'number',
      label: 'Drums required',
      helpText: 'Auto-calculated based on coverage rate',
      min: 1,
      unit: 'drums',
      showIf: (answers) => answers.finish_required === true && answers.curing_required === true,
      deriveFrom: (scopeData, moduleAnswers) => {
        const area = Number(moduleAnswers?.finish_area) || Number(scopeData.area) || 0;
        const drumSize = Number(moduleAnswers?.curing_drum_size) || 20;
        const coverageRate = Number(moduleAnswers?.curing_coverage_rate) || 5;
        const litresNeeded = area / coverageRate;
        return Math.ceil(litresNeeded / drumSize) || 1;
      },
      derivedReadOnly: false,
    },

    // ═══════════════════════════════════════════════════════════════
    // SEALING - Drum-based with labour (separate trip)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'sealing_required',
      type: 'boolean',
      label: 'Sealing required?',
      defaultValue: false,
      showIf: (answers) => answers.finish_required === true && answers.finish_type !== 'sealed',
    },
    {
      id: 'sealer_drum_size',
      type: 'number',
      label: 'Sealer drum size (L)',
      defaultValue: 20,
      min: 1,
      unit: 'L',
      showIf: (answers) => answers.finish_required === true && (answers.sealing_required === true || answers.finish_type === 'sealed'),
    },
    {
      id: 'sealer_drum_price',
      type: 'currency',
      label: 'Sealer price per drum',
      defaultValue: 200,
      priceListKey: 'materials.SEALER_DRUM',
      showIf: (answers) => answers.finish_required === true && (answers.sealing_required === true || (answers.finish_type === 'sealed' && answers.sealed_colour_required !== true)),
    },
    {
      id: 'colour_sealer_drum_price',
      type: 'currency',
      label: 'Colour sealer price per drum',
      defaultValue: 250,
      priceListKey: 'materials.COLOUR_SEALER_DRUM',
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'sealed' && answers.sealed_colour_required === true,
    },
    {
      id: 'sealer_drums_required',
      type: 'number',
      label: 'Drums required',
      helpText: 'Auto-calculated: 8m²/L coverage (prime 1-coat)',
      min: 1,
      unit: 'drums',
      showIf: (answers) => answers.finish_required === true && (answers.sealing_required === true || answers.finish_type === 'sealed'),
      deriveFrom: (scopeData, moduleAnswers) => {
        const area = Number(moduleAnswers?.finish_area) || Number(scopeData.area) || 0;
        const drumSize = Number(moduleAnswers?.sealer_drum_size) || 20;
        const coverageRate = 8; // Prime 1-coat coverage rate (m²/L)
        const litresNeeded = area / coverageRate;
        return Math.ceil(litresNeeded / drumSize) || 1;
      },
      derivedReadOnly: false,
    },
    {
      id: 'sealing_men',
      type: 'number',
      label: 'Sealing crew size',
      defaultValue: 1,
      min: 1,
      unit: 'men',
      showIf: (answers) => answers.finish_required === true && (answers.sealing_required === true || answers.finish_type === 'sealed'),
    },
    {
      id: 'sealing_hours_per_man',
      type: 'number',
      label: 'Hours per man',
      defaultValue: 2,
      min: 0,
      unit: 'hrs',
      showIf: (answers) => answers.finish_required === true && (answers.sealing_required === true || answers.finish_type === 'sealed'),
    },
    {
      id: 'sealing_callout',
      type: 'currency',
      label: 'Return visit call-out fee',
      defaultValue: 150,
      priceListKey: 'other.CALLOUT',
      showIf: (answers) => answers.finish_required === true && (answers.sealing_required === true || answers.finish_type === 'sealed'),
    },

    // ═══════════════════════════════════════════════════════════════
    // SUNDRIES
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'sundries_allowance',
      type: 'currency',
      label: 'Sundries allowance',
      helpText: 'Rollers, sprayers, PPE, misc consumables',
      defaultValue: 75,
      showIf: (answers) => answers.finish_required === true,
    },
  ],

  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    if (answers.finish_required !== true) {
      return {
        moduleId: MODULE_ID,
        moduleName: MODULE_NAME,
        lineItems: [],
        subtotal: 0,
        exclusions: [],
      };
    }

    const area = Number(answers.finish_area) || Number(scopeData.area) || 0;
    const labourRate = getPrice(priceMap, 'labour', 'LABOUR HR', 75);

    // ═══════════════════════════════════════════════════════════════
    // FINISH TYPE CALCULATIONS
    // ═══════════════════════════════════════════════════════════════

    // EXPOSED AGGREGATE - Drum-based
    if (answers.finish_type === 'exposed_aggregate') {
      const drumPrice = Number(answers.exposed_retarder_drum_price) || 
        getPrice(priceMap, 'materials', 'RETARDER_DRUM', 150);
      const drumsNeeded = Number(answers.exposed_retarder_drums_required) || 
        Math.ceil(area / 80) || 1;
      const retarderCost = drumsNeeded * drumPrice;

      lineItems.push({
        id: 'exposed_retarder',
        description: `Exposed Aggregate Retarder (${drumsNeeded} drums for ${area}m² @ 80m²/drum)`,
        quantity: drumsNeeded,
        unit: 'drums',
        unitPrice: drumPrice,
        total: retarderCost,
        category: 'materials',
      });
      subtotal += retarderCost;

      // NO wash-off labour - included in pour labour
    }

    // STENCILLED - Roll-based + Colour bags (no labour)
    if (answers.finish_type === 'stencilled') {
      const rollPrice = Number(answers.stencil_roll_price) || 
        getPrice(priceMap, 'materials', 'STENCIL_ROLL', 150);
      const rollsNeeded = Number(answers.stencil_rolls_required) || 
        Math.ceil((area * 1.1) / 100) || 1;
      const rollCost = rollsNeeded * rollPrice;

      lineItems.push({
        id: 'stencil_rolls',
        description: `Stencil Rolls (${rollsNeeded} × 1m×100m rolls for ${area}m² + 10% waste)`,
        quantity: rollsNeeded,
        unit: 'rolls',
        unitPrice: rollPrice,
        total: rollCost,
        category: 'materials',
      });
      subtotal += rollCost;

      // Colour bags if required
      if (answers.stencil_colour_required === true) {
        const bagPrice = Number(answers.stencil_colour_bag_price) || 
          getPrice(priceMap, 'materials', 'COLOUR_BAG', 50);
        const bagsNeeded = Number(answers.stencil_colour_bags_required) || 
          Math.ceil(area / 8) || 1;
        const colourCost = bagsNeeded * bagPrice;

        lineItems.push({
          id: 'stencil_colour',
          description: `Colour Hardener (${bagsNeeded} × 20kg bags for ${area}m² @ 8m²/bag)`,
          quantity: bagsNeeded,
          unit: 'bags',
          unitPrice: bagPrice,
          total: colourCost,
          category: 'materials',
        });
        subtotal += colourCost;
      }

      // NO labour - included in pour labour
    }

    // OTHER FINISH
    if (answers.finish_type === 'other') {
      const materialCost = Number(answers.other_finish_material_cost) || 0;
      if (materialCost > 0) {
        lineItems.push({
          id: 'other_finish_material',
          description: `Other Finish Materials: ${answers.other_finish_description || 'Custom finish'}`,
          quantity: 1,
          unit: 'lot',
          unitPrice: materialCost,
          total: materialCost,
          category: 'materials',
        });
        subtotal += materialCost;
      }

      const otherHours = Number(answers.other_finish_labour_hours) || 0;
      const otherCrew = Number(answers.other_finish_crew_size) || 1;
      if (otherHours > 0) {
        const otherLabour = otherHours * otherCrew * labourRate;
        lineItems.push({
          id: 'other_finish_labour',
          description: `Other Finish Labour (${otherCrew} men × ${otherHours} hrs)`,
          quantity: otherHours * otherCrew,
          unit: 'hrs',
          unitPrice: labourRate,
          total: otherLabour,
          category: 'labour',
        });
        subtotal += otherLabour;
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // CURING - Drum-based (no labour - included in pour)
    // ═══════════════════════════════════════════════════════════════
    if (answers.curing_required === true) {
      const drumSize = Number(answers.curing_drum_size) || 20;
      const drumPrice = Number(answers.curing_drum_price) || 
        getPrice(priceMap, 'materials', 'CURE_DRUM', 150);

      const coverageRate = 5; // 5m²/L coverage
      const litresNeeded = area / coverageRate;
      const drumsNeeded = Number(answers.curing_drums_required) || 
        Math.ceil(litresNeeded / drumSize) || 1;
      const curingCost = drumsNeeded * drumPrice;

      lineItems.push({
        id: 'curing_material',
        description: `Spray-On Cure (${drumsNeeded} × ${drumSize}L drums for ${area}m² @ 5m²/L)`,
        quantity: drumsNeeded,
        unit: 'drums',
        unitPrice: drumPrice,
        total: curingCost,
        category: 'materials',
      });
      subtotal += curingCost;

      // NO labour - included in pour labour
    }

    // ═══════════════════════════════════════════════════════════════
    // SEALING - Drum-based with labour (separate trip)
    // ═══════════════════════════════════════════════════════════════
    if (answers.sealing_required === true || answers.finish_type === 'sealed') {
      const drumSize = Number(answers.sealer_drum_size) || 20;
      const isColourSealer = answers.finish_type === 'sealed' && 
        answers.sealed_colour_required === true;

      const drumPrice = isColourSealer
        ? (Number(answers.colour_sealer_drum_price) || getPrice(priceMap, 'materials', 'COLOUR_SEALER_DRUM', 250))
        : (Number(answers.sealer_drum_price) || getPrice(priceMap, 'materials', 'SEALER_DRUM', 200));

      const coverageRate = 8; // Prime 1-coat coverage rate
      const litresNeeded = area / coverageRate;
      const drumsNeeded = Number(answers.sealer_drums_required) || 
        Math.ceil(litresNeeded / drumSize) || 1;
      const sealerCost = drumsNeeded * drumPrice;

      lineItems.push({
        id: 'sealer_material',
        description: isColourSealer 
          ? `Colour Sealer (${drumsNeeded} × ${drumSize}L drums for ${area}m² @ 8m²/L)`
          : `Concrete Sealer (${drumsNeeded} × ${drumSize}L drums for ${area}m² @ 8m²/L)`,
        quantity: drumsNeeded,
        unit: 'drums',
        unitPrice: drumPrice,
        total: sealerCost,
        category: 'materials',
      });
      subtotal += sealerCost;

      // Sealing labour - separate trip
      const sealingMen = Number(answers.sealing_men) || 1;
      const sealingHours = Number(answers.sealing_hours_per_man) || 2;
      const sealingLabour = sealingMen * sealingHours * labourRate;

      lineItems.push({
        id: 'sealing_labour',
        description: `Sealer Application Labour (${sealingMen} men × ${sealingHours} hrs)`,
        quantity: sealingMen * sealingHours,
        unit: 'hrs',
        unitPrice: labourRate,
        total: sealingLabour,
        category: 'labour',
      });
      subtotal += sealingLabour;

      // Call-out for return visit
      const callout = Number(answers.sealing_callout) || 
        getPrice(priceMap, 'other', 'CALLOUT', 150);
      lineItems.push({
        id: 'sealing_callout',
        description: 'Sealing Return Visit - Travel/Call-out',
        quantity: 1,
        unit: 'visit',
        unitPrice: callout,
        total: callout,
        category: 'other',
      });
      subtotal += callout;
    }

    // ═══════════════════════════════════════════════════════════════
    // SUNDRIES
    // ═══════════════════════════════════════════════════════════════
    const sundries = Number(answers.sundries_allowance) || 75;
    if (sundries > 0) {
      lineItems.push({
        id: 'finishing_sundries',
        description: 'Finishing Sundries (rollers, sprayers, PPE)',
        quantity: 1,
        unit: 'lot',
        unitPrice: sundries,
        total: sundries,
        category: 'materials',
      });
      subtotal += sundries;
    }

    return {
      moduleId: MODULE_ID,
      moduleName: MODULE_NAME,
      lineItems,
      subtotal,
      exclusions: [],
    };
  },

  getExclusions: (answers): ExclusionItem[] => {
    const exclusions: ExclusionItem[] = [];

    if (answers.finish_required !== true) {
      exclusions.push({
        id: 'no_premium_finish',
        text: 'All surface finishing works',
        moduleId: MODULE_ID,
      });
      return exclusions;
    }

    // Only add exclusions for finishes NOT selected
    if (answers.finish_type !== 'exposed_aggregate') {
      exclusions.push({
        id: 'no_exposed',
        text: 'Exposed aggregate finish',
        moduleId: MODULE_ID,
      });
    }
    if (answers.finish_type !== 'stencilled') {
      exclusions.push({
        id: 'no_stencilled',
        text: 'Stencilled/pattern finish',
        moduleId: MODULE_ID,
      });
    }
    if (answers.finish_type !== 'sealed') {
      exclusions.push({
        id: 'no_sealed',
        text: 'Sealed finish',
        moduleId: MODULE_ID,
      });
    }

    // Always exclude these (temporarily removed options)
    exclusions.push({
      id: 'no_honed_polished',
      text: 'Honed and polished finish',
      moduleId: MODULE_ID,
    });
    exclusions.push({
      id: 'no_stamped',
      text: 'Stamped/textured finish',
      moduleId: MODULE_ID,
    });

    if (answers.curing_required !== true) {
      exclusions.push({
        id: 'no_curing',
        text: 'Concrete curing compound',
        moduleId: MODULE_ID,
      });
    }

    if (answers.sealing_required !== true && answers.finish_type !== 'sealed') {
      exclusions.push({
        id: 'no_sealing',
        text: 'Concrete sealing',
        moduleId: MODULE_ID,
      });
    }

    return exclusions;
  },

  validate: (answers) => {
    const errors: string[] = [];
    
    if (answers.finish_required === true && !answers.finish_type) {
      errors.push('Please select a surface finish type');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

export default surfaceFinishingModule;
