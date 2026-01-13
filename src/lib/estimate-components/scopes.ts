// Scope definitions - each scope references which modules it uses
import { ScopeDefinition, ExclusionItem } from './types';

/**
 * Piers Scope Definition
 * Uses the full set of modules for pier foundation work
 */
export const PIERS_SCOPE: ScopeDefinition = {
  id: 'piers',
  name: 'Piers',
  description: 'Concrete pier foundations including excavation, reinforcement, and placement',
  icon: 'construction',
  supportsMultiplePiers: true,
  piersLabel: 'Pier Configurations',
  questions: [
    // These questions are derived from the multi-pier input
    {
      id: 'num_piers',
      type: 'number',
      label: 'Total Number of Piers',
      required: true,
      min: 1,
    },
    {
      id: 'diameter',
      type: 'number',
      label: 'Average Diameter (mm)',
      required: true,
      min: 100,
      unit: 'mm',
      helpText: 'Derived from pier configurations',
    },
    {
      id: 'depth',
      type: 'number',
      label: 'Average Depth (mm)',
      required: true,
      min: 100,
      unit: 'mm',
      helpText: 'Derived from pier configurations',
    },
  ],
  moduleIds: [
    'labour-prep',
    'labour-place',
    'formwork',
    'excavation',
    'reinforcement-piers',
    'concrete-supply',
    'concrete-pumping',
    'cleanup',
    'sundries',
    'margin',
  ],
  calculateVolume: (answers) => {
    // If we have pier configs, calculate from those
    const piers = answers.piers || [];
    if (piers.length > 0) {
      return piers.reduce((sum: number, pier: any) => {
        const qty = Number(pier.quantity) || 0;
        const diamM = (Number(pier.diameter) || 0) / 1000;
        const depthM = (Number(pier.depth) || 0) / 1000;
        const radius = diamM / 2;
        return sum + qty * Math.PI * radius * radius * depthM;
      }, 0);
    }
    // Fallback to individual questions
    const numPiers = Number(answers.num_piers) || 0;
    const diameterM = (Number(answers.diameter) || 0) / 1000;
    const depthM = (Number(answers.depth) || 0) / 1000;
    const radius = diameterM / 2;
    return numPiers * Math.PI * radius * radius * depthM;
  },
  defaultExclusions: [
    { id: 'engineering', text: 'Engineering design and certification', moduleId: 'piers' },
    { id: 'permits', text: 'Council permits and approvals', moduleId: 'piers' },
    { id: 'soil_testing', text: 'Soil testing and geotechnical reports', moduleId: 'piers' },
  ],
};

/**
 * Standard Slab Scope Definition
 */
export const STANDARD_SLAB_SCOPE: ScopeDefinition = {
  id: 'standard_slab',
  name: 'Standard Slab',
  description: 'Ground-bearing concrete slab on ground',
  icon: 'square',
  supportsMultipleAreas: true,
  areasLabel: 'Slab Areas',
  questions: [
    {
      id: 'area',
      type: 'number',
      label: 'Slab Area (m²)',
      required: true,
      min: 1,
      unit: 'm²',
    },
    {
      id: 'perimeter',
      type: 'number',
      label: 'Perimeter (m)',
      required: true,
      min: 1,
      unit: 'm',
    },
    {
      id: 'thickness',
      type: 'number',
      label: 'Slab Thickness (mm)',
      required: true,
      min: 50,
      defaultValue: 100,
      unit: 'mm',
    },
  ],
  moduleIds: [
    'demolition',
    'labour-prep',
    'labour-place',
    'formwork',
    'excavation',
    'base-preparation',
    'reinforcement-slab',
    'connections-joints',
    'concrete-supply',
    'concrete-pumping',
    'surface-finishing',
    'joints-control',
    'cleanup',
    'sundries',
    'margin',
  ],
  calculateVolume: (answers) => {
    const area = Number(answers.area) || 0;
    const thicknessM = (Number(answers.thickness) || 0) / 1000;
    return area * thicknessM;
  },
  defaultExclusions: [
    { id: 'engineering', text: 'Engineering design and certification', moduleId: 'standard_slab' },
    { id: 'permits', text: 'Council permits and approvals', moduleId: 'standard_slab' },
  ],
};

/**
 * Raft Slab Scope Definition
 */
export const RAFT_SLAB_SCOPE: ScopeDefinition = {
  id: 'raft_slab',
  name: 'Raft Slab',
  description: 'Reinforced raft foundation slab',
  icon: 'layers',
  supportsMultipleAreas: true,
  areasLabel: 'Raft Slab Areas',
  supportsMultipleBeams: true,
  beamsLabel: 'Internal Stiffening Beams',
  // Hide internal beam fields from standard rendering - they're managed by MultiBeamInput
  hideStandardQuestions: ['internal_beams_length', 'internal_beam_width', 'internal_beam_depth'],
  questions: [
    {
      id: 'area',
      type: 'number',
      label: 'Slab Area (m²)',
      required: true,
      min: 1,
      unit: 'm²',
    },
    {
      id: 'perimeter',
      type: 'number',
      label: 'Perimeter (m)',
      required: true,
      min: 1,
      unit: 'm',
    },
    {
      id: 'thickness',
      type: 'number',
      label: 'Slab Thickness (mm)',
      required: true,
      min: 100,
      defaultValue: 300,
      unit: 'mm',
      helpText: 'Thickness of the main slab portion',
    },
    {
      id: 'edge_beam_depth',
      type: 'number',
      label: 'Edge Beam Depth (mm)',
      required: true,
      min: 200,
      defaultValue: 450,
      unit: 'mm',
      helpText: 'Total depth of thickened edge',
    },
    {
      id: 'edge_beam_width',
      type: 'number',
      label: 'Edge Beam Width (mm)',
      required: false,
      min: 200,
      defaultValue: 450,
      unit: 'mm',
      helpText: 'Width of thickened edge (typically 450mm)',
    },
    // These fields are derived from multi-beam input
    {
      id: 'internal_beams_length',
      type: 'number',
      label: 'Total Internal Beam Length (m)',
      required: false,
      min: 0,
      defaultValue: 0,
      unit: 'm',
      helpText: 'Derived from beam configurations',
    },
    {
      id: 'internal_beam_width',
      type: 'number',
      label: 'Internal Beam Width (mm)',
      required: false,
      min: 200,
      defaultValue: 300,
      unit: 'mm',
      helpText: 'Weighted average from beam configurations',
    },
    {
      id: 'internal_beam_depth',
      type: 'number',
      label: 'Internal Beam Depth (mm)',
      required: false,
      min: 200,
      defaultValue: 400,
      unit: 'mm',
      helpText: 'Weighted average from beam configurations',
    },
  ],
  moduleIds: [
    'demolition',
    'labour-prep',
    'labour-place',
    'formwork',
    'excavation',
    'base-preparation',
    'reinforcement-slab',
    'concrete-supply',
    'concrete-pumping',
    'surface-finishing',
    'cleanup',
    'sundries',
    'margin',
  ],
  calculateVolume: (answers) => {
    const area = Number(answers.area) || 0;
    const thicknessM = (Number(answers.thickness) || 300) / 1000;
    const perimeter = Number(answers.perimeter) || 0;
    const edgeBeamDepthM = (Number(answers.edge_beam_depth) || 450) / 1000;
    const edgeBeamWidthM = (Number(answers.edge_beam_width) || 450) / 1000;

    // Main slab volume
    const slabVolume = area * thicknessM;

    // Edge beam extra volume (depth below slab thickness)
    const extraEdgeDepth = Math.max(0, edgeBeamDepthM - thicknessM);
    const edgeBeamVolume = perimeter * edgeBeamWidthM * extraEdgeDepth;

    // Internal beams volume - if we have beam configs, calculate from those
    const beams = answers.beams || [];
    let internalBeamVolume = 0;
    
    if (beams.length > 0) {
      internalBeamVolume = beams.reduce((sum: number, beam: any) => {
        const lengthM = Number(beam.length) || 0;
        const widthM = (Number(beam.width) || 300) / 1000;
        const depthM = (Number(beam.depth) || 400) / 1000;
        const extraDepth = Math.max(0, depthM - thicknessM);
        return sum + lengthM * widthM * extraDepth;
      }, 0);
    } else {
      // Fallback to legacy single-value fields
      const internalLength = Number(answers.internal_beams_length) || 0;
      const internalWidthM = (Number(answers.internal_beam_width) || 300) / 1000;
      const internalDepthM = (Number(answers.internal_beam_depth) || 400) / 1000;
      const internalExtraDepth = Math.max(0, internalDepthM - thicknessM);
      internalBeamVolume = internalLength * internalWidthM * internalExtraDepth;
    }

    return slabVolume + edgeBeamVolume + internalBeamVolume;
  },
  defaultExclusions: [
    { id: 'engineering', text: 'Engineering design and certification', moduleId: 'raft_slab' },
    { id: 'permits', text: 'Council permits and approvals', moduleId: 'raft_slab' },
    { id: 'termite', text: 'Termite treatment and barriers', moduleId: 'raft_slab' },
  ],
};

