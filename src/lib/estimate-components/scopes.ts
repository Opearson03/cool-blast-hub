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
    'labour',
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
    'labour',
    'formwork',
    'excavation',
    'base-preparation',
    'reinforcement-slab',
    'dowels',
    'joints-foam',
    'joints-expansion',
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
    {
      id: 'internal_beams_length',
      type: 'number',
      label: 'Total Internal Beam Length (m)',
      required: false,
      min: 0,
      defaultValue: 0,
      unit: 'm',
      helpText: 'Combined length of all internal stiffening beams (if any)',
    },
    {
      id: 'internal_beam_width',
      type: 'number',
      label: 'Internal Beam Width (mm)',
      required: false,
      min: 200,
      defaultValue: 300,
      unit: 'mm',
      helpText: 'Width of internal stiffening beams',
    },
    {
      id: 'internal_beam_depth',
      type: 'number',
      label: 'Internal Beam Depth (mm)',
      required: false,
      min: 200,
      defaultValue: 400,
      unit: 'mm',
      helpText: 'Depth of internal stiffening beams',
    },
  ],
  moduleIds: [
    'labour',
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

    // Internal beams volume (if any)
    const internalLength = Number(answers.internal_beams_length) || 0;
    const internalWidthM = (Number(answers.internal_beam_width) || 300) / 1000;
    const internalDepthM = (Number(answers.internal_beam_depth) || 400) / 1000;
    const internalExtraDepth = Math.max(0, internalDepthM - thicknessM);
    const internalBeamVolume = internalLength * internalWidthM * internalExtraDepth;

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
    'labour',
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
  ],
  moduleIds: [
    'labour',
    'formwork',
    'excavation',
    'base-preparation',
    'reinforcement-slab',
    'dowels',
    'joints-foam',
    'joints-expansion',
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
    return area * thicknessM;
  },
  defaultExclusions: [
    { id: 'permits', text: 'Council permits and approvals', moduleId: 'driveway' },
    { id: 'demolition', text: 'Demolition and removal of existing driveway', moduleId: 'driveway' },
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
    'labour',
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
    'labour',
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
    'labour',
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
    'labour',
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
    'labour',
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
    'labour',
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
};

// Get scope by ID
export function getScopeById(scopeId: string): ScopeDefinition | undefined {
  return SCOPE_REGISTRY[scopeId];
}

// Get all available scopes
export function getAllScopes(): ScopeDefinition[] {
  return Object.values(SCOPE_REGISTRY);
}
