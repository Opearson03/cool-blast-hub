import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ScopeAreaData {
  scope_id: string;
  name: string | null;
  area_sqm: number | null;
  perimeter_m: number | null;
  markup_id: string;
  // Pier-specific fields
  diameter_mm?: number | null;
  depth_mm?: number | null;
  pier_quantity?: number | null;
  shape_type?: string;
  // Linear element fields
  width_mm?: number | null;
  height_mm?: number | null;
  length_m?: number | null;
  toe_mm?: number | null; // Deprecated
  toe_width_mm?: number | null;
  toe_depth_mm?: number | null;
  // Parent-child relationship for slab beams
  parent_markup_id?: string | null;
  markup_type?: 'primary' | 'edge_beam' | 'internal_beam' | 'thickening' | null;
  // Waffle pod counting data
  pod_count?: number | null;
  pod_thickness_mm?: number | null;
  spacer_4way_count?: number | null;
  spacer_2way_count?: number | null;
}

export interface PierTakeoffData {
  count: number;
  diameter: number;
  depth: number;
}

export interface BollardTakeoffData {
  count: number;
  diameter: number;
  heightAbove: number;
  embedmentDepth: number;
}

export interface PadTakeoffData {
  count: number;
  length: number;    // mm
  width: number;     // mm
  depth: number;     // mm
}

export interface LinearTakeoffData {
  totalLength: number;   // m
  width: number;         // mm
  height: number;        // mm
  segments: Array<{ name: string; length: number }>;
}

// New grouped config interfaces for multiple types
export interface PierConfigFromTakeoff {
  id: string;
  name: string;
  quantity: number;
  diameter: number;
  depth: number;
  _fromTakeoff: true;
}

export interface BollardConfigFromTakeoff {
  id: string;
  name: string;
  quantity: number;
  diameter: number;
  heightAbove: number;
  embedmentDepth: number;
  _fromTakeoff: true;
}

export interface PadConfigFromTakeoff {
  id: string;
  name: string;
  quantity: number;
  length: number;
  width: number;
  depth: number;
  _fromTakeoff: true;
}

export interface FootingConfigFromTakeoff {
  id: string;
  name: string;
  length: number;
  width: number;
  depth: number;
  toe_width?: number;
  toe_depth?: number;
  _fromTakeoff: true;
  _actualLength: number;
}

/**
 * Individual beam data from takeoff
 */
export interface BeamFromTakeoff {
  id: string;
  name: string;
  length: number;  // meters
  width: number;   // mm
  depth: number;   // mm
  _fromTakeoff: true;
}

/**
 * Raft slab area data with associated beam information from takeoff
 */
export interface RaftSlabAreaFromTakeoff {
  id: string;
  name: string;
  area: number;
  perimeter: number;
  // Individual edge beams with their own names/dimensions
  edgeBeams: BeamFromTakeoff[];
  // Individual internal beams with their own names/dimensions
  internalBeams: BeamFromTakeoff[];
  // Legacy aggregated data for backward compatibility
  edgeBeam: {
    totalLength: number;
    width: number;  // mm
    depth: number;  // mm
  } | null;
  internalBeamsSummary: {
    totalLength: number;
    width: number;  // mm
    depth: number;  // mm
  } | null;
  // Waffle pod counting data
  podCount?: number;
  podThicknessMm?: number;
  spacer4WayCount?: number;
  spacer2WayCount?: number;
  _fromTakeoff: true;
}

/**
 * Demolition area data from takeoff
 */
export interface DemolitionAreaFromTakeoff {
  id: string;
  name: string;
  length: number;  // metres (approximate from area)
  width: number;   // metres (approximate from area)
  thickness: number; // mm (default 100)
  _actualArea: number; // actual measured area
  _fromTakeoff: true;
}

interface UseTakeoffMarkupsReturn {
  markups: ScopeAreaData[];
  isLoading: boolean;
  hasFiles: boolean;
  getAreaForScope: (scopeId: string) => number | null;
  getPerimeterForScope: (scopeId: string) => number | null;
  hasMarkupForScope: (scopeId: string) => boolean;
  getMarkupsForScope: (scopeId: string) => ScopeAreaData[];
  getPierDataForScope: (scopeId: string) => PierTakeoffData | null;
  getBollardDataForScope: (scopeId: string) => BollardTakeoffData | null;
  getPadFootingDataForScope: (scopeId: string) => PadTakeoffData | null;
  getLinearDataForScope: (scopeId: string) => LinearTakeoffData | null;
  // New grouped config functions
  getPierConfigsForScope: (scopeId: string) => PierConfigFromTakeoff[];
  getBollardConfigsForScope: (scopeId: string) => BollardConfigFromTakeoff[];
  getPadConfigsForScope: (scopeId: string) => PadConfigFromTakeoff[];
  getFootingConfigsForScope: (scopeId: string) => FootingConfigFromTakeoff[];
  // Raft slab specific
  getRaftSlabAreasForScope: (scopeId: string) => RaftSlabAreaFromTakeoff[];
  // Demolition specific
  getDemolitionAreasForScope: (scopeId: string) => DemolitionAreaFromTakeoff[];
  refetch: () => Promise<void>;
}