/**
 * Waffle Pod Scope Definition
 */
export const WAFFLE_POD_SCOPE: ScopeDefinition = {
  id: 'waffle_pod',
  name: 'Waffle Pod',
  description: 'Waffle pod slab system',
  icon: 'grid3x3',
  supportsMultipleAreas: true,
  areasLabel: 'Waffle Pod Areas',
  questions: [
    {
      id: 'area',
      type: 'number',
      label: 'Slab Area (m²)',
      required: true,
      min: 1,
      unit: 'm²',
    },
    {
      id: 'perimeter',
      type: 'number',
      label: 'Perimeter (m)',
      required: true,
      min: 1,
      unit: 'm',
    },
    {
      id: 'pod_count',
      type: 'number',
      label: 'Number of Pods',
      required: true,
      min: 1,
      helpText: 'Count from engineering drawings or estimate from area',
    },
    {
      id: 'pod_size',
      type: 'select',
      label: 'Pod Size',
      required: false,
      options: [
        { value: '1090', label: '1090mm × 1090mm (Standard)' },
        { value: '1110', label: '1110mm × 1110mm' },
        { value: '990', label: '990mm × 990mm (Smaller)' },
      ],
      defaultValue: '1090',
      helpText: 'Standard waffle pod dimensions',
    },
    {
      id: 'rib_width',
      type: 'number',
      label: 'Rib Width (mm)',
      required: false,
      min: 90,
      max: 200,
      defaultValue: 110,
      unit: 'mm',
      helpText: 'Width of concrete ribs between pods',
    },
    {
      id: 'top_slab_thickness',
      type: 'number',
      label: 'Top Slab Thickness (mm)',
      required: false,
      min: 50,
      max: 150,
      defaultValue: 85,
      unit: 'mm',
      helpText: 'Thickness of concrete above pods',
    },
    {
      id: 'rib_depth',
      type: 'number',
      label: 'Rib Depth (mm)',
      required: false,
      min: 150,
      max: 450,
      defaultValue: 300,
      unit: 'mm',
      helpText: 'Full depth of concrete ribs',
    },
    {
      id: 'edge_beam_depth',
      type: 'number',
      label: 'Edge Beam Depth (mm)',
      required: false,
      min: 200,
      defaultValue: 350,
      unit: 'mm',
      helpText: 'Depth of perimeter edge beam',
    },
    {
      id: 'edge_beam_width',
      type: 'number',
      label: 'Edge Beam Width (mm)',
      required: false,
      min: 200,
      defaultValue: 350,
      unit: 'mm',
      helpText: 'Width of perimeter edge beam',
    },
  ],
  moduleIds: [
    'demolition',
    'labour-prep',
    'labour-place',
    'formwork',
    'base-preparation',
    'reinforcement-slab',
    'concrete-supply',
    'concrete-pumping',
    'surface-finishing',
    'cleanup',
    'sundries',
    'margin',
  ],
  calculateVolume: (answers) => {
    const area = Number(answers.area) || 0;
    const podCount = Number(answers.pod_count) || 0;
    const podSizeMM = Number(answers.pod_size) || 1090;
    const podSizeM = podSizeMM / 1000;
    const ribWidthM = (Number(answers.rib_width) || 110) / 1000;
    const topSlabThicknessM = (Number(answers.top_slab_thickness) || 85) / 1000;
    const ribDepthM = (Number(answers.rib_depth) || 300) / 1000;
    const perimeter = Number(answers.perimeter) || 0;
    const edgeBeamDepthM = (Number(answers.edge_beam_depth) || 350) / 1000;
    const edgeBeamWidthM = (Number(answers.edge_beam_width) || 350) / 1000;

    // Pod void area (no concrete)
    const podArea = podCount * podSizeM * podSizeM;

    // Rib area = total area minus pod voids
    const ribArea = Math.max(0, area - podArea);

    // Rib volume (the ribs between pods)
    const ribVolume = ribArea * ribDepthM;

    // Top slab volume (concrete topping over entire area)
    const topSlabVolume = area * topSlabThicknessM;

    // Edge beam extra volume (outside the main waffle grid)
    // Simplified: perimeter × edge width × (edge depth - top slab)
    const edgeExtraDepth = Math.max(0, edgeBeamDepthM - topSlabThicknessM);
    const edgeBeamVolume = perimeter * edgeBeamWidthM * edgeExtraDepth;

    return ribVolume + topSlabVolume + edgeBeamVolume;
  },
  defaultExclusions: [
    { id: 'engineering', text: 'Engineering design and certification', moduleId: 'waffle_pod' },
    { id: 'permits', text: 'Council permits and approvals', moduleId: 'waffle_pod' },
    { id: 'site_prep', text: 'Site preparation and leveling', moduleId: 'waffle_pod' },
    { id: 'pods', text: 'Supply of waffle pods (by others)', moduleId: 'waffle_pod' },
  ],
};

