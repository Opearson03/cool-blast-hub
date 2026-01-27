export interface TakeoffPoint {
  x: number;
  y: number;
}

export interface TakeoffFile {
  id: string;
  takeoff_id: string;
  file_url: string;
  file_type: 'pdf' | 'image';
  file_name: string;
  page_count: number;
  sort_order: number;
  created_at: string;
}

export interface PageScale {
  id: string;
  file_id: string;
  page_number: number;
  scale_pixels_per_meter: number;
  created_at: string;
}

export interface TakeoffMarkup {
  id: string;
  takeoff_id: string;
  file_id: string | null;
  scope_id: string;
  name: string | null;
  shape_type: 'polygon' | 'rectangle' | 'point' | 'polyline';
  points: TakeoffPoint[];
  area_sqm: number | null;
  perimeter_m: number | null;
  color: string;
  page_number: number;
  created_at: string;
  // Pier/bollard-specific fields
  diameter_mm?: number | null;
  depth_mm?: number | null;
  pier_quantity?: number | null;
  // Linear element fields
  width_mm?: number | null;
  height_mm?: number | null;
  length_m?: number | null;
  toe_mm?: number | null;
  // Parent-child relationship for slab beams
  parent_markup_id?: string | null;
  markup_type?: 'primary' | 'edge_beam' | 'internal_beam' | 'thickening';
}

export interface EstimateTakeoff {
  id: string;
  estimate_id: string;
  plan_url: string | null; // Deprecated - kept for backwards compatibility
  plan_type: 'pdf' | 'image' | null; // Deprecated
  page_count: number;
  current_page: number;
  created_at: string;
  updated_at: string;
}

export interface TakeoffState {
  takeoff: EstimateTakeoff | null;
  files: TakeoffFile[];
  pageScales: PageScale[];
  markups: TakeoffMarkup[];
  currentFileId: string | null;
  isLoading: boolean;
}

export interface DrawingTool {
  type: 'polygon' | 'rectangle' | 'select' | 'pan' | 'calibrate' | 'point' | 'polyline';
}

// Scope type classifications for takeoff tool selection
export const POINT_SCOPES = ['piers', 'bollards', 'pit_bases', 'pad_footings'] as const;
export const LINEAR_SCOPES = ['strip_footings', 'retaining_wall_footings', 'kerbs_channels', 'retaining_walls'] as const;
export const AREA_SCOPES = ['standard_slab', 'raft_slab', 'waffle_pod', 'driveway', 'crossovers', 'paths_surrounds', 'suspended_slab'] as const;

// Waffle Pod specific point scopes for counting pods and spacers
export const WAFFLE_POD_POINT_SCOPES = ['waffle_pods_count', 'spacers_4way', 'spacers_2way'] as const;
export type WafflePodPointScope = typeof WAFFLE_POD_POINT_SCOPES[number];

export function isWafflePodPointScope(scopeId: string): scopeId is WafflePodPointScope {
  return WAFFLE_POD_POINT_SCOPES.includes(scopeId as WafflePodPointScope);
}

// Scopes that support sub-element marking (beams over slabs)
export const SLAB_WITH_BEAMS_SCOPES = ['raft_slab', 'waffle_pod', 'driveway', 'crossovers', 'paths_surrounds', 'standard_slab'] as const;
export type SlabWithBeamsScope = typeof SLAB_WITH_BEAMS_SCOPES[number];

export function isSlabWithBeamsScope(scopeId: string): scopeId is SlabWithBeamsScope {
  return SLAB_WITH_BEAMS_SCOPES.includes(scopeId as SlabWithBeamsScope);
}

export type PointScope = typeof POINT_SCOPES[number];
export type LinearScope = typeof LINEAR_SCOPES[number];
export type AreaScope = typeof AREA_SCOPES[number];

export function isPointScope(scopeId: string): scopeId is PointScope {
  return POINT_SCOPES.includes(scopeId as PointScope);
}

export function isLinearScope(scopeId: string): scopeId is LinearScope {
  return LINEAR_SCOPES.includes(scopeId as LinearScope);
}

export function isAreaScope(scopeId: string): scopeId is AreaScope {
  return AREA_SCOPES.includes(scopeId as AreaScope);
}

// Calculate polyline length from points
export function calculatePolylineLength(points: TakeoffPoint[], pixelsPerMeter: number): number {
  if (points.length < 2) return 0;
  
  let length = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  const metersPerPixel = 1 / pixelsPerMeter;
  return length * metersPerPixel;
}

export interface ScopeMarkupStatus {
  scope_id: string;
  label: string;
  status: 'unmarked' | 'marked' | 'skipped';
  area_sqm: number | null;
  markup_id?: string;
}

// Utility functions for area calculation
export function calculatePolygonArea(points: TakeoffPoint[], pixelsPerMeter: number): number {
  if (points.length < 3) return 0;
  
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  const pixelArea = Math.abs(area) / 2;
  const metersPerPixel = 1 / pixelsPerMeter;
  return pixelArea * metersPerPixel * metersPerPixel;
}

export function calculatePolygonPerimeter(points: TakeoffPoint[], pixelsPerMeter: number): number {
  if (points.length < 2) return 0;
  
  let perimeter = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const dx = points[j].x - points[i].x;
    const dy = points[j].y - points[i].y;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }
  const metersPerPixel = 1 / pixelsPerMeter;
  return perimeter * metersPerPixel;
}

export function calculateRectangleArea(points: TakeoffPoint[], pixelsPerMeter: number): number {
  if (points.length !== 2) return 0;
  
  const width = Math.abs(points[1].x - points[0].x);
  const height = Math.abs(points[1].y - points[0].y);
  const pixelArea = width * height;
  const metersPerPixel = 1 / pixelsPerMeter;
  return pixelArea * metersPerPixel * metersPerPixel;
}

export function calculateRectanglePerimeter(points: TakeoffPoint[], pixelsPerMeter: number): number {
  if (points.length !== 2) return 0;
  
  const width = Math.abs(points[1].x - points[0].x);
  const height = Math.abs(points[1].y - points[0].y);
  const pixelPerimeter = 2 * (width + height);
  const metersPerPixel = 1 / pixelsPerMeter;
  return pixelPerimeter * metersPerPixel;
}

// Generate a color for a scope based on its index
const SCOPE_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#f97316', // orange
];

export function getScopeColor(index: number): string {
  // Handle negative indices (scope not found in selectedScopes)
  const safeIndex = index < 0 ? 0 : index;
  return SCOPE_COLORS[safeIndex % SCOPE_COLORS.length];
}
