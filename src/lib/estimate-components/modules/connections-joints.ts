import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap, ExpansionJointConfig } from '../types';
import { getPrice } from '../types';

export const connectionsJointsModule: EstimateModule = {
  id: 'connections-joints',
  name: 'Connections & Joints',
  description: 'Expansion joints with optional dowels, expansion foam, and capping',
  icon: 'Link',

  questions: [
    // Master toggle for expansion joints
    // Note: expansion_joints array is handled by custom component MultiExpansionJointInput
    // Each joint entry can have its own dowels and foam configuration
    {
      id: 'expansion_joints_required',
      type: 'boolean',
      label: 'Are expansion joints required?',
      defaultValue: false,
      required: true,
      helpText: 'For movement joints in large slabs - each joint can have its own dowels and expansion foam configuration',
    },
    // The expansion_joints array will contain ExpansionJointConfig objects
    // This is handled by custom rendering in ModuleSection.tsx
  ],

  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    // Only process if expansion joints are required
    if (!answers.expansion_joints_required) {
      return {
        moduleId: 'connections-joints',
        moduleName: 'Connections & Joints',
        lineItems: [],
        subtotal: 0,
        exclusions: [],
      };
    }

    const expansionJoints: ExpansionJointConfig[] = answers.expansion_joints || [];
    
    const cappingLabels: Record<string, string> = {
      'EXJ CAP B': 'Black',
      'EXJ CAP G': 'Grey',
      'EXJ CAP RBM': 'Removable',
    };

    const dowelSizeLabels: Record<string, string> = {
      'R12-300 GAL': 'R12 × 300mm Galv',
      'R12-450 GAL': 'R12 × 450mm Galv',
      'R16-300 GAL': 'R16 × 300mm Galv',
      'R16-450 GAL': 'R16 × 450mm Galv',
      'R20-450 GAL': 'R20 × 450mm Galv',
      'R20-600 GAL': 'R20 × 600mm Galv',
      'R24-450 GAL': 'R24 × 450mm Galv',
    };

    expansionJoints.forEach((joint, index) => {
      const jointDepth = joint.depth || '100';
      const jointLengthMM = joint.length || '3000';
      const jointQty = Number(joint.quantity) || 5;
      const jointLabel = joint.name || `${jointDepth}mm`;

      // ============ EXPANSION JOINT COST ============
      const priceListKey = `EXJ${jointDepth}${jointLengthMM === '3000' ? '30' : '60'}`;
      const pricePerJoint = Number(joint.price_each) || getPrice(priceMap, 'joints_expansion', priceListKey, 35);
      const jointCost = jointQty * pricePerJoint;

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

      // ============ CAPPING COST ============
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

      // ============ DOWELS COST (per joint) ============
      if (joint.dowels_required) {
        // Calculate number of dowels
        let dowelCount: number;
        if (joint.dowel_calculation_method === 'spacing') {
          const connectionLength = Number(joint.connection_length) || 10;
          const spacingMM = Number(joint.dowel_spacing) || 300;
          const spacingM = spacingMM / 1000;
          dowelCount = Math.ceil(connectionLength / spacingM) + 1;
        } else {
          dowelCount = Number(joint.dowel_count) || 10;
        }

        const dowelSize = joint.dowel_size || 'R12-300 GAL';
        const pricePerDowel = Number(joint.dowel_price_each) || getPrice(priceMap, 'dowel', dowelSize, 3.50);
        const dowelCost = dowelCount * pricePerDowel;

        lineItems.push({
          id: `dowels_${index}`,
          description: `Dowel Bars ${dowelSizeLabels[dowelSize] || dowelSize} for ${jointLabel} (${dowelCount} pcs)`,
          quantity: dowelCount,
          unit: 'pcs',
          unitPrice: pricePerDowel,
          total: Math.round(dowelCost * 100) / 100,
          category: 'materials',
        });
        subtotal += dowelCost;

        // Chemical anchoring for this joint
        if (joint.chemical_anchor) {
          const cartridges = Number(joint.chemical_cartridges) || 2;
          const chemicalPrice = Number(joint.chemical_price) || 45;
          const chemicalCost = cartridges * chemicalPrice;

          lineItems.push({
            id: `chemical_anchor_${index}`,
            description: `Chemical Anchor Cartridges for ${jointLabel} (${cartridges} pcs)`,
            quantity: cartridges,
            unit: 'pcs',
            unitPrice: chemicalPrice,
            total: Math.round(chemicalCost * 100) / 100,
            category: 'materials',
          });
          subtotal += chemicalCost;
        }
      }

      // ============ EXPANSION FOAM COST (per joint) ============
      if (joint.foam_required) {
        const foamRolls = Number(joint.foam_rolls) || 1;
        const foamHeight = joint.foam_height || '100';
        const foamType = joint.foam_type || 'sticky_back';
        const totalCoverage = foamRolls * 25; // 25m per roll

        let foamPriceListKey = '';
        if (foamType === 'sticky_back') {
          foamPriceListKey = `EJA10${foamHeight}SB`;
        } else {
          foamPriceListKey = `EJ10${foamHeight}`;
        }

        const pricePerRoll = Number(joint.foam_roll_price) || getPrice(priceMap, 'joint_foam', foamPriceListKey, 30.50);
        const foamCost = foamRolls * pricePerRoll;

        const typeLabel = foamType === 'sticky_back' ? 'Sticky Back' : 'Standard';
        const rollLabel = foamRolls === 1 ? '1 roll' : `${foamRolls} rolls`;

        lineItems.push({
          id: `expansion_foam_${index}`,
          description: `Expansion Foam ${foamHeight}mm × 10mm ${typeLabel} for ${jointLabel} (${rollLabel} × 25m = ${totalCoverage}m)`,
          quantity: foamRolls,
          unit: 'rolls',
          unitPrice: pricePerRoll,
          total: Math.round(foamCost * 100) / 100,
          category: 'materials',
        });
        subtotal += foamCost;
      }
    });

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

    if (!answers.expansion_joints_required) {
      exclusions.push({
        id: 'no_expansion_joints',
        text: 'Expansion joints are not included in this quote.',
        moduleId: 'connections-joints',
      });
      // If no joints at all, also exclude dowels and foam
      exclusions.push({
        id: 'no_dowels',
        text: 'Dowel bars for connection to existing concrete are not included.',
        moduleId: 'connections-joints',
      });
      exclusions.push({
        id: 'no_expansion_foam',
        text: 'Expansion foam/compressible filler at abutments is not included.',
        moduleId: 'connections-joints',
      });
    } else {
      // Check if any joint has dowels/foam/chemical anchor configured
      const joints: ExpansionJointConfig[] = answers.expansion_joints || [];
      
      const anyDowels = joints.some(j => j.dowels_required);
      const anyChemicalAnchor = joints.some(j => j.dowels_required && j.chemical_anchor);
      const anyFoam = joints.some(j => j.foam_required);

      if (!anyDowels) {
        exclusions.push({
          id: 'no_dowels',
          text: 'Dowel bars for connection to existing concrete are not included.',
          moduleId: 'connections-joints',
        });
      } else if (!anyChemicalAnchor) {
        exclusions.push({
          id: 'no_chemical_anchor',
          text: 'Chemical anchoring for dowels is not included - dowels to be cast in.',
          moduleId: 'connections-joints',
        });
      }

      if (!anyFoam) {
        exclusions.push({
          id: 'no_expansion_foam',
          text: 'Expansion foam/compressible filler at abutments is not included.',
          moduleId: 'connections-joints',
        });
      }
    }

    return exclusions;
  },

  validate: (answers) => {
    const errors: string[] = [];

    if (answers.expansion_joints_required) {
      const joints: ExpansionJointConfig[] = answers.expansion_joints || [];
      if (joints.length === 0) {
        errors.push('Please add at least one expansion joint configuration');
      } else {
        joints.forEach((joint, i) => {
          if (!joint.quantity || joint.quantity < 1) {
            errors.push(`Joint ${i + 1}: Please specify the quantity`);
          }
          // Validate dowels if enabled
          if (joint.dowels_required) {
            if (joint.dowel_calculation_method === 'spacing') {
              if (!joint.connection_length || joint.connection_length < 1) {
                errors.push(`Joint ${i + 1}: Please specify the connection length for dowels`);
              }
            } else {
              if (!joint.dowel_count || joint.dowel_count < 1) {
                errors.push(`Joint ${i + 1}: Please specify the number of dowels`);
              }
            }
          }
          // Validate foam if enabled
          if (joint.foam_required) {
            if (!joint.foam_rolls || joint.foam_rolls < 1) {
              errors.push(`Joint ${i + 1}: Please specify the number of foam rolls`);
            }
          }
        });
      }
    }

    return { valid: errors.length === 0, errors };
  },
};