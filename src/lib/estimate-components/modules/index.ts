// Module registry - exports all available estimate modules

export { formworkModule } from './formwork';
export { excavationModule } from './excavation';
export { basePreparationModule } from './base-preparation';
export { reinforcementPiersModule } from './reinforcement-piers';
export { reinforcementSlabModule } from './reinforcement-slab';
export { reinforcementFootingModule } from './reinforcement-footing';
export { reinforcementPadModule } from './reinforcement-pad';
export { reinforcementRaftModule } from './reinforcement-raft';
export { connectionsJointsModule } from './connections-joints';
export { concreteSupplyModule } from './concrete-supply';
export { labourModule } from './labour';
export { labourPrepModule } from './labour-prep';
export { labourPlaceModule } from './labour-place';
export { concretePumpingModule } from './concrete-pumping';
export { surfaceFinishingModule } from './surface-finishing';
export { jointsControlModule } from './joints-control';
export { jointsKeyModule } from './joints-key';
export { architecturalFormworkModule } from './architectural-formwork';
export { architecturalFinishingModule } from './architectural-finishing';
export { cleanupModule } from './cleanup';
export { sundriesModule } from './sundries';
export { marginModule } from './margin';
export { plumbingModule } from './plumbing';
export { demolitionModule } from './demolition';
export { extraItemsModule } from './extra-items';

import { formworkModule } from './formwork';
import { excavationModule } from './excavation';
import { basePreparationModule } from './base-preparation';
import { reinforcementPiersModule } from './reinforcement-piers';
import { reinforcementSlabModule } from './reinforcement-slab';
import { reinforcementFootingModule } from './reinforcement-footing';
import { reinforcementPadModule } from './reinforcement-pad';
import { reinforcementRaftModule } from './reinforcement-raft';
import { connectionsJointsModule } from './connections-joints';
import { concreteSupplyModule } from './concrete-supply';
import { labourModule } from './labour';
import { labourPrepModule } from './labour-prep';
import { labourPlaceModule } from './labour-place';
import { concretePumpingModule } from './concrete-pumping';
import { surfaceFinishingModule } from './surface-finishing';
import { jointsControlModule } from './joints-control';
import { jointsKeyModule } from './joints-key';
import { architecturalFormworkModule } from './architectural-formwork';
import { architecturalFinishingModule } from './architectural-finishing';
import { cleanupModule } from './cleanup';
import { sundriesModule } from './sundries';
import { marginModule } from './margin';
import { plumbingModule } from './plumbing';
import { demolitionModule } from './demolition';
import { extraItemsModule } from './extra-items';
import type { EstimateModule } from '../types';

/**
 * Registry of all available modules
 */
export const MODULE_REGISTRY: Record<string, EstimateModule> = {
  'formwork': formworkModule,
  'excavation': excavationModule,
  'base-preparation': basePreparationModule,
  'reinforcement': reinforcementPiersModule,
  'reinforcement-piers': reinforcementPiersModule,
  'reinforcement-slab': reinforcementSlabModule,
  'reinforcement-footing': reinforcementFootingModule,
  'reinforcement-pad': reinforcementPadModule,
  'reinforcement-raft': reinforcementRaftModule,
  'connections-joints': connectionsJointsModule,
  'concrete-supply': concreteSupplyModule,
  'labour': labourModule,
  'labour-prep': labourPrepModule,
  'labour-place': labourPlaceModule,
  'concrete-pumping': concretePumpingModule,
  'surface-finishing': surfaceFinishingModule,
  'joints-control': jointsControlModule,
  'joints-key': jointsKeyModule,
  'architectural-formwork': architecturalFormworkModule,
  'architectural-finishing': architecturalFinishingModule,
  'cleanup': cleanupModule,
  'sundries': sundriesModule,
  'margin': marginModule,
  'plumbing': plumbingModule,
  'demolition': demolitionModule,
  'extra-items': extraItemsModule,
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
