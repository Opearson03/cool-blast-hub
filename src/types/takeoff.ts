export interface TakeoffPoint {
  x: number;
  y: number;
}

export interface TakeoffMarkup {
  id: string;
  takeoff_id: string;
  scope_id: string;
  name: string | null;
  shape_type: 'polygon' | 'rectangle';
  points: TakeoffPoint[];
  area_sqm: number | null;
  perimeter_m: number | null;
  color: string;
  page_number: number;
  created_at: string;
}

export interface EstimateTakeoff {
  id: string;
  estimate_id: string;
  plan_url: string;
  plan_type: 'pdf' | 'image';
  page_count: number;
  current_page: number;
  scale_pixels_per_meter: number | null;
  scale_calibration_method: 'ai' | 'manual' | null;
  created_at: string;
  updated_at: string;
}

export interface TakeoffState {
  takeoff: EstimateTakeoff | null;
  markups: TakeoffMarkup[];
  isLoading: boolean;
  isCalibrated: boolean;
}

export interface CalibrationResult {
  detected: boolean;
  pixels_per_meter: number | null;
  confidence: number;
  method: 'scale_bar' | 'dimension' | 'manual' | null;
  message?: string;
}

export interface DrawingTool {
  type: 'polygon' | 'rectangle' | 'select' | 'pan' | 'calibrate';
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
  return SCOPE_COLORS[index % SCOPE_COLORS.length];
}
