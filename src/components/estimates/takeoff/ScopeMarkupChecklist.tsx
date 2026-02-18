import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, SkipForward, Trash2, Plus, ChevronDown, ChevronUp, Layers, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import type { TakeoffMarkup, ScopeMarkupStatus } from '@/types/takeoff';
import { SLAB_WITH_BEAMS_SCOPES } from '@/types/takeoff';

// Interface for beam type grouping
interface BeamTypeGroup {
  baseName: string;
  width: number;
  depth: number;
  markupType: string;
  beams: TakeoffMarkup[];
  totalLength: number;
  totalVolume: number;
}

// Interface for linear type grouping (strip footings, retaining wall footings, etc.)
interface LinearTypeGroup {
  baseName: string;
  width: number;
  depth: number;
  segments: TakeoffMarkup[];
  totalLength: number;
  totalVolume: number;
}

// Linear scope IDs that should be grouped by type
const LINEAR_SCOPES = ['strip_footings', 'retaining_wall_footings', 'kerbs_channels', 'retaining_walls', 'kerb', 'insitu_walls'] as const;

interface ScopeMarkupChecklistProps {
  scopes: { id: string; label: string }[];
  markups: TakeoffMarkup[];
  skippedScopes: Set<string>;
  activeScope: string | null;
  onMarkArea: (scopeId: string) => void;
  onSkipScope: (scopeId: string) => void;
  onEditMarkup: (markupId: string) => void;
  onEditBeam?: (markupId: string) => void;
  onDeleteMarkup: (markupId: string) => void;
  onAddBeamToSlab?: (slabMarkupId: string, beamType: 'edge_beam' | 'internal_beam') => void;
  /** Callback for adding a new segment to an existing linear type */
  onAddToLinearType?: (scopeId: string, typeName: string, width: number, depth: number) => void;
  /** Callback for drawing a cutout (pool surround only) */
  onDrawCutout?: (scopeId: string) => void;
  isCalibrated: boolean;
  /** When true, panel collapses to a compact toggle button */
  isCollapsed?: boolean;
  /** Callback to toggle collapsed state */
  onToggle?: () => void;
}

