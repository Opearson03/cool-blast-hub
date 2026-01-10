// Module registry - exports all available estimate modules

export { formworkModule } from './formwork';
export { excavationModule } from './excavation';
export { reinforcementModule } from './reinforcement';
export { concreteSupplyModule } from './concrete-supply';
export { concretePlacementModule } from './concrete-placement';
export { concretePumpingModule } from './concrete-pumping';
export { surfaceFinishingModule } from './surface-finishing';
export { architecturalFormworkModule } from './architectural-formwork';
export { architecturalFinishingModule } from './architectural-finishing';
export { cleanupModule } from './cleanup';
export { sundriesModule } from './sundries';
export { marginModule } from './margin';

import { formworkModule } from './formwork';
import { excavationModule } from './excavation';
import { reinforcementModule } from './reinforcement';
import { concreteSupplyModule } from './concrete-supply';
import { concretePlacementModule } from './concrete-placement';
import { concretePumpingModule } from './concrete-pumping';
import { surfaceFinishingModule } from './surface-finishing';
import { architecturalFormworkModule } from './architectural-formwork';
import { architecturalFinishingModule } from './architectural-finishing';
import { cleanupModule } from './cleanup';
import { sundriesModule } from './sundries';
import { marginModule } from './margin';
import type { EstimateModule } from '../types';

/**
 * Registry of all available modules
 */
export const MODULE_REGISTRY: Record<string, EstimateModule> = {
  'formwork': formworkModule,
  'excavation': excavationModule,
  'reinforcement': reinforcementModule,
  'concrete-supply': concreteSupplyModule,
  'concrete-placement': concretePlacementModule,
  'concrete-pumping': concretePumpingModule,
  'surface-finishing': surfaceFinishingModule,
  'architectural-formwork': architecturalFormworkModule,
  'architectural-finishing': architecturalFinishingModule,
  'cleanup': cleanupModule,
  'sundries': sundriesModule,
  'margin': marginModule,
};

/**
 * Get a module by ID
 */
export function getModule(moduleId: string): EstimateModule | undefined {
  return MODULE_REGISTRY[moduleId];
}

/**
 * Get multiple modules by IDs
 */
export function getModules(moduleIds: string[]): EstimateModule[] {
  return moduleIds.map(id => MODULE_REGISTRY[id]).filter(Boolean);
}
