import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  EstimateTakeoff, 
  TakeoffMarkup, 
  TakeoffPoint,
  TakeoffFile,
  PageScale
} from '@/types/takeoff';
import type { Json } from '@/integrations/supabase/types';

interface UseTakeoffDataProps {
  estimateId: string | null;
  businessId: string | null;
}

interface UseTakeoffDataReturn {
  takeoff: EstimateTakeoff | null;
  files: TakeoffFile[];
  pageScales: PageScale[];
  markups: TakeoffMarkup[];
  currentFileId: string | null;
  isLoading: boolean;
  isUploading: boolean;
  addFile: (file: File, fileName?: string) => Promise<TakeoffFile | null>;
  removeFile: (fileId: string) => Promise<void>;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  reorderFiles: (fileIds: string[]) => Promise<void>;
  setCurrentFile: (fileId: string) => void;
  setPageScale: (fileId: string, pageNumber: number, pixelsPerMeter: number) => Promise<void>;
  getPageScale: (fileId: string, pageNumber: number) => number | null;
  deletePlan: () => Promise<void>;
  addMarkup: (fileId: string, scopeId: string, shapeType: 'polygon' | 'rectangle', points: TakeoffPoint[], color: string, pageNumber: number, name?: string) => Promise<TakeoffMarkup | null>;
  addPierMarkups: (fileId: string, scopeId: string, points: TakeoffPoint[], diameterMm: number, depthMm: number, color: string, pageNumber: number) => Promise<TakeoffMarkup | null>;
  addBollardMarkups: (fileId: string, scopeId: string, points: TakeoffPoint[], diameterMm: number, heightMm: number, embedmentMm: number, color: string, pageNumber: number) => Promise<TakeoffMarkup | null>;
  addPadMarkups: (fileId: string, scopeId: string, points: TakeoffPoint[], lengthMm: number, widthMm: number, depthMm: number, color: string, pageNumber: number, scopeType: 'pad_footings' | 'pit_bases') => Promise<TakeoffMarkup | null>;
  addPolylineMarkup: (fileId: string, scopeId: string, points: TakeoffPoint[], lengthM: number, widthMm: number, heightMm: number, color: string, pageNumber: number, name?: string) => Promise<TakeoffMarkup | null>;
  updateMarkup: (markupId: string, points: TakeoffPoint[]) => Promise<void>;
  deleteMarkup: (markupId: string) => Promise<void>;
  setCurrentPage: (page: number) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useTakeoffData({ estimateId, businessId }: UseTakeoffDataProps): UseTakeoffDataReturn {
  const [takeoff, setTakeoff] = useState<EstimateTakeoff | null>(null);
  const [files, setFiles] = useState<TakeoffFile[]>([]);
  const [pageScales, setPageScales] = useState<PageScale[]>([]);
  const [markups, setMarkups] = useState<TakeoffMarkup[]>([]);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
        
        // Fetch files
        const { data: filesData, error: filesError } = await supabase
          .from('takeoff_files')
          .select('*')
          .eq('takeoff_id', takeoffData.id)
          .order('sort_order', { ascending: true });
        
        if (filesError) throw filesError;
        
        const typedFiles = (filesData || []).map(f => ({
          ...f,
          file_type: f.file_type as 'pdf' | 'image'
        }));
        setFiles(typedFiles);
        
        // Set current file to first if not set
        if (typedFiles.length > 0 && !currentFileId) {
          setCurrentFileId(typedFiles[0].id);
        }
        
        // Fetch page scales for all files
        if (typedFiles.length > 0) {
          const fileIds = typedFiles.map(f => f.id);
          const { data: scalesData, error: scalesError } = await supabase
            .from('takeoff_page_scales')
            .select('*')
            .in('file_id', fileIds);
          
          if (scalesError) throw scalesError;
          setPageScales((scalesData || []) as PageScale[]);
        }
        
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
          file_id: m.file_id || null,
          shape_type: m.shape_type as 'polygon' | 'rectangle' | 'point' | 'polyline',
          points: m.points as unknown as TakeoffPoint[],
          diameter_mm: m.diameter_mm || null,
          depth_mm: m.depth_mm || null,
          pier_quantity: m.pier_quantity || null,
          width_mm: m.width_mm || null,
          height_mm: m.height_mm || null,
          length_m: m.length_m ? Number(m.length_m) : null,
        })));
      } else {
        setTakeoff(null);
        setFiles([]);
        setPageScales([]);
        setMarkups([]);
        setCurrentFileId(null);
      }
    } catch (error) {
      console.error('Error fetching takeoff data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [estimateId, currentFileId]);

  useEffect(() => {
    fetchTakeoffData();
  }, [fetchTakeoffData]);

  const addFile = async (file: File, fileName?: string): Promise<TakeoffFile | null> => {
    if (!estimateId || !businessId) {
      toast({ title: 'Error', description: 'Missing estimate or business ID', variant: 'destructive' });
      return null;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const isPdf = file.type === 'application/pdf' || fileExt === 'pdf';
      const planType = isPdf ? 'pdf' : 'image';
      const uniqueId = crypto.randomUUID();
      const filePath = `${businessId}/${estimateId}/${uniqueId}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('estimate-plans')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get signed URL
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('estimate-plans')
        .createSignedUrl(filePath, 3600 * 24 * 7);

      if (signedUrlError) throw signedUrlError;

      // Create or get takeoff record
      let takeoffId = takeoff?.id;
      if (!takeoffId) {
        const { data: newTakeoff, error: takeoffError } = await supabase
          .from('estimate_takeoffs')
          .insert({
            estimate_id: estimateId,
            plan_url: null,
            plan_type: null,
            page_count: 1,
            current_page: 1
          })
          .select()
          .single();
        
        if (takeoffError) throw takeoffError;
        takeoffId = newTakeoff.id;
        setTakeoff(newTakeoff as unknown as EstimateTakeoff);
      }

      // Create file record
      const displayName = fileName || file.name.replace(/\.[^/.]+$/, '') || 'Building Plan';
      const sortOrder = files.length;
      
      const { data: fileData, error: fileError } = await supabase
        .from('takeoff_files')
        .insert({
          takeoff_id: takeoffId,
          file_url: signedUrlData.signedUrl,
          file_type: planType,
          file_name: displayName,
          page_count: 1,
          sort_order: sortOrder
        })
        .select()
        .single();

      if (fileError) throw fileError;

      const newFile: TakeoffFile = {
        ...fileData,
        file_type: fileData.file_type as 'pdf' | 'image'
      };

      setFiles(prev => [...prev, newFile]);
      
      // Set as current file if first file
      if (files.length === 0) {
        setCurrentFileId(newFile.id);
      }

      toast({ title: 'File added', description: `"${displayName}" has been uploaded.` });
      return newFile;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = async (fileId: string) => {
    try {
      const file = files.find(f => f.id === fileId);
      if (!file) return;

      // Delete markups for this file
      await supabase
        .from('takeoff_markups')
        .delete()
        .eq('file_id', fileId);

      // Delete page scales for this file
      await supabase
        .from('takeoff_page_scales')
        .delete()
        .eq('file_id', fileId);

      // Delete file record
      const { error } = await supabase
        .from('takeoff_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      // Delete from storage
      // Extract path from signed URL
      const urlParts = file.file_url.split('/');
      const objectPath = urlParts.slice(-3).join('/').split('?')[0];
      if (businessId && estimateId) {
        await supabase.storage
          .from('estimate-plans')
          .remove([objectPath]);
      }

      setFiles(prev => prev.filter(f => f.id !== fileId));
      setPageScales(prev => prev.filter(s => s.file_id !== fileId));
      setMarkups(prev => prev.filter(m => m.file_id !== fileId));
      
      // Update current file if needed
      if (currentFileId === fileId) {
        const remaining = files.filter(f => f.id !== fileId);
        setCurrentFileId(remaining.length > 0 ? remaining[0].id : null);
      }

      toast({ title: 'File removed' });
    } catch (error: any) {
      console.error('Error removing file:', error);
      toast({ title: 'Remove failed', description: error.message, variant: 'destructive' });
    }
  };

  const renameFile = async (fileId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('takeoff_files')
        .update({ file_name: newName })
        .eq('id', fileId);

      if (error) throw error;

      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, file_name: newName } : f
      ));
    } catch (error: any) {
      console.error('Error renaming file:', error);
      toast({ title: 'Rename failed', description: error.message, variant: 'destructive' });
    }
  };

  const reorderFiles = async (fileIds: string[]) => {
    try {
      const updates = fileIds.map((id, index) => 
        supabase
          .from('takeoff_files')
          .update({ sort_order: index })
          .eq('id', id)
      );
      
      await Promise.all(updates);
      
      setFiles(prev => {
        const sorted = [...prev].sort((a, b) => 
          fileIds.indexOf(a.id) - fileIds.indexOf(b.id)
        );
        return sorted;
      });
    } catch (error: any) {
      console.error('Error reordering files:', error);
    }
  };

  const setCurrentFile = (fileId: string) => {
    setCurrentFileId(fileId);
  };

  const setPageScale = async (fileId: string, pageNumber: number, pixelsPerMeter: number) => {
    try {
      // Upsert page scale
      const { data, error } = await supabase
        .from('takeoff_page_scales')
        .upsert({
          file_id: fileId,
          page_number: pageNumber,
          scale_pixels_per_meter: pixelsPerMeter
        }, {
          onConflict: 'file_id,page_number'
        })
        .select()
        .single();

      if (error) throw error;

      setPageScales(prev => {
        const existing = prev.findIndex(s => s.file_id === fileId && s.page_number === pageNumber);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = data as PageScale;
          return updated;
        }
        return [...prev, data as PageScale];
      });

      // Recalculate markup areas for this file and page
      const affectedMarkups = markups.filter(m => m.file_id === fileId && m.page_number === pageNumber);
      for (const markup of affectedMarkups) {
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
      toast({ title: 'Scale set', description: `${pixelsPerMeter.toFixed(1)} pixels per meter` });
    } catch (error: any) {
      console.error('Error setting scale:', error);
      toast({ title: 'Calibration failed', description: error.message, variant: 'destructive' });
    }
  };

  const getPageScale = (fileId: string, pageNumber: number): number | null => {
    const scale = pageScales.find(s => s.file_id === fileId && s.page_number === pageNumber);
    return scale ? scale.scale_pixels_per_meter : null;
  };

  const deletePlan = async () => {
    if (!takeoff) return;

    try {
      // Delete all markups
      await supabase
        .from('takeoff_markups')
        .delete()
        .eq('takeoff_id', takeoff.id);

      // Delete all page scales via files
      for (const file of files) {
        await supabase
          .from('takeoff_page_scales')
          .delete()
          .eq('file_id', file.id);
      }

      // Delete all files
      await supabase
        .from('takeoff_files')
        .delete()
        .eq('takeoff_id', takeoff.id);

      // Delete takeoff record
      await supabase
        .from('estimate_takeoffs')
        .delete()
        .eq('id', takeoff.id);

      // Delete files from storage
      if (businessId && estimateId) {
        for (const file of files) {
          const urlParts = file.file_url.split('/');
          const objectPath = urlParts.slice(-3).join('/').split('?')[0];
          await supabase.storage
            .from('estimate-plans')
            .remove([objectPath]);
        }
      }

      setTakeoff(null);
      setFiles([]);
      setPageScales([]);
      setMarkups([]);
      setCurrentFileId(null);
      toast({ title: 'All plans removed' });
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    }
  };

  const addMarkup = async (
    fileId: string,
    scopeId: string, 
    shapeType: 'polygon' | 'rectangle', 
    points: TakeoffPoint[],
    color: string,
    pageNumber: number,
    name?: string
  ): Promise<TakeoffMarkup | null> => {
    if (!takeoff) return null;

    try {
      const { calculatePolygonArea, calculatePolygonPerimeter, calculateRectangleArea, calculateRectanglePerimeter } = await import('@/types/takeoff');
      
      const scale = getPageScale(fileId, pageNumber);
      let area: number | null = null;
      let perimeter: number | null = null;
      
      if (scale) {
        if (shapeType === 'polygon') {
          area = calculatePolygonArea(points, scale);
          perimeter = calculatePolygonPerimeter(points, scale);
        } else {
          area = calculateRectangleArea(points, scale);
          perimeter = calculateRectanglePerimeter(points, scale);
        }
      }

      const { data, error } = await supabase
        .from('takeoff_markups')
        .insert({
          takeoff_id: takeoff.id,
          file_id: fileId,
          scope_id: scopeId,
          shape_type: shapeType,
          points: points as unknown as Json,
          area_sqm: area,
          perimeter_m: perimeter,
          color: color,
          name: name || null,
          page_number: pageNumber
        })
        .select()
        .single();

      if (error) throw error;

      const newMarkup: TakeoffMarkup = {
        ...data,
        name: data.name || null,
        file_id: data.file_id || null,
        shape_type: data.shape_type as 'polygon' | 'rectangle' | 'point',
        points: data.points as unknown as TakeoffPoint[],
        diameter_mm: null,
        depth_mm: null,
        pier_quantity: null,
      };

      setMarkups(prev => [...prev, newMarkup]);
      return newMarkup;
    } catch (error: any) {
      console.error('Error adding markup:', error);
      toast({ title: 'Error adding markup', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  // Add pier markups (point-based with diameter/depth)
  const addPierMarkups = async (
    fileId: string,
    scopeId: string,
    points: TakeoffPoint[],
    diameterMm: number,
    depthMm: number,
    color: string,
    pageNumber: number
  ): Promise<TakeoffMarkup | null> => {
    if (!takeoff || points.length === 0) return null;

    try {
      const { data, error } = await supabase
        .from('takeoff_markups')
        .insert({
          takeoff_id: takeoff.id,
          file_id: fileId,
          scope_id: scopeId,
          shape_type: 'point',
          points: points as unknown as Json,
          area_sqm: null,
          perimeter_m: null,
          color: color,
          name: `${points.length} piers`,
          page_number: pageNumber,
          diameter_mm: diameterMm,
          depth_mm: depthMm,
          pier_quantity: points.length
        })
        .select()
        .single();

      if (error) throw error;

      const newMarkup: TakeoffMarkup = {
        ...data,
        name: data.name || null,
        file_id: data.file_id || null,
        shape_type: data.shape_type as 'polygon' | 'rectangle' | 'point',
        points: data.points as unknown as TakeoffPoint[],
        diameter_mm: data.diameter_mm,
        depth_mm: data.depth_mm,
        pier_quantity: data.pier_quantity,
      };

      setMarkups(prev => [...prev, newMarkup]);
      toast({ title: 'Piers saved', description: `${points.length} pier locations saved` });
      return newMarkup;
    } catch (error: any) {
      console.error('Error adding pier markups:', error);
      toast({ title: 'Error adding piers', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  // Add bollard markups (point-based with diameter/height/embedment)
  const addBollardMarkups = async (
    fileId: string,
    scopeId: string,
    points: TakeoffPoint[],
    diameterMm: number,
    heightMm: number,
    embedmentMm: number,
    color: string,
    pageNumber: number
  ): Promise<TakeoffMarkup | null> => {
    if (!takeoff || points.length === 0) return null;

    try {
      const { data, error } = await supabase
        .from('takeoff_markups')
        .insert({
          takeoff_id: takeoff.id,
          file_id: fileId,
          scope_id: scopeId,
          shape_type: 'point',
          points: points as unknown as Json,
          area_sqm: null,
          perimeter_m: null,
          color: color,
          name: `${points.length} bollards`,
          page_number: pageNumber,
          diameter_mm: diameterMm,
          depth_mm: embedmentMm,
          height_mm: heightMm,
          pier_quantity: points.length
        })
        .select()
        .single();

      if (error) throw error;

      const newMarkup: TakeoffMarkup = {
        ...data,
        name: data.name || null,
        file_id: data.file_id || null,
        shape_type: data.shape_type as 'polygon' | 'rectangle' | 'point' | 'polyline',
        points: data.points as unknown as TakeoffPoint[],
        diameter_mm: data.diameter_mm,
        depth_mm: data.depth_mm,
        height_mm: data.height_mm,
        pier_quantity: data.pier_quantity,
        width_mm: null,
        length_m: null,
      };

      setMarkups(prev => [...prev, newMarkup]);
      toast({ title: 'Bollards saved', description: `${points.length} bollard locations saved` });
      return newMarkup;
    } catch (error: any) {
      console.error('Error adding bollard markups:', error);
      toast({ title: 'Error adding bollards', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  // Add pad footing or pit base markups (point-based with L x W x D)
  const addPadMarkups = async (
    fileId: string,
    scopeId: string,
    points: TakeoffPoint[],
    lengthMm: number,
    widthMm: number,
    depthMm: number,
    color: string,
    pageNumber: number,
    scopeType: 'pad_footings' | 'pit_bases'
  ): Promise<TakeoffMarkup | null> => {
    if (!takeoff || points.length === 0) return null;

    try {
      const label = scopeType === 'pit_bases' ? 'pit bases' : 'pad footings';
      const { data, error } = await supabase
        .from('takeoff_markups')
        .insert({
          takeoff_id: takeoff.id,
          file_id: fileId,
          scope_id: scopeId,
          shape_type: 'point',
          points: points as unknown as Json,
          area_sqm: null,
          perimeter_m: null,
          color: color,
          name: `${points.length} ${label}`,
          page_number: pageNumber,
          width_mm: widthMm,
          height_mm: lengthMm, // Store length in height_mm (reuse field)
          depth_mm: depthMm,
          pier_quantity: points.length
        })
        .select()
        .single();

      if (error) throw error;

      const newMarkup: TakeoffMarkup = {
        ...data,
        name: data.name || null,
        file_id: data.file_id || null,
        shape_type: data.shape_type as 'polygon' | 'rectangle' | 'point' | 'polyline',
        points: data.points as unknown as TakeoffPoint[],
        width_mm: data.width_mm,
        height_mm: data.height_mm,
        depth_mm: data.depth_mm,
        pier_quantity: data.pier_quantity,
        diameter_mm: null,
        length_m: null,
      };

      setMarkups(prev => [...prev, newMarkup]);
      toast({ title: `${scopeType === 'pit_bases' ? 'Pit bases' : 'Pad footings'} saved`, description: `${points.length} locations saved` });
      return newMarkup;
    } catch (error: any) {
      console.error('Error adding pad markups:', error);
      toast({ title: 'Error adding markups', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  // Add polyline markup for linear elements (footings, kerbs, retaining walls)
  const addPolylineMarkup = async (
    fileId: string,
    scopeId: string,
    points: TakeoffPoint[],
    lengthM: number,
    widthMm: number,
    heightMm: number,
    color: string,
    pageNumber: number,
    name?: string
  ): Promise<TakeoffMarkup | null> => {
    if (!takeoff || points.length < 2) return null;

    try {
      const { data, error } = await supabase
        .from('takeoff_markups')
        .insert({
          takeoff_id: takeoff.id,
          file_id: fileId,
          scope_id: scopeId,
          shape_type: 'polyline',
          points: points as unknown as Json,
          area_sqm: null,
          perimeter_m: null,
          color: color,
          name: name || `${lengthM.toFixed(1)}m`,
          page_number: pageNumber,
          length_m: lengthM,
          width_mm: widthMm,
          height_mm: heightMm
        })
        .select()
        .single();

      if (error) throw error;

      const newMarkup: TakeoffMarkup = {
        ...data,
        name: data.name || null,
        file_id: data.file_id || null,
        shape_type: data.shape_type as 'polygon' | 'rectangle' | 'point' | 'polyline',
        points: data.points as unknown as TakeoffPoint[],
        length_m: data.length_m ? Number(data.length_m) : null,
        width_mm: data.width_mm,
        height_mm: data.height_mm,
        diameter_mm: null,
        depth_mm: null,
        pier_quantity: null,
      };

      setMarkups(prev => [...prev, newMarkup]);
      toast({ title: 'Linear element saved', description: `${lengthM.toFixed(1)}m marked` });
      return newMarkup;
    } catch (error: any) {
      console.error('Error adding polyline markup:', error);
      toast({ title: 'Error adding linear element', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const updateMarkup = async (markupId: string, points: TakeoffPoint[]) => {
    try {
      const markup = markups.find(m => m.id === markupId);
      if (!markup) return;

      const scale = markup.file_id 
        ? getPageScale(markup.file_id, markup.page_number)
        : null;

      let area: number | null = null;
      let perimeter: number | null = null;
      
      if (scale) {
        const { calculatePolygonArea, calculatePolygonPerimeter, calculateRectangleArea, calculateRectanglePerimeter } = await import('@/types/takeoff');
        
        if (markup.shape_type === 'polygon') {
          area = calculatePolygonArea(points, scale);
          perimeter = calculatePolygonPerimeter(points, scale);
        } else {
          area = calculateRectangleArea(points, scale);
          perimeter = calculateRectanglePerimeter(points, scale);
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

  return {
    takeoff,
    files,
    pageScales,
    markups,
    currentFileId,
    isLoading,
    isUploading,
    addFile,
    removeFile,
    renameFile,
    reorderFiles,
    setCurrentFile,
    setPageScale,
    getPageScale,
    deletePlan,
    addMarkup,
    addPierMarkups,
    addBollardMarkups,
    addPadMarkups,
    addPolylineMarkup,
    updateMarkup,
    deleteMarkup,
    setCurrentPage,
    refetch: fetchTakeoffData
  };
}