/**
 * Driveway Scope Definition
 * Supports multiple measurement areas (e.g., driveway + porch + patio)
 */
export const DRIVEWAY_SCOPE: ScopeDefinition = {
  id: 'driveway',
  name: 'Driveway',
  description: 'Concrete driveway installation',
  icon: 'car',
  supportsMultipleAreas: true,
  areasLabel: 'Driveway Areas',
  questions: [
    // These questions are now derived from the multi-area input
    {
      id: 'area',
      type: 'number',
      label: 'Total Area (m²)',
      required: true,
      min: 1,
      unit: 'm²',
    },
    {
      id: 'perimeter',
      type: 'number',
      label: 'Total Perimeter (m)',
      required: true,
      min: 1,
      unit: 'm',
    },
    {
      id: 'thickness',
      type: 'number',
      label: 'Thickness (mm)',
      required: true,
      min: 75,
      defaultValue: 100,
      unit: 'mm',
    },
    // Thickening/edge beam questions
    {
      id: 'hasThickening',
      type: 'boolean',
      label: 'Has Thickening/Edge Beams',
      required: false,
      defaultValue: false,
    },
    {
      id: 'thickeningDepth',
      type: 'number',
      label: 'Thickening Depth (mm)',
      required: false,
      min: 100,
      defaultValue: 300,
      unit: 'mm',
    },
    {
      id: 'thickeningWidth',
      type: 'number',
      label: 'Thickening Width (mm)',
      required: false,
      min: 100,
      defaultValue: 300,
      unit: 'mm',
    },
  ],
  moduleIds: [
    'demolition',
    'labour-prep',
    'labour-place',
    'formwork',
    'excavation',
    'base-preparation',
    'reinforcement-slab',
    'connections-joints',
    'concrete-supply',
    'concrete-pumping',
    'plumbing',
    'surface-finishing',
    'joints-control',
    'cleanup',
    'sundries',
    'margin',
  ],
  calculateVolume: (answers) => {
    const area = Number(answers.area) || 0;
    const thicknessM = (Number(answers.thickness) || 0) / 1000;
    const perimeter = Number(answers.perimeter) || 0;
    
    // Base slab volume
    let volume = area * thicknessM;
    
    // Add thickening/edge beam volume if enabled
    if (answers.hasThickening) {
      const thickeningDepthM = (Number(answers.thickeningDepth) || 300) / 1000;
      const thickeningWidthM = (Number(answers.thickeningWidth) || 300) / 1000;
      // Edge beam volume = perimeter × width × (depth - slab thickness)
      // Only add the extra depth below the slab
      const extraDepth = Math.max(0, thickeningDepthM - thicknessM);
      const thickeningVolume = perimeter * thickeningWidthM * extraDepth;
      volume += thickeningVolume;
    }
    
    return volume;
  },
  defaultExclusions: [
    { id: 'permits', text: 'Council permits and approvals', moduleId: 'driveway' },
  ],
};

/**
 * Crossovers Scope Definition
 * Supports multiple measurement areas
 */
export const CROSSOVERS_SCOPE: ScopeDefinition = {
  id: 'crossovers',
  name: 'Crossovers',
  description: 'Vehicle crossover/layback installation',
  icon: 'move-horizontal',
  supportsMultipleAreas: true,
  areasLabel: 'Crossover Areas',
  questions: [
    {
      id: 'area',
      type: 'number',
      label: 'Total Area (m²)',
      required: true,
      min: 1,
      unit: 'm²',
    },
    {
      id: 'perimeter',
      type: 'number',
      label: 'Total Perimeter (m)',
      required: true,
      min: 1,
      unit: 'm',
    },
    {
      id: 'thickness',
      type: 'number',
      label: 'Thickness (mm)',
      required: true,
      min: 100,
      defaultValue: 125,
      unit: 'mm',
    },
  ],
  moduleIds: [
    'demolition',
    'labour-prep',
    'labour-place',
    'formwork',
    'excavation',
    'reinforcement-slab',
    'concrete-supply',
    'concrete-pumping',
    'surface-finishing',
    'cleanup',
    'sundries',
    'margin',
  ],
  calculateVolume: (answers) => {
    const area = Number(answers.area) || 0;
    const thicknessM = (Number(answers.thickness) || 0) / 1000;
    return area * thicknessM;
  },
  defaultExclusions: [
    { id: 'permits', text: 'Council permits and crossover applications', moduleId: 'crossovers' },
    { id: 'kerb', text: 'Kerb and gutter modifications', moduleId: 'crossovers' },
  ],
};

/**
 * Paths & Surrounds Scope Definition
 * Supports multiple measurement areas
 */
export const PATHS_SURROUNDS_SCOPE: ScopeDefinition = {
  id: 'paths_surrounds',
  name: 'Paths & Surrounds',
  description: 'Concrete pathways and house surrounds',
  icon: 'footprints',
  supportsMultipleAreas: true,
  areasLabel: 'Path & Surround Areas',
  questions: [
    {
      id: 'area',
      type: 'number',
      label: 'Total Area (m²)',
      required: true,
      min: 1,
      unit: 'm²',
    },
    {
      id: 'perimeter',
      type: 'number',
      label: 'Total Perimeter (m)',
      required: true,
      min: 1,
      unit: 'm',
    },
    {
      id: 'thickness',
      type: 'number',
      label: 'Thickness (mm)',
      required: true,
      min: 50,
      defaultValue: 75,
      unit: 'mm',
    },
  ],
  moduleIds: [
    'demolition',
    'labour-prep',
    'labour-place',
    'formwork',
    'excavation',
    'reinforcement-slab',
    'concrete-supply',
    'concrete-pumping',
    'plumbing',
    'surface-finishing',
    'cleanup',
    'sundries',
    'margin',
  ],
  calculateVolume: (answers) => {
    const area = Number(answers.area) || 0;
    const thicknessM = (Number(answers.thickness) || 0) / 1000;
    return area * thicknessM;
  },
  defaultExclusions: [
    { id: 'excavation', text: 'Excavation and soil removal', moduleId: 'paths_surrounds' },
  ],
};

/**
 * Strip Footings Scope Definition
 * Supports multiple footing configurations
 */
