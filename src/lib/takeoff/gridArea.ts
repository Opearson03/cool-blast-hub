/**
 * Grid-based Area Estimation Utility for Takeoff
 * 
 * This module provides precise area calculation for complex polygon shapes
 * by subdividing them into a grid of cells and sampling point-in-polygon coverage.
 * 
 * This is the authoritative area calculation method for volume calculations,
 * replacing simple shoelace formula which can be less reliable for complex shapes.
 */

import type { TakeoffPoint } from '@/types/takeoff';

/**
 * Ray-casting algorithm for point-in-polygon test.
 * Returns true if the point (x, y) is inside the polygon.
 */
export function pointInPolygon(x: number, y: number, polygon: TakeoffPoint[]): boolean {
  if (polygon.length < 3) return false;
  
  let inside = false;
  const n = polygon.length;
  
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    
    // Ray casting: check if horizontal ray from point intersects edge
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

/**
 * Compute bounding box of a polygon
 */
function getBoundingBox(polygon: TakeoffPoint[]): { minX: number; maxX: number; minY: number; maxY: number } {
  if (polygon.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }
  
  let minX = polygon[0].x;
  let maxX = polygon[0].x;
  let minY = polygon[0].y;
  let maxY = polygon[0].y;
  
  for (const point of polygon) {
    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.y > maxY) maxY = point.y;
  }
  
  return { minX, maxX, minY, maxY };
}

/**
 * Generate a simple hash for cache key
 */
function hashPolygon(polygon: TakeoffPoint[], scale: number, cellSize: number): string {
  const pointsHash = polygon.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join('|');
  return `${pointsHash}:${scale.toFixed(6)}:${cellSize}`;
}

// Simple cache for expensive calculations
const areaCache = new Map<string, number>();
const CACHE_MAX_SIZE = 50;

/**
 * Estimate area of a polygon using grid subdivision with multi-point sampling.
 * 
 * Algorithm:
 * 1. Compute bounding box of polygon
 * 2. Divide bounding box into grid cells of specified size
 * 3. For each cell, sample 9 points (3x3 grid)
 * 4. Count how many sample points are inside the polygon
 * 5. Calculate coverage_ratio = inside_count / 9
 * 6. Add coverage_ratio × cell_area to total
 * 
 * @param polygonPointsPx - Polygon vertices in pixel coordinates
 * @param metersPerPixel - Scale factor (1 / pixelsPerMeter)
 * @param cellSizeMm - Grid cell size in millimeters (default 500mm)
 * @param samplesPerCell - Number of sample points per cell (default 9 for 3x3)
 * @returns Total area in square meters
 */
export function estimateAreaGrid(
  polygonPointsPx: TakeoffPoint[],
  metersPerPixel: number,
  cellSizeMm: number = 500,
  samplesPerCell: number = 9
): number {
  if (polygonPointsPx.length < 3 || metersPerPixel <= 0) {
    return 0;
  }

  // Check cache
  const cacheKey = hashPolygon(polygonPointsPx, metersPerPixel, cellSizeMm);
  const cached = areaCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  // Convert cell size to meters and then to pixels
  const cellSizeM = cellSizeMm / 1000;
  const cellSizePx = cellSizeM / metersPerPixel;

  // Get bounding box
  const { minX, maxX, minY, maxY } = getBoundingBox(polygonPointsPx);
  
  // Ensure we have a valid bounding box
  if (maxX <= minX || maxY <= minY) {
    return 0;
  }

  // Calculate grid dimensions
  const gridWidth = Math.ceil((maxX - minX) / cellSizePx);
  const gridHeight = Math.ceil((maxY - minY) / cellSizePx);

  // Limit maximum grid size for performance (100x100 = 10000 cells max)
  const maxGridDim = 100;
  if (gridWidth > maxGridDim || gridHeight > maxGridDim) {
    // Fall back to larger cell size
    const scaleFactor = Math.max(gridWidth, gridHeight) / maxGridDim;
    const adjustedCellSizeMm = cellSizeMm * scaleFactor;
    return estimateAreaGrid(polygonPointsPx, metersPerPixel, adjustedCellSizeMm, samplesPerCell);
  }

  // Sample points layout (3x3 within each cell at 1/6, 3/6, 5/6 positions)
  const sampleOffsets = [1/6, 3/6, 5/6];
  const sampleCount = sampleOffsets.length * sampleOffsets.length;

  let totalAreaM2 = 0;
  const cellAreaM2 = cellSizeM * cellSizeM;

  // Iterate over grid cells
  for (let cellY = 0; cellY < gridHeight; cellY++) {
    for (let cellX = 0; cellX < gridWidth; cellX++) {
      const cellStartX = minX + cellX * cellSizePx;
      const cellStartY = minY + cellY * cellSizePx;
      
      // Count sample points inside polygon
      let insideCount = 0;
      
      for (const offsetX of sampleOffsets) {
        for (const offsetY of sampleOffsets) {
          const sampleX = cellStartX + offsetX * cellSizePx;
          const sampleY = cellStartY + offsetY * cellSizePx;
          
          if (pointInPolygon(sampleX, sampleY, polygonPointsPx)) {
            insideCount++;
          }
        }
      }
      
      // Calculate coverage ratio and add to total
      const coverageRatio = insideCount / sampleCount;
      totalAreaM2 += coverageRatio * cellAreaM2;
    }
  }

  // Cache result
  if (areaCache.size >= CACHE_MAX_SIZE) {
    // Clear oldest entries
    const keysToDelete = Array.from(areaCache.keys()).slice(0, Math.floor(CACHE_MAX_SIZE / 2));
    keysToDelete.forEach(key => areaCache.delete(key));
  }
  areaCache.set(cacheKey, totalAreaM2);

  return totalAreaM2;
}

/**
 * Calculate polygon area using traditional shoelace formula.
 * Kept for comparison and fallback purposes.
 */
export function calculatePolygonAreaShoelace(
  polygonPointsPx: TakeoffPoint[],
  metersPerPixel: number
): number {
  if (polygonPointsPx.length < 3 || metersPerPixel <= 0) {
    return 0;
  }

  let area = 0;
  const n = polygonPointsPx.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += polygonPointsPx[i].x * polygonPointsPx[j].y;
    area -= polygonPointsPx[j].x * polygonPointsPx[i].y;
  }
  
  const pixelArea = Math.abs(area) / 2;
  return pixelArea * metersPerPixel * metersPerPixel;
}

/**
 * Calculate area with both methods and return grid result with optional comparison.
 * Useful during validation phase.
 */
export function calculatePolygonAreaWithComparison(
  polygonPointsPx: TakeoffPoint[],
  metersPerPixel: number,
  cellSizeMm: number = 500
): {
  gridArea: number;
  shoelaceArea: number;
  difference: number;
  differencePercent: number;
} {
  const gridArea = estimateAreaGrid(polygonPointsPx, metersPerPixel, cellSizeMm);
  const shoelaceArea = calculatePolygonAreaShoelace(polygonPointsPx, metersPerPixel);
  const difference = Math.abs(gridArea - shoelaceArea);
  const differencePercent = shoelaceArea > 0 ? (difference / shoelaceArea) * 100 : 0;

  return {
    gridArea,
    shoelaceArea,
    difference,
    differencePercent,
  };
}

/**
 * Clear the area calculation cache.
 * Call when polygon data changes significantly.
 */
export function clearAreaCache(): void {
  areaCache.clear();
}
