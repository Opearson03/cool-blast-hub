import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { TakeoffMarkup, TakeoffPoint } from '@/types/takeoff';

interface ScopeAreaData {
  scope_id: string;
  area_sqm: number | null;
  perimeter_m: number | null;
  markup_id: string;
}

interface UseTakeoffMarkupsReturn {
  markups: ScopeAreaData[];
  isLoading: boolean;
  getAreaForScope: (scopeId: string) => number | null;
  getPerimeterForScope: (scopeId: string) => number | null;
  hasMarkupForScope: (scopeId: string) => boolean;
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

      // Then get the markups for this takeoff
      const { data: markupsData, error: markupsError } = await supabase
        .from('takeoff_markups')
        .select('id, scope_id, area_sqm, perimeter_m')
        .eq('takeoff_id', takeoffData.id);

      if (markupsError) throw markupsError;

      setMarkups((markupsData || []).map(m => ({
        scope_id: m.scope_id,
        area_sqm: m.area_sqm,
        perimeter_m: m.perimeter_m,
        markup_id: m.id,
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

  return {
    markups,
    isLoading,
    getAreaForScope,
    getPerimeterForScope,
    hasMarkupForScope,
    refetch: fetchMarkups,
  };
}
