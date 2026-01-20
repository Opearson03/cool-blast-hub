import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, SkipForward, Trash2, Plus, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { TakeoffMarkup, ScopeMarkupStatus } from '@/types/takeoff';

interface ScopeMarkupChecklistProps {
  scopes: { id: string; label: string }[];
  markups: TakeoffMarkup[];
  skippedScopes: Set<string>;
  activeScope: string | null;
  onMarkArea: (scopeId: string) => void;
  onSkipScope: (scopeId: string) => void;
  onEditMarkup: (markupId: string) => void;
  onDeleteMarkup: (markupId: string) => void;
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
  onDeleteMarkup,
  isCalibrated,
  isCollapsed = false,
  onToggle
}: ScopeMarkupChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const getScopeMarkups = (scopeId: string) => {
    return markups.filter(m => m.scope_id === scopeId);
  };

  const getScopeStatus = (scopeId: string): ScopeMarkupStatus & { pierCount?: number; totalLength?: number } => {
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
    <Card className="border-2 border-primary/20 bg-card/95 backdrop-blur shadow-lg w-72 max-h-[calc(100vh-200px)] flex flex-col">
      {/* Collapsible header */}
      <CardHeader 
        className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors shrink-0"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold">Scope Areas</CardTitle>
            <Badge 
              variant={completedCount === scopes.length ? "default" : "secondary"} 
              className="text-xs font-medium"
            >
              {completedCount}/{scopes.length}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {/* Scope list - vertical stack */}
      <CardContent className={cn(
        "pt-0 pb-3 overflow-y-auto flex-1",
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
                            : `${scopeMarkups.length} area${scopeMarkups.length !== 1 ? 's' : ''} • ${formatArea(status.area_sqm)}`
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
                <div className="flex items-center gap-1.5 mt-2">
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
                    {scopeMarkups.slice(0, 2).map((markup, idx) => {
                      const isPolyline = markup.shape_type === 'polyline';
                      const isPoint = markup.shape_type === 'point';
                      const displayLabel = isPoint 
                        ? `${markup.pier_quantity || 1} item${(markup.pier_quantity || 1) !== 1 ? 's' : ''}`
                        : isPolyline
                          ? formatLength(markup.length_m || null)
                          : formatArea(markup.area_sqm);
                      const defaultName = isPolyline ? `Section ${idx + 1}` : `Area ${idx + 1}`;
                      
                      return (
                        <div 
                          key={markup.id}
                          className="flex items-center gap-1.5 text-xs py-1 px-1.5 rounded bg-muted/50"
                        >
                          <span className="flex-1 truncate">{markup.name || defaultName}</span>
                          <span className="text-muted-foreground font-mono text-[10px]">{displayLabel}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 touch-manipulation"
                            onClick={() => onDeleteMarkup(markup.id)}
                          >
                            <Trash2 className="h-2.5 w-2.5 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                    {scopeMarkups.length > 2 && (
                      <p className="text-[10px] text-muted-foreground text-center">
                        +{scopeMarkups.length - 2} more
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