export const STRIP_FOOTINGS_SCOPE: ScopeDefinition = {
  id: 'strip_footings',
  name: 'Strip Footings',
  description: 'Strip footing foundations',
  icon: 'minus',
  supportsMultipleFootings: true,
  footingsLabel: 'Footing Sections',
  questions: [
    // These questions are derived from the multi-footing input
    {
      id: 'total_length',
      type: 'number',
      label: 'Total Length (m)',
      required: true,
      min: 1,
      unit: 'm',
    },
    {
      id: 'width',
      type: 'number',
      label: 'Average Width (mm)',
      required: true,
      min: 200,
      unit: 'mm',
    },
    {
      id: 'depth',
      type: 'number',
      label: 'Average Depth (mm)',
      required: true,
      min: 200,
      unit: 'mm',
    },
  ],
  moduleIds: [
    'labour-prep',
    'labour-place',
    'formwork',
    'excavation',
    'reinforcement-footing',
    'concrete-supply',
    'concrete-pumping',
    'cleanup',
    'sundries',
    'margin',
  ],
  calculateVolume: (answers) => {
    // If we have footing configs, calculate from those
    const footings = answers.footings || [];
    if (footings.length > 0) {
      return footings.reduce((sum: number, footing: any) => {
        const length = Number(footing.length) || 0;
        const widthM = (Number(footing.width) || 0) / 1000;
        const depthM = (Number(footing.depth) || 0) / 1000;
        return sum + length * widthM * depthM;
      }, 0);
    }
    // Fallback to individual questions
    const length = Number(answers.total_length) || 0;
    const widthM = (Number(answers.width) || 0) / 1000;
    const depthM = (Number(answers.depth) || 0) / 1000;
    return length * widthM * depthM;
  },
  defaultExclusions: [
    { id: 'engineering', text: 'Engineering design and certification', moduleId: 'strip_footings' },
    { id: 'permits', text: 'Council permits and approvals', moduleId: 'strip_footings' },
  ],
};

/**
 * Retaining Wall Scope Definition
 * Supports multiple footing configurations
 */
export const RETAINING_WALL_FOOTINGS_SCOPE: ScopeDefinition = {
  id: 'retaining_wall_footings',
  name: 'Retaining Wall Footings',
  description: 'Retaining wall footing foundations',
  icon: 'brick-wall',
  supportsMultipleFootings: true,
  footingsLabel: 'Footing Sections',
  questions: [
    // These questions are derived from the multi-footing input
    {
      id: 'total_length',
      type: 'number',
      label: 'Total Length (m)',
      required: true,
      min: 1,
      unit: 'm',
    },
    {
      id: 'footing_width',
      type: 'number',
      label: 'Average Footing Width (mm)',
      required: true,
      min: 300,
      unit: 'mm',
    },
    {
      id: 'footing_depth',
      type: 'number',
      label: 'Average Footing Depth (mm)',
      required: true,
      min: 200,
      unit: 'mm',
    },
  ],
  moduleIds: [
    'labour-prep',
    'labour-place',
    'formwork',
    'excavation',
    'reinforcement-footing',
    'concrete-supply',
    'concrete-pumping',
    'cleanup',
    'sundries',
    'margin',
  ],
  calculateVolume: (answers) => {
    // If we have footing configs, calculate from those
    const footings = answers.footings || [];
    if (footings.length > 0) {
      return footings.reduce((sum: number, footing: any) => {
        const length = Number(footing.length) || 0;
        const widthM = (Number(footing.width) || 0) / 1000;
        const depthM = (Number(footing.depth) || 0) / 1000;
        return sum + length * widthM * depthM;
      }, 0);
    }
    // Fallback to individual questions
    const length = Number(answers.total_length) || 0;
    const widthM = (Number(answers.footing_width) || 0) / 1000;
    const depthM = (Number(answers.footing_depth) || 0) / 1000;
    return length * widthM * depthM;
  },
  defaultExclusions: [
    { id: 'engineering', text: 'Engineering design and certification', moduleId: 'retaining_wall_footings' },
    { id: 'wall', text: 'Retaining wall construction (footing only)', moduleId: 'retaining_wall_footings' },
  ],
};


/**
 * Suspended Slab Scope Definition
 */
export const SUSPENDED_SLAB_SCOPE: ScopeDefinition = {
  id: 'suspended_slab',
  name: 'Suspended Slab',
  description: 'Elevated/suspended concrete slab',
  icon: 'layers-2',
  supportsMultipleAreas: true,
  areasLabel: 'Suspended Slab Areas',
  questions: [
    {
      id: 'area',
      type: 'number',
      label: 'Slab Area (m²)',
      required: true,
      min: 1,
      unit: 'm²',
    },
    {
      id: 'perimeter',
      type: 'number',
      label: 'Perimeter (m)',
      required: true,
      min: 1,
      unit: 'm',
    },
    {
      id: 'thickness',
      type: 'number',
      label: 'Slab Thickness (mm)',
      required: true,
      min: 100,
      defaultValue: 200,
      unit: 'mm',
    },
    {
      id: 'height',
      type: 'number',
      label: 'Height from Ground (mm)',
      required: true,
      min: 500,
      defaultValue: 3000,
      unit: 'mm',
    },
  ],
  moduleIds: [
    'demolition',
    'labour-prep',
    'labour-place',
    'formwork',
    'reinforcement-slab',
    'concrete-supply',
    'concrete-pumping',
    'surface-finishing',
    'cleanup',
    'sundries',
    'margin',
  ],
  calculateVolume: (answers) => {
    const area = Number(answers.area) || 0;
    const thicknessM = (Number(answers.thickness) || 0) / 1000;
    return area * thicknessM;
  },
  defaultExclusions: [
    { id: 'engineering', text: 'Engineering design and certification', moduleId: 'suspended_slab' },
    { id: 'propping', text: 'Propping system (quoted separately)', moduleId: 'suspended_slab' },
    { id: 'permits', text: 'Council permits and approvals', moduleId: 'suspended_slab' },
  ],
};

/**
 * Architectural Concrete Scope Definition
 * Custom elements: benchtops, garden walls, tables, seats, planters
 */
