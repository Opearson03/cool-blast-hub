// Architectural Formwork Module - specialised formwork for 3D concrete elements
import { EstimateModule, ComponentCost, CostLineItem, ExclusionItem, PriceMap, getPrice } from '../types';

export const architecturalFormworkModule: EstimateModule = {
  id: 'architectural-formwork',
  name: 'Molds & Formwork',
  description: 'Specialised formwork and molds for architectural concrete elements',
  questions: [
    {
      id: 'formwork_required',
      type: 'boolean',
      label: 'Is formwork/mold fabrication required?',
      required: true,
      defaultValue: false,
    },
    {
      id: 'formwork_type',
      type: 'select',
      label: 'Mold/Formwork Type',
      required: true,
      showIf: (answers) => answers.formwork_required === true,
      options: [
        { value: 'timber', label: 'Timber formwork (site-built)' },
        { value: 'steel_hire', label: 'Steel mold (hired)' },
        { value: 'rubber', label: 'Rubber mold (for texture)' },
        { value: 'custom', label: 'Custom fabricated mold' },
        { value: 'reusable', label: 'Reusable form system' },
      ],
    },
    {
      id: 'complexity',
      type: 'select',
      label: 'Form Complexity',
      required: true,
      showIf: (answers) => answers.formwork_required === true,
      options: [
        { value: 'simple', label: 'Simple box form' },
        { value: 'multi_sided', label: 'Multi-sided' },
        { value: 'curved', label: 'Curved surfaces' },
        { value: 'complex', label: 'Complex geometry' },
      ],
    },
    {
      id: 'form_liner_required',
      type: 'boolean',
      label: 'Form liner required?',
      required: true,
      showIf: (answers) => answers.formwork_required === true,
      defaultValue: false,
    },
    {
      id: 'form_liner_type',
      type: 'select',
      label: 'Form Liner Type',
      required: true,
      showIf: (answers) => answers.formwork_required === true && answers.form_liner_required === true,
      options: [
        { value: 'timber_grain', label: 'Timber grain texture' },
        { value: 'stone', label: 'Stone texture' },
        { value: 'smooth', label: 'Smooth finish liner' },
        { value: 'custom_pattern', label: 'Custom pattern' },
      ],
    },
    {
      id: 'form_liner_area',
      type: 'number',
      label: 'Form Liner Coverage (m²)',
      required: true,
      min: 0.1,
      unit: 'm²',
      showIf: (answers) => answers.formwork_required === true && answers.form_liner_required === true,
    },
    {
      id: 'form_builders',
      type: 'number',
      label: 'Number of Form Builders',
      required: true,
      min: 1,
      defaultValue: 1,
      showIf: (answers) => answers.formwork_required === true,
    },
    {
      id: 'form_builder_hours',
      type: 'number',
      label: 'Hours per Form Builder',
      required: true,
      min: 1,
      defaultValue: 8,
      showIf: (answers) => answers.formwork_required === true,
    },
    {
      id: 'mold_reuse_count',
      type: 'number',
      label: 'Number of Uses for Mold',
      required: true,
      min: 1,
      defaultValue: 1,
      showIf: (answers) => answers.formwork_required === true && (answers.formwork_type === 'steel_hire' || answers.formwork_type === 'rubber' || answers.formwork_type === 'reusable'),
      helpText: 'Mold cost will be amortized across uses',
    },
  ],
  
  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;
    
    if (!answers.formwork_required) {
      return { 
        moduleId: 'architectural-formwork',
        moduleName: 'Molds & Formwork',
        lineItems: [], 
        subtotal: 0, 
        exclusions: [] 
      };
    }
    
    const labourRate = getPrice(priceMap, 'labour', 'LABOUR HR', 75);
    const formBuilders = Number(answers.form_builders) || 1;
    const formBuilderHours = Number(answers.form_builder_hours) || 8;
    const totalLabourHours = formBuilders * formBuilderHours;
    const reuseCount = Number(answers.mold_reuse_count) || 1;
    
    // Labour cost
    const labourCost = totalLabourHours * labourRate;
    lineItems.push({
      id: 'arch-form-labour',
      description: `Form building labour (${formBuilders} × ${formBuilderHours}h)`,
      quantity: totalLabourHours,
      unit: 'hours',
      unitPrice: labourRate,
      total: labourCost,
      category: 'labour',
    });
    subtotal += labourCost;
    
    // Material costs based on formwork type
    const formworkType = answers.formwork_type as string;
    const complexity = answers.complexity as string;
    
    // Complexity multiplier
    const complexityMultiplier = {
      simple: 1.0,
      multi_sided: 1.3,
      curved: 1.6,
      complex: 2.0,
    }[complexity] || 1.0;
    
    // Base material costs by type
    let materialCost = 0;
    let materialDescription = '';
    let materialId = 'arch-form-material';
    
    switch (formworkType) {
      case 'timber':
        const timberAllowance = 250 * complexityMultiplier;
        materialCost = timberAllowance;
        materialDescription = 'Timber formwork materials';
        materialId = 'arch-form-timber';
        break;
      case 'steel_hire':
        const steelHireCost = (350 * complexityMultiplier) / reuseCount;
        materialCost = steelHireCost;
        materialDescription = `Steel mold hire (amortized over ${reuseCount} use${reuseCount > 1 ? 's' : ''})`;
        materialId = 'arch-form-steel';
        break;
      case 'rubber':
        const rubberMoldCost = (getPrice(priceMap, 'formwork', 'RUBBER_MOLD', 180) * complexityMultiplier) / reuseCount;
        materialCost = rubberMoldCost;
        materialDescription = `Rubber mold (amortized over ${reuseCount} use${reuseCount > 1 ? 's' : ''})`;
        materialId = 'arch-form-rubber';
        break;
      case 'custom':
        const customMoldCost = getPrice(priceMap, 'formwork', 'CUSTOM_MOLD', 500) * complexityMultiplier;
        materialCost = customMoldCost;
        materialDescription = 'Custom mold fabrication';
        materialId = 'arch-form-custom';
        break;
      case 'reusable':
        const reusableCost = (400 * complexityMultiplier) / reuseCount;
        materialCost = reusableCost;
        materialDescription = `Reusable form system (amortized over ${reuseCount} use${reuseCount > 1 ? 's' : ''})`;
        materialId = 'arch-form-reusable';
        break;
    }
    
    if (materialCost > 0) {
      lineItems.push({
        id: materialId,
        description: materialDescription,
        quantity: 1,
        unit: 'allow',
        unitPrice: materialCost,
        total: materialCost,
        category: 'materials',
      });
      subtotal += materialCost;
    }
    
    // Form liner costs
    if (answers.form_liner_required) {
      const linerArea = Number(answers.form_liner_area) || 1;
      const linerType = answers.form_liner_type as string;
      
      const linerPrices: Record<string, number> = {
        timber_grain: 65,
        stone: 85,
        smooth: 45,
        custom_pattern: 120,
      };
      
      const linerUnitPrice = linerPrices[linerType] || 65;
      const linerCost = linerArea * linerUnitPrice;
      
      lineItems.push({
        id: 'arch-form-liner',
        description: `Form liner - ${linerType?.replace('_', ' ')}`,
        quantity: linerArea,
        unit: 'm²',
        unitPrice: linerUnitPrice,
        total: linerCost,
        category: 'materials',
      });
      subtotal += linerCost;
    }
    
    return { 
      moduleId: 'architectural-formwork',
      moduleName: 'Molds & Formwork',
      lineItems, 
      subtotal, 
      exclusions: [] 
    };
  },
  
  getExclusions: (answers): ExclusionItem[] => {
    const exclusions: ExclusionItem[] = [];
    
    if (!answers.formwork_required) {
      exclusions.push({
        id: 'no-arch-formwork',
        text: 'Formwork and mold fabrication are excluded',
        moduleId: 'architectural-formwork',
      });
    }
    
    if (!answers.form_liner_required && answers.formwork_required) {
      exclusions.push({
        id: 'no-form-liner',
        text: 'Form liners and textured finishes are excluded',
        moduleId: 'architectural-formwork',
      });
    }
    
    return exclusions;
  },
  
  validate: (answers) => {
    const errors: string[] = [];
    
    if (answers.formwork_required) {
      if (!answers.formwork_type) {
        errors.push('Formwork type is required');
      }
      if (!answers.complexity) {
        errors.push('Form complexity is required');
      }
      if (!answers.form_builders || Number(answers.form_builders) < 1) {
        errors.push('Number of form builders is required');
      }
      if (!answers.form_builder_hours || Number(answers.form_builder_hours) < 1) {
        errors.push('Hours per form builder is required');
      }
      if (answers.form_liner_required && !answers.form_liner_area) {
        errors.push('Form liner area is required');
      }
    }
    
    return { valid: errors.length === 0, errors };
  },
};
