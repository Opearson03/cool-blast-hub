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

interface UseTakeoffMarkupsReturn {
  markups: ScopeAreaData[];
  isLoading: boolean;
  getAreaForScope: (scopeId: string) => number | null;
  getPerimeterForScope: (scopeId: string) => number | null;
  hasMarkupForScope: (scopeId: string) => boolean;
  getMarkupsForScope: (scopeId: string) => ScopeAreaData[];
  getPierDataForScope: (scopeId: string) => PierTakeoffData | null;
  getBollardDataForScope: (scopeId: string) => BollardTakeoffData | null;
  getPadFootingDataForScope: (scopeId: string) => PadTakeoffData | null;
  getLinearDataForScope: (scopeId: string) => LinearTakeoffData | null;
  refetch: () => Promise<void>;
}

export function useTakeoffMarkups(estimateId: string | null): UseTakeoffMarkupsReturn {
  const [markups, setMarkups] = useState<ScopeAreaData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMarkups = useCallback(async () => {
    if (!estimateId) {
      setMarkups([]);
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
        return;
      }

      // Then get the markups for this takeoff - include all fields for linear/pad elements
      const { data: markupsData, error: markupsError } = await supabase
        .from('takeoff_markups')
        .select('id, scope_id, name, area_sqm, perimeter_m, shape_type, diameter_mm, depth_mm, pier_quantity, width_mm, height_mm, length_m')
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

  return {
    markups,
    isLoading,
    getAreaForScope,
    getPerimeterForScope,
    hasMarkupForScope,
    getMarkupsForScope,
    getPierDataForScope,
    getBollardDataForScope,
    getPadFootingDataForScope,
    getLinearDataForScope,
    refetch: fetchMarkups,
  };
}