export const ARCHITECTURAL_CONCRETE_SCOPE: ScopeDefinition = {
  id: 'architectural_concrete',
  name: 'Architectural Concrete',
  description: 'Custom concrete elements: benchtops, walls, furniture',
  icon: 'gem',
  questions: [
    {
      id: 'item_types',
      type: 'text',
      label: 'Item Types (comma-separated)',
      required: true,
      placeholder: 'e.g., Bench Tops, Garden Walls, Tables',
      helpText: 'List the types of items to quote',
    },
    {
      id: 'total_items',
      type: 'number',
      label: 'Total Number of Items',
      required: true,
      min: 1,
      defaultValue: 1,
    },
    {
      id: 'total_volume',
      type: 'number',
      label: 'Total Concrete Volume (m³)',
      required: true,
      min: 0.01,
      defaultValue: 0.1,
      unit: 'm³',
      helpText: 'Combined volume of all items',
    },
    {
      id: 'total_surface_area',
      type: 'number',
      label: 'Total Surface Area to Finish (m²)',
      required: true,
      min: 0.1,
      defaultValue: 2,
      unit: 'm²',
      helpText: 'Combined exposed surface area',
    },
  ],
  moduleIds: [
    'labour-prep',
    'labour-place',
    'architectural-formwork',
    'reinforcement-slab',
    'concrete-supply',
    'concrete-pumping',
    'architectural-finishing',
    'cleanup',
    'sundries',
    'margin',
  ],
  calculateVolume: (answers) => {
    return Number(answers.total_volume) || 0.1;
  },
  defaultExclusions: [
    { id: 'engineering', text: 'Structural engineering certification', moduleId: 'architectural_concrete' },
    { id: 'installation', text: 'Installation and fixing to substrate', moduleId: 'architectural_concrete' },
    { id: 'delivery', text: 'Delivery of finished items to site', moduleId: 'architectural_concrete' },
    { id: 'craneage', text: 'Crane hire for heavy items', moduleId: 'architectural_concrete' },
  ],
};

// ============= COMMERCIAL-SPECIFIC SCOPES =============

/**
 * Pad Footings Scope Definition
 * Isolated pad/spread footings for column support
 */
export const PAD_FOOTINGS_SCOPE: ScopeDefinition = {
  id: 'pad_footings',
  name: 'Pad Footings',
  description: 'Isolated pad/spread footings for columns and point loads',
  icon: 'square',
  supportsMultipleFootings: true,
  footingsLabel: 'Pad Footing Configurations',
  questions: [
    {
      id: 'total_num_pads',
      type: 'number',
      label: 'Total Number of Pad Footings',
      required: true,
      min: 1,
    },
    {
      id: 'total_length',
      type: 'number',
      label: 'Average Length (mm)',
      required: true,
      min: 100,
      unit: 'mm',
    },
    {
      id: 'total_width',
      type: 'number',
      label: 'Average Width (mm)',
      required: true,
      min: 100,
      unit: 'mm',
    },
    {
      id: 'total_depth',
      type: 'number',
      label: 'Average Depth (mm)',
      required: true,
      min: 100,
      unit: 'mm',
    },
  ],
  moduleIds: [
    'labour-prep',
    'labour-place',
    'formwork',
    'excavation',
    'reinforcement-footing',
    'concrete-supply',
    'concrete-pumping',
    'cleanup',
    'sundries',
    'margin',
  ],
  calculateVolume: (answers) => {
    const footings = answers.footings || [];
    if (footings.length > 0) {
      return footings.reduce((sum: number, footing: any) => {
        const qty = Number(footing.quantity) || 1;
        const lengthM = (Number(footing.length) || 0) / 1000;
        const widthM = (Number(footing.width) || 0) / 1000;
        const depthM = (Number(footing.depth) || 0) / 1000;
        return sum + qty * lengthM * widthM * depthM;
      }, 0);
    }
    const numPads = Number(answers.total_num_pads) || 0;
    const lengthM = (Number(answers.total_length) || 0) / 1000;
    const widthM = (Number(answers.total_width) || 0) / 1000;
    const depthM = (Number(answers.total_depth) || 0) / 1000;
    return numPads * lengthM * widthM * depthM;
  },
  defaultExclusions: [
    { id: 'engineering', text: 'Structural engineering design and certification', moduleId: 'pad_footings' },
    { id: 'setout', text: 'Survey setout of footing locations', moduleId: 'pad_footings' },
    { id: 'soil_testing', text: 'Soil bearing capacity testing', moduleId: 'pad_footings' },
    { id: 'dewatering', text: 'Dewatering if groundwater encountered', moduleId: 'pad_footings' },
  ],
};

/**
 * OSD Tank / Stormwater Scope Definition
 * On-site detention tanks and stormwater management structures
 */
export const OSD_TANK_SCOPE: ScopeDefinition = {
  id: 'osd_tank',
  name: 'OSD Tank / Stormwater',
  description: 'On-site detention tanks and stormwater pits',
  icon: 'box',
  questions: [
    {
      id: 'internal_length',
      type: 'number',
      label: 'Internal Length (mm)',
      required: true,
      min: 500,
      unit: 'mm',
      defaultValue: 3000,
    },
    {
      id: 'internal_width',
      type: 'number',
      label: 'Internal Width (mm)',
      required: true,
      min: 500,
      unit: 'mm',
      defaultValue: 2000,
    },
    {
      id: 'internal_depth',
      type: 'number',
      label: 'Internal Depth (mm)',
      required: true,
      min: 300,
      unit: 'mm',
      defaultValue: 1500,
    },
    {
      id: 'wall_thickness',
      type: 'number',
      label: 'Wall Thickness (mm)',
      required: true,
      min: 150,
      unit: 'mm',
      defaultValue: 200,
    },
    {
      id: 'base_thickness',
      type: 'number',
      label: 'Base Thickness (mm)',
      required: true,
      min: 150,
      unit: 'mm',
      defaultValue: 200,
    },
    {
      id: 'include_lid',
      type: 'boolean',
      label: 'Include Lid Slab',
      defaultValue: true,
    },
    {
      id: 'lid_thickness',
      type: 'number',
      label: 'Lid Thickness (mm)',
      min: 150,
      unit: 'mm',
      defaultValue: 200,
      showIf: (answers) => answers.include_lid === true,
    },
  ],
  moduleIds: [
    'labour-prep',
    'labour-place',
    'formwork',
    'excavation',
    'base-preparation',
    'reinforcement-slab',
    'concrete-supply',
    'concrete-pumping',
    'surface-finishing',
    'cleanup',
    'sundries',
    'margin',
  ],
  calculateVolume: (answers) => {
    const intLengthM = (Number(answers.internal_length) || 3000) / 1000;
    const intWidthM = (Number(answers.internal_width) || 2000) / 1000;
    const intDepthM = (Number(answers.internal_depth) || 1500) / 1000;
    const wallThickM = (Number(answers.wall_thickness) || 200) / 1000;
    const baseThickM = (Number(answers.base_thickness) || 200) / 1000;
    
    // External dimensions
    const extLength = intLengthM + 2 * wallThickM;
    const extWidth = intWidthM + 2 * wallThickM;
    
    // Base slab volume
    const baseVolume = extLength * extWidth * baseThickM;
    
    // Wall volume (4 walls, accounting for corners)
    const longWallsVolume = 2 * intLengthM * wallThickM * intDepthM;
    const shortWallsVolume = 2 * (intWidthM + 2 * wallThickM) * wallThickM * intDepthM;
    const wallsVolume = longWallsVolume + shortWallsVolume;
    
    // Lid volume (optional)
    let lidVolume = 0;
    if (answers.include_lid) {
      const lidThickM = (Number(answers.lid_thickness) || 200) / 1000;
      lidVolume = extLength * extWidth * lidThickM;
    }
    
    return baseVolume + wallsVolume + lidVolume;
  },
  defaultExclusions: [
    { id: 'engineering', text: 'Structural and hydraulic engineering design', moduleId: 'osd_tank' },
    { id: 'waterproofing', text: 'Tanking and waterproofing membrane', moduleId: 'osd_tank' },
    { id: 'pipework', text: 'Inlet/outlet pipework and connections', moduleId: 'osd_tank' },
    { id: 'grates', text: 'Access hatches and grates', moduleId: 'osd_tank' },
    { id: 'dewatering', text: 'Dewatering during construction', moduleId: 'osd_tank' },
    { id: 'backfill', text: 'Backfilling around tank structure', moduleId: 'osd_tank' },
  ],
};