export function useTakeoffMarkups(estimateId: string | null): UseTakeoffMarkupsReturn {
  const [markups, setMarkups] = useState<ScopeAreaData[]>([]);
  const [hasFiles, setHasFiles] = useState(false);
  // Initialize loading to true if we have an estimateId to prevent race conditions
  const [isLoading, setIsLoading] = useState(!!estimateId);

  const fetchMarkups = useCallback(async () => {
    if (!estimateId) {
      setMarkups([]);
      setHasFiles(false);
      return;
    }

    setIsLoading(true);
    try {
      // First get the takeoff for this estimate
      const { data: takeoffData, error: takeoffError } = await supabase
        .from('estimate_takeoffs')
        .select('id')
        .eq('estimate_id', estimateId)
        .maybeSingle();

      if (takeoffError) throw takeoffError;

      if (!takeoffData) {
        setMarkups([]);
        setHasFiles(false);
        return;
      }

      // Check if any files have been uploaded to this takeoff
      const { count: filesCount, error: filesError } = await supabase
        .from('takeoff_files')
        .select('id', { count: 'exact', head: true })
        .eq('takeoff_id', takeoffData.id);

      if (filesError) throw filesError;
      setHasFiles((filesCount || 0) > 0);

      // Then get the markups for this takeoff - include all fields for linear/pad elements, beam relationships, and waffle pod counts
      const { data: markupsData, error: markupsError } = await supabase
        .from('takeoff_markups')
        .select('id, scope_id, name, area_sqm, perimeter_m, shape_type, diameter_mm, depth_mm, pier_quantity, width_mm, height_mm, length_m, toe_mm, toe_width_mm, toe_depth_mm, parent_markup_id, markup_type, pod_count, pod_thickness_mm, spacer_4way_count, spacer_2way_count')
        .eq('takeoff_id', takeoffData.id)
        .order('created_at', { ascending: true });

      if (markupsError) throw markupsError;

      setMarkups((markupsData || []).map(m => ({
        scope_id: m.scope_id,
        name: m.name,
        area_sqm: m.area_sqm,
        perimeter_m: m.perimeter_m,
        markup_id: m.id,
        shape_type: m.shape_type,
        diameter_mm: m.diameter_mm,
        depth_mm: m.depth_mm,
        pier_quantity: m.pier_quantity,
        width_mm: m.width_mm,
        height_mm: m.height_mm,
        length_m: m.length_m ? Number(m.length_m) : null,
        toe_mm: m.toe_mm,
        toe_width_mm: m.toe_width_mm,
        toe_depth_mm: m.toe_depth_mm,
        parent_markup_id: m.parent_markup_id,
        markup_type: m.markup_type as ScopeAreaData['markup_type'],
        pod_count: m.pod_count,
        pod_thickness_mm: m.pod_thickness_mm,
        spacer_4way_count: m.spacer_4way_count,
        spacer_2way_count: m.spacer_2way_count,
      })));
    } catch (error) {
      console.error('Error fetching takeoff markups:', error);
      setMarkups([]);
    } finally {
      setIsLoading(false);
    }
  }, [estimateId]);

  useEffect(() => {
    fetchMarkups();
  }, [fetchMarkups]);

  const getAreaForScope = useCallback((scopeId: string): number | null => {
    const markup = markups.find(m => m.scope_id === scopeId);
    return markup?.area_sqm ?? null;
  }, [markups]);

  const getPerimeterForScope = useCallback((scopeId: string): number | null => {
    const markup = markups.find(m => m.scope_id === scopeId);
    return markup?.perimeter_m ?? null;
  }, [markups]);

  const hasMarkupForScope = useCallback((scopeId: string): boolean => {
    return markups.some(m => m.scope_id === scopeId);
  }, [markups]);

  const getMarkupsForScope = useCallback((scopeId: string): ScopeAreaData[] => {
    return markups.filter(m => m.scope_id === scopeId);
  }, [markups]);

  const getPierDataForScope = useCallback((scopeId: string): PierTakeoffData | null => {
    const pierMarkups = markups.filter(
      m => m.scope_id === scopeId && m.shape_type === 'point'
    );
    
    if (pierMarkups.length === 0) return null;
    
    // Count total piers (sum of pier_quantity for each markup)
    const count = pierMarkups.reduce((sum, m) => sum + (m.pier_quantity || 1), 0);
    
    // Get diameter and depth from the first markup (they should all be the same)
    const firstMarkup = pierMarkups[0];
    const diameter = firstMarkup.diameter_mm || 450;
    const depth = firstMarkup.depth_mm || 600;
    
    return { count, diameter, depth };
  }, [markups]);

  /**
   * Get bollard data from takeoff - uses height_mm for height above ground
   * and depth_mm for embedment depth
   */
  const getBollardDataForScope = useCallback((scopeId: string): BollardTakeoffData | null => {
    const bollardMarkups = markups.filter(
      m => m.scope_id === scopeId && m.shape_type === 'point'
    );
    
    if (bollardMarkups.length === 0) return null;
    
    const count = bollardMarkups.reduce((sum, m) => sum + (m.pier_quantity || 1), 0);
    const firstMarkup = bollardMarkups[0];
    
    return {
      count,
      diameter: firstMarkup.diameter_mm || 150,
      heightAbove: firstMarkup.height_mm || 900,  // height_mm stores height above ground for bollards
      embedmentDepth: firstMarkup.depth_mm || 400,
    };
  }, [markups]);

  /**
   * Get pad footing/pit base data from takeoff
   */
  const getPadFootingDataForScope = useCallback((scopeId: string): PadTakeoffData | null => {
    const padMarkups = markups.filter(
      m => m.scope_id === scopeId && m.shape_type === 'point'
    );
    
    if (padMarkups.length === 0) return null;
    
    const count = padMarkups.reduce((sum, m) => sum + (m.pier_quantity || 1), 0);
    const firstMarkup = padMarkups[0];
    
    // For pad footings: width_mm = length, height_mm = width, depth_mm = depth
    return {
      count,
      length: firstMarkup.width_mm || 600,   // Stored in width_mm
      width: firstMarkup.height_mm || 600,   // Stored in height_mm  
      depth: firstMarkup.depth_mm || 300,
    };
  }, [markups]);

  /**
   * Get linear element data from takeoff (strip footings, kerbs, retaining walls, etc.)
   */
  const getLinearDataForScope = useCallback((scopeId: string): LinearTakeoffData | null => {
    const linearMarkups = markups.filter(
      m => m.scope_id === scopeId && m.shape_type === 'polyline'
    );
    
    if (linearMarkups.length === 0) return null;
    
    // Sum up all segment lengths
    const totalLength = linearMarkups.reduce((sum, m) => sum + (m.length_m || 0), 0);
    
    // Get dimensions from first markup (typically consistent across all segments)
    const firstMarkup = linearMarkups[0];
    
    // Build segments array with names
    const segments = linearMarkups.map((m, index) => ({
      name: m.name || `Section ${index + 1}`,
      length: m.length_m || 0,
    }));
    
    return {
      totalLength,
      width: firstMarkup.width_mm || 450,
      height: firstMarkup.height_mm || 300,
      segments,
    };
  }, [markups]);

  /**
   * Get pier configs grouped by unique dimensions (diameter + depth)
   * Returns one PierConfigFromTakeoff per unique dimension combination
   */
  const getPierConfigsForScope = useCallback((scopeId: string): PierConfigFromTakeoff[] => {
    const pierMarkups = markups.filter(
      m => m.scope_id === scopeId && m.shape_type === 'point'
    );
    
    if (pierMarkups.length === 0) return [];
    
    // Each markup is its own pier group (user names groups individually)
    return pierMarkups.map((m, index) => {
      const diameter = m.diameter_mm || 450;
      const depth = m.depth_mm || 600;
      const quantity = m.pier_quantity || 1;
      
      return {
        id: `takeoff-pier-${m.markup_id}`,
        name: m.name || `Pier Group ${index + 1}`,
        quantity,
        diameter,
        depth,
        _fromTakeoff: true as const,
      };
    });
  }, [markups]);

  /**
   * Get bollard configs grouped by unique dimensions (diameter + height + depth)
   */
  const getBollardConfigsForScope = useCallback((scopeId: string): BollardConfigFromTakeoff[] => {
    const bollardMarkups = markups.filter(
      m => m.scope_id === scopeId && m.shape_type === 'point'
    );
    
    if (bollardMarkups.length === 0) return [];
    
    // Group by unique diameter + height + depth combination
    const grouped = new Map<string, { count: number; diameter: number; heightAbove: number; embedmentDepth: number; name: string }>();
    
    bollardMarkups.forEach(m => {
      const diameter = m.diameter_mm || 150;
      const heightAbove = m.height_mm || 900;
      const embedmentDepth = m.depth_mm || 400;
      const key = `${diameter}-${heightAbove}-${embedmentDepth}`;
      const qty = m.pier_quantity || 1;
      
      if (grouped.has(key)) {
        const existing = grouped.get(key)!;
        existing.count += qty;
        existing.name = `${existing.count} bollards @ ${diameter}mm`;
      } else {
        grouped.set(key, {
          count: qty,
          diameter,
          heightAbove,
          embedmentDepth,
          name: m.name || `${qty} bollards @ ${diameter}mm`,
        });
      }
    });
    
    return Array.from(grouped.entries()).map(([key, data], index) => ({
      id: `takeoff-bollard-${key}-${Date.now()}-${index}`,
      name: data.name,
      quantity: data.count,
      diameter: data.diameter,
      heightAbove: data.heightAbove,
      embedmentDepth: data.embedmentDepth,
      _fromTakeoff: true as const,
    }));
  }, [markups]);

  /**
   * Get pad footing/pit base configs grouped by unique dimensions (length + width + depth)
   * All pad footings are now point-based markups with manual dimensions
   */
  const getPadConfigsForScope = useCallback((scopeId: string): PadConfigFromTakeoff[] => {
    // All pad_footings and pit_bases are now point-based markups
    const pointMarkups = markups.filter(
      m => m.scope_id === scopeId && m.shape_type === 'point'
    );
    
    if (pointMarkups.length === 0) return [];
    
    // Group by markup name to preserve user-defined groups from takeoff
    const grouped = new Map<string, { count: number; length: number; width: number; depth: number; name: string }>();
    
    pointMarkups.forEach(m => {
      // For pad footings: height_mm = length, width_mm = width, depth_mm = depth (see addPadMarkups)
      const length = m.height_mm || 600;
      const width = m.width_mm || 600;
      const depth = m.depth_mm || 300;
      const qty = m.pier_quantity || 1;
      // Use the markup name as the grouping key to preserve user-defined groups
      const groupName = m.name || `Pad Footings`;
      const key = groupName;
      
      if (grouped.has(key)) {
        const existing = grouped.get(key)!;
        existing.count += qty;
        // Keep the original name, don't overwrite
      } else {
        grouped.set(key, {
          count: qty,
          length,
          width,
          depth,
          name: groupName,
        });
      }
    });
    
    return Array.from(grouped.entries()).map(([key, data], index) => ({
      id: `takeoff-pad-${key}-${Date.now()}-${index}`,
      name: data.name,
      quantity: data.count,
      length: data.length,
      width: data.width,
      depth: data.depth,
      _fromTakeoff: true as const,
    }));
  }, [markups]);

  /**
   * Get footing configs for linear scopes (strip footings, kerbs, retaining walls)
   * Each markup becomes its own footing config (no grouping since lengths are typically unique)
   */
  const getFootingConfigsForScope = useCallback((scopeId: string): FootingConfigFromTakeoff[] => {
    const linearMarkups = markups.filter(
      m => m.scope_id === scopeId && m.shape_type === 'polyline'
    );
    
    if (linearMarkups.length === 0) return [];
    
    return linearMarkups.map((m, index) => ({
      id: `takeoff-footing-${m.markup_id}`,
      name: m.name || `Section ${index + 1}`,
      length: m.length_m || 0,
      width: m.width_mm || 450,
      depth: m.height_mm || 300,
      toe_width: m.toe_width_mm || undefined,
      toe_depth: m.toe_depth_mm || undefined,
      _fromTakeoff: true as const,
      _actualLength: m.length_m || 0,
    }));
  }, [markups]);

  /**
   * Get raft slab areas with their associated edge and internal beam data
   * Groups primary slab markups with their child beam markups by parent_markup_id
   */
  const getRaftSlabAreasForScope = useCallback((scopeId: string): RaftSlabAreaFromTakeoff[] => {
    // Get primary slab markups (polygon/rectangle shapes that are the main slab area)
    const primaryMarkups = markups.filter(
      m => m.scope_id === scopeId && 
           (m.markup_type === 'primary' || m.markup_type === null || m.markup_type === undefined) &&
           m.shape_type !== 'polyline' &&
           !m.parent_markup_id // No parent means it's a primary markup
    );
    
    if (primaryMarkups.length === 0) return [];
    
    return primaryMarkups.map((primary, index) => {
      // Find child edge beam markups for this slab
      const edgeBeamMarkups = markups.filter(
        m => m.parent_markup_id === primary.markup_id && m.markup_type === 'edge_beam'
      );
      
      // Find child internal beam markups for this slab
      const internalBeamMarkups = markups.filter(
        m => m.parent_markup_id === primary.markup_id && m.markup_type === 'internal_beam'
      );
      
      // Convert to individual beam arrays
      const edgeBeams: BeamFromTakeoff[] = edgeBeamMarkups.map((m, i) => ({
        id: `edge-beam-${m.markup_id}`,
        name: m.name || `Edge Beam ${i + 1}`,
        length: m.length_m || 0,
        width: m.width_mm || 450,
        depth: m.height_mm || 450,
        _fromTakeoff: true as const,
      }));
      
      const internalBeams: BeamFromTakeoff[] = internalBeamMarkups.map((m, i) => ({
        id: `internal-beam-${m.markup_id}`,
        name: m.name || `Internal Beam ${i + 1}`,
        length: m.length_m || 0,
        width: m.width_mm || 300,
        depth: m.height_mm || 400,
        _fromTakeoff: true as const,
      }));
      
      // Legacy aggregated edge beam data for backward compatibility
      let edgeBeam: RaftSlabAreaFromTakeoff['edgeBeam'] = null;
      if (edgeBeams.length > 0) {
        const totalLength = edgeBeams.reduce((sum, b) => sum + b.length, 0);
        edgeBeam = {
          totalLength,
          width: edgeBeams[0].width,
          depth: edgeBeams[0].depth,
        };
      }
      
      // Legacy aggregated internal beam data
      let internalBeamsSummary: RaftSlabAreaFromTakeoff['internalBeamsSummary'] = null;
      if (internalBeams.length > 0) {
        const totalLength = internalBeams.reduce((sum, b) => sum + b.length, 0);
        internalBeamsSummary = {
          totalLength,
          width: internalBeams[0].width,
          depth: internalBeams[0].depth,
        };
      }
      
      return {
        id: `takeoff-raft-${primary.markup_id}`,
        name: primary.name || `Slab Area ${index + 1}`,
        area: primary.area_sqm || 0,
        perimeter: primary.perimeter_m || 0,
        edgeBeams,
        internalBeams,
        edgeBeam,
        internalBeamsSummary,
        // Waffle pod counting data
        podCount: primary.pod_count ?? undefined,
        podThicknessMm: primary.pod_thickness_mm ?? undefined,
        spacer4WayCount: primary.spacer_4way_count ?? undefined,
        spacer2WayCount: primary.spacer_2way_count ?? undefined,
        _fromTakeoff: true as const,
      };
    });
  }, [markups]);

  /**
   * Get demolition area data from takeoff
   * Converts polygon markups for demolition scope into DemolitionArea format
   */
  const getDemolitionAreasForScope = useCallback((scopeId: string): DemolitionAreaFromTakeoff[] => {
    // Get polygon markups for demolition scope
    const demoMarkups = markups.filter(
      m => m.scope_id === scopeId && 
           (m.shape_type === 'polygon' || m.shape_type === 'rectangle' || !m.shape_type)
    );
    
    if (demoMarkups.length === 0) return [];
    
    return demoMarkups.map((m, index) => {
      const area = m.area_sqm || 0;
      // Calculate approximate square dimensions for display
      const side = Math.sqrt(area);
      // Default thickness of 100mm for demolition
      const thickness = m.depth_mm || 100;
      
      return {
        id: `takeoff-demo-${m.markup_id}`,
        name: m.name || `Demo Area ${index + 1}`,
        length: parseFloat(side.toFixed(2)),
        width: parseFloat(side.toFixed(2)),
        thickness,
        _actualArea: area,
        _fromTakeoff: true as const,
      };
    });
  }, [markups]);

  return {
    markups,
    isLoading,
    hasFiles,
    getAreaForScope,
    getPerimeterForScope,
    hasMarkupForScope,
    getMarkupsForScope,
    getPierDataForScope,
    getBollardDataForScope,
    getPadFootingDataForScope,
    getLinearDataForScope,
    // New grouped config functions
    getPierConfigsForScope,
    getBollardConfigsForScope,
    getPadConfigsForScope,
    getFootingConfigsForScope,
    // Raft slab specific
    getRaftSlabAreasForScope,
    // Demolition specific
    getDemolitionAreasForScope,
    refetch: fetchMarkups,
  };
}
