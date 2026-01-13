import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  EstimateTakeoff, 
  TakeoffMarkup, 
  TakeoffPoint,
  CalibrationResult
} from '@/types/takeoff';
import type { Json } from '@/integrations/supabase/types';

interface UseTakeoffDataProps {
  estimateId: string | null;
  businessId: string | null;
}

interface UseTakeoffDataReturn {
  takeoff: EstimateTakeoff | null;
  markups: TakeoffMarkup[];
  isLoading: boolean;
  isUploading: boolean;
  isCalibrating: boolean;
  uploadPlan: (file: File) => Promise<void>;
  deletePlan: () => Promise<void>;
  setScale: (pixelsPerMeter: number, method: 'ai' | 'manual') => Promise<void>;
  addMarkup: (scopeId: string, shapeType: 'polygon' | 'rectangle', points: TakeoffPoint[], color: string, name?: string) => Promise<TakeoffMarkup | null>;
  updateMarkup: (markupId: string, points: TakeoffPoint[]) => Promise<void>;
  deleteMarkup: (markupId: string) => Promise<void>;
  setCurrentPage: (page: number) => Promise<void>;
  detectScale: () => Promise<CalibrationResult>;
  refetch: () => Promise<void>;
}

export function useTakeoffData({ estimateId, businessId }: UseTakeoffDataProps): UseTakeoffDataReturn {
  const [takeoff, setTakeoff] = useState<EstimateTakeoff | null>(null);
  const [markups, setMarkups] = useState<TakeoffMarkup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const { toast } = useToast();

  const fetchTakeoffData = useCallback(async () => {
    if (!estimateId) return;
    
    setIsLoading(true);
    try {
      // Fetch takeoff
      const { data: takeoffData, error: takeoffError } = await supabase
        .from('estimate_takeoffs')
        .select('*')
        .eq('estimate_id', estimateId)
        .maybeSingle();
      
      if (takeoffError) throw takeoffError;
      
      if (takeoffData) {
        setTakeoff(takeoffData as unknown as EstimateTakeoff);
        
        // Fetch markups
        const { data: markupsData, error: markupsError } = await supabase
          .from('takeoff_markups')
          .select('*')
          .eq('takeoff_id', takeoffData.id)
          .order('created_at', { ascending: true });
        
        if (markupsError) throw markupsError;
        
        setMarkups((markupsData || []).map(m => ({
          ...m,
          name: m.name || null,
          shape_type: m.shape_type as 'polygon' | 'rectangle',
          points: m.points as unknown as TakeoffPoint[]
        })));
      } else {
        setTakeoff(null);
        setMarkups([]);
      }
    } catch (error) {
      console.error('Error fetching takeoff data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [estimateId]);

  useEffect(() => {
    fetchTakeoffData();
  }, [fetchTakeoffData]);

  const uploadPlan = async (file: File) => {
    if (!estimateId || !businessId) {
      toast({ title: 'Error', description: 'Missing estimate or business ID', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const isPdf = file.type === 'application/pdf' || fileExt === 'pdf';
      const planType = isPdf ? 'pdf' : 'image';
      const filePath = `${businessId}/${estimateId}/plan.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('estimate-plans')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('estimate-plans')
        .getPublicUrl(filePath);

      // For private bucket, we need to use signed URL
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('estimate-plans')
        .createSignedUrl(filePath, 3600 * 24 * 7); // 7 days

      if (signedUrlError) throw signedUrlError;

      const planUrl = signedUrlData.signedUrl;

      // Create or update takeoff record
      if (takeoff) {
        const { error } = await supabase
          .from('estimate_takeoffs')
          .update({
            plan_url: planUrl,
            plan_type: planType,
            page_count: 1, // Will be updated when PDF is loaded
            current_page: 1,
            scale_pixels_per_meter: null,
            scale_calibration_method: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', takeoff.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('estimate_takeoffs')
          .insert({
            estimate_id: estimateId,
            plan_url: planUrl,
            plan_type: planType,
            page_count: 1,
            current_page: 1
          });
        
        if (error) throw error;
      }

      await fetchTakeoffData();
      toast({ title: 'Plan uploaded', description: 'Your plan has been uploaded successfully.' });
      
      // Auto-detect scale in background (silently)
      setTimeout(async () => {
        try {
          const { data, error } = await supabase.functions.invoke('detect-plan-scale', {
            body: { planUrl: planUrl, pageNumber: 1 }
          });
          
          if (!error && data?.detected && data?.pixels_per_meter) {
            // Silently apply the detected scale
            await supabase
              .from('estimate_takeoffs')
              .update({
                scale_pixels_per_meter: data.pixels_per_meter,
                scale_calibration_method: 'ai',
                updated_at: new Date().toISOString()
              })
              .eq('estimate_id', estimateId);
            
            // Refetch to update state
            await fetchTakeoffData();
            toast({ title: 'Scale detected', description: 'Scale was automatically detected from your plan.' });
          }
        } catch (e) {
          // Silently fail - user can still calibrate manually
          console.log('Auto scale detection skipped:', e);
        }
      }, 500);
    } catch (error: any) {
      console.error('Error uploading plan:', error);
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const deletePlan = async () => {
    if (!takeoff) return;

    try {
      // Delete markups first
      await supabase
        .from('takeoff_markups')
        .delete()
        .eq('takeoff_id', takeoff.id);

      // Delete takeoff record
      await supabase
        .from('estimate_takeoffs')
        .delete()
        .eq('id', takeoff.id);

      // Delete file from storage
      if (businessId && estimateId) {
        const filePath = takeoff.plan_url.split('/').slice(-2).join('/');
        await supabase.storage
          .from('estimate-plans')
          .remove([`${businessId}/${estimateId}/${filePath}`]);
      }

      setTakeoff(null);
      setMarkups([]);
      toast({ title: 'Plan deleted' });
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    }
  };

  const setScale = async (pixelsPerMeter: number, method: 'ai' | 'manual') => {
    if (!takeoff) return;

    try {
      const { error } = await supabase
        .from('estimate_takeoffs')
        .update({
          scale_pixels_per_meter: pixelsPerMeter,
          scale_calibration_method: method,
          updated_at: new Date().toISOString()
        })
        .eq('id', takeoff.id);

      if (error) throw error;

      setTakeoff(prev => prev ? {
        ...prev,
        scale_pixels_per_meter: pixelsPerMeter,
        scale_calibration_method: method
      } : null);

      // Recalculate all markup areas with new scale
      for (const markup of markups) {
        const { calculatePolygonArea, calculatePolygonPerimeter, calculateRectangleArea, calculateRectanglePerimeter } = await import('@/types/takeoff');
        
        let area: number;
        let perimeter: number;
        
        if (markup.shape_type === 'polygon') {
          area = calculatePolygonArea(markup.points, pixelsPerMeter);
          perimeter = calculatePolygonPerimeter(markup.points, pixelsPerMeter);
        } else {
          area = calculateRectangleArea(markup.points, pixelsPerMeter);
          perimeter = calculateRectanglePerimeter(markup.points, pixelsPerMeter);
        }

        await supabase
          .from('takeoff_markups')
          .update({ area_sqm: area, perimeter_m: perimeter })
          .eq('id', markup.id);
      }

      await fetchTakeoffData();
      toast({ title: 'Scale calibrated', description: `${pixelsPerMeter.toFixed(1)} pixels per meter` });
    } catch (error: any) {
      console.error('Error setting scale:', error);
      toast({ title: 'Calibration failed', description: error.message, variant: 'destructive' });
    }
  };

  const addMarkup = async (
    scopeId: string, 
    shapeType: 'polygon' | 'rectangle', 
    points: TakeoffPoint[],
    color: string,
    name?: string
  ): Promise<TakeoffMarkup | null> => {
    if (!takeoff) return null;

    try {
      const { calculatePolygonArea, calculatePolygonPerimeter, calculateRectangleArea, calculateRectanglePerimeter } = await import('@/types/takeoff');
      
      let area: number | null = null;
      let perimeter: number | null = null;
      
      if (takeoff.scale_pixels_per_meter) {
        if (shapeType === 'polygon') {
          area = calculatePolygonArea(points, takeoff.scale_pixels_per_meter);
          perimeter = calculatePolygonPerimeter(points, takeoff.scale_pixels_per_meter);
        } else {
          area = calculateRectangleArea(points, takeoff.scale_pixels_per_meter);
          perimeter = calculateRectanglePerimeter(points, takeoff.scale_pixels_per_meter);
        }
      }

      const { data, error } = await supabase
        .from('takeoff_markups')
        .insert({
          takeoff_id: takeoff.id,
          scope_id: scopeId,
          shape_type: shapeType,
          points: points as unknown as Json,
          area_sqm: area,
          perimeter_m: perimeter,
          color: color,
          name: name || null,
          page_number: takeoff.current_page
        })
        .select()
        .single();

      if (error) throw error;

      const newMarkup: TakeoffMarkup = {
        ...data,
        name: data.name || null,
        shape_type: data.shape_type as 'polygon' | 'rectangle',
        points: data.points as unknown as TakeoffPoint[]
      };

      setMarkups(prev => [...prev, newMarkup]);
      return newMarkup;
    } catch (error: any) {
      console.error('Error adding markup:', error);
      toast({ title: 'Error adding markup', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const updateMarkup = async (markupId: string, points: TakeoffPoint[]) => {
    if (!takeoff) return;

    try {
      const { calculatePolygonArea, calculatePolygonPerimeter, calculateRectangleArea, calculateRectanglePerimeter } = await import('@/types/takeoff');
      
      const markup = markups.find(m => m.id === markupId);
      if (!markup) return;

      let area: number | null = null;
      let perimeter: number | null = null;
      
      if (takeoff.scale_pixels_per_meter) {
        if (markup.shape_type === 'polygon') {
          area = calculatePolygonArea(points, takeoff.scale_pixels_per_meter);
          perimeter = calculatePolygonPerimeter(points, takeoff.scale_pixels_per_meter);
        } else {
          area = calculateRectangleArea(points, takeoff.scale_pixels_per_meter);
          perimeter = calculateRectanglePerimeter(points, takeoff.scale_pixels_per_meter);
        }
      }

      const { error } = await supabase
        .from('takeoff_markups')
        .update({ points: points as unknown as Json, area_sqm: area, perimeter_m: perimeter })
        .eq('id', markupId);

      if (error) throw error;

      setMarkups(prev => prev.map(m => 
        m.id === markupId ? { ...m, points, area_sqm: area, perimeter_m: perimeter } : m
      ));
    } catch (error: any) {
      console.error('Error updating markup:', error);
      toast({ title: 'Error updating markup', description: error.message, variant: 'destructive' });
    }
  };

  const deleteMarkup = async (markupId: string) => {
    try {
      const { error } = await supabase
        .from('takeoff_markups')
        .delete()
        .eq('id', markupId);

      if (error) throw error;

      setMarkups(prev => prev.filter(m => m.id !== markupId));
    } catch (error: any) {
      console.error('Error deleting markup:', error);
      toast({ title: 'Error deleting markup', description: error.message, variant: 'destructive' });
    }
  };

  const setCurrentPage = async (page: number) => {
    if (!takeoff) return;

    try {
      const { error } = await supabase
        .from('estimate_takeoffs')
        .update({ current_page: page, updated_at: new Date().toISOString() })
        .eq('id', takeoff.id);

      if (error) throw error;

      setTakeoff(prev => prev ? { ...prev, current_page: page } : null);
    } catch (error: any) {
      console.error('Error setting page:', error);
    }
  };

  const detectScale = async (): Promise<CalibrationResult> => {
    if (!takeoff?.plan_url) {
      return { detected: false, pixels_per_meter: null, confidence: 0, method: null, message: 'No plan uploaded' };
    }

    setIsCalibrating(true);
    try {
      const { data, error } = await supabase.functions.invoke('detect-plan-scale', {
        body: { planUrl: takeoff.plan_url, pageNumber: takeoff.current_page }
      });

      if (error) throw error;

      const result = data as CalibrationResult;
      
      if (result.detected && result.pixels_per_meter) {
        await setScale(result.pixels_per_meter, 'ai');
      }

      return result;
    } catch (error: any) {
      console.error('Error detecting scale:', error);
      return { detected: false, pixels_per_meter: null, confidence: 0, method: null, message: error.message };
    } finally {
      setIsCalibrating(false);
    }
  };

  return {
    takeoff,
    markups,
    isLoading,
    isUploading,
    isCalibrating,
    uploadPlan,
    deletePlan,
    setScale,
    addMarkup,
    updateMarkup,
    deleteMarkup,
    setCurrentPage,
    detectScale,
    refetch: fetchTakeoffData
  };
}
