// Architectural Finishing Module - premium finishes for architectural concrete
import { EstimateModule, ComponentCost, CostLineItem, ExclusionItem, PriceMap, getPrice } from '../types';

export const architecturalFinishingModule: EstimateModule = {
  id: 'architectural-finishing',
  name: 'Premium Finishing',
  description: 'Premium finishing options for architectural concrete including honing, polishing, and specialty textures',
  questions: [
    // Section 1: Premium Finish Required?
    {
      id: 'premium_finish_required',
      type: 'boolean',
      label: 'Is a premium finish required?',
      required: true,
      defaultValue: true,
    },
    // Section 2: Finish Type Selection
    {
      id: 'finish_type',
      type: 'select',
      label: 'Select Premium Finish Type',
      required: true,
      showIf: (answers) => answers.premium_finish_required === true,
      options: [
        { value: 'honed', label: 'Honed (light grind)' },
        { value: 'polished', label: 'Polished (high-shine)' },
        { value: 'board_form', label: 'Board-form texture (timber grain imprint)' },
        { value: 'gfrc', label: 'GFRC (Glass Fiber Reinforced Concrete)' },
        { value: 'exposed_agg', label: 'Exposed aggregate' },
        { value: 'smooth_steel', label: 'Smooth steel trowel' },
        { value: 'custom', label: 'Custom / other' },
      ],
    },
    // Section 3: Total Surface Area
    {
      id: 'finish_area',
      type: 'number',
      label: 'Total Surface Area to Finish (m²)',
      required: true,
      min: 0.1,
      unit: 'm²',
      showIf: (answers) => answers.premium_finish_required === true,
      deriveFrom: (scopeData) => scopeData?.totalSurfaceArea || 2,
    },
    // Honed / Polished specific questions
    {
      id: 'grit_level',
      type: 'select',
      label: 'Grit Level (Final)',
      required: true,
      showIf: (answers) => answers.premium_finish_required === true && (answers.finish_type === 'honed' || answers.finish_type === 'polished'),
      options: [
        { value: '200', label: '200 grit (matte hone)' },
        { value: '400', label: '400 grit (satin hone)' },
        { value: '800', label: '800 grit (light polish)' },
        { value: '1500', label: '1500 grit (medium polish)' },
        { value: '3000', label: '3000 grit (mirror polish)' },
      ],
    },
    {
      id: 'number_of_passes',
      type: 'number',
      label: 'Number of Grinding Passes',
      required: true,
      min: 1,
      defaultValue: 3,
      showIf: (answers) => answers.premium_finish_required === true && (answers.finish_type === 'honed' || answers.finish_type === 'polished'),
    },
    {
      id: 'edge_profile',
      type: 'select',
      label: 'Edge Profile',
      required: true,
      showIf: (answers) => answers.premium_finish_required === true && (answers.finish_type === 'honed' || answers.finish_type === 'polished'),
      options: [
        { value: 'square', label: 'Square edge' },
        { value: 'bullnose', label: 'Bullnose (rounded)' },
        { value: 'chamfered', label: 'Chamfered (45°)' },
        { value: 'custom', label: 'Custom profile' },
      ],
    },
    // Board-form specific questions
    {
      id: 'timber_type',
      type: 'select',
      label: 'Timber Type for Board-Form',
      required: true,
      showIf: (answers) => answers.premium_finish_required === true && answers.finish_type === 'board_form',
      options: [
        { value: 'pine', label: 'Pine (light grain)' },
        { value: 'hardwood', label: 'Hardwood (pronounced grain)' },
        { value: 'custom', label: 'Custom timber selection' },
      ],
    },
    {
      id: 'grain_direction',
      type: 'select',
      label: 'Grain Direction',
      required: true,
      showIf: (answers) => answers.premium_finish_required === true && answers.finish_type === 'board_form',
      options: [
        { value: 'horizontal', label: 'Horizontal' },
        { value: 'vertical', label: 'Vertical' },
        { value: 'diagonal', label: 'Diagonal' },
        { value: 'mixed', label: 'Mixed / Pattern' },
      ],
    },
    {
      id: 'release_agent_included',
      type: 'boolean',
      label: 'Release agent included?',
      required: true,
      defaultValue: true,
      showIf: (answers) => answers.premium_finish_required === true && answers.finish_type === 'board_form',
    },
    // GFRC specific questions
    {
      id: 'gfrc_fiber_level',
      type: 'select',
      label: 'Glass Fiber Content Level',
      required: true,
      showIf: (answers) => answers.premium_finish_required === true && answers.finish_type === 'gfrc',
      options: [
        { value: 'standard', label: 'Standard (3-4%)' },
        { value: 'high', label: 'High strength (5-6%)' },
        { value: 'ultra', label: 'Ultra high (7%+)' },
      ],
    },
    {
      id: 'backing_mix_required',
      type: 'boolean',
      label: 'Backing mix required?',
      required: true,
      defaultValue: true,
      showIf: (answers) => answers.premium_finish_required === true && answers.finish_type === 'gfrc',
    },
    {
      id: 'mold_fabrication_included',
      type: 'boolean',
      label: 'Mold fabrication included in finishing?',
      required: true,
      defaultValue: false,
      showIf: (answers) => answers.premium_finish_required === true && answers.finish_type === 'gfrc',
    },
    // Color / Pigment (for all except smooth_steel)
    {
      id: 'integral_color_required',
      type: 'boolean',
      label: 'Integral color/pigment required?',
      required: true,
      defaultValue: false,
      showIf: (answers) => answers.premium_finish_required === true && answers.finish_type !== 'smooth_steel',
    },
    {
      id: 'color_type',
      type: 'select',
      label: 'Color Type',
      required: true,
      showIf: (answers) => answers.premium_finish_required === true && answers.integral_color_required === true,
      options: [
        { value: 'oxide', label: 'Iron oxide (standard)' },
        { value: 'liquid', label: 'Liquid pigment' },
        { value: 'custom_match', label: 'Custom color match' },
      ],
    },
    {
      id: 'pigment_kg',
      type: 'number',
      label: 'Pigment Quantity (kg)',
      required: true,
      min: 0.5,
      defaultValue: 2,
      unit: 'kg',
      showIf: (answers) => answers.premium_finish_required === true && answers.integral_color_required === true,
    },
    // Sealing section
    {
      id: 'sealing_required',
      type: 'boolean',
      label: 'Is sealing required?',
      required: true,
      defaultValue: true,
      showIf: (answers) => answers.premium_finish_required === true,
    },
    {
      id: 'sealer_type',
      type: 'select',
      label: 'Sealer Type',
      required: true,
      showIf: (answers) => answers.premium_finish_required === true && answers.sealing_required === true,
      options: [
        { value: 'food_safe', label: 'Food-safe (for benchtops)' },
        { value: 'penetrating', label: 'Penetrating sealer' },
        { value: 'high_gloss', label: 'High-gloss topcoat' },
        { value: 'matte', label: 'Matte finish' },
        { value: 'wet_look', label: 'Wet-look sealer' },
      ],
    },
    {
      id: 'sealer_coats',
      type: 'number',
      label: 'Number of Sealer Coats',
      required: true,
      min: 1,
      defaultValue: 2,
      showIf: (answers) => answers.premium_finish_required === true && answers.sealing_required === true,
    },
    {
      id: 'maintenance_sealer_included',
      type: 'boolean',
      label: 'Maintenance sealer kit included?',
      required: true,
      defaultValue: false,
      showIf: (answers) => answers.premium_finish_required === true && answers.sealing_required === true,
    },
    // Labour section
    {
      id: 'finishing_specialists',
      type: 'number',
      label: 'Finishing Specialists Required',
      required: true,
      min: 1,
      defaultValue: 1,
      showIf: (answers) => answers.premium_finish_required === true,
    },
    {
      id: 'specialist_hours',
      type: 'number',
      label: 'Hours per Specialist',
      required: true,
      min: 1,
      defaultValue: 8,
      showIf: (answers) => answers.premium_finish_required === true,
    },
    {
      id: 'equipment_hire_required',
      type: 'boolean',
      label: 'Polishing/grinding equipment hire required?',
      required: true,
      defaultValue: true,
      showIf: (answers) => answers.premium_finish_required === true && (answers.finish_type === 'honed' || answers.finish_type === 'polished'),
    },
    {
      id: 'equipment_hire_days',
      type: 'number',
      label: 'Equipment Hire Days',
      required: true,
      min: 1,
      defaultValue: 1,
      showIf: (answers) => answers.premium_finish_required === true && answers.equipment_hire_required === true,
    },
  ],

  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;

    if (!answers.premium_finish_required) {
      return { 
        moduleId: 'architectural-finishing',
        moduleName: 'Premium Finishing',
        lineItems: [], 
        subtotal: 0, 
        exclusions: [] 
      };
    }

    const finishArea = Number(answers.finish_area) || 1;
    const finishType = answers.finish_type as string;
    const labourRate = getPrice(priceMap, 'labour', 'LABOUR HR', 75);
    
    // Specialist labour
    const specialists = Number(answers.finishing_specialists) || 1;
    const specialistHours = Number(answers.specialist_hours) || 8;
    const totalLabourHours = specialists * specialistHours;
    
    // Premium specialist rate (1.5x standard)
    const specialistRate = labourRate * 1.5;
    const labourCost = totalLabourHours * specialistRate;
    
    lineItems.push({
      id: 'arch-finish-labour',
      description: `Finishing specialist labour (${specialists} × ${specialistHours}h)`,
      quantity: totalLabourHours,
      unit: 'hours',
      unitPrice: specialistRate,
      total: labourCost,
      category: 'labour',
    });
    subtotal += labourCost;

    // Finish-specific costs
    switch (finishType) {
      case 'honed':
        const honedRate = getPrice(priceMap, 'finishing', 'HONED_GRIND', 85);
        const honedCost = finishArea * honedRate;
        lineItems.push({
          id: 'arch-finish-honed',
          description: `Honed finish - ${answers.grit_level} grit (${answers.number_of_passes} passes)`,
          quantity: finishArea,
          unit: 'm²',
          unitPrice: honedRate,
          total: honedCost,
          category: 'subcontractor',
        });
        subtotal += honedCost;
        break;
        
      case 'polished':
        const polishedRate = getPrice(priceMap, 'finishing', 'POLISHED_GRIND', 150);
        const gritMultiplier = { '200': 0.6, '400': 0.75, '800': 1.0, '1500': 1.25, '3000': 1.5 }[answers.grit_level as string] || 1.0;
        const polishedCost = finishArea * polishedRate * gritMultiplier;
        lineItems.push({
          id: 'arch-finish-polished',
          description: `Polished finish - ${answers.grit_level} grit (${answers.number_of_passes} passes)`,
          quantity: finishArea,
          unit: 'm²',
          unitPrice: polishedRate * gritMultiplier,
          total: polishedCost,
          category: 'subcontractor',
        });
        subtotal += polishedCost;
        break;
        
      case 'board_form':
        const boardFormRate = getPrice(priceMap, 'finishing', 'BOARD_FORM_LINER', 45);
        const boardFormCost = finishArea * boardFormRate;
        lineItems.push({
          id: 'arch-finish-boardform',
          description: `Board-form texture - ${answers.timber_type} (${answers.grain_direction})`,
          quantity: finishArea,
          unit: 'm²',
          unitPrice: boardFormRate,
          total: boardFormCost,
          category: 'materials',
        });
        subtotal += boardFormCost;
        
        if (answers.release_agent_included) {
          const releaseAgentCost = finishArea * 8; // $8/m²
          lineItems.push({
            id: 'arch-finish-release',
            description: 'Release agent',
            quantity: finishArea,
            unit: 'm²',
            unitPrice: 8,
            total: releaseAgentCost,
            category: 'materials',
          });
          subtotal += releaseAgentCost;
        }
        break;
        
      case 'gfrc':
        const fiberRate = getPrice(priceMap, 'materials', 'GFRC_FIBER', 35);
        const fiberLevel = { standard: 1.0, high: 1.4, ultra: 1.8 }[answers.gfrc_fiber_level as string] || 1.0;
        // Approximate 2kg fiber per m² of finished surface
        const fiberKg = finishArea * 2 * fiberLevel;
        const fiberCost = fiberKg * fiberRate;
        lineItems.push({
          id: 'arch-finish-gfrc-fiber',
          description: `GFRC glass fiber - ${answers.gfrc_fiber_level} strength`,
          quantity: fiberKg,
          unit: 'kg',
          unitPrice: fiberRate,
          total: fiberCost,
          category: 'materials',
        });
        subtotal += fiberCost;
        
        if (answers.backing_mix_required) {
          const backingCost = finishArea * 45; // $45/m²
          lineItems.push({
            id: 'arch-finish-gfrc-backing',
            description: 'GFRC backing mix',
            quantity: finishArea,
            unit: 'm²',
            unitPrice: 45,
            total: backingCost,
            category: 'materials',
          });
          subtotal += backingCost;
        }
        break;
        
      case 'exposed_agg':
        const exposedRate = 65;
        const exposedCost = finishArea * exposedRate;
        lineItems.push({
          id: 'arch-finish-exposed',
          description: 'Exposed aggregate finish',
          quantity: finishArea,
          unit: 'm²',
          unitPrice: exposedRate,
          total: exposedCost,
          category: 'subcontractor',
        });
        subtotal += exposedCost;
        break;
        
      case 'smooth_steel':
        const smoothRate = 35;
        const smoothCost = finishArea * smoothRate;
        lineItems.push({
          id: 'arch-finish-smooth',
          description: 'Smooth steel trowel finish',
          quantity: finishArea,
          unit: 'm²',
          unitPrice: smoothRate,
          total: smoothCost,
          category: 'labour',
        });
        subtotal += smoothCost;
        break;
    }

    // Edge profile for honed/polished
    if ((finishType === 'honed' || finishType === 'polished') && answers.edge_profile) {
      const edgeProfileCosts: Record<string, number> = {
        square: 25,
        bullnose: 65,
        chamfered: 45,
        custom: 95,
      };
      const edgeCostPerM = edgeProfileCosts[answers.edge_profile as string] || 45;
      // Estimate 2m of edge per m² of surface for benchtops/tables
      const edgeLength = finishArea * 2;
      const edgeCost = edgeLength * edgeCostPerM;
      lineItems.push({
        id: 'arch-finish-edge',
        description: `Edge profile - ${(answers.edge_profile as string)?.replace('_', ' ')}`,
        quantity: edgeLength,
        unit: 'lm',
        unitPrice: edgeCostPerM,
        total: edgeCost,
        category: 'labour',
      });
      subtotal += edgeCost;
    }

    // Integral color/pigment
    if (answers.integral_color_required) {
      const pigmentRate = getPrice(priceMap, 'materials', 'OXIDE_PIGMENT', 25);
      const pigmentKg = Number(answers.pigment_kg) || 2;
      const colorMultiplier = { oxide: 1.0, liquid: 1.5, custom_match: 3.0 }[answers.color_type as string] || 1.0;
      const pigmentCost = pigmentKg * pigmentRate * colorMultiplier;
      lineItems.push({
        id: 'arch-finish-pigment',
        description: `Integral color - ${(answers.color_type as string)?.replace('_', ' ')}`,
        quantity: pigmentKg,
        unit: 'kg',
        unitPrice: pigmentRate * colorMultiplier,
        total: pigmentCost,
        category: 'materials',
      });
      subtotal += pigmentCost;
    }

    // Sealing
    if (answers.sealing_required) {
      const sealerType = answers.sealer_type as string;
      const sealerCoats = Number(answers.sealer_coats) || 2;
      
      const sealerRates: Record<string, number> = {
        food_safe: 85,
        penetrating: 45,
        high_gloss: 65,
        matte: 55,
        wet_look: 60,
      };
      
      const sealerRate = sealerRates[sealerType] || 55;
      // Coverage approximately 8m²/L, priced per m²
      const sealerCostPerM2 = (sealerRate / 8) * sealerCoats;
      const sealerCost = finishArea * sealerCostPerM2;
      
      lineItems.push({
        id: 'arch-finish-sealer',
        description: `${sealerType?.replace('_', ' ')} sealer (${sealerCoats} coat${sealerCoats > 1 ? 's' : ''})`,
        quantity: finishArea,
        unit: 'm²',
        unitPrice: sealerCostPerM2,
        total: sealerCost,
        category: 'materials',
      });
      subtotal += sealerCost;
      
      if (answers.maintenance_sealer_included) {
        const maintenanceKitCost = 85;
        lineItems.push({
          id: 'arch-finish-maintenance-kit',
          description: 'Maintenance sealer kit',
          quantity: 1,
          unit: 'kit',
          unitPrice: maintenanceKitCost,
          total: maintenanceKitCost,
          category: 'materials',
        });
        subtotal += maintenanceKitCost;
      }
    }

    // Equipment hire
    if (answers.equipment_hire_required && (finishType === 'honed' || finishType === 'polished')) {
      const hireDays = Number(answers.equipment_hire_days) || 1;
      const polisherRate = getPrice(priceMap, 'plant', 'POLISHER_HIRE', 250);
      const grinderRate = getPrice(priceMap, 'plant', 'GRINDER_HIRE', 75);
      
      const polisherCost = hireDays * polisherRate;
      lineItems.push({
        id: 'arch-finish-polisher',
        description: `Polishing machine hire`,
        quantity: hireDays,
        unit: 'days',
        unitPrice: polisherRate,
        total: polisherCost,
        category: 'plant',
      });
      subtotal += polisherCost;
      
      const grinderCost = hireDays * grinderRate;
      lineItems.push({
        id: 'arch-finish-grinder',
        description: `Angle grinder hire`,
        quantity: hireDays,
        unit: 'days',
        unitPrice: grinderRate,
        total: grinderCost,
        category: 'plant',
      });
      subtotal += grinderCost;
    }

    return { 
      moduleId: 'architectural-finishing',
      moduleName: 'Premium Finishing',
      lineItems, 
      subtotal, 
      exclusions: [] 
    };
  },

  getExclusions: (answers): ExclusionItem[] => {
    const exclusions: ExclusionItem[] = [];

    if (!answers.premium_finish_required) {
      exclusions.push({
        id: 'no-premium-finish',
        text: 'Premium finishes, honing, polishing, and specialty textures are excluded',
        moduleId: 'architectural-finishing',
      });
      return exclusions;
    }

    const finishType = answers.finish_type as string;

    if (finishType !== 'honed' && finishType !== 'polished') {
      exclusions.push({
        id: 'no-hone-polish',
        text: 'Honing and polishing finishes are excluded',
        moduleId: 'architectural-finishing',
      });
    }

    if (finishType !== 'gfrc') {
      exclusions.push({
        id: 'no-gfrc',
        text: 'GFRC (Glass Fiber Reinforced Concrete) is excluded',
        moduleId: 'architectural-finishing',
      });
    }

    if (finishType !== 'board_form') {
      exclusions.push({
        id: 'no-boardform',
        text: 'Board-form timber texture finishes are excluded',
        moduleId: 'architectural-finishing',
      });
    }

    if (!answers.integral_color_required) {
      exclusions.push({
        id: 'no-color',
        text: 'Integral color pigmentation is excluded',
        moduleId: 'architectural-finishing',
      });
    }

    if (!answers.sealing_required) {
      exclusions.push({
        id: 'no-sealing',
        text: 'Sealing and protective coatings are excluded',
        moduleId: 'architectural-finishing',
      });
    }

    return exclusions;
  },

  validate: (answers) => {
    const errors: string[] = [];

    if (answers.premium_finish_required) {
      if (!answers.finish_type) {
        errors.push('Premium finish type is required');
      }
      if (!answers.finish_area || Number(answers.finish_area) <= 0) {
        errors.push('Surface area to finish is required');
      }
      if (!answers.finishing_specialists || Number(answers.finishing_specialists) < 1) {
        errors.push('Number of finishing specialists is required');
      }
      
      const finishType = answers.finish_type as string;
      if ((finishType === 'honed' || finishType === 'polished') && !answers.grit_level) {
        errors.push('Grit level is required for honed/polished finishes');
      }
    }

    return { valid: errors.length === 0, errors };
  },
};
