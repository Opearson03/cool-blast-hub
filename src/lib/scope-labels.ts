// Centralized scope labels used across the application
export const SCOPE_LABELS: Record<string, string> = {
  standard_slab: "Slab on Ground",
  raft_slab: "Raft Slab",
  waffle_pod: "Waffle Pod",
  strip_footings: "Strip Footings",
  piers: "Piers",
  suspended_slab: "Suspended Slab",
  crossovers: "Crossover",
  driveway: "Driveway",
  paths_surrounds: "Paths & Surrounds",
  retaining_wall: "Retaining Wall",
  architectural: "Architectural Concrete",
};

export const ALL_SCOPE_KEYS = Object.keys(SCOPE_LABELS);
