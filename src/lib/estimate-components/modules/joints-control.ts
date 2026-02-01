import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap, ControlJointConfig } from '../types';
import { getPrice } from '../types';

export const jointsControlModule: EstimateModule = {
  id: 'joints-control',
  name: 'Control Joints',
  description: 'Saw cutting and caulking for control joints',
  icon: 'Scissors',

  questions: [
    {
      id: 'saw_cutting_required',
      type: 'boolean',
      label: 'Is saw cutting required?',
      defaultValue: false,
      required: true,
      helpText: 'Cut control joints after concrete has cured',
    },
    // Note: Individual control joint configs are managed by MultiControlJointInput component
    // stored in answers.control_joints as ControlJointConfig[]
  ],

  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    // If saw cutting not required, return empty
    if (!answers.saw_cutting_required) {
      return {
        moduleId: 'joints-control',
        moduleName: 'Control Joints',
        lineItems,
        subtotal: 0,
        exclusions: [],
      };
    }

    // Get control joints from multi-row input
    const controlJoints: ControlJointConfig[] = answers.control_joints || [];

    controlJoints.forEach((joint, index) => {
      const length = joint.total_length_m || 0;
      const jointLabel = joint.name || `Control Joint ${index + 1}`;

      // Saw cutting cost
      if (joint.pricing_method === 'per_metre') {
        const pricePerM = joint.price_per_m ?? getPrice(priceMap, 'joint_saw_cutting', 'JOINTCUT', 4.50);
        const sawCost = length * pricePerM;

        if (length > 0) {
          lineItems.push({
            id: `saw_cutting_${joint.id}`,
            description: `Saw Cutting - ${jointLabel} (${length}m)`,
            quantity: length,
            unit: 'm',
            unitPrice: pricePerM,
            total: Math.round(sawCost * 100) / 100,
            category: 'labour',
          });
          subtotal += sawCost;
        }
      } else {
        // Hourly pricing
        const hours = joint.hours ?? 4;
        const hourlyRate = joint.hourly_rate ?? getPrice(priceMap, 'joint_saw_cutting', 'JOINTCUT HR', 75);
        const sawCost = hours * hourlyRate;

        if (hours > 0) {
          lineItems.push({
            id: `saw_cutting_${joint.id}`,
            description: `Saw Cutting - ${jointLabel} (${hours} hrs)`,
            quantity: hours,
            unit: 'hrs',
            unitPrice: hourlyRate,
            total: Math.round(sawCost * 100) / 100,
            category: 'labour',
          });
          subtotal += sawCost;
        }
      }

      // Caulking cost (if enabled for this joint)
      if (joint.caulking_required && length > 0) {
        const caulkingPricePerM = joint.caulking_price_per_m ?? getPrice(priceMap, 'joint_saw_cutting', 'CAULKING', 8);
        const caulkCost = length * caulkingPricePerM;

        lineItems.push({
          id: `caulking_${joint.id}`,
          description: `Joint Caulking - ${jointLabel} (${length}m)`,
          quantity: length,
          unit: 'm',
          unitPrice: caulkingPricePerM,
          total: Math.round(caulkCost * 100) / 100,
          category: 'labour',
        });
        subtotal += caulkCost;
      }
    });

    return {
      moduleId: 'joints-control',
      moduleName: 'Control Joints',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (answers): ExclusionItem[] => {
    const exclusions: ExclusionItem[] = [];
    
    if (!answers.saw_cutting_required) {
      exclusions.push({
        id: 'no_saw_cutting',
        text: 'Saw cutting of control joints is not included.',
        moduleId: 'joints-control',
      });
    }

    // Check if ANY joint has caulking enabled
    const controlJoints: ControlJointConfig[] = answers.control_joints || [];
    const anyCaulking = controlJoints.some(j => j.caulking_required);
    
    if (answers.saw_cutting_required && !anyCaulking) {
      exclusions.push({
        id: 'no_caulking',
        text: 'Caulking/sealing of joints is not included.',
        moduleId: 'joints-control',
      });
    }

    return exclusions;
  },

  validate: (answers) => {
    const errors: string[] = [];

    if (answers.saw_cutting_required) {
      const controlJoints: ControlJointConfig[] = answers.control_joints || [];
      
      if (controlJoints.length === 0) {
        errors.push('Please add at least one control joint configuration');
      }

      controlJoints.forEach((joint, index) => {
        if (joint.pricing_method === 'per_metre' && (!joint.total_length_m || joint.total_length_m < 0.1)) {
          errors.push(`Control Joint ${index + 1}: Please specify the total saw cut length`);
        }
        if (joint.pricing_method === 'hourly' && (!joint.hours || joint.hours < 0.5)) {
          errors.push(`Control Joint ${index + 1}: Please specify the number of hours`);
        }
      });
    }

    return { valid: errors.length === 0, errors };
  },
};
