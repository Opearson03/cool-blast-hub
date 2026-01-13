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
      label: 'Is a surface finish required?',
      defaultValue: true,
      required: true,
    },

    // ========== Q2: Finish Type (Single Select) ==========
    {
      id: 'finish_type',
      type: 'select',
      label: 'Select surface finish type',
      options: [
        { value: 'steel_trowel', label: 'Steel trowel (hard finish)' },
        { value: 'machine_trowel', label: 'Machine trowel (power float)' },
        { value: 'broom_finish', label: 'Broom finish' },
        { value: 'exposed_aggregate', label: 'Exposed aggregate' },
        { value: 'honed_polished', label: 'Honed / polished' },
        { value: 'custom_other', label: 'Custom / other' },
      ],
      defaultValue: 'steel_trowel',
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

    // ========== Steel / Machine Trowel Specific ==========
    {
      id: 'trowel_type',
      type: 'select',
      label: 'Trowel type',
      options: [
        { value: 'hand', label: 'Hand trowel' },
        { value: 'machine', label: 'Machine trowel (power float)' },
      ],
      defaultValue: 'hand',
      showIf: (answers) => answers.finish_required === true && 
        (answers.finish_type === 'steel_trowel' || answers.finish_type === 'machine_trowel'),
    },
    {
      id: 'machine_hire_required',
      type: 'boolean',
      label: 'Machine hire required?',
      defaultValue: true,
      showIf: (answers) => answers.finish_required === true && 
        (answers.finish_type === 'machine_trowel' || answers.trowel_type === 'machine'),
    },
    {
      id: 'machine_hire_hours',
      type: 'number',
      label: 'Machine hire hours',
      defaultValue: 4,
      min: 1,
      unit: 'hrs',
      showIf: (answers) => answers.finish_required === true && 
        (answers.finish_type === 'machine_trowel' || answers.trowel_type === 'machine') &&
        answers.machine_hire_required === true,
    },
    {
      id: 'machine_hire_rate',
      type: 'currency',
      label: 'Machine hire rate per hour',
      defaultValue: 45,
      unit: '/hr',
      priceListKey: 'plant.POWER_FLOAT',
      showIf: (answers) => answers.finish_required === true && 
        (answers.finish_type === 'machine_trowel' || answers.trowel_type === 'machine') &&
        answers.machine_hire_required === true,
    },
    {
      id: 'fuel_wear_allowance',
      type: 'currency',
      label: 'Fuel & wear allowance',
      defaultValue: 25,
      showIf: (answers) => answers.finish_required === true && 
        (answers.finish_type === 'machine_trowel' || answers.trowel_type === 'machine') &&
        answers.machine_hire_required === true,
    },
    {
      id: 'additional_operator_required',
      type: 'boolean',
      label: 'Additional operator required?',
      defaultValue: false,
      showIf: (answers) => answers.finish_required === true && 
        (answers.finish_type === 'machine_trowel' || answers.trowel_type === 'machine'),
    },
    {
      id: 'edge_detail_required',
      type: 'boolean',
      label: 'Edge detail required?',
      helpText: 'Hand finishing around edges',
      defaultValue: true,
      showIf: (answers) => answers.finish_required === true && 
        (answers.finish_type === 'steel_trowel' || answers.finish_type === 'machine_trowel'),
    },
    {
      id: 'edge_finish_hours',
      type: 'number',
      label: 'Hand finish edges labour (hours)',
      defaultValue: 2,
      min: 0.5,
      step: 0.5,
      unit: 'hrs',
      showIf: (answers) => answers.finish_required === true && 
        (answers.finish_type === 'steel_trowel' || answers.finish_type === 'machine_trowel') &&
        answers.edge_detail_required === true,
    },

    // ========== Broom Finish Specific ==========
    {
      id: 'broom_direction',
      type: 'select',
      label: 'Broom direction',
      options: [
        { value: 'cross', label: 'Cross' },
        { value: 'longitudinal', label: 'Longitudinal' },
        { value: 'decorative', label: 'Decorative' },
      ],
      defaultValue: 'cross',
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'broom_finish',
    },
    {
      id: 'slip_resistance',
      type: 'select',
      label: 'Slip resistance required?',
      options: [
        { value: 'standard', label: 'Standard' },
        { value: 'high_grip', label: 'High-grip (adds labour)' },
      ],
      defaultValue: 'standard',
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'broom_finish',
    },
    {
      id: 'high_grip_extra_hours',
      type: 'number',
      label: 'Extra hours for high-grip finish',
      defaultValue: 1,
      min: 0.5,
      step: 0.5,
      unit: 'hrs',
      showIf: (answers) => answers.finish_required === true && 
        answers.finish_type === 'broom_finish' && 
        answers.slip_resistance === 'high_grip',
    },

    // ========== Exposed Aggregate Specific ==========
    {
      id: 'exposure_level',
      type: 'select',
      label: 'Aggregate exposure level',
      options: [
        { value: 'light', label: 'Light' },
        { value: 'medium', label: 'Medium' },
        { value: 'heavy', label: 'Heavy' },
      ],
      defaultValue: 'medium',
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'exposed_aggregate',
    },
    {
      id: 'exposure_method',
      type: 'select',
      label: 'Exposure method',
      options: [
        { value: 'retarder', label: 'Surface retarder' },
        { value: 'acid_wash', label: 'Acid wash' },
        { value: 'both', label: 'Both' },
      ],
      defaultValue: 'retarder',
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'exposed_aggregate',
    },
    {
      id: 'retarder_coverage_rate',
      type: 'number',
      label: 'Retarder coverage rate (m²/L)',
      defaultValue: 8,
      min: 1,
      unit: 'm²/L',
      showIf: (answers) => answers.finish_required === true && 
        answers.finish_type === 'exposed_aggregate' &&
        (answers.exposure_method === 'retarder' || answers.exposure_method === 'both'),
    },
    {
      id: 'retarder_price_per_litre',
      type: 'currency',
      label: 'Retarder price per litre',
      defaultValue: 45,
      unit: '/L',
      priceListKey: 'materials.RETARDER',
      showIf: (answers) => answers.finish_required === true && 
        answers.finish_type === 'exposed_aggregate' &&
        (answers.exposure_method === 'retarder' || answers.exposure_method === 'both'),
    },
    {
      id: 'retarder_application_hours',
      type: 'number',
      label: 'Application labour (hours)',
      defaultValue: 2,
      min: 0.5,
      step: 0.5,
      unit: 'hrs',
      showIf: (answers) => answers.finish_required === true && 
        answers.finish_type === 'exposed_aggregate' &&
        (answers.exposure_method === 'retarder' || answers.exposure_method === 'both'),
    },
    {
      id: 'neutralisation_required',
      type: 'boolean',
      label: 'Neutralisation required?',
      defaultValue: true,
      showIf: (answers) => answers.finish_required === true && 
        answers.finish_type === 'exposed_aggregate' &&
        (answers.exposure_method === 'acid_wash' || answers.exposure_method === 'both'),
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
        (answers.exposure_method === 'acid_wash' || answers.exposure_method === 'both'),
    },
    {
      id: 'acid_price',
      type: 'currency',
      label: 'Acid wash materials cost',
      defaultValue: 85,
      priceListKey: 'materials.ACID_WASH',
      showIf: (answers) => answers.finish_required === true && 
        answers.finish_type === 'exposed_aggregate' &&
        (answers.exposure_method === 'acid_wash' || answers.exposure_method === 'both'),
    },
    {
      id: 'washoff_timing',
      type: 'select',
      label: 'Wash-off timing',
      options: [
        { value: 'same_day', label: 'Same day' },
        { value: 'next_day', label: 'Next day' },
        { value: 'return_visit', label: 'Return visit required' },
      ],
      defaultValue: 'same_day',
      showIf: (answers) => answers.finish_required === true && answers.finish_type === 'exposed_aggregate',
    },
    {
      id: 'return_visit_labour',
      type: 'number',
      label: 'Return visit labour hours',
      defaultValue: 4,
      min: 1,
      unit: 'hrs',
      showIf: (answers) => answers.finish_required === true && 
        answers.finish_type === 'exposed_aggregate' &&
        answers.washoff_timing === 'return_visit',
    },
    {
      id: 'callout_charge',
      type: 'currency',
      label: 'Travel / call-out charge',
      defaultValue: 150,
      priceListKey: 'other.CALLOUT',
      showIf: (answers) => answers.finish_required === true && 
        answers.finish_type === 'exposed_aggregate' &&
        answers.washoff_timing === 'return_visit',
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

    // ========== Machine Trowel Hire ==========
    if ((answers.finish_type === 'machine_trowel' || answers.trowel_type === 'machine') && 
        answers.machine_hire_required === true) {
      const machineHours = Number(answers.machine_hire_hours) || 4;
      const machineRate = Number(answers.machine_hire_rate) || getPrice(priceMap, 'plant', 'POWER_FLOAT', 45);
      const machineCost = machineHours * machineRate;
      const fuelWear = Number(answers.fuel_wear_allowance) || 25;

      lineItems.push({
        id: 'machine_hire',
        description: `Power Float Hire (${machineHours} hrs)`,
        quantity: machineHours,
        unit: 'hrs',
        unitPrice: machineRate,
        total: machineCost,
        category: 'plant',
      });
      subtotal += machineCost;

      if (fuelWear > 0) {
        lineItems.push({
          id: 'fuel_wear',
          description: 'Fuel & Wear Allowance',
          quantity: 1,
          unit: 'allow',
          unitPrice: fuelWear,
          total: fuelWear,
          category: 'plant',
        });
        subtotal += fuelWear;
      }

      // Additional operator
      if (answers.additional_operator_required === true) {
        const operatorCost = machineHours * effectiveRate;
        lineItems.push({
          id: 'additional_operator',
          description: `Additional Operator (${machineHours} hrs)`,
          quantity: machineHours,
          unit: 'hrs',
          unitPrice: effectiveRate,
          total: operatorCost,
          category: 'labour',
        });
        subtotal += operatorCost;
      }
    }

    // ========== Edge Detail ==========
    if ((answers.finish_type === 'steel_trowel' || answers.finish_type === 'machine_trowel') &&
        answers.edge_detail_required === true) {
      const edgeHours = Number(answers.edge_finish_hours) || 2;
      const edgeCost = edgeHours * effectiveRate;
      lineItems.push({
        id: 'edge_finishing',
        description: `Hand Finish Edges (${edgeHours} hrs)`,
        quantity: edgeHours,
        unit: 'hrs',
        unitPrice: effectiveRate,
        total: edgeCost,
        category: 'labour',
      });
      subtotal += edgeCost;
    }

    // ========== Broom Finish - High Grip Extra ==========
    if (answers.finish_type === 'broom_finish' && answers.slip_resistance === 'high_grip') {
      const extraHours = Number(answers.high_grip_extra_hours) || 1;
      const extraCost = extraHours * effectiveRate;
      lineItems.push({
        id: 'high_grip_labour',
        description: `High-Grip Finish Extra Labour (${extraHours} hrs)`,
        quantity: extraHours,
        unit: 'hrs',
        unitPrice: effectiveRate,
        total: extraCost,
        category: 'labour',
      });
      subtotal += extraCost;
    }

    // ========== Exposed Aggregate - Retarder ==========
    if (answers.finish_type === 'exposed_aggregate' &&
        (answers.exposure_method === 'retarder' || answers.exposure_method === 'both')) {
      const coverageRate = Number(answers.retarder_coverage_rate) || 8;
      const pricePerLitre = Number(answers.retarder_price_per_litre) || getPrice(priceMap, 'materials', 'RETARDER', 45);
      const litresNeeded = Math.ceil(area / coverageRate);
      const retarderCost = litresNeeded * pricePerLitre;

      lineItems.push({
        id: 'retarder_material',
        description: `Surface Retarder (${litresNeeded}L for ${area}m²)`,
        quantity: litresNeeded,
        unit: 'L',
        unitPrice: pricePerLitre,
        total: retarderCost,
        category: 'materials',
      });
      subtotal += retarderCost;

      const appHours = Number(answers.retarder_application_hours) || 2;
      const appCost = appHours * effectiveRate;
      lineItems.push({
        id: 'retarder_application',
        description: `Retarder Application Labour (${appHours} hrs)`,
        quantity: appHours,
        unit: 'hrs',
        unitPrice: effectiveRate,
        total: appCost,
        category: 'labour',
      });
      subtotal += appCost;
    }

    // ========== Exposed Aggregate - Acid Wash ==========
    if (answers.finish_type === 'exposed_aggregate' &&
        (answers.exposure_method === 'acid_wash' || answers.exposure_method === 'both')) {
      const acidPrice = Number(answers.acid_price) || getPrice(priceMap, 'materials', 'ACID_WASH', 85);
      lineItems.push({
        id: 'acid_wash_materials',
        description: 'Acid Wash Materials',
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
    }

    // ========== Exposed Aggregate - Return Visit ==========
    if (answers.finish_type === 'exposed_aggregate' && answers.washoff_timing === 'return_visit') {
      const returnHours = Number(answers.return_visit_labour) || 4;
      const returnCost = returnHours * effectiveRate;
      const callout = Number(answers.callout_charge) || getPrice(priceMap, 'other', 'CALLOUT', 150);

      lineItems.push({
        id: 'return_visit_labour',
        description: `Return Visit Labour (${returnHours} hrs)`,
        quantity: returnHours,
        unit: 'hrs',
        unitPrice: effectiveRate,
        total: returnCost,
        category: 'labour',
      });
      subtotal += returnCost;

      lineItems.push({
        id: 'callout_charge',
        description: 'Travel / Call-out Charge',
        quantity: 1,
        unit: 'visit',
        unitPrice: callout,
        total: callout,
        category: 'other',
      });
      subtotal += callout;
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
    if (answers.sealing_required === true) {
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
    if (answers.sealing_required === false) {
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

    // Decorative finishes
    if (answers.finish_type === 'custom_other') {
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
    'steel_trowel': 'Steel Trowel',
    'machine_trowel': 'Machine Trowel',
    'broom_finish': 'Broom',
    'exposed_aggregate': 'Exposed Aggregate',
    'honed_polished': 'Honed/Polished',
    'custom_other': 'Custom',
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
