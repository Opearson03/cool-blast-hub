import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap, ExpansionJointConfig } from '../types';
import { getPrice } from '../types';

export const connectionsJointsModule: EstimateModule = {
  id: 'connections-joints',
  name: 'Connections & Joints',
  description: 'Dowels, expansion foam, and expansion joints for connecting to structures',
  icon: 'Link',

  questions: [
    // ============ DOWELS SECTION ============
    {
      id: 'dowels_required',
      type: 'boolean',
      label: 'Are dowels required?',
      defaultValue: false,
      required: true,
      helpText: 'For tying into existing concrete slabs',
    },
    {
      id: 'dowel_purpose',
      type: 'select',
      label: 'Dowel Purpose',
      options: [
        { value: 'tie_in', label: 'Tying into existing slab' },
        { value: 'load_transfer', label: 'Load transfer at construction joints' },
      ],
      defaultValue: 'tie_in',
      showIf: (answers) => answers.dowels_required === true,
    },
    {
      id: 'dowel_size',
      type: 'select',
      label: 'Dowel Diameter & Length',
      options: [
        { value: 'R12-300 GAL', label: 'R12 × 300mm Galvanised' },
        { value: 'R12-450 GAL', label: 'R12 × 450mm Galvanised' },
        { value: 'R16-300 GAL', label: 'R16 × 300mm Galvanised' },
        { value: 'R16-450 GAL', label: 'R16 × 450mm Galvanised' },
        { value: 'R20-450 GAL', label: 'R20 × 450mm Galvanised' },
        { value: 'R20-600 GAL', label: 'R20 × 600mm Galvanised' },
        { value: 'R24-450 GAL', label: 'R24 × 450mm Galvanised' },
      ],
      defaultValue: 'R12-300 GAL',
      showIf: (answers) => answers.dowels_required === true,
    },
    {
      id: 'dowel_calculation_method',
      type: 'select',
      label: 'Quantity Method',
      options: [
        { value: 'manual', label: 'Enter number of dowels' },
        { value: 'spacing', label: 'Calculate from length and spacing' },
      ],
      defaultValue: 'manual',
      showIf: (answers) => answers.dowels_required === true,
    },
    {
      id: 'dowel_count',
      type: 'number',
      label: 'Number of Dowels',
      min: 1,
      defaultValue: 10,
      showIf: (answers) => answers.dowels_required === true && answers.dowel_calculation_method === 'manual',
    },
    {
      id: 'connection_length',
      type: 'number',
      label: 'Length of Connection',
      unit: 'm',
      min: 1,
      helpText: 'Linear metres where dowels are needed',
      showIf: (answers) => answers.dowels_required === true && answers.dowel_calculation_method === 'spacing',
    },
    {
      id: 'dowel_spacing',
      type: 'select',
      label: 'Dowel Spacing',
      options: [
        { value: '200', label: '200mm centres' },
        { value: '250', label: '250mm centres' },
        { value: '300', label: '300mm centres' },
        { value: '400', label: '400mm centres' },
        { value: '450', label: '450mm centres' },
        { value: '600', label: '600mm centres' },
      ],
      defaultValue: '300',
      showIf: (answers) => answers.dowels_required === true && answers.dowel_calculation_method === 'spacing',
    },
    {
      id: 'dowel_price_each',
      type: 'currency',
      label: 'Price per Dowel',
      defaultValue: 3.50,
      unit: '/each',
      showIf: (answers) => answers.dowels_required === true,
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const dowelSize = moduleAnswers.dowel_size || 'R12-300 GAL';
        return priceMap?.['dowel']?.[dowelSize];
      },
    },
    {
      id: 'chemical_anchor',
      type: 'boolean',
      label: 'Include chemical anchoring?',
      defaultValue: false,
      helpText: 'Epoxy or chemical anchor system for drilling into existing concrete',
      showIf: (answers) => answers.dowels_required === true,
    },
    {
      id: 'chemical_cartridges',
      type: 'number',
      label: 'Number of Chemical Cartridges',
      min: 1,
      defaultValue: 2,
      helpText: 'Each cartridge typically does 10-20 holes',
      showIf: (answers) => answers.dowels_required === true && answers.chemical_anchor === true,
    },
    {
      id: 'chemical_price',
      type: 'currency',
      label: 'Chemical Anchor Price per Cartridge',
      defaultValue: 45,
      unit: '/each',
      showIf: (answers) => answers.dowels_required === true && answers.chemical_anchor === true,
    },

    // ============ EXPANSION FOAM SECTION ============
    {
      id: 'foam_required',
      type: 'boolean',
      label: 'Is expansion foam required?',
      defaultValue: false,
      required: true,
      helpText: 'Where concrete meets existing structures, walls, or slabs',
    },
    {
      id: 'foam_type',
      type: 'select',
      label: 'Foam Type',
      options: [
        { value: 'sticky_back', label: 'Sticky Back (Self-Adhesive)' },
        { value: 'standard', label: 'Standard (Non-Adhesive)' },
      ],
      defaultValue: 'sticky_back',
      showIf: (answers) => answers.foam_required === true,
    },
    {
      id: 'foam_height',
      type: 'select',
      label: 'Foam Height',
      options: [
        { value: '50', label: '50mm' },
        { value: '75', label: '75mm' },
        { value: '100', label: '100mm' },
        { value: '125', label: '125mm' },
        { value: '150', label: '150mm' },
        { value: '200', label: '200mm' },
        { value: '250', label: '250mm' },
        { value: '300', label: '300mm' },
      ],
      defaultValue: '100',
      showIf: (answers) => answers.foam_required === true,
    },
    {
      id: 'foam_rolls',
      type: 'number',
      label: 'Number of Rolls',
      min: 1,
      defaultValue: 1,
      helpText: 'Each roll = 25 linear metres',
      showIf: (answers) => answers.foam_required === true,
    },
    {
      id: 'foam_roll_price',
      type: 'currency',
      label: 'Price per Roll',
      defaultValue: 30.50,
      unit: '/roll',
      helpText: 'Price per 25m roll',
      showIf: (answers) => answers.foam_required === true,
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const foamHeight = moduleAnswers.foam_height || '100';
        const foamType = moduleAnswers.foam_type || 'sticky_back';
        let priceListKey = '';
        if (foamType === 'sticky_back') {
          priceListKey = `EJA10${foamHeight}SB`;
        } else {
          priceListKey = `EJ10${foamHeight}`;
        }
        return priceMap?.['joint_foam']?.[priceListKey];
      },
    },
    {
      id: 'foam_coverage_display',
      type: 'text',
      label: 'Total Coverage',
      derivedReadOnly: true,
      deriveFrom: (_scopeData, moduleAnswers) => {
        const rolls = Number(moduleAnswers.foam_rolls) || 1;
        const totalMetres = rolls * 25;
        return `${totalMetres}m`;
      },
      showIf: (answers) => answers.foam_required === true,
    },

    // ============ EXPANSION JOINTS SECTION ============
    // Note: expansion_joints array is handled by custom component MultiExpansionJointInput
    // The questions below are just for UI structure - actual data is in answers.expansion_joints
    {
      id: 'expansion_joints_required',
      type: 'boolean',
      label: 'Are expansion joints required?',
      defaultValue: false,
      required: true,
      helpText: 'For movement joints in large slabs - supports multiple depths for varying slab thicknesses',
    },
    // The expansion_joints array will contain ExpansionJointConfig objects
    // This is handled by custom rendering in ModuleSection.tsx
  ],

  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    // ============ DOWELS CALCULATION ============
    if (answers.dowels_required) {
      // Calculate number of dowels
      let dowelCount: number;
      if (answers.dowel_calculation_method === 'spacing') {
        const connectionLength = Number(answers.connection_length) || 10;
        const spacingMM = Number(answers.dowel_spacing) || 300;
        const spacingM = spacingMM / 1000;
        dowelCount = Math.ceil(connectionLength / spacingM) + 1;
      } else {
        dowelCount = Number(answers.dowel_count) || 10;
      }

      const dowelSize = answers.dowel_size || 'R12-300 GAL';
      const pricePerDowel = Number(answers.dowel_price_each) || getPrice(priceMap, 'dowel', dowelSize, 3.50);
      const dowelCost = dowelCount * pricePerDowel;

      const sizeLabels: Record<string, string> = {
        'R12-300 GAL': 'R12 × 300mm Galv',
        'R12-450 GAL': 'R12 × 450mm Galv',
        'R16-300 GAL': 'R16 × 300mm Galv',
        'R16-450 GAL': 'R16 × 450mm Galv',
        'R20-450 GAL': 'R20 × 450mm Galv',
        'R20-600 GAL': 'R20 × 600mm Galv',
        'R24-450 GAL': 'R24 × 450mm Galv',
      };

      lineItems.push({
        id: 'dowel_bars',
        description: `Dowel Bars ${sizeLabels[dowelSize] || dowelSize} (${dowelCount} pcs)`,
        quantity: dowelCount,
        unit: 'pcs',
        unitPrice: pricePerDowel,
        total: Math.round(dowelCost * 100) / 100,
        category: 'materials',
      });
      subtotal += dowelCost;

      // Chemical anchoring
      if (answers.chemical_anchor) {
        const cartridges = Number(answers.chemical_cartridges) || 2;
        const chemicalPrice = Number(answers.chemical_price) || 45;
        const chemicalCost = cartridges * chemicalPrice;

        lineItems.push({
          id: 'chemical_anchor',
          description: `Chemical Anchor Cartridges (${cartridges} pcs)`,
          quantity: cartridges,
          unit: 'pcs',
          unitPrice: chemicalPrice,
          total: Math.round(chemicalCost * 100) / 100,
          category: 'materials',
        });
        subtotal += chemicalCost;
      }
    }

    // ============ EXPANSION FOAM CALCULATION ============
    if (answers.foam_required) {
      const foamRolls = Number(answers.foam_rolls) || 1;
      const foamHeight = answers.foam_height || '100';
      const foamType = answers.foam_type || 'sticky_back';
      const totalCoverage = foamRolls * 25; // 25m per roll

      let priceListKey = '';
      if (foamType === 'sticky_back') {
        priceListKey = `EJA10${foamHeight}SB`;
      } else {
        priceListKey = `EJ10${foamHeight}`;
      }

      const pricePerRoll = Number(answers.foam_roll_price) || getPrice(priceMap, 'joint_foam', priceListKey, 30.50);
      const foamCost = foamRolls * pricePerRoll;

      const typeLabel = foamType === 'sticky_back' ? 'Sticky Back' : 'Standard';
      const rollLabel = foamRolls === 1 ? '1 roll' : `${foamRolls} rolls`;

      lineItems.push({
        id: 'expansion_foam',
        description: `Expansion Foam ${foamHeight}mm × 10mm ${typeLabel} (${rollLabel} × 25m = ${totalCoverage}m)`,
        quantity: foamRolls,
        unit: 'rolls',
        unitPrice: pricePerRoll,
        total: Math.round(foamCost * 100) / 100,
        category: 'materials',
      });
      subtotal += foamCost;
    }

    // ============ EXPANSION JOINTS CALCULATION ============
    if (answers.expansion_joints_required) {
      const expansionJoints: ExpansionJointConfig[] = answers.expansion_joints || [];
      
      const cappingLabels: Record<string, string> = {
        'EXJ CAP B': 'Black',
        'EXJ CAP G': 'Grey',
        'EXJ CAP RBM': 'Removable',
      };

      expansionJoints.forEach((joint, index) => {
        const jointDepth = joint.depth || '100';
        const jointLengthMM = joint.length || '3000';
        const jointQty = Number(joint.quantity) || 5;

        const priceListKey = `EXJ${jointDepth}${jointLengthMM === '3000' ? '30' : '60'}`;
        const pricePerJoint = Number(joint.price_each) || getPrice(priceMap, 'joints_expansion', priceListKey, 35);
        const jointCost = jointQty * pricePerJoint;

        const jointLabel = joint.name || `${jointDepth}mm`;
        
        lineItems.push({
          id: `expansion_joints_${index}`,
          description: `Expansion Joints ${jointLabel} × ${Number(jointLengthMM) / 1000}m (${jointQty} pcs)`,
          quantity: jointQty,
          unit: 'pcs',
          unitPrice: pricePerJoint,
          total: Math.round(jointCost * 100) / 100,
          category: 'materials',
        });
        subtotal += jointCost;

        // Capping mould for this joint configuration
        if (joint.capping_required) {
          const cappingType = joint.capping_type || 'EXJ CAP B';
          const cappingLength = jointQty * (Number(jointLengthMM) / 1000);
          const pricePerM = Number(joint.capping_price_per_m) || getPrice(priceMap, 'joints_expansion', cappingType, 4.50);
          const cappingCost = cappingLength * pricePerM;

          lineItems.push({
            id: `joint_capping_${index}`,
            description: `Joint Capping Mould ${cappingLabels[cappingType] || ''} for ${jointLabel} (${cappingLength}m)`,
            quantity: cappingLength,
            unit: 'm',
            unitPrice: pricePerM,
            total: Math.round(cappingCost * 100) / 100,
            category: 'materials',
          });
          subtotal += cappingCost;
        }
      });
    }

    return {
      moduleId: 'connections-joints',
      moduleName: 'Connections & Joints',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (answers): ExclusionItem[] => {
    const exclusions: ExclusionItem[] = [];

    if (!answers.dowels_required) {
      exclusions.push({
        id: 'no_dowels',
        text: 'Dowel bars for connection to existing concrete are not included.',
        moduleId: 'connections-joints',
      });
    }

    if (answers.dowels_required && !answers.chemical_anchor) {
      exclusions.push({
        id: 'no_chemical_anchor',
        text: 'Chemical anchoring for dowels is not included - dowels to be cast in.',
        moduleId: 'connections-joints',
      });
    }

    if (!answers.foam_required) {
      exclusions.push({
        id: 'no_expansion_foam',
        text: 'Expansion foam/compressible filler at abutments is not included.',
        moduleId: 'connections-joints',
      });
    }

    if (!answers.expansion_joints_required) {
      exclusions.push({
        id: 'no_expansion_joints',
        text: 'Expansion joints are not included in this quote.',
        moduleId: 'connections-joints',
      });
    }

    return exclusions;
  },

  validate: (answers) => {
    const errors: string[] = [];

    if (answers.dowels_required) {
      if (answers.dowel_calculation_method === 'spacing') {
        if (!answers.connection_length || answers.connection_length < 1) {
          errors.push('Please specify the connection length for dowels');
        }
      } else {
        if (!answers.dowel_count || answers.dowel_count < 1) {
          errors.push('Please specify the number of dowels');
        }
      }
    }

    if (answers.foam_required) {
      if (!answers.foam_length || answers.foam_length < 1) {
        errors.push('Please specify the length of expansion foam required');
      }
    }

    if (answers.expansion_joints_required) {
      const joints: ExpansionJointConfig[] = answers.expansion_joints || [];
      if (joints.length === 0) {
        errors.push('Please add at least one expansion joint configuration');
      } else {
        joints.forEach((joint, i) => {
          if (!joint.quantity || joint.quantity < 1) {
            errors.push(`Joint ${i + 1}: Please specify the quantity`);
          }
        });
      }
    }

    return { valid: errors.length === 0, errors };
  },
};