/**
 * Kerbs & Channels Scope Definition
 * Concrete kerbing and drainage channels
 */
export const KERBS_CHANNELS_SCOPE: ScopeDefinition = {
  id: 'kerbs_channels',
  name: 'Kerbs & Channels',
  description: 'Concrete kerbing and drainage channels',
  icon: 'minus',
  supportsMultipleFootings: true,
  footingsLabel: 'Kerb Sections',
  questions: [
    {
      id: 'total_length',
      type: 'number',
      label: 'Total Length (m)',
      required: true,
      min: 1,
      unit: 'm',
    },
    {
      id: 'kerb_type',
      type: 'select',
      label: 'Kerb Profile Type',
      required: true,
      options: [
        { value: 'barrier', label: 'Barrier Kerb (150x300mm)' },
        { value: 'mountable', label: 'Mountable Kerb (150x150mm)' },
        { value: 'rollover', label: 'Roll-top Kerb (150x200mm)' },
        { value: 'channel', label: 'Channel Only (300x75mm)' },
        { value: 'kerb_channel', label: 'Kerb & Channel (450x300mm)' },
      ],
      defaultValue: 'barrier',
    },
  ],
  moduleIds: [
    'labour-prep',
    'labour-place',
    'formwork',
    'excavation',
    'concrete-supply',
    'concrete-pumping',
    'surface-finishing',
    'cleanup',
    'sundries',
    'margin',
  ],
  calculateVolume: (answers) => {
    const footings = answers.footings || [];
    let totalLength = 0;
    
    if (footings.length > 0) {
      totalLength = footings.reduce((sum: number, f: any) => sum + (Number(f.length) || 0), 0);
    } else {
      totalLength = Number(answers.total_length) || 0;
    }
    
    // Cross-sectional areas for different kerb types (in m²)
    const kerbAreas: Record<string, number> = {
      barrier: 0.15 * 0.30,        // 150mm x 300mm
      mountable: 0.15 * 0.15,      // 150mm x 150mm
      rollover: 0.15 * 0.20,       // 150mm x 200mm
      channel: 0.30 * 0.075,       // 300mm x 75mm
      kerb_channel: 0.45 * 0.30,   // 450mm x 300mm (approximate)
    };
    
    const kerbType = answers.kerb_type || 'barrier';
    const crossSectionArea = kerbAreas[kerbType] || 0.045;
    
    return totalLength * crossSectionArea;
  },
  defaultExclusions: [
    { id: 'setout', text: 'Survey setout and line marking', moduleId: 'kerbs_channels' },
    { id: 'subgrade', text: 'Subgrade preparation and compaction', moduleId: 'kerbs_channels' },
    { id: 'joints', text: 'Expansion and contraction joints', moduleId: 'kerbs_channels' },
    { id: 'drainage', text: 'Stormwater drainage connections', moduleId: 'kerbs_channels' },
  ],
};

/**
 * Concrete Stairs Scope Definition
 * Cast-in-place concrete stairways
 */
export const CONCRETE_STAIRS_SCOPE: ScopeDefinition = {
  id: 'concrete_stairs',
  name: 'Concrete Stairs',
  description: 'Cast-in-place concrete stairways',
  icon: 'stairs',
  questions: [
    {
      id: 'num_flights',
      type: 'number',
      label: 'Number of Flights',
      required: true,
      min: 1,
      defaultValue: 1,
    },
    {
      id: 'treads_per_flight',
      type: 'number',
      label: 'Treads per Flight',
      required: true,
      min: 2,
      defaultValue: 12,
    },
    {
      id: 'tread_depth',
      type: 'number',
      label: 'Tread Depth (Going) (mm)',
      required: true,
      min: 250,
      unit: 'mm',
      defaultValue: 300,
    },
    {
      id: 'riser_height',
      type: 'number',
      label: 'Riser Height (mm)',
      required: true,
      min: 150,
      unit: 'mm',
      defaultValue: 175,
    },
    {
      id: 'stair_width',
      type: 'number',
      label: 'Stair Width (mm)',
      required: true,
      min: 900,
      unit: 'mm',
      defaultValue: 1200,
    },
    {
      id: 'waist_thickness',
      type: 'number',
      label: 'Waist Thickness (mm)',
      required: true,
      min: 150,
      unit: 'mm',
      defaultValue: 200,
      helpText: 'Minimum thickness of slab under treads',
    },
    {
      id: 'include_landings',
      type: 'boolean',
      label: 'Include Landing Platforms',
      defaultValue: true,
    },
    {
      id: 'landing_area',
      type: 'number',
      label: 'Total Landing Area (m²)',
      min: 0,
      unit: 'm²',
      defaultValue: 2,
      showIf: (answers) => answers.include_landings === true,
    },
    {
      id: 'landing_thickness',
      type: 'number',
      label: 'Landing Thickness (mm)',
      min: 150,
      unit: 'mm',
      defaultValue: 200,
      showIf: (answers) => answers.include_landings === true,
    },
  ],
  moduleIds: [
    'labour-prep',
    'labour-place',
    'formwork',
    'reinforcement-slab',
    'concrete-supply',
    'concrete-pumping',
    'surface-finishing',
    'cleanup',
    'sundries',
    'margin',
  ],
  calculateVolume: (answers) => {
    const numFlights = Number(answers.num_flights) || 1;
    const treadsPerFlight = Number(answers.treads_per_flight) || 12;
    const treadDepthM = (Number(answers.tread_depth) || 300) / 1000;
    const riserHeightM = (Number(answers.riser_height) || 175) / 1000;
    const stairWidthM = (Number(answers.stair_width) || 1200) / 1000;
    const waistThickM = (Number(answers.waist_thickness) || 200) / 1000;
    
    // Flight length (horizontal run)
    const flightLength = treadsPerFlight * treadDepthM;
    // Flight rise (vertical)
    const flightRise = treadsPerFlight * riserHeightM;
    // Stair slope length (hypotenuse)
    const slopeLength = Math.sqrt(flightLength * flightLength + flightRise * flightRise);
    
    // Waist slab volume (base slab following slope)
    const waistVolume = slopeLength * stairWidthM * waistThickM;
    
    // Tread/riser volume (triangular sections on top of waist)
    // Each tread adds approximately half a rectangular prism
    const treadRiserVolume = treadsPerFlight * (treadDepthM * riserHeightM * stairWidthM) / 2;
    
    // Total flight volume
    const flightVolume = (waistVolume + treadRiserVolume) * numFlights;
    
    // Landing volume
    let landingVolume = 0;
    if (answers.include_landings) {
      const landingAreaM2 = Number(answers.landing_area) || 2;
      const landingThickM = (Number(answers.landing_thickness) || 200) / 1000;
      landingVolume = landingAreaM2 * landingThickM;
    }
    
    return flightVolume + landingVolume;
  },
  defaultExclusions: [
    { id: 'engineering', text: 'Structural engineering design', moduleId: 'concrete_stairs' },
    { id: 'handrails', text: 'Handrails and balustrades', moduleId: 'concrete_stairs' },
    { id: 'nosings', text: 'Stair nosing strips', moduleId: 'concrete_stairs' },
    { id: 'propping', text: 'Temporary propping (if suspended)', moduleId: 'concrete_stairs' },
    { id: 'finishes', text: 'Tiled or other surface finishes', moduleId: 'concrete_stairs' },
  ],
};

