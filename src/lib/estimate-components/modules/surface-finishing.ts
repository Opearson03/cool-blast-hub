import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice } from '../types';

export const surfaceFinishingModule: EstimateModule = {
  id: 'surface-finishing',
  name: 'Surface Finishing',
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
        { value: 'stamped', label: 'Stamped' },
        { value: 'honed_polished', label: 'Honed & polished' },
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

    // ========== Stencilled Finish Specific ==========
    {
      id: 'stencil_pattern',
      type: 'select',
      label: 'Stencil pattern type',
      options: [
        { value: 'tile', label: 'Tile pattern' },
        { value: 'brick', label: 'Brick pattern' },
        { value: 'slate', label: 'Slate pattern' },
        { value: 'cobblestone', label: 'Cobblestone pattern' },
        { value: 'custom', label: 'Custom pattern' },
      ],
      defaultValue: 'tile',
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'stencilled',
    },
    {
      id: 'stencil_material_rate',
      type: 'currency',
      label: 'Stencil material cost per m²',
      defaultValue: 25,
      unit: '/m²',
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'stencilled',
    },
    {
      id: 'stencil_colour_required',
      type: 'boolean',
      label: 'Colour/dye required?',
      defaultValue: true,
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'stencilled',
    },
    {
      id: 'stencil_colour_rate',
      type: 'currency',
      label: 'Colour hardener cost per m²',
      defaultValue: 15,
      unit: '/m²',
      showIf: (answers) => answers.finish_required === true && 
        answers.finish_type === 'stencilled' && 
        answers.stencil_colour_required === true,
    },
    {
      id: 'stencil_labour_hours',
      type: 'number',
      label: 'Application labour hours',
      defaultValue: 4,
      min: 1,
      step: 0.5,
      unit: 'hrs',
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'stencilled',
    },
    {
      id: 'stencil_crew_size',
      type: 'number',
      label: 'Crew size for stencilling',
      defaultValue: 2,
      min: 1,
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'stencilled',
    },

    // ========== Stamped Finish Specific ==========
    {
      id: 'stamp_pattern',
      type: 'select',
      label: 'Stamp pattern type',
      options: [
        { value: 'slate', label: 'Slate' },
        { value: 'brick', label: 'Brick' },
        { value: 'cobblestone', label: 'Cobblestone' },
        { value: 'wood_plank', label: 'Wood plank' },
        { value: 'tile', label: 'Tile' },
        { value: 'custom', label: 'Custom pattern' },
      ],
      defaultValue: 'slate',
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'stamped',
    },
    {
      id: 'stamp_mat_hire',
      type: 'currency',
      label: 'Stamp mat hire/cost',
      defaultValue: 200,
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'stamped',
    },
    {
      id: 'release_agent_required',
      type: 'boolean',
      label: 'Release agent required?',
      defaultValue: true,
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'stamped',
    },
    {
      id: 'release_agent_rate',
      type: 'currency',
      label: 'Release agent cost per m²',
      defaultValue: 8,
      unit: '/m²',
      showIf: (answers) => answers.finish_required === true && 
        answers.finish_type === 'stamped' && 
        answers.release_agent_required === true,
    },
    {
      id: 'stamp_colour_hardener_required',
      type: 'boolean',
      label: 'Colour hardener required?',
      defaultValue: true,
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'stamped',
    },
    {
      id: 'stamp_colour_rate',
      type: 'currency',
      label: 'Colour hardener cost per m²',
      defaultValue: 18,
      unit: '/m²',
      showIf: (answers) => answers.finish_required === true && 
        answers.finish_type === 'stamped' && 
        answers.stamp_colour_hardener_required === true,
    },
    {
      id: 'stamp_labour_hours',
      type: 'number',
      label: 'Stamping labour hours',
      defaultValue: 6,
      min: 1,
      step: 0.5,
      unit: 'hrs',
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'stamped',
    },
    {
      id: 'stamp_crew_size',
      type: 'number',
      label: 'Crew size for stamping',
      defaultValue: 2,
      min: 1,
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'stamped',
    },

    // ========== Honed & Polished Specific ==========
    {
      id: 'polish_grade',
      type: 'select',
      label: 'Polish grade',
      options: [
        { value: 'grind_seal', label: 'Grind & seal' },
        { value: 'honed', label: 'Honed (matte)' },
        { value: 'semi_polished', label: 'Semi-polished' },
        { value: 'high_polish', label: 'High polish (mirror)' },
      ],
      defaultValue: 'honed',
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'honed_polished',
    },
    {
      id: 'polish_rate',
      type: 'currency',
      label: 'Polishing rate per m²',
      defaultValue: 65,
      unit: '/m²',
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'honed_polished',
    },

    // ========== Other Finish Specific ==========
    {
      id: 'other_finish_allowance',
      type: 'currency',
      label: 'Finish allowance (lump sum)',
      defaultValue: 500,
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'other',
    },
    {
      id: 'other_finish_description',
      type: 'text',
      label: 'Finish description',
      helpText: 'Describe the finish type for the quote',
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'other',
    },

    // ========== Exposed Aggregate Specific ==========
    // Method: Place concrete → finish → spray retarder → wash off → cure 28 days → acid wash → seal
    {
      id: 'retarder_drum_size',
      type: 'number',
      label: 'Retarder drum size (L)',
      defaultValue: 20,
      min: 1,
      unit: 'L',
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'exposed_aggregate',
    },
    {
      id: 'retarder_drum_price',
      type: 'currency',
      label: 'Retarder price per drum',
      defaultValue: 125,
      priceListKey: 'materials.RETARDER_DRUM',
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'exposed_aggregate',
    },
    {
      id: 'retarder_drums_required',
      type: 'number',
      label: 'Drums required',
      helpText: 'Auto-calculated: 4m²/L coverage, rounded up to whole drums',
      min: 1,
      unit: 'drums',
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'exposed_aggregate',
      deriveFrom: (scopeData, moduleAnswers) => {
        const area = Number(moduleAnswers.finish_area) || Number(scopeData.area) || 0;
        const drumSize = Number(moduleAnswers.retarder_drum_size) || 20;
        const coverageRate = 4; // 4m²/L
        const litresNeeded = area / coverageRate;
        return Math.ceil(litresNeeded / drumSize);
      },
      derivedReadOnly: false,
    },
    {
      id: 'acid_wash_required',
      type: 'boolean',
      label: 'Include acid wash & seal return visit?',
      helpText: 'Required after 28 days cure - before sealing',
      defaultValue: true,
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'exposed_aggregate',
    },
    {
      id: 'acid_wash_hours',
      type: 'number',
      label: 'Acid wash labour hours',
      defaultValue: 3,
      min: 0.5,
      step: 0.5,
      unit: 'hrs',
      showIf: (answers) => answers.finish_required === true && 
        answers.finish_type === 'exposed_aggregate' &&
        answers.acid_wash_required === true,
    },
    {
      id: 'acid_price',
      type: 'currency',
      label: 'Acid wash materials cost',
      defaultValue: 85,
      priceListKey: 'materials.ACID_WASH',
      showIf: (answers) => answers.finish_required === true && 
        answers.finish_type === 'exposed_aggregate' &&
        answers.acid_wash_required === true,
    },
    // ========== Curing (Reusable Module) ==========
    {
      id: 'curing_required',
      type: 'boolean',
      label: 'Is curing required?',
      defaultValue: true,
      showIf: (answers) => answers.finish_required === true,
    },
    {
      id: 'curing_method',
      type: 'select',
      label: 'Curing method',
      options: [
        { value: 'spray', label: 'Spray-on curing compound' },
        { value: 'plastic', label: 'Plastic / wet cure' },
        { value: 'water', label: 'Water cure' },
        { value: 'combined', label: 'Curing + sealing combined' },
      ],
      defaultValue: 'spray',
      showIf: (answers) => answers.finish_required === true && answers.curing_required === true,
    },
    {
      id: 'curing_coverage_rate',
      type: 'number',
      label: 'Curing product coverage rate (m²/L)',
      defaultValue: 6,
      min: 1,
      unit: 'm²/L',
      showIf: (answers) => answers.finish_required === true && 
        answers.curing_required === true && 
        answers.curing_method === 'spray',
    },
    {
      id: 'curing_product_price',
      type: 'currency',
      label: 'Curing product price per litre',
      defaultValue: 25,
      unit: '/L',
      priceListKey: 'materials.CURING_COMPOUND',
      showIf: (answers) => answers.finish_required === true && 
        answers.curing_required === true && 
        answers.curing_method === 'spray',
    },
    {
      id: 'curing_coats',
      type: 'number',
      label: 'Number of coats',
      defaultValue: 1,
      min: 1,
      max: 3,
      showIf: (answers) => answers.finish_required === true && 
        answers.curing_required === true && 
        answers.curing_method === 'spray',
    },
    {
      id: 'curing_men',
      type: 'number',
      label: 'How many men for curing?',
      defaultValue: 1,
      min: 1,
      showIf: (answers) => answers.finish_required === true && answers.curing_required === true,
    },
    {
      id: 'curing_hours_per_man',
      type: 'number',
      label: 'Hours per man for curing',
      defaultValue: 1,
      min: 0.5,
      step: 0.5,
      unit: 'hrs',
      showIf: (answers) => answers.finish_required === true && answers.curing_required === true,
    },

    // ========== Sealing (Reusable Module) ==========
    {
      id: 'sealing_required',
      type: 'boolean',
      label: 'Is sealing required?',
      defaultValue: false,
      showIf: (answers) => answers.finish_required === true,
    },
    {
      id: 'sealer_type',
      type: 'select',
      label: 'Sealer type',
      options: [
        { value: 'acrylic', label: 'Acrylic' },
        { value: 'penetrating', label: 'Penetrating' },
        { value: 'high_gloss', label: 'High-gloss' },
        { value: 'matte', label: 'Matte' },
        { value: 'exposed_agg', label: 'Exposed-agg specific' },
      ],
      defaultValue: 'acrylic',
      showIf: (answers) => answers.finish_required === true && answers.sealing_required === true,
    },
    {
      id: 'sealer_coats',
      type: 'number',
      label: 'Number of sealer coats',
      defaultValue: 2,
      min: 1,
      max: 4,
      showIf: (answers) => answers.finish_required === true && answers.sealing_required === true,
    },
    {
      id: 'sealer_coverage_rate',
      type: 'number',
      label: 'Sealer coverage rate (m²/L)',
      defaultValue: 8,
      min: 1,
      unit: 'm²/L',
      showIf: (answers) => answers.finish_required === true && answers.sealing_required === true,
    },
    {
      id: 'sealer_price_per_litre',
      type: 'currency',
      label: 'Sealer price per litre',
      defaultValue: 35,
      unit: '/L',
      priceListKey: 'materials.SEALER',
      showIf: (answers) => answers.finish_required === true && answers.sealing_required === true,
    },
    {
      id: 'slip_additive_required',
      type: 'boolean',
      label: 'Slip additive required?',
      defaultValue: false,
      showIf: (answers) => answers.finish_required === true && answers.sealing_required === true,
    },
    {
      id: 'slip_additive_rate',
      type: 'number',
      label: 'Additive rate (kg/m²)',
      defaultValue: 0.05,
      min: 0.01,
      step: 0.01,
      unit: 'kg/m²',
      showIf: (answers) => answers.finish_required === true && 
        answers.sealing_required === true && 
        answers.slip_additive_required === true,
    },
    {
      id: 'slip_additive_price',
      type: 'currency',
      label: 'Slip additive price per kg',
      defaultValue: 45,
      unit: '/kg',
      priceListKey: 'materials.SLIP_ADDITIVE',
      showIf: (answers) => answers.finish_required === true && 
        answers.sealing_required === true && 
        answers.slip_additive_required === true,
    },
    {
      id: 'slip_additive_extra_labour',
      type: 'number',
      label: 'Extra labour time for additive',
      defaultValue: 0.5,
      min: 0,
      step: 0.5,
      unit: 'hrs',
      showIf: (answers) => answers.finish_required === true && 
        answers.sealing_required === true && 
        answers.slip_additive_required === true,
    },
    {
      id: 'sealing_men',
      type: 'number',
      label: 'How many men for sealing?',
      defaultValue: 1,
      min: 1,
      showIf: (answers) => answers.finish_required === true && answers.sealing_required === true,
    },
    {
      id: 'sealing_hours_per_man',
      type: 'number',
      label: 'Hours per man for sealing',
      defaultValue: 2,
      min: 0.5,
      step: 0.5,
      unit: 'hrs',
      showIf: (answers) => answers.finish_required === true && answers.sealing_required === true,
    },
    {
      id: 'sealing_return_visit',
      type: 'boolean',
      label: 'Return visit required for sealing?',
      defaultValue: false,
      showIf: (answers) => answers.finish_required === true && answers.sealing_required === true,
    },
    {
      id: 'sealing_return_hours',
      type: 'number',
      label: 'Return visit hours',
      defaultValue: 2,
      min: 0.5,
      step: 0.5,
      unit: 'hrs',
      showIf: (answers) => answers.finish_required === true && 
        answers.sealing_required === true && 
        answers.sealing_return_visit === true,
    },

    // ========== Sundries Allowance ==========
    {
      id: 'sundries_allowance',
      type: 'currency',
      label: 'Sundries allowance (rollers, sprayers, PPE, etc.)',
      helpText: 'For application tools, PPE, and consumables',
      defaultValue: 75,
      showIf: (answers) => answers.finish_required === true,
    },
  ],

  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    // If finish not required, skip everything
    if (answers.finish_required === false) {
      return {
        moduleId: 'surface-finishing',
        moduleName: 'Surface Finishing',
        lineItems: [],
        subtotal: 0,
        exclusions: [],
      };
    }

    const area = Number(answers.finish_area) || Number(scopeData.area) || 0;
    const labourRate = getPrice(priceMap, 'labour', 'LABOUR HR', 85);
    const effectiveRate = labourRate;

    // ========== Exposed Aggregate - Retarder (Drum-based) ==========
    if (answers.finish_type === 'exposed_aggregate') {
      const drumSize = Number(answers.retarder_drum_size) || 20;
      const drumPrice = Number(answers.retarder_drum_price) || getPrice(priceMap, 'materials', 'RETARDER_DRUM', 125);
      
      // Calculate drums needed: 4m²/L coverage, rounded up to whole drums
      const coverageRate = 4; // 4m²/L
      const litresNeeded = area / coverageRate;
      const drumsNeeded = Number(answers.retarder_drums_required) || Math.ceil(litresNeeded / drumSize);
      const totalLitres = drumsNeeded * drumSize;
      const retarderCost = drumsNeeded * drumPrice;

      lineItems.push({
        id: 'retarder_material',
        description: `Surface Retarder (${drumsNeeded} × ${drumSize}L drums for ${area}m² @ 4m²/L)`,
        quantity: drumsNeeded,
        unit: 'drums',
        unitPrice: drumPrice,
        total: retarderCost,
        category: 'materials',
      });
      subtotal += retarderCost;
    }

    // ========== Exposed Aggregate - Acid Wash Return Visit ==========
    if (answers.finish_type === 'exposed_aggregate' && answers.acid_wash_required === true) {
      const acidPrice = Number(answers.acid_price) || getPrice(priceMap, 'materials', 'ACID_WASH', 85);
      lineItems.push({
        id: 'acid_wash_materials',
        description: 'Acid Wash Materials (return visit after 28 day cure)',
        quantity: 1,
        unit: 'allow',
        unitPrice: acidPrice,
        total: acidPrice,
        category: 'materials',
      });
      subtotal += acidPrice;

      const washHours = Number(answers.acid_wash_hours) || 3;
      const washCost = washHours * effectiveRate;
      lineItems.push({
        id: 'acid_wash_labour',
        description: `Acid Wash Labour (${washHours} hrs)`,
        quantity: washHours,
        unit: 'hrs',
        unitPrice: effectiveRate,
        total: washCost,
        category: 'labour',
      });
      subtotal += washCost;

      // Callout charge for return visit
      const callout = getPrice(priceMap, 'other', 'CALLOUT', 150);
      lineItems.push({
        id: 'acid_wash_callout',
        description: 'Acid Wash Return Visit - Travel/Call-out',
        quantity: 1,
        unit: 'visit',
        unitPrice: callout,
        total: callout,
        category: 'other',
      });
      subtotal += callout;
    }

    // ========== Stencilled Finish ==========
    if (answers.finish_type === 'stencilled') {
      const stencilRate = Number(answers.stencil_material_rate) || 25;
      const stencilMaterialCost = area * stencilRate;

      lineItems.push({
        id: 'stencil_material',
        description: `Stencil Materials (${area}m² @ $${stencilRate}/m²)`,
        quantity: area,
        unit: 'm²',
        unitPrice: stencilRate,
        total: stencilMaterialCost,
        category: 'materials',
      });
      subtotal += stencilMaterialCost;

      if (answers.stencil_colour_required === true) {
        const colourRate = Number(answers.stencil_colour_rate) || 15;
        const colourCost = area * colourRate;

        lineItems.push({
          id: 'stencil_colour',
          description: `Colour Hardener (${area}m² @ $${colourRate}/m²)`,
          quantity: area,
          unit: 'm²',
          unitPrice: colourRate,
          total: colourCost,
          category: 'materials',
        });
        subtotal += colourCost;
      }

      const labourHours = Number(answers.stencil_labour_hours) || 4;
      const crewSize = Number(answers.stencil_crew_size) || 2;
      const totalLabourHours = labourHours * crewSize;
      const labourCost = totalLabourHours * effectiveRate;

      lineItems.push({
        id: 'stencil_labour',
        description: `Stencilling Labour (${crewSize} men × ${labourHours} hrs)`,
        quantity: totalLabourHours,
        unit: 'hrs',
        unitPrice: effectiveRate,
        total: labourCost,
        category: 'labour',
      });
      subtotal += labourCost;
    }

    // ========== Stamped Finish ==========
    if (answers.finish_type === 'stamped') {
      const matCost = Number(answers.stamp_mat_hire) || 200;

      lineItems.push({
        id: 'stamp_mat',
        description: 'Stamp Mat Hire/Cost',
        quantity: 1,
        unit: 'allow',
        unitPrice: matCost,
        total: matCost,
        category: 'plant',
      });
      subtotal += matCost;

      if (answers.release_agent_required === true) {
        const releaseRate = Number(answers.release_agent_rate) || 8;
        const releaseCost = area * releaseRate;

        lineItems.push({
          id: 'release_agent',
          description: `Release Agent (${area}m² @ $${releaseRate}/m²)`,
          quantity: area,
          unit: 'm²',
          unitPrice: releaseRate,
          total: releaseCost,
          category: 'materials',
        });
        subtotal += releaseCost;
      }

      if (answers.stamp_colour_hardener_required === true) {
        const colourRate = Number(answers.stamp_colour_rate) || 18;
        const colourCost = area * colourRate;

        lineItems.push({
          id: 'stamp_colour',
          description: `Colour Hardener (${area}m² @ $${colourRate}/m²)`,
          quantity: area,
          unit: 'm²',
          unitPrice: colourRate,
          total: colourCost,
          category: 'materials',
        });
        subtotal += colourCost;
      }

      const labourHours = Number(answers.stamp_labour_hours) || 6;
      const crewSize = Number(answers.stamp_crew_size) || 2;
      const totalLabourHours = labourHours * crewSize;
      const labourCost = totalLabourHours * effectiveRate;

      lineItems.push({
        id: 'stamp_labour',
        description: `Stamping Labour (${crewSize} men × ${labourHours} hrs)`,
        quantity: totalLabourHours,
        unit: 'hrs',
        unitPrice: effectiveRate,
        total: labourCost,
        category: 'labour',
      });
      subtotal += labourCost;
    }

    // ========== Honed & Polished ==========
    if (answers.finish_type === 'honed_polished') {
      const polishRate = Number(answers.polish_rate) || 65;
      const polishCost = area * polishRate;

      lineItems.push({
        id: 'polish',
        description: `${getPolishGradeName(answers.polish_grade)} Finish (${area}m² @ $${polishRate}/m²)`,
        quantity: area,
        unit: 'm²',
        unitPrice: polishRate,
        total: polishCost,
        category: 'subcontractor',
      });
      subtotal += polishCost;
    }

    // ========== Sealed (Standalone) ==========
    if (answers.finish_type === 'sealed') {
      // Sealing is handled in the sealing section below
    }

    // ========== Other Finish ==========
    if (answers.finish_type === 'other') {
      const allowance = Number(answers.other_finish_allowance) || 500;

      lineItems.push({
        id: 'other_finish',
        description: answers.other_finish_description || 'Custom Finish Allowance',
        quantity: 1,
        unit: 'allow',
        unitPrice: allowance,
        total: allowance,
        category: 'other',
      });
      subtotal += allowance;
    }

    // ========== Curing ==========
    if (answers.curing_required === true) {
      const curingMen = Number(answers.curing_men) || 1;
      const curingHours = Number(answers.curing_hours_per_man) || 1;
      const curingLabour = curingMen * curingHours * effectiveRate;

      lineItems.push({
        id: 'curing_labour',
        description: `Curing Application Labour (${curingMen} men × ${curingHours} hrs)`,
        quantity: curingMen * curingHours,
        unit: 'hrs',
        unitPrice: effectiveRate,
        total: curingLabour,
        category: 'labour',
      });
      subtotal += curingLabour;

      if (answers.curing_method === 'spray') {
        const coverageRate = Number(answers.curing_coverage_rate) || 6;
        const pricePerLitre = Number(answers.curing_product_price) || getPrice(priceMap, 'materials', 'CURING_COMPOUND', 25);
        const coats = Number(answers.curing_coats) || 1;
        const litresNeeded = Math.ceil((area / coverageRate) * coats);
        const curingMaterialCost = litresNeeded * pricePerLitre;

        lineItems.push({
          id: 'curing_material',
          description: `Curing Compound (${litresNeeded}L for ${area}m² × ${coats} coat${coats > 1 ? 's' : ''})`,
          quantity: litresNeeded,
          unit: 'L',
          unitPrice: pricePerLitre,
          total: curingMaterialCost,
          category: 'materials',
        });
        subtotal += curingMaterialCost;
      }
    }

    // ========== Sealing ==========
    if (answers.sealing_required === true || answers.finish_type === 'sealed') {
      const sealingMen = Number(answers.sealing_men) || 1;
      const sealingHours = Number(answers.sealing_hours_per_man) || 2;
      const sealingLabour = sealingMen * sealingHours * effectiveRate;

      lineItems.push({
        id: 'sealing_labour',
        description: `Sealer Application Labour (${sealingMen} men × ${sealingHours} hrs)`,
        quantity: sealingMen * sealingHours,
        unit: 'hrs',
        unitPrice: effectiveRate,
        total: sealingLabour,
        category: 'labour',
      });
      subtotal += sealingLabour;

      // Sealer materials
      const coverageRate = Number(answers.sealer_coverage_rate) || 8;
      const pricePerLitre = Number(answers.sealer_price_per_litre) || getPrice(priceMap, 'materials', 'SEALER', 35);
      const coats = Number(answers.sealer_coats) || 2;
      const litresNeeded = Math.ceil((area / coverageRate) * coats);
      const sealerCost = litresNeeded * pricePerLitre;

      const sealerType = getSealerTypeName(answers.sealer_type);
      lineItems.push({
        id: 'sealer_material',
        description: `${sealerType} Sealer (${litresNeeded}L for ${area}m² × ${coats} coats)`,
        quantity: litresNeeded,
        unit: 'L',
        unitPrice: pricePerLitre,
        total: sealerCost,
        category: 'materials',
      });
      subtotal += sealerCost;

      // Slip additive
      if (answers.slip_additive_required === true) {
        const additiveRate = Number(answers.slip_additive_rate) || 0.05;
        const additivePrice = Number(answers.slip_additive_price) || getPrice(priceMap, 'materials', 'SLIP_ADDITIVE', 45);
        const additiveKg = Math.ceil(area * additiveRate * 10) / 10;
        const additiveCost = additiveKg * additivePrice;

        lineItems.push({
          id: 'slip_additive',
          description: `Slip Additive (${additiveKg}kg for ${area}m²)`,
          quantity: additiveKg,
          unit: 'kg',
          unitPrice: additivePrice,
          total: additiveCost,
          category: 'materials',
        });
        subtotal += additiveCost;

        const extraLabour = Number(answers.slip_additive_extra_labour) || 0.5;
        if (extraLabour > 0) {
          const extraLabourCost = extraLabour * effectiveRate;
          lineItems.push({
            id: 'slip_additive_labour',
            description: `Slip Additive Extra Labour (${extraLabour} hrs)`,
            quantity: extraLabour,
            unit: 'hrs',
            unitPrice: effectiveRate,
            total: extraLabourCost,
            category: 'labour',
          });
          subtotal += extraLabourCost;
        }
      }

      // Return visit for sealing
      if (answers.sealing_return_visit === true) {
        const returnHours = Number(answers.sealing_return_hours) || 2;
        const returnCost = returnHours * effectiveRate;
        const callout = getPrice(priceMap, 'other', 'CALLOUT', 150);

        lineItems.push({
          id: 'sealing_return_labour',
          description: `Sealing Return Visit Labour (${returnHours} hrs)`,
          quantity: returnHours,
          unit: 'hrs',
          unitPrice: effectiveRate,
          total: returnCost,
          category: 'labour',
        });
        subtotal += returnCost;

        lineItems.push({
          id: 'sealing_callout',
          description: 'Sealing Return Visit Call-out',
          quantity: 1,
          unit: 'visit',
          unitPrice: callout,
          total: callout,
          category: 'other',
        });
        subtotal += callout;
      }
    }

    // ========== Sundries ==========
    const sundries = Number(answers.sundries_allowance) || 75;
    if (sundries > 0) {
      lineItems.push({
        id: 'sundries',
        description: 'Finishing Sundries (rollers, sprayers, PPE)',
        quantity: 1,
        unit: 'allow',
        unitPrice: sundries,
        total: sundries,
        category: 'materials',
      });
      subtotal += sundries;
    }

    return {
      moduleId: 'surface-finishing',
      moduleName: 'Surface Finishing',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (answers): ExclusionItem[] => {
    const exclusions: ExclusionItem[] = [];

    // No finish at all
    if (answers.finish_required === false) {
      exclusions.push({
        id: 'no_finishing',
        text: 'Surface finishing, decorative finishes, curing compounds and sealing are excluded.',
        moduleId: 'surface-finishing',
      });
      return exclusions;
    }

    // Finish type specific exclusions
    if (answers.finish_type !== 'exposed_aggregate') {
      exclusions.push({
        id: 'no_exposed_agg',
        text: 'Exposed aggregate finish is excluded.',
        moduleId: 'surface-finishing',
      });
    }

    if (answers.finish_type !== 'stencilled') {
      exclusions.push({
        id: 'no_stencilled',
        text: 'Stencilled concrete finish is excluded.',
        moduleId: 'surface-finishing',
      });
    }

    if (answers.finish_type !== 'stamped') {
      exclusions.push({
        id: 'no_stamped',
        text: 'Stamped concrete finish is excluded.',
        moduleId: 'surface-finishing',
      });
    }

    if (answers.finish_type !== 'honed_polished') {
      exclusions.push({
        id: 'no_polishing',
        text: 'Honed or polished concrete finishes are excluded.',
        moduleId: 'surface-finishing',
      });
    }

    // Curing exclusion
    if (answers.curing_required === false) {
      exclusions.push({
        id: 'no_curing',
        text: 'Concrete curing is excluded.',
        moduleId: 'surface-finishing',
      });
    }

    // Sealing exclusion
    if (answers.sealing_required === false && answers.finish_type !== 'sealed') {
      exclusions.push({
        id: 'no_sealing',
        text: 'Concrete sealing is excluded.',
        moduleId: 'surface-finishing',
      });
    }

    // Return visits
    if (answers.finish_type === 'exposed_aggregate' && answers.washoff_timing !== 'return_visit') {
      exclusions.push({
        id: 'no_return_visits',
        text: 'Additional return visits for wash-off are excluded.',
        moduleId: 'surface-finishing',
      });
    }

    // Other finish - details TBD
    if (answers.finish_type === 'other') {
      exclusions.push({
        id: 'decorative_tbd',
        text: 'Decorative finish details to be confirmed.',
        moduleId: 'surface-finishing',
      });
    }

    return exclusions;
  },

  validate: (answers) => {
    const errors: string[] = [];

    if (answers.finish_required === true) {
      if (!answers.finish_type) {
        errors.push('Please select a finish type');
      }
      if (!answers.finish_area || answers.finish_area <= 0) {
        errors.push('Please specify the area to be finished');
      }
    }

    return { valid: errors.length === 0, errors };
  },
};

// Helper functions
function getFinishTypeName(finishType: string): string {
  const names: Record<string, string> = {
    'exposed_aggregate': 'Exposed Aggregate',
    'stencilled': 'Stencilled',
    'stamped': 'Stamped',
    'honed_polished': 'Honed & Polished',
    'sealed': 'Sealed',
    'other': 'Other',
  };
  return names[finishType] || 'Surface';
}

function getSealerTypeName(sealerType: string): string {
  const names: Record<string, string> = {
    'acrylic': 'Acrylic',
    'penetrating': 'Penetrating',
    'high_gloss': 'High-Gloss',
    'matte': 'Matte',
    'exposed_agg': 'Exposed Aggregate',
  };
  return names[sealerType] || 'Concrete';
}

function getPolishGradeName(grade: string): string {
  const names: Record<string, string> = {
    'grind_seal': 'Grind & Seal',
    'honed': 'Honed',
    'semi_polished': 'Semi-Polished',
    'high_polish': 'High Polish',
  };
  return names[grade] || 'Polished';
}
