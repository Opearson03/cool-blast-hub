import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap } from '../types';
import { getPrice } from '../types';

// Scopes that primarily need bulk excavation (site cuts)
const BULK_EXCAVATION_SCOPES = ['standard_slab', 'raft_slab', 'waffle_pod', 'driveway', 'crossovers', 'paths_surrounds'];

// Scopes that primarily need detailed excavation (point/linear elements)
const DETAILED_EXCAVATION_SCOPES = ['piers', 'pad_footings', 'strip_footings', 'retaining_wall_footings'];

// Scopes that have "flat bottom" excavation (no below-slab beams) - detailed excavation not applicable
const FLAT_BOTTOM_SCOPES = ['waffle_pod'];

export const excavationModule: EstimateModule = {
  id: 'excavation',
  name: 'Excavation',
  description: 'Bulk site cuts and detailed excavation for beams, pads, piers, and footings',
  icon: 'Shovel',

  questions: [
    // ==================== BULK EXCAVATION SECTION ====================
    {
      id: 'bulk_excavation_required',
      type: 'boolean',
      label: 'Bulk excavation required? (site cuts / level cuts)',
      defaultValue: false,
      helpText: 'For general site preparation and level cuts. Usually done by others.',
      showIf: (_answers, scopeData) => {
        // Only show bulk excavation for slab/driveway scopes
        const scopeId = scopeData?.scopeId;
        return BULK_EXCAVATION_SCOPES.includes(scopeId);
      },
    },
    {
      id: 'bulk_cut_depth',
      type: 'number',
      label: 'Average cut depth (mm)',
      defaultValue: 0,
      min: 0,
      max: 2000,
      unit: 'mm',
      helpText: 'Average depth of site cut',
      showIf: (answers, scopeData) => {
        const scopeId = scopeData?.scopeId;
        return BULK_EXCAVATION_SCOPES.includes(scopeId) && answers.bulk_excavation_required === true;
      },
    },
    {
      id: 'bulk_excavation_area',
      type: 'number',
      label: 'Area to excavate (m²)',
      unit: 'm²',
      min: 0,
      helpText: 'Auto-fills from scope dimensions',
      deriveFrom: (scopeData) => {
        // Return the area value if it exists (even if 0), otherwise undefined to show empty field
        return scopeData.area !== undefined && scopeData.area !== null ? scopeData.area : undefined;
      },
      showIf: (answers, scopeData) => {
        const scopeId = scopeData?.scopeId;
        return BULK_EXCAVATION_SCOPES.includes(scopeId) && answers.bulk_excavation_required === true;
      },
    },
    {
      id: 'bulk_estimated_volume',
      type: 'text',
      label: 'Estimated cut volume',
      derivedReadOnly: true,
      deriveFrom: (_scopeData, moduleAnswers) => {
        const cutDepthM = (Number(moduleAnswers.bulk_cut_depth) || 0) / 1000;
        const area = Number(moduleAnswers.bulk_excavation_area) || 0;
        if (cutDepthM <= 0 || area <= 0) return undefined;
        const volume = area * cutDepthM;
        return `~${volume.toFixed(1)}m³`;
      },
      showIf: (answers, scopeData) => {
        const scopeId = scopeData?.scopeId;
        return BULK_EXCAVATION_SCOPES.includes(scopeId) && 
          answers.bulk_excavation_required === true && 
          Number(answers.bulk_cut_depth) > 0;
      },
    },
    {
      id: 'bulk_machine_type',
      type: 'select',
      label: 'Machine for bulk excavation',
      options: [
        { value: 'EXC 1.4T', label: '1.4T Excavator', priceKey: 'excavation.EXC 1.4T' },
        { value: 'EXC 3.2T', label: '3.2T Excavator', priceKey: 'excavation.EXC 3.2T' },
        { value: 'EXC 4T', label: '4T Excavator', priceKey: 'excavation.EXC 4T' },
        { value: 'EXC 6T', label: '6T Excavator', priceKey: 'excavation.EXC 6T' },
        { value: 'EXC 9T', label: '9T Excavator', priceKey: 'excavation.EXC 9T' },
        { value: 'POSI TRACK', label: 'Posi Track', priceKey: 'excavation.POSI TRACK' },
      ],
      defaultValue: 'EXC 6T',
      showIf: (answers, scopeData) => {
        const scopeId = scopeData?.scopeId;
        return BULK_EXCAVATION_SCOPES.includes(scopeId) && answers.bulk_excavation_required === true;
      },
    },
    {
      id: 'bulk_machine_rate',
      type: 'currency',
      label: 'Machine hourly rate',
      defaultValue: 180,
      unit: '/hr',
      helpText: 'Auto-fills from price list based on machine selected',
      showIf: (answers, scopeData) => {
        const scopeId = scopeData?.scopeId;
        return BULK_EXCAVATION_SCOPES.includes(scopeId) && answers.bulk_excavation_required === true;
      },
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const machineType = moduleAnswers.bulk_machine_type || 'EXC 6T';
        return priceMap['excavation']?.[machineType];
      },
    },
    {
      id: 'bulk_excavation_hours',
      type: 'number',
      label: 'Bulk excavation hours',
      defaultValue: 8,
      min: 0.5,
      step: 0.5,
      unit: 'hrs',
      helpText: 'Expected hours for site cut',
      showIf: (answers, scopeData) => {
        const scopeId = scopeData?.scopeId;
        return BULK_EXCAVATION_SCOPES.includes(scopeId) && answers.bulk_excavation_required === true;
      },
    },
    {
      id: 'bulk_float_charge',
      type: 'currency',
      label: 'Float charge to site',
      defaultValue: 150,
      priceListKey: 'excavation.FLOAT',
      showIf: (answers, scopeData) => {
        const scopeId = scopeData?.scopeId;
        return BULK_EXCAVATION_SCOPES.includes(scopeId) && answers.bulk_excavation_required === true;
      },
    },

    // ==================== DETAILED EXCAVATION SECTION ====================
    {
      id: 'detailed_excavation_required',
      type: 'boolean',
      label: 'Detailed excavation required?',
      defaultValue: false,
      helpText: 'For excavating specific elements like edge beams, pad footings, piers, and strip footings',
      // Hide for waffle pod - beams are inline with slab (flat bottom), no below-slab excavation
      showIf: (_answers, scopeData) => {
        const scopeId = scopeData?.scopeId;
        return !FLAT_BOTTOM_SCOPES.includes(scopeId);
      },
    },
    {
      id: 'detailed_excavation_volume',
      type: 'text',
      label: 'Estimated detailed excavation volume',
      derivedReadOnly: true,
      deriveFrom: (scopeData) => {
        // Use pre-calculated excavation volume from scope
        if (scopeData.excavation_volume && scopeData.excavation_volume > 0) {
          return `~${scopeData.excavation_volume.toFixed(2)}m³`;
        }
        
        // Calculate pier excavation volume from pierGroups (same logic as concrete-supply)
        if (scopeData.pierGroups && Array.isArray(scopeData.pierGroups) && scopeData.pierGroups.length > 0) {
          let pierVolume = 0;
          for (const group of scopeData.pierGroups) {
            const qty = Number(group.quantity) || 0;
            const diameter = Number(group.diameter) / 1000; // mm to m
            const depth = Number(group.depth) / 1000; // mm to m
            const radius = diameter / 2;
            pierVolume += qty * Math.PI * radius * radius * depth;
          }
          if (pierVolume > 0) {
            return `~${pierVolume.toFixed(2)}m³`;
          }
        }
        
        // Fallback to legacy pier fields
        if (scopeData.num_piers && scopeData.diameter && scopeData.depth) {
          const numPiers = Number(scopeData.num_piers);
          const diameter = Number(scopeData.diameter) / 1000; // mm to m
          const depth = Number(scopeData.depth) / 1000; // mm to m
          const radius = diameter / 2;
          const pierVolume = numPiers * Math.PI * radius * radius * depth;
          if (pierVolume > 0) {
            return `~${pierVolume.toFixed(2)}m³`;
          }
        }
        
        // Calculate from linearSections (strip footings, retaining wall footings)
        const linearSections = scopeData.linearSections || scopeData.footings || [];
        if (Array.isArray(linearSections) && linearSections.length > 0) {
          let volume = 0;
          for (const section of linearSections) {
            const length = Number(section._actualLength || section.length) || 0;
            const widthM = (Number(section.dimension1 || section.width) || 0) / 1000;
            const depthM = (Number(section.dimension2 || section.depth) || 0) / 1000;
            volume += length * widthM * depthM;
            
            // Add toe volume if present (per-section, e.g. retaining_wall_footings)
            if (section.has_toe) {
              const toeWidthM = (Number(section.toe_width) || 0) / 1000;
              const toeDepthM = (Number(section.toe_depth) || 0) / 1000;
              volume += length * toeWidthM * toeDepthM;
            }
          }
          
          // Add toe volume for retaining_walls scope (global toe_length)
          if (scopeData.scopeId === 'retaining_walls' && scopeData.include_footing) {
            const toeLengthM = (Number(scopeData.toe_length) || 0) / 1000;
            if (toeLengthM > 0) {
              const footingDepthM = (Number(scopeData.footing_depth) || 300) / 1000;
              const rwFootings = scopeData.footings || [];
              const totalLen = Array.isArray(rwFootings) && rwFootings.length > 0
                ? rwFootings.reduce((s: number, f: any) => s + (Number(f.length) || 0), 0)
                : Number(scopeData.total_length) || 0;
              volume += totalLen * toeLengthM * footingDepthM;
            }
          }
          
          if (volume > 0) {
            return `~${volume.toFixed(2)}m³`;
          }
        }
        
        // Calculate from padGroups (pad footings)
        if (scopeData.padGroups && Array.isArray(scopeData.padGroups) && scopeData.padGroups.length > 0) {
          let padVolume = 0;
          for (const group of scopeData.padGroups) {
            const qty = Number(group.quantity) || 1;
            const lengthM = (Number(group.length) || 0) / 1000;
            const widthM = (Number(group.width) || 0) / 1000;
            const depthM = (Number(group.depth) || 0) / 1000;
            padVolume += qty * lengthM * widthM * depthM;
          }
          if (padVolume > 0) {
            return `~${padVolume.toFixed(2)}m³`;
          }
        }
        
        return undefined;
      },
      showIf: (answers, scopeData) => {
        if (answers.detailed_excavation_required !== true) return false;
        
        // Show if we have excavation_volume
        if (scopeData.excavation_volume && scopeData.excavation_volume > 0) return true;
        
        // Show if we have pier groups
        if (scopeData.pierGroups && Array.isArray(scopeData.pierGroups) && scopeData.pierGroups.length > 0) {
          return scopeData.pierGroups.some((g: any) => Number(g.quantity) > 0);
        }
        
        // Show if we have legacy pier data
        if (scopeData.num_piers && scopeData.diameter && scopeData.depth) return true;
        
        // Show if we have linear sections (strip/retaining wall footings)
        const linearSections = scopeData.linearSections || scopeData.footings || [];
        if (Array.isArray(linearSections) && linearSections.length > 0) {
          return linearSections.some((s: any) => {
            const length = Number(s._actualLength || s.length) || 0;
            return length > 0;
          });
        }
        
        // Show if we have pad groups
        if (scopeData.padGroups && Array.isArray(scopeData.padGroups) && scopeData.padGroups.length > 0) {
          return scopeData.padGroups.some((g: any) => Number(g.quantity) > 0);
        }
        
        return false;
      },
    },
    // Pricing method toggle for detailed excavation
    {
      id: 'detailed_pricing_method',
      type: 'select',
      label: 'Pricing method',
      options: [
        { value: 'hourly', label: 'Hourly Rate' },
        { value: 'm3', label: 'm³ Rate' },
      ],
      defaultValue: 'hourly',
      showIf: (answers) => answers.detailed_excavation_required === true,
    },
    // m³ rate field (shown when m³ pricing method selected)
    {
      id: 'detailed_m3_rate',
      type: 'currency',
      label: 'Excavation rate per m³',
      defaultValue: 60,
      priceListKey: 'excavation.EXC_M3',
      unit: '/m³',
      showIf: (answers) => 
        answers.detailed_excavation_required === true && 
        answers.detailed_pricing_method === 'm3',
    },
    // Hourly rate fields (shown when hourly pricing method selected - default)
    {
      id: 'detailed_machine_type',
      type: 'select',
      label: 'Machine for detailed excavation',
      options: [
        { value: 'EXC 1.4T', label: '1.4T Excavator', priceKey: 'excavation.EXC 1.4T' },
        { value: 'EXC 3.2T', label: '3.2T Excavator', priceKey: 'excavation.EXC 3.2T' },
        { value: 'EXC 4T', label: '4T Excavator', priceKey: 'excavation.EXC 4T' },
        { value: 'EXC 6T', label: '6T Excavator', priceKey: 'excavation.EXC 6T' },
        { value: 'EXC 9T', label: '9T Excavator', priceKey: 'excavation.EXC 9T' },
        { value: 'POSI TRACK', label: 'Posi Track', priceKey: 'excavation.POSI TRACK' },
      ],
      defaultValue: 'EXC 3.2T',
      showIf: (answers) => 
        answers.detailed_excavation_required === true && 
        answers.detailed_pricing_method !== 'm3',
    },
    {
      id: 'detailed_machine_rate',
      type: 'currency',
      label: 'Machine hourly rate',
      defaultValue: 150,
      unit: '/hr',
      helpText: 'Auto-fills from price list based on machine selected',
      showIf: (answers) => 
        answers.detailed_excavation_required === true && 
        answers.detailed_pricing_method !== 'm3',
      deriveFrom: (_scopeData, moduleAnswers, priceMap) => {
        const machineType = moduleAnswers.detailed_machine_type || 'EXC 3.2T';
        return priceMap['excavation']?.[machineType];
      },
    },
    {
      id: 'detailed_excavation_hours',
      type: 'number',
      label: 'Detailed excavation hours',
      defaultValue: 4,
      min: 0.5,
      step: 0.5,
      unit: 'hrs',
      helpText: 'Expected hours for detailed excavation',
      showIf: (answers) => 
        answers.detailed_excavation_required === true && 
        answers.detailed_pricing_method !== 'm3',
    },
    {
      id: 'detailed_float_charge',
      type: 'currency',
      label: 'Float charge to site',
      defaultValue: 150,
      priceListKey: 'excavation.FLOAT',
      showIf: (answers, scopeData) => {
        // Only show float if bulk excavation is not already charging for it
        const scopeId = scopeData?.scopeId;
        const bulkShown = BULK_EXCAVATION_SCOPES.includes(scopeId) && answers.bulk_excavation_required === true;
        return answers.detailed_excavation_required === true && !bulkShown;
      },
    },
    
    // Auger options - for point excavation (piers, pad footings) - only shown for hourly pricing
    {
      id: 'auger_required',
      type: 'boolean',
      label: 'Is an auger required?',
      defaultValue: false,
      showIf: (answers, scopeData) => {
        const scopeId = scopeData?.scopeId;
        return answers.detailed_excavation_required === true && 
          answers.detailed_pricing_method !== 'm3' &&
          DETAILED_EXCAVATION_SCOPES.includes(scopeId);
      },
    },
    {
      id: 'auger_hire_cost',
      type: 'currency',
      label: 'Auger hire cost per day',
      defaultValue: 100,
      priceListKey: 'excavation.AUGER HIRE',
      showIf: (answers) => 
        answers.detailed_excavation_required === true && 
        answers.detailed_pricing_method !== 'm3' &&
        answers.auger_required === true,
    },
    {
      id: 'auger_drive_cost',
      type: 'currency',
      label: 'Auger drive attachment cost per day',
      defaultValue: 100,
      priceListKey: 'excavation.AUGER DRIVE',
      showIf: (answers) => 
        answers.detailed_excavation_required === true && 
        answers.detailed_pricing_method !== 'm3' &&
        answers.auger_required === true,
    },

    // ==================== SHARED COSTS ====================
    {
      id: 'setout_materials',
      type: 'currency',
      label: 'Setout materials',
      defaultValue: 80,
      helpText: 'Pegs, string lines, spray paint, etc.',
      showIf: (answers) => answers.bulk_excavation_required === true || answers.detailed_excavation_required === true,
    },
  ],

  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;
    const scopeId = scopeData?.scopeId;
    const isBulkScope = BULK_EXCAVATION_SCOPES.includes(scopeId);

    const bulkEnabled = isBulkScope && answers.bulk_excavation_required === true;
    const detailedEnabled = answers.detailed_excavation_required === true;

    if (!bulkEnabled && !detailedEnabled) {
      return {
        moduleId: 'excavation',
        moduleName: 'Excavation',
        lineItems,
        subtotal: 0,
        exclusions: [],
      };
    }

    // Setout materials (shared)
    if (bulkEnabled || detailedEnabled) {
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
    }

    // ==================== BULK EXCAVATION COSTS ====================
    if (bulkEnabled) {
      const machineType = answers.bulk_machine_type || 'EXC 6T';
      const machineRate = Number(answers.bulk_machine_rate) || getPrice(priceMap, 'excavation', machineType, 180);
      const hours = Number(answers.bulk_excavation_hours) || 8;
      const machineCost = hours * machineRate;

      lineItems.push({
        id: 'bulk_machine_hire',
        description: `Bulk Excavation - ${machineType} (${hours} hrs)`,
        quantity: hours,
        unit: 'hrs',
        unitPrice: machineRate,
        total: machineCost,
        category: 'plant',
      });
      subtotal += machineCost;

      // Float charge for bulk
      const floatCharge = Number(answers.bulk_float_charge) || getPrice(priceMap, 'excavation', 'FLOAT', 150);
      if (floatCharge > 0) {
        lineItems.push({
          id: 'bulk_float_charge',
          description: 'Float Charge to Site (Bulk Machine)',
          quantity: 1,
          unit: 'item',
          unitPrice: floatCharge,
          total: floatCharge,
          category: 'plant',
        });
        subtotal += floatCharge;
      }
    }

    // ==================== DETAILED EXCAVATION COSTS ====================
    if (detailedEnabled) {
      const pricingMethod = answers.detailed_pricing_method || 'hourly';
      
      if (pricingMethod === 'm3') {
        // m³ Rate pricing method
        const m3Rate = Number(answers.detailed_m3_rate) || getPrice(priceMap, 'excavation', 'EXC_M3', 60);
        
        // Get excavation volume from scope data or calculate from groups
        let excavationVolume = scopeData?.excavation_volume || 0;
        
        // Calculate from pier groups if available
        if (!excavationVolume && scopeData?.pierGroups && Array.isArray(scopeData.pierGroups)) {
          for (const group of scopeData.pierGroups) {
            const qty = Number(group.quantity) || 0;
            const diameter = Number(group.diameter) / 1000; // mm to m
            const depth = Number(group.depth) / 1000; // mm to m
            const radius = diameter / 2;
            excavationVolume += qty * Math.PI * radius * radius * depth;
          }
        }
        
        // Calculate from pad groups if available
        if (!excavationVolume && scopeData?.padGroups && Array.isArray(scopeData.padGroups)) {
          for (const group of scopeData.padGroups) {
            const qty = Number(group.quantity) || 1;
            const lengthM = (Number(group.length) || 0) / 1000;
            const widthM = (Number(group.width) || 0) / 1000;
            const depthM = (Number(group.depth) || 0) / 1000;
            excavationVolume += qty * lengthM * widthM * depthM;
          }
        }
        
        // Calculate from linear sections if available
        if (!excavationVolume) {
          const linearSections = scopeData?.linearSections || scopeData?.footings || [];
          if (Array.isArray(linearSections)) {
            for (const section of linearSections) {
              const length = Number(section._actualLength || section.length) || 0;
              const widthM = (Number(section.dimension1 || section.width) || 0) / 1000;
              const depthM = (Number(section.dimension2 || section.depth) || 0) / 1000;
              excavationVolume += length * widthM * depthM;
              
              // Add toe volume if present (per-section, e.g. retaining_wall_footings)
              if (section.has_toe) {
                const toeWidthM = (Number(section.toe_width) || 0) / 1000;
                const toeDepthM = (Number(section.toe_depth) || 0) / 1000;
                excavationVolume += length * toeWidthM * toeDepthM;
              }
            }
          }
        }
        
        // Add toe volume for retaining_walls scope (global toe_length, not per-section)
        if (scopeData?.scopeId === 'retaining_walls' && scopeData?.include_footing) {
          const toeLengthM = (Number(scopeData.toe_length) || 0) / 1000;
          if (toeLengthM > 0) {
            const footingDepthM = (Number(scopeData.footing_depth) || 300) / 1000;
            const rwFootings = scopeData.footings || [];
            const totalLen = Array.isArray(rwFootings) && rwFootings.length > 0
              ? rwFootings.reduce((s: number, f: any) => s + (Number(f.length) || 0), 0)
              : Number(scopeData.total_length) || 0;
            excavationVolume += totalLen * toeLengthM * footingDepthM;
          }
        }
        
        const roundedVolume = Math.round(excavationVolume * 100) / 100; // Round to 2 decimal places
        const excavationCost = roundedVolume * m3Rate;
        
        if (roundedVolume > 0) {
          lineItems.push({
            id: 'detailed_excavation_m3',
            description: `Detailed Excavation (${roundedVolume.toFixed(2)} m³ @ $${m3Rate}/m³)`,
            quantity: roundedVolume,
            unit: 'm³',
            unitPrice: m3Rate,
            total: excavationCost,
            category: 'plant',
          });
          subtotal += excavationCost;
        }
      } else {
        // Hourly Rate pricing method (default)
        const machineType = answers.detailed_machine_type || 'EXC 3.2T';
        const machineRate = Number(answers.detailed_machine_rate) || getPrice(priceMap, 'excavation', machineType, 150);
        const hours = Number(answers.detailed_excavation_hours) || 4;
        const machineCost = hours * machineRate;

        lineItems.push({
          id: 'detailed_machine_hire',
          description: `Detailed Excavation - ${machineType} (${hours} hrs)`,
          quantity: hours,
          unit: 'hrs',
          unitPrice: machineRate,
          total: machineCost,
          category: 'plant',
        });
        subtotal += machineCost;

        // Auger (only for hourly method)
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
      }

      // Float charge for detailed (only if bulk not already charging)
      if (!bulkEnabled) {
        const floatCharge = Number(answers.detailed_float_charge) || getPrice(priceMap, 'excavation', 'FLOAT', 150);
        if (floatCharge > 0) {
          lineItems.push({
            id: 'detailed_float_charge',
            description: 'Float Charge to Site',
            quantity: 1,
            unit: 'item',
            unitPrice: floatCharge,
            total: floatCharge,
            category: 'plant',
          });
          subtotal += floatCharge;
        }
      }
    }

    return {
      moduleId: 'excavation',
      moduleName: 'Excavation',
      lineItems,
      subtotal,
      exclusions: [],
    };
  },

  getExclusions: (answers, scopeData): ExclusionItem[] => {
    const exclusions: ExclusionItem[] = [];
    const scopeId = scopeData?.scopeId;
    const isBulkScope = BULK_EXCAVATION_SCOPES.includes(scopeId);
    const isFlatBottomScope = FLAT_BOTTOM_SCOPES.includes(scopeId);

    const bulkEnabled = isBulkScope && answers.bulk_excavation_required === true;
    const detailedEnabled = answers.detailed_excavation_required === true;

    // If bulk excavation scope but bulk is off
    if (isBulkScope && !bulkEnabled) {
      exclusions.push({
        id: 'no_bulk_excavation',
        text: 'Bulk excavation and site cut works are not included. Site to be prepared by others prior to commencement.',
        moduleId: 'excavation',
      });
    }

    // If detailed excavation is off (but not for flat bottom scopes like waffle pod where it's N/A)
    if (!detailedEnabled && !isFlatBottomScope) {
      exclusions.push({
        id: 'no_detailed_excavation',
        text: 'Detailed excavation for beams, footings, pads, and piers is not included.',
        moduleId: 'excavation',
      });
    }

    // Add rock excavation exclusion when any excavation is enabled
    if (bulkEnabled || detailedEnabled) {
      exclusions.push({
        id: 'rock_excavation',
        text: 'Rock excavation or rock breaking',
        moduleId: 'excavation',
      });
    }

    // Add backfill exclusion when detailed excavation is enabled
    if (detailedEnabled) {
      exclusions.push({
        id: 'backfill',
        text: 'Backfilling or compaction of excavations',
        moduleId: 'excavation',
      });
    }

    return exclusions;
  },

  validate: (answers) => {
    // Note: scopeData is available via answers context in practice
    const scopeData = (answers as any)._scopeData || {};
    const errors: string[] = [];
    const scopeId = scopeData?.scopeId;
    const isBulkScope = BULK_EXCAVATION_SCOPES.includes(scopeId);

    const bulkEnabled = isBulkScope && answers.bulk_excavation_required === true;
    const detailedEnabled = answers.detailed_excavation_required === true;

    if (bulkEnabled) {
      if (!answers.bulk_excavation_hours || answers.bulk_excavation_hours < 0.5) {
        errors.push('Please specify expected bulk excavation hours');
      }
      if (!answers.bulk_machine_type) {
        errors.push('Please select a machine type for bulk excavation');
      }
    }

    if (detailedEnabled) {
      const pricingMethod = answers.detailed_pricing_method || 'hourly';
      
      // Only validate hourly fields when hourly method is selected
      if (pricingMethod !== 'm3') {
        if (!answers.detailed_excavation_hours || answers.detailed_excavation_hours < 0.5) {
          errors.push('Please specify expected detailed excavation hours');
        }
        if (!answers.detailed_machine_type) {
          errors.push('Please select a machine type for detailed excavation');
        }
      }
    }

    return { valid: errors.length === 0, errors };
  },
};