/**
 * Retaining Walls Scope Definition
 * Full retaining wall construction including footing
 */
export const RETAINING_WALLS_SCOPE: ScopeDefinition = {
  id: 'retaining_walls',
  name: 'Retaining Walls',
  description: 'Full retaining wall construction',
  icon: 'layers',
  supportsMultipleFootings: true,
  footingsLabel: 'Wall Sections',
  questions: [
    {
      id: 'total_length',
      type: 'number',
      label: 'Total Wall Length (m)',
      required: true,
      min: 1,
      unit: 'm',
    },
    {
      id: 'wall_height',
      type: 'number',
      label: 'Wall Height (mm)',
      required: true,
      min: 300,
      unit: 'mm',
      defaultValue: 1200,
    },
    {
      id: 'wall_thickness',
      type: 'number',
      label: 'Wall Thickness (mm)',
      required: true,
      min: 150,
      unit: 'mm',
      defaultValue: 200,
    },
    {
      id: 'include_footing',
      type: 'boolean',
      label: 'Include Strip Footing',
      defaultValue: true,
    },
    {
      id: 'footing_width',
      type: 'number',
      label: 'Footing Width (mm)',
      min: 300,
      unit: 'mm',
      defaultValue: 600,
      showIf: (answers) => answers.include_footing === true,
    },
    {
      id: 'footing_depth',
      type: 'number',
      label: 'Footing Depth (mm)',
      min: 200,
      unit: 'mm',
      defaultValue: 300,
      showIf: (answers) => answers.include_footing === true,
    },
  ],
  moduleIds: [
    'labour-prep',
    'labour-place',
    'formwork',
    'excavation',
    'reinforcement-slab',
    'concrete-supply',
    'concrete-pumping',
    'surface-finishing',
    'cleanup',
    'sundries',
    'margin',
  ],
  calculateVolume: (answers) => {
    const footings = answers.footings || [];
    let totalLength = 0;
    
    if (footings.length > 0) {
      totalLength = footings.reduce((sum: number, f: any) => sum + (Number(f.length) || 0), 0);
    } else {
      totalLength = Number(answers.total_length) || 0;
    }
    
    const wallHeightM = (Number(answers.wall_height) || 1200) / 1000;
    const wallThickM = (Number(answers.wall_thickness) || 200) / 1000;
    
    // Wall volume
    const wallVolume = totalLength * wallHeightM * wallThickM;
    
    // Footing volume
    let footingVolume = 0;
    if (answers.include_footing) {
      const footingWidthM = (Number(answers.footing_width) || 600) / 1000;
      const footingDepthM = (Number(answers.footing_depth) || 300) / 1000;
      footingVolume = totalLength * footingWidthM * footingDepthM;
    }
    
    return wallVolume + footingVolume;
  },
  defaultExclusions: [
    { id: 'engineering', text: 'Structural engineering and geotechnical design', moduleId: 'retaining_walls' },
    { id: 'drainage', text: 'Weep holes and agricultural drain installation', moduleId: 'retaining_walls' },
    { id: 'waterproofing', text: 'Waterproofing membrane to rear face', moduleId: 'retaining_walls' },
    { id: 'backfill', text: 'Backfilling with drainage aggregate', moduleId: 'retaining_walls' },
    { id: 'capping', text: 'Capping or coping to top of wall', moduleId: 'retaining_walls' },
  ],
};

/**
 * Pit Bases Scope Definition
 * Pump pits, lift pits, sump bases
 */
