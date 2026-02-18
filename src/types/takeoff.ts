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
  toe_mm?: number | null; // Deprecated - use toe_width_mm and toe_depth_mm
  toe_width_mm?: number | null;
  toe_depth_mm?: number | null;
  // Parent-child relationship for slab beams
  parent_markup_id?: string | null;
  markup_type?: 'primary' | 'edge_beam' | 'internal_beam' | 'thickening' | 'cutout';
  // Waffle pod counting data
  pod_count?: number | null;
  pod_thickness_mm?: number | null;
  spacer_4way_count?: number | null;
  spacer_2way_count?: number | null;
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
export const LINEAR_SCOPES = ['strip_footings', 'retaining_wall_footings', 'kerbs_channels', 'retaining_walls', 'expansion_joints', 'control_joints', 'kerb', 'insitu_walls'] as const;
export const AREA_SCOPES = ['standard_slab', 'raft_slab', 'waffle_pod', 'driveway', 'crossovers', 'paths_surrounds', 'suspended_slab', 'pool_surround'] as const;

// Waffle Pod specific point scopes for counting pods and spacers
export const WAFFLE_POD_POINT_SCOPES = ['waffle_pods_count', 'spacers_4way', 'spacers_2way'] as const;
export type WafflePodPointScope = typeof WAFFLE_POD_POINT_SCOPES[number];

export function isWafflePodPointScope(scopeId: string): scopeId is WafflePodPointScope {
  return WAFFLE_POD_POINT_SCOPES.includes(scopeId as WafflePodPointScope);
}

// Scopes that support sub-element marking (beams over slabs)
export const SLAB_WITH_BEAMS_SCOPES = ['raft_slab', 'waffle_pod', 'driveway', 'crossovers', 'paths_surrounds', 'standard_slab', 'pool_surround'] as const;
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

/**
 * Calculate polygon area using grid-based subdivision for accurate measurement
 * of complex shapes (L-shapes, irregular polygons, etc.)
 * 
 * This is the authoritative area calculation method that replaces the simple
 * shoelace formula for volume calculations.
 * 
 * @param points - Polygon vertices in pixel coordinates
 * @param pixelsPerMeter - Scale factor (pixels per meter)
 * @param cellSizeMm - Grid cell size in mm (default 500mm)
 * @returns Area in square meters
 */
export function calculatePolygonAreaGrid(
  points: TakeoffPoint[],
  pixelsPerMeter: number,
  cellSizeMm: number = 500
): number {
  // Import the grid area estimator dynamically to avoid circular dependencies
  // The actual implementation is in src/lib/takeoff/gridArea.ts
  if (points.length < 3 || pixelsPerMeter <= 0) return 0;
  
  const metersPerPixel = 1 / pixelsPerMeter;
  
  // Grid-based area estimation with 9-point sampling per cell
  const cellSizeM = cellSizeMm / 1000;
  const cellSizePx = cellSizeM / metersPerPixel;
  
  // Get bounding box
  let minX = points[0].x, maxX = points[0].x;
  let minY = points[0].y, maxY = points[0].y;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  
  // Point-in-polygon helper (ray casting)
  const pointInPolygon = (x: number, y: number): boolean => {
    let inside = false;
    const n = points.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = points[i].x, yi = points[i].y;
      const xj = points[j].x, yj = points[j].y;
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  };
  
  // Sample offsets (3x3 grid within each cell)
  const offsets = [1/6, 3/6, 5/6];
  const sampleCount = 9;
  const cellAreaM2 = cellSizeM * cellSizeM;
  
  let totalArea = 0;
  const gridWidth = Math.ceil((maxX - minX) / cellSizePx);
  const gridHeight = Math.ceil((maxY - minY) / cellSizePx);
  
  // Limit grid size for performance
  if (gridWidth > 100 || gridHeight > 100) {
    const scale = Math.max(gridWidth, gridHeight) / 100;
    return calculatePolygonAreaGrid(points, pixelsPerMeter, cellSizeMm * scale);
  }
  
  for (let cy = 0; cy < gridHeight; cy++) {
    for (let cx = 0; cx < gridWidth; cx++) {
      const startX = minX + cx * cellSizePx;
      const startY = minY + cy * cellSizePx;
      
      let inside = 0;
      for (const ox of offsets) {
        for (const oy of offsets) {
          if (pointInPolygon(startX + ox * cellSizePx, startY + oy * cellSizePx)) {
            inside++;
          }
        }
      }
      
      totalArea += (inside / sampleCount) * cellAreaM2;
    }
  }
  
  return totalArea;
}

/**
 * Calculate polygon area using traditional shoelace formula.
 * Kept for backwards compatibility and simple rectangular shapes.
 */
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
