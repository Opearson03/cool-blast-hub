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
  questions: [
    {
      id: 'num_piers',
      type: 'number',
      label: 'Number of Piers',
      required: true,
      min: 1,
      defaultValue: 1,
    },
    {
      id: 'diameter',
      type: 'number',
      label: 'Diameter of piers (mm)',
      required: true,
      min: 100,
      defaultValue: 450,
      unit: 'mm',
    },
    {
      id: 'depth',
      type: 'number',
      label: 'Depth of piers (mm)',
      required: true,
      min: 100,
      defaultValue: 600,
      unit: 'mm',
    },
  ],
  moduleIds: [
    'formwork',
    'excavation',
    'reinforcement',
    'concrete-supply',
    'concrete-placement',
    'concrete-pumping',
    'cleanup',
    'sundries',
    'margin',
  ],
  calculateVolume: (answers) => {
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
    'formwork',
    'excavation',
    'reinforcement',
    'concrete-supply',
    'concrete-placement',
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
    },
    {
      id: 'edge_beam_depth',
      type: 'number',
      label: 'Edge Beam Depth (mm)',
      required: true,
      min: 200,
      defaultValue: 450,
      unit: 'mm',
    },
  ],
  moduleIds: [
    'formwork',
    'excavation',
    'reinforcement',
    'concrete-supply',
    'concrete-placement',
    'concrete-pumping',
    'surface-finishing',
    'cleanup',
    'sundries',
    'margin',
  ],
  calculateVolume: (answers) => {
    const area = Number(answers.area) || 0;
    const thicknessM = (Number(answers.thickness) || 0) / 1000;
    // Simplified calculation - actual would include edge beams
    return area * thicknessM;
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
    },
  ],
  moduleIds: [
    'formwork',
    'reinforcement',
    'concrete-supply',
    'concrete-placement',
    'concrete-pumping',
    'surface-finishing',
    'cleanup',
    'sundries',
    'margin',
  ],
  calculateVolume: (answers) => {
    // Waffle pod volume calculation is complex - simplified version
    const area = Number(answers.area) || 0;
    return area * 0.085; // Approximate average for waffle pod
  },
  defaultExclusions: [
    { id: 'engineering', text: 'Engineering design and certification', moduleId: 'waffle_pod' },
    { id: 'permits', text: 'Council permits and approvals', moduleId: 'waffle_pod' },
    { id: 'site_prep', text: 'Site preparation and leveling', moduleId: 'waffle_pod' },
  ],
};

/**
 * Driveway Scope Definition
 */
export const DRIVEWAY_SCOPE: ScopeDefinition = {
  id: 'driveway',
  name: 'Driveway',
  description: 'Concrete driveway installation',
  icon: 'car',
  questions: [
    {
      id: 'area',
      type: 'number',
      label: 'Driveway Area (m²)',
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
      label: 'Thickness (mm)',
      required: true,
      min: 75,
      defaultValue: 100,
      unit: 'mm',
    },
  ],
  moduleIds: [
    'formwork',
    'excavation',
    'reinforcement',
    'concrete-supply',
    'concrete-placement',
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
    { id: 'permits', text: 'Council permits and approvals', moduleId: 'driveway' },
    { id: 'demolition', text: 'Demolition and removal of existing driveway', moduleId: 'driveway' },
  ],
};

/**
 * Crossovers Scope Definition
 */
export const CROSSOVERS_SCOPE: ScopeDefinition = {
  id: 'crossovers',
  name: 'Crossovers',
  description: 'Vehicle crossover/layback installation',
  icon: 'move-horizontal',
  questions: [
    {
      id: 'area',
      type: 'number',
      label: 'Crossover Area (m²)',
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
      label: 'Thickness (mm)',
      required: true,
      min: 100,
      defaultValue: 125,
      unit: 'mm',
    },
  ],
  moduleIds: [
    'formwork',
    'excavation',
    'reinforcement',
    'concrete-supply',
    'concrete-placement',
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
 */
export const PATHS_SURROUNDS_SCOPE: ScopeDefinition = {
  id: 'paths_surrounds',
  name: 'Paths & Surrounds',
  description: 'Concrete pathways and house surrounds',
  icon: 'footprints',
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
      label: 'Perimeter (m)',
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
    'formwork',
    'excavation',
    'reinforcement',
    'concrete-supply',
    'concrete-placement',
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
    { id: 'excavation', text: 'Excavation and soil removal', moduleId: 'paths_surrounds' },
  ],
};

/**
 * Strip Footings Scope Definition
 */
export const STRIP_FOOTINGS_SCOPE: ScopeDefinition = {
  id: 'strip_footings',
  name: 'Strip Footings',
  description: 'Strip footing foundations',
  icon: 'minus',
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
      id: 'width',
      type: 'number',
      label: 'Width (mm)',
      required: true,
      min: 200,
      defaultValue: 450,
      unit: 'mm',
    },
    {
      id: 'depth',
      type: 'number',
      label: 'Depth (mm)',
      required: true,
      min: 200,
      defaultValue: 300,
      unit: 'mm',
    },
  ],
  moduleIds: [
    'formwork',
    'excavation',
    'reinforcement',
    'concrete-supply',
    'concrete-placement',
    'concrete-pumping',
    'cleanup',
    'sundries',
    'margin',
  ],
  calculateVolume: (answers) => {
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
 */
export const RETAINING_WALL_FOOTINGS_SCOPE: ScopeDefinition = {
  id: 'retaining_wall_footings',
  name: 'Retaining Wall Footings',
  description: 'Retaining wall footing foundations',
  icon: 'brick-wall',
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
      id: 'footing_width',
      type: 'number',
      label: 'Footing Width (mm)',
      required: true,
      min: 300,
      defaultValue: 600,
      unit: 'mm',
    },
    {
      id: 'footing_depth',
      type: 'number',
      label: 'Footing Depth (mm)',
      required: true,
      min: 200,
      defaultValue: 300,
      unit: 'mm',
    },
  ],
  moduleIds: [
    'formwork',
    'excavation',
    'reinforcement',
    'concrete-supply',
    'concrete-placement',
    'concrete-pumping',
    'cleanup',
    'sundries',
    'margin',
  ],
  calculateVolume: (answers) => {
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
    'formwork',
    'reinforcement',
    'concrete-supply',
    'concrete-placement',
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
};

// Get scope by ID
export function getScopeById(scopeId: string): ScopeDefinition | undefined {
  return SCOPE_REGISTRY[scopeId];
}

// Get all available scopes
export function getAllScopes(): ScopeDefinition[] {
  return Object.values(SCOPE_REGISTRY);
}