export const PIT_BASES_SCOPE: ScopeDefinition = {
  id: 'pit_bases',
  name: 'Pit Bases',
  description: 'Pump pits, lift pits, sump bases',
  icon: 'box',
  supportsMultipleFootings: true,
  footingsLabel: 'Pit Configurations',
  questions: [
    {
      id: 'total_num_pits',
      type: 'number',
      label: 'Total Number of Pits',
      required: true,
      min: 1,
    },
    {
      id: 'pit_length',
      type: 'number',
      label: 'Average Pit Length (mm)',
      required: true,
      min: 300,
      unit: 'mm',
      defaultValue: 1000,
    },
    {
      id: 'pit_width',
      type: 'number',
      label: 'Average Pit Width (mm)',
      required: true,
      min: 300,
      unit: 'mm',
      defaultValue: 800,
    },
    {
      id: 'base_thickness',
      type: 'number',
      label: 'Base Thickness (mm)',
      required: true,
      min: 100,
      unit: 'mm',
      defaultValue: 150,
    },
    {
      id: 'include_walls',
      type: 'boolean',
      label: 'Include Pit Walls',
      defaultValue: false,
    },
    {
      id: 'wall_height',
      type: 'number',
      label: 'Wall Height (mm)',
      min: 200,
      unit: 'mm',
      defaultValue: 600,
      showIf: (answers) => answers.include_walls === true,
    },
    {
      id: 'wall_thickness',
      type: 'number',
      label: 'Wall Thickness (mm)',
      min: 100,
      unit: 'mm',
      defaultValue: 150,
      showIf: (answers) => answers.include_walls === true,
    },
  ],
  moduleIds: [
    'labour-prep',
    'labour-place',
    'formwork',
    'excavation',
    'base-preparation',
    'reinforcement-slab',
    'concrete-supply',
    'concrete-pumping',
    'cleanup',
    'sundries',
    'margin',
  ],
  calculateVolume: (answers) => {
    const footings = answers.footings || [];
    let totalPits = 0;
    let avgLength = 0;
    let avgWidth = 0;
    
    if (footings.length > 0) {
      totalPits = footings.reduce((sum: number, f: any) => sum + (Number(f.quantity) || 1), 0);
      // Use first config as representative (simplified)
      avgLength = (Number(footings[0]?.length) || 1000) / 1000;
      avgWidth = (Number(footings[0]?.width) || 800) / 1000;
    } else {
      totalPits = Number(answers.total_num_pits) || 1;
      avgLength = (Number(answers.pit_length) || 1000) / 1000;
      avgWidth = (Number(answers.pit_width) || 800) / 1000;
    }
    
    const baseThickM = (Number(answers.base_thickness) || 150) / 1000;
    
    // Base volume
    const baseVolume = totalPits * avgLength * avgWidth * baseThickM;
    
    // Wall volume
    let wallVolume = 0;
    if (answers.include_walls) {
      const wallHeightM = (Number(answers.wall_height) || 600) / 1000;
      const wallThickM = (Number(answers.wall_thickness) || 150) / 1000;
      const perimeter = 2 * (avgLength + avgWidth);
      wallVolume = totalPits * perimeter * wallHeightM * wallThickM;
    }
    
    return baseVolume + wallVolume;
  },
  defaultExclusions: [
    { id: 'engineering', text: 'Structural engineering design', moduleId: 'pit_bases' },
    { id: 'waterproofing', text: 'Waterproofing and tanking', moduleId: 'pit_bases' },
    { id: 'penetrations', text: 'Pipe penetrations and puddle flanges', moduleId: 'pit_bases' },
    { id: 'grates', text: 'Grates and access covers', moduleId: 'pit_bases' },
    { id: 'pumps', text: 'Pump equipment and pipework', moduleId: 'pit_bases' },
  ],
};

/**
 * Bollards Scope Definition
 * Concrete bollards for car parks and barriers
 */
export const BOLLARDS_SCOPE: ScopeDefinition = {
  id: 'bollards',
  name: 'Bollards',
  description: 'Concrete bollards for car parks and barriers',
  icon: 'cylinder',
  questions: [
    {
      id: 'num_bollards',
      type: 'number',
      label: 'Number of Bollards',
      required: true,
      min: 1,
      defaultValue: 4,
    },
    {
      id: 'diameter',
      type: 'number',
      label: 'Bollard Diameter (mm)',
      required: true,
      min: 150,
      unit: 'mm',
      defaultValue: 200,
    },
    {
      id: 'height_above',
      type: 'number',
      label: 'Height Above Ground (mm)',
      required: true,
      min: 300,
      unit: 'mm',
      defaultValue: 900,
    },
    {
      id: 'embedment_depth',
      type: 'number',
      label: 'Embedment Depth (mm)',
      required: true,
      min: 200,
      unit: 'mm',
      defaultValue: 400,
      helpText: 'Depth of bollard below ground/slab level',
    },
    {
      id: 'footing_diameter',
      type: 'number',
      label: 'Footing Diameter (mm)',
      required: true,
      min: 200,
      unit: 'mm',
      defaultValue: 400,
      helpText: 'Diameter of concrete base around embedment',
    },
  ],
  moduleIds: [
    'labour-prep',
    'labour-place',
    'excavation',
    'reinforcement-piers',
    'concrete-supply',
    'cleanup',
    'sundries',
    'margin',
  ],
  calculateVolume: (answers) => {
    const numBollards = Number(answers.num_bollards) || 4;
    const bollardDiamM = (Number(answers.diameter) || 200) / 1000;
    const heightAboveM = (Number(answers.height_above) || 900) / 1000;
    const embedDepthM = (Number(answers.embedment_depth) || 400) / 1000;
    const footingDiamM = (Number(answers.footing_diameter) || 400) / 1000;
    
    const bollardRadius = bollardDiamM / 2;
    const footingRadius = footingDiamM / 2;
    
    // Bollard column volume (above + embedment at bollard diameter)
    const totalHeight = heightAboveM + embedDepthM;
    const bollardVolume = Math.PI * bollardRadius * bollardRadius * totalHeight;
    
    // Additional footing volume around embedment (larger diameter base)
    const footingVolume = Math.PI * footingRadius * footingRadius * embedDepthM;
    // Subtract the bollard portion already counted
    const additionalFootingVolume = footingVolume - (Math.PI * bollardRadius * bollardRadius * embedDepthM);
    
    return numBollards * (bollardVolume + Math.max(0, additionalFootingVolume));
  },
  defaultExclusions: [
    { id: 'engineering', text: 'Engineering design for impact loading', moduleId: 'bollards' },
    { id: 'paint', text: 'Safety painting and line marking', moduleId: 'bollards' },
    { id: 'sleeves', text: 'Removable bollard sleeves', moduleId: 'bollards' },
    { id: 'reflectors', text: 'Reflective tape or caps', moduleId: 'bollards' },
  ],
};

// Registry of all scopes - keys must match ScopeType in ScopeSelector.tsx
export const SCOPE_REGISTRY: Record<string, ScopeDefinition> = {
  piers: PIERS_SCOPE,
  standard_slab: STANDARD_SLAB_SCOPE,
  raft_slab: RAFT_SLAB_SCOPE,
  waffle_pod: WAFFLE_POD_SCOPE,
  driveway: DRIVEWAY_SCOPE,
  crossovers: CROSSOVERS_SCOPE,
  paths_surrounds: PATHS_SURROUNDS_SCOPE,
  strip_footings: STRIP_FOOTINGS_SCOPE,
  retaining_wall_footings: RETAINING_WALL_FOOTINGS_SCOPE,
  suspended_slab: SUSPENDED_SLAB_SCOPE,
  architectural_concrete: ARCHITECTURAL_CONCRETE_SCOPE,
  // Commercial-specific scopes
  pad_footings: PAD_FOOTINGS_SCOPE,
  osd_tank: OSD_TANK_SCOPE,
  kerbs_channels: KERBS_CHANNELS_SCOPE,
  concrete_stairs: CONCRETE_STAIRS_SCOPE,
  retaining_walls: RETAINING_WALLS_SCOPE,
  pit_bases: PIT_BASES_SCOPE,
  bollards: BOLLARDS_SCOPE,
};

// Get scope by ID
export function getScopeById(scopeId: string): ScopeDefinition | undefined {
  return SCOPE_REGISTRY[scopeId];
}

// Get all available scopes
export function getAllScopes(): ScopeDefinition[] {
  return Object.values(SCOPE_REGISTRY);
}