export function ScopeMarkupChecklist({
  scopes,
  markups,
  skippedScopes,
  activeScope,
  onMarkArea,
  onSkipScope,
  onEditMarkup,
  onEditBeam,
  onDeleteMarkup,
  onAddBeamToSlab,
  onAddToLinearType,
  onDrawCutout,
  isCalibrated,
  isCollapsed = false,
  onToggle
}: ScopeMarkupChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Filter to only get root-level markups (no parent) for a scope
  const getScopeMarkups = (scopeId: string) => {
    return markups.filter(m => m.scope_id === scopeId && !m.parent_markup_id);
  };

  const getScopeStatus = (scopeId: string): ScopeMarkupStatus & { pierCount?: number; totalLength?: number; cutoutArea?: number; primaryArea?: number } => {
    const scopeMarkups = getScopeMarkups(scopeId);
    if (scopeMarkups.length > 0) {
      // Check if this is a pier/point scope (has point-type markups)
      const pointMarkup = scopeMarkups.find(m => m.shape_type === 'point');
      if (pointMarkup) {
        const totalCount = scopeMarkups.reduce((sum, m) => sum + (m.pier_quantity || 0), 0);
        return {
          scope_id: scopeId,
          label: scopes.find(s => s.id === scopeId)?.label || scopeId,
          status: 'marked',
          area_sqm: null,
          pierCount: totalCount,
          markup_id: scopeMarkups[0].id
        };
      }
      
      // Check if this is a linear scope (has polyline-type markups)
      const polylineMarkup = scopeMarkups.find(m => m.shape_type === 'polyline');
      if (polylineMarkup) {
        const totalLength = scopeMarkups.reduce((sum, m) => sum + (m.length_m || 0), 0);
        return {
          scope_id: scopeId,
          label: scopes.find(s => s.id === scopeId)?.label || scopeId,
          status: 'marked',
          area_sqm: null,
          totalLength,
          markup_id: scopeMarkups[0].id
        };
      }
      
      // Pool surround: separate primary vs cutout areas, return net area
      if (scopeId === 'pool_surround') {
        const primaryMarkups = scopeMarkups.filter(m => m.markup_type !== 'cutout');
        const cutoutMarkups = scopeMarkups.filter(m => m.markup_type === 'cutout');
        const primaryArea = primaryMarkups.reduce((sum, m) => sum + (m.area_sqm || 0), 0);
        const cutoutArea = cutoutMarkups.reduce((sum, m) => sum + (m.area_sqm || 0), 0);
        const netArea = Math.max(0, primaryArea - cutoutArea);
        return {
          scope_id: scopeId,
          label: scopes.find(s => s.id === scopeId)?.label || scopeId,
          status: 'marked',
          area_sqm: netArea,
          primaryArea,
          cutoutArea,
          markup_id: scopeMarkups[0].id
        };
      }
      
      // Sum all areas for this scope (polygon/rectangle markups)
      const totalArea = scopeMarkups.reduce((sum, m) => sum + (m.area_sqm || 0), 0);
      return {
        scope_id: scopeId,
        label: scopes.find(s => s.id === scopeId)?.label || scopeId,
        status: 'marked',
        area_sqm: totalArea,
        markup_id: scopeMarkups[0].id
      };
    }
    if (skippedScopes.has(scopeId)) {
      return {
        scope_id: scopeId,
        label: scopes.find(s => s.id === scopeId)?.label || scopeId,
        status: 'skipped',
        area_sqm: null
      };
    }
    return {
      scope_id: scopeId,
      label: scopes.find(s => s.id === scopeId)?.label || scopeId,
      status: 'unmarked',
      area_sqm: null
    };
  };

  const formatArea = (area: number | null): string => {
    if (area === null) return '--';
    return `${area.toFixed(1)} m²`;
  };

  const formatLength = (length: number | null): string => {
    if (length === null) return '--';
    return `${length.toFixed(1)} m`;
  };

  const formatPierCount = (count: number | undefined): string => {
    if (!count) return '--';
    return `${count} pier${count !== 1 ? 's' : ''}`;
  };

  // Count based on whether scope has at least one markup or is skipped
  const completedCount = scopes.filter(s => {
    const status = getScopeStatus(s.id);
    return status.status === 'marked' || status.status === 'skipped';
  }).length;

  // Get the active scope label for collapsed state
  const activeScopeLabel = activeScope 
    ? scopes.find(s => s.id === activeScope)?.label || activeScope 
    : null;

  // Collapsed state - show compact toggle button
  if (isCollapsed) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="bg-card/95 backdrop-blur shadow-lg border-2 border-primary/20 hover:bg-card gap-2 h-10"
      >
        <Layers className="h-4 w-4 text-primary" />
        <span className="font-medium">Scopes</span>
        <Badge variant="secondary" className="text-xs">
          {completedCount}/{scopes.length}
        </Badge>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Button>
    );
  }

  return (
    <Card className="border border-primary/20 bg-card/95 backdrop-blur shadow-md w-56 max-h-[calc(100vh-200px)] flex flex-col">
      {/* Collapsible header */}
      <CardHeader 
        className="p-2 cursor-pointer hover:bg-muted/50 transition-colors shrink-0"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <CardTitle className="text-xs font-semibold">Scopes</CardTitle>
            <Badge 
              variant={completedCount === scopes.length ? "default" : "secondary"} 
              className="text-[10px] px-1.5 h-4 font-medium"
            >
              {completedCount}/{scopes.length}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>
      </CardHeader>
      
      {/* Scope list - vertical stack */}
      <CardContent className={cn(
        "pt-0 px-2 pb-2 overflow-y-auto flex-1",
        !isExpanded && "hidden"
      )}>
        <div className="space-y-2">
          {scopes.map((scope) => {
            const status = getScopeStatus(scope.id);
            const scopeMarkups = getScopeMarkups(scope.id);
            const isActive = activeScope === scope.id;
            
            return (
              <div
                key={scope.id}
                className={cn(
                  'rounded-lg border-2 transition-all p-2.5',
                  isActive && 'border-primary bg-primary/10 ring-2 ring-primary/20',
                  status.status === 'marked' && !isActive && 'border-green-500/50 bg-green-500/10',
                  status.status === 'skipped' && !isActive && 'border-muted/50 bg-muted/30 opacity-70',
                  status.status === 'unmarked' && !isActive && 'border-border bg-card hover:border-primary/30'
                )}
              >
                {/* Scope header */}
                <div className="flex items-start gap-2">
                  {/* Status icon */}
                  <div className="shrink-0 mt-0.5">
                    {status.status === 'marked' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : status.status === 'skipped' ? (
                      <SkipForward className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </div>

                  {/* Scope info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate leading-tight">{status.label}</p>
                    {status.status === 'marked' && (
                      <p className="text-xs text-green-600 dark:text-green-400 font-mono mt-0.5">
                        {status.pierCount 
                          ? formatPierCount(status.pierCount)
                          : status.totalLength 
                            ? `${scopeMarkups.length} section${scopeMarkups.length !== 1 ? 's' : ''} • ${formatLength(status.totalLength)}`
                            : scope.id === 'pool_surround' && (status as any).cutoutArea > 0
                              ? `${formatArea((status as any).primaryArea)} − ${formatArea((status as any).cutoutArea)} = ${formatArea(status.area_sqm)} net`
                              : `${scopeMarkups.filter(m => m.markup_type !== 'cutout').length} area${scopeMarkups.filter(m => m.markup_type !== 'cutout').length !== 1 ? 's' : ''} • ${formatArea(status.area_sqm)}`
                        }
                      </p>
                    )}
                    {status.status === 'skipped' && (
                      <p className="text-xs text-muted-foreground mt-0.5">Manual entry</p>
                    )}
                    {status.status === 'unmarked' && (
                      <p className="text-xs text-muted-foreground mt-0.5">Not marked</p>
                    )}
                  </div>
                </div>

                {/* Actions - compact */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {status.status === 'marked' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1 text-xs gap-1 touch-manipulation"
                      onClick={() => onMarkArea(scope.id)}
                      disabled={!isCalibrated}
                    >
                      <Plus className="h-3 w-3" /> Add More
                    </Button>
                  )}
                  {/* Add Another Cutout button for pool_surround (after initial flow) */}
                  {scope.id === 'pool_surround' && status.status === 'marked' && onDrawCutout && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-full text-xs gap-1 touch-manipulation border-dashed border-destructive/50 text-destructive hover:bg-destructive/10"
                      onClick={() => onDrawCutout(scope.id)}
                      disabled={!isCalibrated}
                    >
                      <Plus className="h-3 w-3" /> Add Another Cutout
                    </Button>
                  )}
                  {status.status === 'unmarked' && (
                    <>
                      <Button
                        variant={isCalibrated ? 'default' : 'secondary'}
                        size="sm"
                        className="h-8 flex-1 text-xs touch-manipulation"
                        onClick={() => onMarkArea(scope.id)}
                        disabled={!isCalibrated}
                      >
                        Mark
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-muted-foreground touch-manipulation"
                        onClick={() => onSkipScope(scope.id)}
                      >
                        Skip
                      </Button>
                    </>
                  )}
                  {status.status === 'skipped' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1 text-xs touch-manipulation"
                      onClick={() => onMarkArea(scope.id)}
                      disabled={!isCalibrated}
                    >
                      Mark Instead
                    </Button>
                  )}
                </div>
                
                {/* Markup details - compact list */}
                {scopeMarkups.length > 0 && (
                  <div className="border-t mt-2 pt-2 space-y-1">
                    {/* Check if this is a linear scope that should be grouped by type */}
                    {LINEAR_SCOPES.includes(scope.id as any) ? (
                      // Group linear markups by type (SF1, RF1, etc.)
                      (() => {
                        const linearGroups: LinearTypeGroup[] = [];
                        const groupMap = new Map<string, LinearTypeGroup>();
                        
                        scopeMarkups.forEach(markup => {
                          if (markup.shape_type !== 'polyline') return;
                          
                          const baseName = (markup.name || '').split('-')[0].trim() || 'Section';
                          const width = markup.width_mm || 0;
                          const depth = markup.depth_mm || markup.height_mm || 0;
                          const key = `${baseName}-${width}-${depth}`;
                          
                          if (!groupMap.has(key)) {
                            const group: LinearTypeGroup = {
                              baseName,
                              width,
                              depth,
                              segments: [markup],
                              totalLength: markup.length_m || 0,
                              totalVolume: (markup.length_m || 0) * (width / 1000) * (depth / 1000)
                            };
                            groupMap.set(key, group);
                            linearGroups.push(group);
                          } else {
                            const group = groupMap.get(key)!;
                            group.segments.push(markup);
                            group.totalLength += markup.length_m || 0;
                            group.totalVolume += (markup.length_m || 0) * (width / 1000) * (depth / 1000);
                          }
                        });
                        
                        // Sort by type name
                        linearGroups.sort((a, b) => a.baseName.localeCompare(b.baseName, undefined, { numeric: true }));
                        
                        return linearGroups.map((group) => (
                          <div 
                            key={`${group.baseName}-${group.width}-${group.depth}`}
                            className="flex items-center gap-1.5 text-xs py-1 px-1.5 rounded bg-muted/50"
                          >
                            <Badge variant="outline" className="h-5 text-[10px] px-1.5 font-mono">
                              {group.baseName}
                            </Badge>
                            <span className="text-muted-foreground text-[10px]">
                              {group.width}×{group.depth}mm
                            </span>
                            <span className="flex-1" />
                            <span className="text-muted-foreground font-mono text-[10px]">
                              {group.segments.length > 1 ? `${group.segments.length}× ` : ''}{group.totalLength.toFixed(1)}m
                            </span>
                            <span className="text-muted-foreground font-mono text-[10px]">
                              {group.totalVolume.toFixed(2)}m³
                            </span>
                            {/* Add segment button */}
                            {onAddToLinearType && isCalibrated && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 touch-manipulation"
                                onClick={() => onAddToLinearType(scope.id, group.baseName, group.width, group.depth)}
                                title={`Add segment to ${group.baseName}`}
                              >
                                <Plus className="h-2.5 w-2.5 text-primary" />
                              </Button>
                            )}
                          </div>
                        ));
                      })()
                    ) : (
                      // Standard markup list for non-linear scopes
                      scopeMarkups.slice(0, 5).map((markup, idx) => {
                        const isPolyline = markup.shape_type === 'polyline';
                        const isPoint = markup.shape_type === 'point';
                        const isCutout = markup.markup_type === 'cutout';
                        const displayLabel = isPoint 
                          ? `${markup.pier_quantity || 1} item${(markup.pier_quantity || 1) !== 1 ? 's' : ''}`
                          : isPolyline
                            ? formatLength(markup.length_m || null)
                            : isCutout
                              ? `−${formatArea(markup.area_sqm)}`
                              : formatArea(markup.area_sqm);
                        const defaultName = isPolyline ? `Section ${idx + 1}` : isCutout ? `Cutout ${idx + 1}` : `Area ${idx + 1}`;
                        
                        // Get child beams for this markup
                        const childBeams = markups.filter(m => m.parent_markup_id === markup.id);
                        
                        return (
                          <div key={markup.id}>
                            <div 
                              className={cn(
                                "flex items-center gap-1.5 text-xs py-1 px-1.5 rounded",
                                isCutout ? "bg-destructive/10 border border-destructive/20 border-dashed" : "bg-muted/50"
                              )}
                            >
                              <span className={cn("flex-1 truncate", isCutout && "text-destructive font-medium")}>{markup.name || defaultName}</span>
                              <span className={cn("font-mono text-[10px]", isCutout ? "text-destructive font-semibold" : "text-muted-foreground")}>{displayLabel}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 touch-manipulation"
                                onClick={() => onDeleteMarkup(markup.id)}
                              >
                                <Trash2 className="h-2.5 w-2.5 text-destructive" />
                              </Button>
                            </div>
                            
                            {/* Show child beams grouped by type for slab scopes */}
                            {SLAB_WITH_BEAMS_SCOPES.includes(scope.id as any) && (
                              <div className="ml-3 mt-1 space-y-1 border-l-2 border-primary/20 pl-2">
                                {/* Group beams by type */}
                                {(() => {
                                  // Group beams by baseName + dimensions
                                  const beamGroups: BeamTypeGroup[] = [];
                                  const groupMap = new Map<string, BeamTypeGroup>();
                                  
                                  childBeams.forEach(beam => {
                                    const baseName = (beam.name || '').split('-')[0].trim() || 
                                      (beam.markup_type === 'edge_beam' ? 'EB' : 'IB');
                                    const width = beam.width_mm || 0;
                                    const depth = beam.depth_mm || 0;
                                    const key = `${baseName}-${width}-${depth}-${beam.markup_type}`;
                                    
                                    if (!groupMap.has(key)) {
                                      const group: BeamTypeGroup = {
                                        baseName,
                                        width,
                                        depth,
                                        markupType: beam.markup_type || '',
                                        beams: [beam],
                                        totalLength: beam.length_m || 0,
                                        totalVolume: (beam.length_m || 0) * (width / 1000) * (depth / 1000)
                                      };
                                      groupMap.set(key, group);
                                      beamGroups.push(group);
                                    } else {
                                      const group = groupMap.get(key)!;
                                      group.beams.push(beam);
                                      group.totalLength += beam.length_m || 0;
                                      group.totalVolume += (beam.length_m || 0) * (width / 1000) * (depth / 1000);
                                    }
                                  });
                                  
                                  return beamGroups.map((group) => (
                                    <div 
                                      key={`${group.baseName}-${group.width}-${group.depth}-${group.markupType}`}
                                      className="flex items-center gap-1 text-[10px] py-0.5 px-1 rounded bg-primary/5"
                                    >
                                      <Badge variant="outline" className="h-4 text-[9px] px-1 font-mono">
                                        {group.baseName}
                                      </Badge>
                                      <span className="text-muted-foreground">
                                        {group.width}×{group.depth}mm
                                      </span>
                                      <span className="flex-1" />
                                      <span className="text-muted-foreground font-mono">
                                        {group.totalLength.toFixed(1)}m
                                      </span>
                                      <span className="text-muted-foreground font-mono">
                                        {group.totalVolume.toFixed(2)}m³
                                      </span>
                                    </div>
                                  ));
                                })()}
                                
                                {/* Add beam buttons */}
                                {onAddBeamToSlab && isCalibrated && (
                                  <div className="flex gap-1 mt-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 text-[10px] px-1.5 text-primary hover:bg-primary/10"
                                      onClick={() => onAddBeamToSlab(markup.id, 'edge_beam')}
                                    >
                                      <Plus className="h-2.5 w-2.5 mr-0.5" /> Edge
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 text-[10px] px-1.5 text-primary hover:bg-primary/10"
                                      onClick={() => onAddBeamToSlab(markup.id, 'internal_beam')}
                                    >
                                      <Plus className="h-2.5 w-2.5 mr-0.5" /> Internal
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                    {scopeMarkups.length > 5 && (
                      <p className="text-[10px] text-muted-foreground text-center">
                        +{scopeMarkups.length - 5} more
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!isCalibrated && (
          <p className="text-xs text-amber-600 dark:text-amber-400 text-center mt-3 font-medium">
            ⚠️ Set scale first to enable marking
          </p>
        )}
      </CardContent>
    </Card>
  );
}
